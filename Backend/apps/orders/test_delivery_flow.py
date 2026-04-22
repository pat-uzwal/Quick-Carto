from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.orders.models import Order
from apps.warehouses.models import Warehouse

User = get_user_model()

class DeliveryFlowTests(APITestCase):
    def setUp(self):
        # Create a Rider user
        self.rider = User.objects.create_user(
            username='rider1', email='rider1@test.com', password='password123', 
            role='delivery', full_name='Mike Rider', phone_number='9800000001'
        )
        self.client.force_authenticate(user=self.rider)
        
        self.warehouse = Warehouse.objects.create(
            name='KTM Hub', code='KTM01', address='Kathmandu', latitude=27.7, longitude=85.3
        )
        
        # Create an order available for delivery
        self.order = Order.objects.create(
            user=self.rider, # Just for convenience in test
            warehouse=self.warehouse,
            total_amount=1500,
            delivery_address='Baneshwor',
            delivery_lat=27.7,
            delivery_lng=85.3,
            status='packed'
        )

    def test_view_mission_feed(self):
        """Rider can see available delivery jobs (notifications/missions)."""
        url = reverse('delivery-notifications')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_accept_delivery_request(self):
        """Rider can accept an order for delivery."""
        url = reverse('delivery-accept', kwargs={'order_pk': self.order.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.rider, self.rider)
        self.assertEqual(self.order.status, 'out_for_delivery')

    def test_reject_delivery_request(self):
        """Rider can reject an order request."""
        url = reverse('delivery-reject', kwargs={'order_pk': self.order.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_delivery_status_to_delivered(self):
        """Rider updates status (usually happens after OTP verification in real flow)."""
        self.order.rider = self.rider
        self.order.status = 'out_for_delivery'
        self.order.save()
        
        # We test the verify-otp endpoint which ultimately marks as delivered
        url = reverse('delivery-verify-otp', kwargs={'order_pk': self.order.id})
        # Assuming the order has an otp field or we mock the check
        self.order.otp = '123456'
        self.order.save()
        
        response = self.client.post(url, {'otp': '123456'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'delivered')

    def test_view_earnings_and_stats(self):
        """Rider can view their delivery statistics and earnings."""
        url = reverse('delivery-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_earnings', response.data)

    def test_update_rider_profile(self):
        """Rider can update their phone number and name."""
        url = reverse('delivery-profile-update')
        data = {'full_name': 'Mike Faster Rider', 'phone_number': '9811111111'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.rider.refresh_from_db()
        self.assertEqual(self.rider.full_name, 'Mike Faster Rider')

    def test_toggle_online_offline_status(self):
        """Rider can toggle their availability."""
        url = reverse('delivery-profile-update') # Reusing update profile for status
        response = self.client.patch(url, {'is_online': False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.rider.refresh_from_db()
        self.assertFalse(self.rider.is_online)
