from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartSerializer, CartItemWriteSerializer, OrderSerializer, PlaceOrderSerializer,
)
from apps.warehouses.utils import find_nearest_warehouse, deduct_inventory
from apps.offers.utils import apply_offer_to_price
from .tasks import notify_warehouse_new_order
from apps.offers.models import Coupon


class CartView(APIView):
    """Retrieve the current user's cart."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemView(APIView):
    """Add / update / remove items in the cart."""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        """Add or update a cart item."""
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']
        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity = quantity
        else:
            item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    def delete(self, request, product_id):
        """Remove a specific product from the cart."""
        cart = get_object_or_404(Cart, user=request.user)
        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class ClearCartView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request):
        Cart.objects.filter(user=request.user).delete()
        return Response({'detail': 'Cart cleared.'}, status=status.HTTP_204_NO_CONTENT)


class CartSyncView(APIView):
    """Bulk update cart items in a single request."""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        items_data = request.data.get('items', [])
        
        # Clear existing items and replace
        cart.items.all().delete()
        
        new_items = []
        for item in items_data:
            new_items.append(CartItem(
                cart=cart,
                product_id=item['product'],
                quantity=item['quantity']
            ))
        
        if new_items:
            CartItem.objects.bulk_create(new_items)
            
        return Response(CartSerializer(cart).data)


class PlaceOrderView(APIView):
    """
    Convert the user's cart into an Order.
    Finds the nearest warehouse with stock, applies offers, deducts inventory.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        cart = get_object_or_404(Cart, user=request.user)
        cart_items = cart.items.select_related('product__category').all()

        if not cart_items.exists():
            return Response({'detail': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # Build product → quantity map for warehouse lookup
        product_quantities = {item.product_id: item.quantity for item in cart_items}

        nearest_wh = find_nearest_warehouse(
            float(data['delivery_lat']),
            float(data['delivery_lng']),
            product_quantities,
        )
        if not nearest_wh:
            return Response(
                {'detail': 'No warehouse with sufficient stock is available near your location.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create order
        subtotal = 0
        discount_total = 0
        delivery_fee = 40  # Flat fee as per user requirements
        
        # Check for Coupon
        coupon_code = request.data.get('coupon_code')
        coupon_discount_val = 0
        applied_coupon = None
        
        if coupon_code:
            try:
                # Need to calculate subtotal first to check coupon validity
                temp_subtotal = sum(item.product.price * item.quantity for item in cart_items)
                c = Coupon.objects.get(code=coupon_code.upper(), is_active=True)
                is_valid, msg = c.is_valid(temp_subtotal)
                if is_valid:
                    applied_coupon = c
                    # We will apply this to the final total after item-level discounts
                else:
                    return Response({'detail': msg}, status=400)
            except Coupon.DoesNotExist:
                return Response({'detail': 'Invalid coupon code.'}, status=400)

        order = Order.objects.create(
            user=request.user,
            warehouse=nearest_wh,
            delivery_address=data['delivery_address'],
            delivery_lat=data['delivery_lat'],
            delivery_lng=data['delivery_lng'],
            delivery_fee=delivery_fee,
        )

        from apps.offers.utils import apply_offer_to_price, bulk_get_offers_for_products
        
        # Batch Fetch all offers for products in cart in 1 query
        products_in_cart = [item.product for item in cart_items]
        offers_map = bulk_get_offers_for_products(products_in_cart)

        order_items_to_create = []
        for item in cart_items:
            pricing = apply_offer_to_price(item.product, offer=offers_map.get(item.product.id))
            final_price = pricing['final_price']
            discount = pricing['discount_amount']
            subtotal += pricing['original_price'] * item.quantity
            discount_total += discount * item.quantity

            order_items_to_create.append(OrderItem(
                order=order,
                product=item.product,
                quantity=item.quantity,
                unit_price=pricing['original_price'],
                discount_percentage=pricing['discount_percentage'],
                final_price=final_price,
                applied_offer=pricing['offer'],
            ))

        if order_items_to_create:
            OrderItem.objects.bulk_create(order_items_to_create)

        # Update order totals
        order.subtotal = subtotal
        
        # Initial discount from item-level offers
        total_discount = discount_total
        
        # Add Coupon Discount if applicable
        if applied_coupon:
            remaining_total = subtotal - discount_total
            coupon_discount_val = (remaining_total * (applied_coupon.discount_percentage / 100))
            total_discount += coupon_discount_val

        order.discount_amount = total_discount
        order.total_amount = subtotal - total_discount + delivery_fee
        order.save()

        # Deduct inventory
        deduct_inventory(nearest_wh, order.items.all())

        # Clear the cart
        cart.items.all().delete()

        # Fire background notification
        try:
            from .tasks import notify_warehouse_new_order
            notify_warehouse_new_order.delay(order.id, nearest_wh.name)
        except Exception:
            pass

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class ValidateCouponView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        code = request.data.get('code')
        cart_total = request.data.get('cart_total', 0)
        
        if not code:
            return Response({'detail': 'Coupon code is required.'}, status=400)
            
        try:
            coupon = Coupon.objects.get(code=code.upper(), is_active=True)
            is_valid, msg = coupon.is_valid(float(cart_total))
            
            if not is_valid:
                return Response({'valid': False, 'detail': msg}, status=400)
                
            return Response({
                'valid': True,
                'code': coupon.code,
                'discount_percentage': coupon.discount_percentage,
                'description': coupon.description
            })
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'detail': 'Invalid coupon code.'}, status=404)


class OrderListView(generics.ListAPIView):
    """List all orders for the authenticated user."""
    serializer_class = OrderSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product').order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class NearestWarehouseView(APIView):
    """
    GET /api/nearest-warehouse/?lat=XX&lng=YY&product_ids=1,2,3
    Returns the nearest warehouse that has all the specified products in stock.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        product_ids_str = request.query_params.get('product_ids', '')

        if not lat or not lng:
            return Response({'detail': 'lat and lng are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat, lng = float(lat), float(lng)
        except ValueError:
            return Response({'detail': 'Invalid lat/lng values.'}, status=status.HTTP_400_BAD_REQUEST)

        product_ids = [int(pid) for pid in product_ids_str.split(',') if pid.strip().isdigit()]
        product_quantities = {pid: 1 for pid in product_ids}  # qty=1 means "has stock"

        from apps.warehouses.utils import find_nearest_warehouse
        warehouse = find_nearest_warehouse(lat, lng, product_quantities)
        if not warehouse:
            return Response({'detail': 'No available warehouse found.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.warehouses.serializers import WarehouseSerializer
        return Response(WarehouseSerializer(warehouse).data)


from .models import OrderRating
from .serializers import OrderRatingSerializer

class OrderRatingView(APIView):
    """Allow customer to rate a completed order's delivery."""
    permission_classes = (IsAuthenticated,)

    def post(self, request, order_pk):
        try:
            order = Order.objects.get(pk=order_pk, user=request.user)
            if order.status != 'delivered':
                 return Response({'detail': 'You can only rate delivered orders.'}, status=400)
            
            if hasattr(order, 'rating'):
                 return Response({'detail': 'Order already rated.'}, status=400)

            stars = request.data.get('stars', 5)
            review = request.data.get('review', '')
            
            # Find the assigned rider
            assignment = getattr(order, 'delivery_assignment', None)
            if not assignment or not assignment.delivery_man:
                 return Response({'detail': 'No rider found for this order.'}, status=404)

            rating = OrderRating.objects.create(
                order=order,
                rider=assignment.delivery_man,
                stars=stars,
                review=review
            )
            return Response(OrderRatingSerializer(rating).data, status=201)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
