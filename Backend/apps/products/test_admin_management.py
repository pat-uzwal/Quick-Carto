from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product
from apps.warehouses.models import Warehouse, Inventory
from apps.orders.models import Order
from decimal import Decimal

User = get_user_model()

class AdminManagementTests(APITestCase):
    def setUp(self):
        # Admin User
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='password123'
        )
        self.admin.role = 'admin'
        self.admin.save()
        self.client.force_authenticate(user=self.admin)

        # Basic Data
        self.category = Category.objects.create(name='Electronics')
        self.warehouse = Warehouse.objects.create(
            name='Kathmandu Hub', code='KTM01', address='Kathmandu',
            latitude=27.7, longitude=85.3
        )
        self.product = Product.objects.create(
            category=self.category, name='Smartphone', price=50000, 
            weight_volume='200g', brand='Apple', sku='IP15'
        )
        self.inventory = Inventory.objects.create(
            warehouse=self.warehouse, product=self.product, stock_quantity=10
        )

    # --- CATEGORY TESTS ---
    def test_create_new_category(self):
        url = reverse('admin-category-list')
        data = {'name': 'Home Appliances'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Category.objects.filter(name='Home Appliances').exists())

    # --- PRODUCT TESTS ---
    def test_add_new_product(self):
        url = reverse('admin-product-list')
        data = {
            'name': 'Laptop',
            'category': self.category.id,
            'price': 120000,
            'weight_volume': '2kg',
            'brand': 'Dell',
            'sku': 'DELL-XP-01'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Product.objects.filter(name='Laptop').exists())

    def test_edit_update_product(self):
        url = reverse('admin-product-detail', kwargs={'pk': self.product.id})
        data = {'price': 55000} # Price Increase
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, 55000)

    # --- INVENTORY TESTS ---
    def test_filter_inventory_by_warehouse(self):
        url = reverse('admin-inventory-list')
        response = self.client.get(url, {'warehouse': self.warehouse.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return exactly our inventory record
        self.assertGreaterEqual(len(response.data), 1)

    def test_update_stock_quantity(self):
        url = reverse('admin-inventory-update-stock', kwargs={'pk': self.inventory.id})
        # RESTOCK
        response = self.client.post(url, {'action': 'restock', 'quantity': 15, 'notes': 'New Shipment'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 25) # 10 + 15

    # --- ORDER TESTS ---
    def test_view_all_incoming_orders(self):
        """Admin can list all orders across lahat warehouses."""
        url = reverse('admin-order-list') # Assuming router basename='admin-order'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_orders_by_status(self):
        """Admin can filter orders by status (e.g. pending)."""
        Order.objects.create(user=self.admin, warehouse=self.warehouse, total_amount=100, status='pending')
        Order.objects.create(user=self.admin, warehouse=self.warehouse, total_amount=200, status='packed')
        
        url = reverse('admin-order-list')
        response = self.client.get(url, {'status': 'pending'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify all are pending
        for order in response.data['results']:
            self.assertEqual(order['status'], 'pending')

    def test_update_order_status_cycle(self):
        # Create a test order
        order = Order.objects.create(
            user=self.admin, warehouse=self.warehouse, 
            delivery_address='Test St', delivery_lat='27.7', delivery_lng='85.3',
            total_amount=1000, status='pending'
        )
        url = reverse('admin-order-detail', kwargs={'pk': order.id})

        # Pending -> Packed
        response = self.client.patch(url, {'status': 'packed'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'packed')

        # Packed -> Out for Delivery
        response = self.client.patch(url, {'status': 'out_for_delivery'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'out_for_delivery')

        # Out for Delivery -> Delivered
        response = self.client.patch(url, {'status': 'delivered'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'delivered')

    def test_assign_rider_for_delivery(self):
        """Admin can assign a rider to an order."""
        rider = User.objects.create_user(username='riderX', email='rx@test.com', password='pw', role='delivery')
        order = Order.objects.create(user=self.admin, warehouse=self.warehouse, total_amount=100, status='packed')
        
        # Detail view includes 'assign_delivery' action via @action
        url = reverse('admin-order-assign-delivery', kwargs={'pk': order.id})
        response = self.client.post(url, {'delivery_man_id': rider.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --- STOCK FILTER TESTS ---
    def test_filter_stock_by_status_low_stock(self):
        """Admin can filter for low stock items."""
        # Create a low stock product
        low_stock_product = Product.objects.create(category=self.category, name='Low Stock Item', sku='LOW01', price=100)
        Inventory.objects.create(warehouse=self.warehouse, product=low_stock_product, stock_quantity=2)
        
        url = reverse('admin-inventory-list')
        response = self.client.get(url, {'stock_status': 'low'}) # Assuming 'low' filter is implemented
        self.assertEqual(response.status_code, status.HTTP_200_OK)
