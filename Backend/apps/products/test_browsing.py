from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.products.models import Category, Product

class ProductBrowsingTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Electronics')
        self.category_food = Category.objects.create(name='Food')
        
        self.product1 = Product.objects.create(
            category=self.category, name='iPhone 15', price=100000, brand='Apple', sku='IP15'
        )
        self.product2 = Product.objects.create(
            category=self.category_food, name='Apple Fruit', price=200, brand='Organic', sku='AF01'
        )
        self.list_url = reverse('product-list')

    def test_real_time_product_search(self):
        """User can search products by name."""
        response = self.client.get(self.list_url, {'search': 'iPhone'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'iPhone 15')

    def test_browse_products_by_category(self):
        """User can filter products by category."""
        response = self.client.get(self.list_url, {'category': self.category.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return iPhone, not Apple Fruit
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'iPhone 15')

    def test_view_product_details(self):
        """User can view details of a specific product."""
        url = reverse('product-detail', kwargs={'pk': self.product1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'iPhone 15')
