from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.warehouses.models import Warehouse

User = get_user_model()

class AdminUserManagementTests(APITestCase):
    def setUp(self):
        # Create an Admin user
        self.admin_user = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='password123'
        )
        # Ensure role is set to 'admin' (if superuser doesn't automatically set it)
        self.admin_user.role = 'admin'
        self.admin_user.save()
        self.client.force_authenticate(user=self.admin_user)

        # Create some test users with different roles
        self.customer = User.objects.create_user(
            username='customer1', email='customer1@test.com', 
            password='password123', role='user', full_name='John Customer'
        )
        self.rider = User.objects.create_user(
            username='rider1', email='rider1@test.com', 
            password='password123', role='delivery', full_name='Mike Rider',
            phone_number='9800000001'
        )
        self.manager = User.objects.create_user(
            username='manager1', email='manager1@test.com', 
            password='password123', role='warehouse', full_name='Alice Manager'
        )

        # Create a warehouse for assignment testing
        self.warehouse = Warehouse.objects.create(
            name='Kathmandu Main', code='KTM001', address='Durbarmarg',
            latitude=27.7172, longitude=85.3240
        )

        self.list_url = reverse('admin-user-list')

    def test_view_all_registered_users(self):
        """Admin can list all registered users."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should have at least 4 users: admin, customer1, rider1, manager1
        self.assertGreaterEqual(len(response.data['results']), 4)

    def test_role_based_user_filtering(self):
        """Admin can filter users by role (e.g., riders)."""
        # Filter for riders (delivery role)
        response = self.client.get(self.list_url, {'role': 'delivery'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if all returned users have the 'delivery' role
        for user in response.data['results']:
            self.assertEqual(user['role'], 'delivery')

    def test_search_users_by_name_email_phone(self):
        """Admin can search users by username, email, or phone."""
        # Search by email
        response = self.client.get(self.list_url, {'search': 'rider1@test.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['username'], 'rider1')

    def test_delete_user_account(self):
        """Admin can delete a user account."""
        user_to_delete = User.objects.create_user(
            username='delete_me', email='delete_me@test.com', password='password123'
        )
        detail_url = reverse('admin-user-detail', kwargs={'pk': user_to_delete.id})
        
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(username='delete_me').exists())

    def test_create_warehouse_manager_and_assign_warehouse(self):
        """Admin can create a warehouse manager and assign a specific warehouse."""
        manager_data = {
            'username': 'new_manager',
            'email': 'new_manager@test.com',
            'password': 'password123',
            'full_name': 'New Warehouse Manager',
            'phone_number': '9800000002',
            'role': 'warehouse',
            'assigned_warehouse': self.warehouse.id
        }
        response = self.client.post(self.list_url, manager_data)
        
        # Checking status 201
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify in database
        new_manager = User.objects.get(username='new_manager')
        self.assertEqual(new_manager.role, 'warehouse')
        self.assertEqual(new_manager.assigned_warehouse, self.warehouse)
