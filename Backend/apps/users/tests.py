from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.users.models import EmailOTP

User = get_user_model()

class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.request_otp_url = reverse('request-otp')
        self.verify_otp_url = reverse('verify-otp')
        
        self.user_data = {
            'username': 'testuser1',
            'email': 'testuser@example.com',
            'password': 'testpassword123',
            'full_name': 'Test User',
            'phone_number': '1234567890'
        }

    def test_register_user(self):
        # Ensure new user can register and OTP is generated
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='testuser@example.com').exists())
        user = User.objects.get(email='testuser@example.com')
        # Check if OTP was created
        self.assertTrue(EmailOTP.objects.filter(user=user).exists())

    def test_request_otp(self):
        # Create a user first
        user = User.objects.create_user(username='testuser1', email='testuser@example.com', password='testpassword123', full_name='Test User')
        
        response = self.client.post(self.request_otp_url, {'email': user.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(EmailOTP.objects.filter(user=user, is_verified=False).exists())

    def test_verify_otp_success(self):
        user = User.objects.create_user(username='testuser2', email='testuser@example.com', password='testpassword123', full_name='Test User')
        otp_obj = EmailOTP.generate_for(user)
        
        verify_data = {
            'email': user.email,
            'otp': otp_obj.otp
        }
        
        response = self.client.post(self.verify_otp_url, verify_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        otp_obj.refresh_from_db()
        self.assertTrue(otp_obj.is_verified)

    def test_verify_otp_invalid(self):
        user = User.objects.create_user(username='testuser3', email='testuser@example.com', password='testpassword123', full_name='Test User')
        EmailOTP.generate_for(user)
        
        verify_data = {
            'email': user.email,
            'otp': '000000' # Wrong OTP
        }
        
        response = self.client.post(self.verify_otp_url, verify_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
