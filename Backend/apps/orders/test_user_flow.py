from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product
from apps.orders.models import Order, Cart, CartItem
from apps.warehouses.models import Warehouse

User = get_user_model()

class UserOrderFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@test.com', password='password123', full_name='Test User'
        )
        self.client.force_authenticate(user=self.user)
        
        self.category = Category.objects.create(name='Electronics')
        self.product = Product.objects.create(
            category=self.category, name='iPhone 15', price=100000, brand='Apple', sku='IP15'
        )
        self.warehouse = Warehouse.objects.create(
            name='KTM Hub', code='KTM01', address='Kathmandu', latitude=27.7, longitude=85.3
        )
        
        self.cart_url = reverse('cart')
        self.cart_items_url = reverse('cart-items')
        self.place_order_url = reverse('place-order')
        self.order_list_url = reverse('order-list')

    def test_add_product_to_cart(self):
        """User can add a product to their cart."""
        data = {'product_id': self.product.id, 'quantity': 2}
        response = self.client.post(self.cart_items_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CartItem.objects.filter(product=self.product).exists())

    def test_update_cart_item_quantity(self):
        """User can change the quantity of an item in the cart."""
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        
        data = {'product_id': self.product.id, 'quantity': 5}
        response = self.client.post(self.cart_items_url, data) # Usually update is handled by the same POST or PATCH
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        item = CartItem.objects.get(product=self.product)
        self.assertEqual(item.quantity, 5)

    def test_remove_item_from_cart(self):
        """User can remove a product from their cart."""
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        
        url = reverse('cart-item-delete', kwargs={'product_id': self.product.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CartItem.objects.filter(product=self.product).exists())

    def test_view_cart_total(self):
        """User can see the cart subtotal and delivery fee."""
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)
        
        response = self.client.get(self.cart_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming response data includes subtotal and delivery_fee
        self.assertIn('subtotal', response.data)
        self.assertIn('delivery_fee', response.data)

    def test_place_order(self):
        """User can place an order with delivery address and payment method."""
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        
        data = {
            'delivery_address': 'New Baneshwor, KTM',
            'delivery_lat': 27.6915,
            'delivery_lng': 85.3420,
            'payment_method': 'cod',
            'warehouse_id': self.warehouse.id
        }
        response = self.client.post(self.place_order_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Order.objects.filter(user=self.user).exists())

    def test_view_order_history_and_details(self):
        """User can see their past orders and individual order details."""
        order = Order.objects.create(
            user=self.user, warehouse=self.warehouse, total_amount=1000, 
            delivery_address='KTM', status='pending'
        )
        
        # History
        response = self.client.get(self.order_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
        
        # Details
        detail_url = reverse('order-detail', kwargs={'pk': order.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'pending')
