from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order, OrderItem, DeliveryAssignment
from .serializers import OrderSerializer, OrderItemSerializer # I need to check if these exist
from apps.users.permissions import IsAdmin

class AdminOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Order.objects.all().order_by('-created_at')
    # serializer_class = OrderSerializer # I'll verify this
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'warehouse', 'user']

    def get_serializer_class(self):
        # We might want a detailed serializer for list/retrieve
        return OrderSerializer

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        order.save()
        return Response({'status': 'Order status updated'})

    @action(detail=True, methods=['post'])
    def assign_delivery(self, request, pk=None):
        order = self.get_object()
        delivery_man_id = request.data.get('delivery_man_id')
        if not delivery_man_id:
            return Response({'error': 'Delivery man ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Implementation for assignment logic...
        # assignment, created = DeliveryAssignment.objects.get_or_create(order=order)
        # assignment.delivery_man_id = delivery_man_id
        # assignment.save()
        return Response({'status': 'Delivery man assigned'})
