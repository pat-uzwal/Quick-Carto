from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.orders.models import Order, DeliveryAssignment
from apps.warehouses.models import Warehouse

User = get_user_model()

class RiderFullFlowTests(APITestCase):
    def setUp(self):
        # Create Rider
        self.rider = User.objects.create_user(
            username='rider1', email='rider1@test.com', password='password123', 
            role='delivery', full_name='Mike Rider', phone_number='9800000001', is_online=True
        )
        self.client.force_authenticate(user=self.rider)
        
        # Create Warehouse
        self.warehouse = Warehouse.objects.create(
            name='KTM Hub', code='KTM01', address='Kathmandu', latitude=27.7, longitude=85.3
        )
        
        # Create an order available for delivery
        self.order = Order.objects.create(
            user=self.rider, # dummy user for order
            warehouse=self.warehouse,
            total_amount=1500,
            delivery_address='Baneshwor',
            delivery_lat=27.7,
            delivery_lng=85.3,
            status='packed'
        )

    # 1. View mission feed (assigned orders / notifications)
    def test_mission_feed(self):
        url = reverse('delivery-notifications')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 2. Accept delivery request
    def test_accept_request(self):
        url = reverse('delivery-accept', kwargs={'order_pk': self.order.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'accepted_by_rider')

    # 3. Reject delivery request
    def test_reject_request(self):
        url = reverse('delivery-reject', kwargs={'order_pk': self.order.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 4. View delivery details
    def test_delivery_details(self):
        url = reverse('delivery-order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 5. Update delivery status (Picked Up)
    def test_update_status_picked(self):
        # Manually assign first
        DeliveryAssignment.objects.create(order=self.order, delivery_man=self.rider)
        self.order.status = 'reached_warehouse' # Next step will be 'picked_up'
        self.order.save()
        
        url = reverse('delivery-update', kwargs={'order_pk': self.order.id})
        response = self.client.post(url, {'status': 'picked_up'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'picked_up')

    # 6. OTP verification for delivery completion
    def test_verify_otp(self):
        # Must be assigned to mission to verify OTP
        DeliveryAssignment.objects.create(order=self.order, delivery_man=self.rider)
        self.order.status = 'out_for_delivery'
        self.order.delivery_otp = '123456' # Correct field name
        self.order.save()
        
        url = reverse('delivery-verify-otp', kwargs={'order_pk': self.order.id})
        response = self.client.post(url, {'otp': '123456'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'delivered')

    # 7. View earnings (today + total)
    def test_view_earnings(self):
        url = reverse('delivery-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_earnings', response.data)

    # 8. View completed delivery history
    def test_delivery_history(self):
        url = reverse('delivery-completed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 9. Update rider profile
    def test_update_profile(self):
        url = reverse('delivery-profile-update')
        response = self.client.post(url, {'full_name': 'New Name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.rider.refresh_from_db()
        self.assertEqual(self.rider.full_name, 'New Name')

    # 10. Toggle online/offline status
    def test_toggle_online(self):
        url = reverse('delivery-toggle-online')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.rider.refresh_from_db()
        self.assertFalse(self.rider.is_online)
