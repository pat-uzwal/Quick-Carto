from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product
from apps.orders.models import Order, Cart, CartItem
from apps.warehouses.models import Warehouse

User = get_user_model()

class CustomerFullFlowTests(APITestCase):
    def setUp(self):
        # Create Customer
        self.user = User.objects.create_user(
            username='customer1', email='customer@test.com', password='password123', full_name='John Customer'
        )
        self.client.force_authenticate(user=self.user)
        
        # Setup Data
        self.category = Category.objects.create(name='Groceries')
        self.product = Product.objects.create(
            category=self.category, name='Milk', price=100, brand='Dairy', sku='MILK01'
        )
        self.warehouse = Warehouse.objects.create(
            name='KTM Hub', code='KTM01', address='Kathmandu', latitude=27.7, longitude=85.3
        )
        
        # Add Inventory (Required for Placing Order)
        from apps.warehouses.models import Inventory
        Inventory.objects.create(
            warehouse=self.warehouse, product=self.product, stock_quantity=100
        )

    # 1. Real-time product search
    def test_search_products(self):
        url = reverse('product-list')
        response = self.client.get(url, {'search': 'Milk'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['name'], 'Milk')

    # 2. Browse products by category
    def test_browse_by_category(self):
        url = reverse('product-list')
        response = self.client.get(url, {'category': self.category.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['name'], 'Milk')

    # 3. View product details
    def test_view_product_details(self):
        url = reverse('product-detail', kwargs={'pk': self.product.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Milk')

    # 4. Add product to cart
    def test_add_to_cart(self):
        url = reverse('cart-items')
        response = self.client.post(url, {'product': self.product.id, 'quantity': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK) # View returns 200 OK after adding

    # 5. Update cart item quantity
    def test_update_cart_quantity(self):
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        url = reverse('cart-items')
        response = self.client.post(url, {'product': self.product.id, 'quantity': 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 6. Remove item from cart
    def test_remove_from_cart(self):
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        url = reverse('cart-item-delete', kwargs={'product_id': self.product.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK) # API returns updated cart

    # 7. View cart total
    def test_view_cart_total(self):
        url = reverse('cart')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data) # Changed from subtotal to total

    # 8. Proceed to checkout
    def test_proceed_to_checkout(self):
        # Checkout usually means viewing the cart summary before placing order
        url = reverse('cart')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 9. Enter delivery address & 10. Select payment method & 11. Place order
    def test_place_order_full(self):
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        url = reverse('place-order')
        data = {
            'delivery_address': 'Baneshwor, KTM',
            'delivery_lat': 27.7,
            'delivery_lng': 85.3,
            'payment_method': 'cod',
            'warehouse_id': self.warehouse.id
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # 12. View order history
    def test_order_history(self):
        url = reverse('order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 13. View order details
    def test_order_details(self):
        order = Order.objects.create(user=self.user, warehouse=self.warehouse, total_amount=100, status='pending')
        url = reverse('order-detail', kwargs={'pk': order.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 14. Track order status (check status field)
    def test_track_order_status(self):
        order = Order.objects.create(user=self.user, warehouse=self.warehouse, total_amount=100, status='packed')
        url = reverse('order-detail', kwargs={'pk': order.id})
        response = self.client.get(url)
        self.assertEqual(response.data['status'], 'packed')

    # 15. Edit user profile
    def test_edit_profile(self):
        # Using the router-generated URL for the user detail update
        url = reverse('user-detail', kwargs={'pk': self.user.id})
        data = {'full_name': 'Updated John'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, 'Updated John')
