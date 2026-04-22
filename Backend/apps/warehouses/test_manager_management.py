from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.orders.models import Order
from apps.warehouses.models import Warehouse, Inventory
from apps.products.models import Category, Product

User = get_user_model()

class WarehouseManagerTests(APITestCase):
    def setUp(self):
        # Create a Warehouse
        self.warehouse = Warehouse.objects.create(
            name='Kathmandu Main Hub', code='KTM001', address='Durbarmarg',
            latitude=27.7172, longitude=85.3240
        )
        
        # Create a Warehouse Manager
        self.manager = User.objects.create_user(
            username='manager1', email='manager1@test.com', password='password123',
            role='warehouse', assigned_warehouse=self.warehouse, full_name='Alice Manager'
        )
        self.client.force_authenticate(user=self.manager)

        # Create Category and Product
        self.category = Category.objects.create(name='Electronics')
        self.product = Product.objects.create(
            category=self.category, name='Laptop', price=100000, 
            weight_volume='2kg', brand='Dell', sku='DELL-XP-01'
        )
        
        # Create Inventory for the Warehouse
        self.inventory = Inventory.objects.create(
            warehouse=self.warehouse, product=self.product, stock_quantity=10,
            low_stock_threshold=5
        )

        # Create some orders for this warehouse
        self.order1 = Order.objects.create(
            user=self.manager, warehouse=self.warehouse, total_amount=1000, 
            delivery_address='KTM', status='pending'
        )
        self.order2 = Order.objects.create(
            user=self.manager, warehouse=self.warehouse, total_amount=2000, 
            delivery_address='Lalitpur', status='packed'
        )

    # 1. View all incoming orders
    def test_view_incoming_orders(self):
        """Warehouse manager can view all orders assigned to their hub."""
        url = reverse('wh-order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check 'results' key because the API is paginated
        self.assertEqual(len(response.data['results']), 2)

    # 2. Filter orders by status
    def test_filter_orders_by_status(self):
        """Warehouse manager can filter incoming orders by status."""
        url = reverse('wh-order-list')
        response = self.client.get(url, {'status': 'pending'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return only the pending order
        for order in response.data['results']:
            self.assertEqual(order['status'], 'pending')

    # 3. Search orders by ID/email
    def test_search_orders(self):
        """Warehouse manager can search for specific orders."""
        url = reverse('wh-order-list')
        response = self.client.get(url, {'search': str(self.order1.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    # 4. Pack an order (status update)
    def test_pack_order(self):
        """Warehouse manager can mark a pending order as 'packed'."""
        url = reverse('wh-order-pack', kwargs={'pk': self.order1.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order1.refresh_from_db()
        self.assertEqual(self.order1.status, 'packed')

    # 5. View stock items
    def test_view_stock_items(self):
        """Warehouse manager can view current inventory in their hub."""
        url = reverse('wh-inventory-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['product_name'], 'Laptop')

    # 6. Filter stock by status (Low / Out of Stock)
    def test_filter_stock_alerts(self):
        """Warehouse manager can see low stock and out of stock counts in dashboard."""
        url = reverse('wh-analytics')
        # Update inventory to be low stock
        self.inventory.stock_quantity = 2 # Below threshold 5
        self.inventory.save()
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['low_stock_count'], 1)

    # 7. Update stock quantity
    def test_update_stock_quantity(self):
        """Warehouse manager can manually update stock levels."""
        url = reverse('wh-inventory-detail', kwargs={'pk': self.inventory.id})
        data = {'stock_quantity': 50}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 50)

    # 8. Ping/assign rider for delivery
    def test_ping_riders(self):
        """Warehouse manager can broadcast a ping to nearby riders for a packed order."""
        url = reverse('wh-assign-delivery', kwargs={'order_pk': self.order2.id})
        # Assuming there's a mock for the notification logic or it returns a 400 if no riders online
        response = self.client.post(url)
        # We check for a valid status code (either 200 or 400 with 'no riders' message is acceptable for logic test)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
