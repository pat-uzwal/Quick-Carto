from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.orders.models import Order
from apps.orders.payment_models import Payment
from unittest.mock import patch
import uuid

User = get_user_model()

class PaymentAPITests(APITestCase):
    def setUp(self):
        self.verify_khalti_url = reverse('verify-khalti')
        self.user = User.objects.create_user(username='testuser1', email='testuser@example.com', password='testpassword123', full_name='Test User')
        
        # Create an order
        self.order = Order.objects.create(
            user=self.user,
            total_amount=100.00,
            status='pending',
            delivery_address="Test Address, City"
        )
        
    @patch('apps.orders.payment_views.requests.post')
    def test_verify_khalti_success(self, mock_post):
        # Force authentication
        self.client.force_authenticate(user=self.user)
        
        # Mock requests.post response from Khalti
        mock_response = mock_post.return_value
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "idx": "8xG6TcEcVn4b7HxzYxM8H3",
            "type": "ebanking"
        }
        
        payload = {
            "token": "test_token_123",
            "amount": 10000, # 100 Rs in paisa
            "order_id": str(self.order.id)
        }
        
        response = self.client.post(self.verify_khalti_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify db states
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'packed')
        
        self.assertTrue(Payment.objects.filter(order=self.order).exists())
        payment = Payment.objects.get(order=self.order)
        self.assertEqual(payment.payment_status, 'completed')
        self.assertEqual(payment.transaction_id, "8xG6TcEcVn4b7HxzYxM8H3")

    @patch('apps.orders.payment_views.requests.post')
    def test_verify_khalti_failure(self, mock_post):
        self.client.force_authenticate(user=self.user)
        
        # Mock Khalti failure
        mock_response = mock_post.return_value
        mock_response.status_code = 400
        mock_response.json.return_value = {"detail": "Invalid token"}
        
        payload = {
            "token": "invalid_token",
            "amount": 10000,
            "order_id": str(self.order.id)
        }
        
        response = self.client.post(self.verify_khalti_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'pending') # Should not change
        
        # Verify Payment table doesn't have completed payment
        self.assertFalse(Payment.objects.filter(order=self.order, payment_status='completed').exists())
