from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.permissions import IsAdmin
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, ProductWriteSerializer

class AdminCategoryViewSet(viewsets.ModelViewSet):
    """Admin-only category management CRUD."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (IsAdmin,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class AdminProductViewSet(viewsets.ModelViewSet):
    """Admin-only product management CRUD + bulk upload."""
    queryset = Product.objects.all().select_related('category')
    permission_classes = (IsAdmin,)
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'is_active']
    search_fields = ['name', 'sku', 'brand', 'description']
    ordering_fields = ['price', 'created_at', 'mrp', 'selling_price']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductWriteSerializer
        return ProductSerializer

    @action(detail=False, methods=['POST'], url_path='bulk-upload')
    def bulk_upload(self, request):
        """Placeholder for bulk CSV upload logic."""
        # For professional FYP, would implement pandas/csv processing here.
        return Response({'detail': 'Bulk upload feature initialized. CSV processing module pending integration.'}, status=status.HTTP_202_ACCEPTED)
