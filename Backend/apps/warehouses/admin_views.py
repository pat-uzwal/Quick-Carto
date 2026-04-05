from rest_framework import viewsets, filters, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.permissions import IsAdmin
from .models import Warehouse, Inventory, StockLog
from .serializers import WarehouseSerializer, InventorySerializer, StockLogSerializer

class AdminWarehouseViewSet(viewsets.ModelViewSet):
    """Admin-only warehouse management CRUD."""
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = (IsAdmin,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code', 'address']

class AdminInventoryViewSet(viewsets.ModelViewSet):
    """Admin-only global inventory management CRUD + stock operations."""
    queryset = Inventory.objects.select_related('warehouse', 'product__category').all()
    serializer_class = InventorySerializer
    permission_classes = (IsAdmin,)
    pagination_class = None  # Return ALL records - no page limit
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['warehouse', 'product']
    search_fields = ['product__name', 'product__sku']

    @action(detail=True, methods=['POST'], url_path='update-stock')
    def update_stock(self, request, pk=None):
        """Perform stock movement (restock, deduction, damage)."""
        inventory = self.get_object()
        action_type = request.data.get('action')
        quantity = int(request.data.get('quantity', 0))
        notes = request.data.get('notes', '')

        if action_type == 'restock':
            inventory.stock_quantity += quantity
        elif action_type == 'damage':
            inventory.stock_quantity -= quantity
        elif action_type == 'transfer':
            # Simplified logic for transfer
            inventory.stock_quantity -= quantity
        else:
            return Response({'detail': 'Invalid action type for manual update.'}, status=400)

        inventory.save()
        StockLog.objects.create(
            inventory=inventory,
            action=action_type,
            quantity=quantity,
            notes=notes
        )
        return Response(InventorySerializer(inventory).data)

class AdminStockLogListView(generics.ListAPIView):
    """History of all stock movements globally."""
    queryset = StockLog.objects.select_related('inventory__product', 'inventory__warehouse').order_by('-timestamp').all()
    serializer_class = StockLogSerializer
    permission_classes = (IsAdmin,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['action', 'inventory__warehouse', 'inventory__product']
    search_fields = ['inventory__product__name', 'notes']
