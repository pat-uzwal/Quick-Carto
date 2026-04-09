from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, DeliveryAssignment, DeliveryNotification, ChatMessage, OrderRating
from apps.products.serializers import ProductSerializer
from apps.offers.utils import apply_offer_to_price


class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_detail', 'quantity', 'subtotal')


class CartItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ('product', 'quantity')

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total', 'updated_at')


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = (
            'id', 'product', 'product_name', 'product_image', 'quantity',
            'unit_price', 'discount_percentage', 'final_price', 'subtotal', 'applied_offer',
        )

    def get_product_image(self, obj):
        from urllib.parse import quote
        raw = obj.product.image_url or ''
        if not raw:
            return ''
        if raw.startswith('data:'):
            return raw
        if raw.startswith('http'):
            return raw
        parts = raw.split('/')
        return '/'.join(quote(part, safe='') for part in parts)


class OrderRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderRating
        fields = ['id', 'order', 'rider', 'stars', 'review', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    delivery_assignment = serializers.SerializerMethodField()
    rating = OrderRatingSerializer(read_only=True)
    is_rated = serializers.SerializerMethodField()

    def get_is_rated(self, obj):
        return hasattr(obj, 'rating')

    class Meta:
        model = Order
        fields = (
            'id', 'status', 'status_display', 'warehouse', 'warehouse_name', 'delivery_address',
            'delivery_lat', 'delivery_lng', 'subtotal', 'discount_amount',
            'delivery_fee', 'total_amount', 'items', 'delivery_assignment', 'created_at', 'delivery_otp',
            'is_rated', 'rating', 'customer_name', 'customer_phone', 'rider_name',
        )

    customer_name = serializers.CharField(source='user.full_name', read_only=True)
    customer_phone = serializers.CharField(source='user.phone_number', read_only=True)
    rider_name = serializers.CharField(source='delivery_assignment.delivery_man.full_name', default='Unassigned', read_only=True)

    def get_delivery_assignment(self, obj):
        try:
            da = obj.delivery_assignment
            return {
                'delivery_man': da.delivery_man.get_full_name() if da.delivery_man else None,
                'assigned_at': da.assigned_at,
                'delivered_at': da.delivered_at,
            }
        except Exception:
            return None


class PlaceOrderSerializer(serializers.Serializer):
    """Minimal payload: user just needs to confirm their address."""
    delivery_address = serializers.CharField()
    delivery_lat = serializers.DecimalField(max_digits=9, decimal_places=6)
    delivery_lng = serializers.DecimalField(max_digits=9, decimal_places=6)


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'order', 'sender', 'sender_email', 'sender_role', 'message', 'message_type', 'context', 'timestamp', 'is_read']


class DeliveryAssignmentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    delivery_address = serializers.CharField(source='order.delivery_address', read_only=True)
    user_name = serializers.CharField(source='order.user.full_name', read_only=True)
    user_phone = serializers.CharField(source='order.user.phone_number', default='', read_only=True)
    total_amount = serializers.DecimalField(source='order.total_amount', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = DeliveryAssignment
        fields = ['id', 'order_id', 'order_status', 'delivery_address', 'user_name', 'user_phone', 'total_amount', 'assigned_at', 'delivered_at']


class DeliveryNotificationSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    delivery_address = serializers.CharField(source='order.delivery_address', read_only=True)
    total_amount = serializers.DecimalField(
        source='order.total_amount', max_digits=10, decimal_places=2, read_only=True
    )
    warehouse_name = serializers.CharField(source='order.warehouse.name', read_only=True)
    warehouse_district = serializers.CharField(source='order.warehouse.district', read_only=True)
    items_count = serializers.SerializerMethodField()
    order_items = OrderItemSerializer(source='order.items', many=True, read_only=True)

    class Meta:
        model = DeliveryNotification
        fields = (
            'id', 'order_id', 'order_status', 'delivery_address', 'total_amount',
            'warehouse_name', 'warehouse_district', 'items_count', 'order_items',
            'status', 'notified_at', 'responded_at', 'rejection_reason',
        )

    def get_items_count(self, obj):
        return obj.order.items.count()


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = ChatMessage
        fields = (
            'id', 'order', 'sender', 'sender_name', 'sender_role', 
            'receiver', 'message', 'message_type', 'timestamp', 
            'context', 'is_read'
        )

    def get_sender_name(self, obj):
        name = obj.sender.full_name or f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name if name else obj.sender.username.split('@')[0]

