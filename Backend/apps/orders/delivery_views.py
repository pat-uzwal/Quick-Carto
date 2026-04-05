"""
Delivery Man API views — /api/delivery/...
Location-based: drivers only see orders from their assigned warehouse AND if they are online.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Sum

from apps.users.permissions import IsDeliveryMan
from apps.orders.models import Order, DeliveryAssignment, DeliveryNotification, ChatMessage
from apps.orders.serializers import OrderSerializer, DeliveryNotificationSerializer, ChatMessageSerializer
from apps.warehouses.models import Warehouse
from django.db.models import Q

User = get_user_model()


def notify_warehouse_riders(order):
    """
    Primary Assignment: Notify all online delivery riders who are in the SAME zone as the warehouse.
    Secondary Assignment: Handled dynamically by DeliveryNotificationListView after 15s timeout.
    """
    if not order.warehouse or not order.warehouse.district:
        return 0

    import math
    from django.utils import timezone

    # Timestamp the packing for expansion timeout
    if not order.packed_at:
        order.packed_at = timezone.now()
        order.save(update_fields=['packed_at'])

    warehouse_district = order.warehouse.district

    # Find riders who are: Online AND (Assigned to this warehouse OR in the same district)
    riders = User.objects.filter(
        role='delivery', 
        is_online=True,
        assigned_warehouse__district=warehouse_district
    )

    notifications = []
    for rider in riders:
        if not DeliveryNotification.objects.filter(order=order, rider=rider).exists():
            notifications.append(
                DeliveryNotification(order=order, rider=rider)
            )

    if notifications:
        DeliveryNotification.objects.bulk_create(notifications)

    # Return TOTAL number of online riders available for this district
    return riders.count()


class ToggleOnlineStatusView(APIView):
    """Toggle the rider's online/offline status."""
    permission_classes = (IsDeliveryMan,)

    def post(self, request):
        user = request.user
        user.is_online = not user.is_online
        user.save(update_fields=['is_online'])
        return Response({'is_online': user.is_online})


class DeliveryNotificationListView(generics.ListAPIView):
    """
    Incoming order notifications for this rider.
    Implements proximity rules:
    1. Primary: Same district.
    2. Expansion (Secondary/Fallback): Expanded after status 'packed' for > 15s.
    """
    serializer_class = DeliveryNotificationSerializer
    permission_classes = (IsDeliveryMan,)

    def get_queryset(self):
        user = self.request.user
        if not user.is_online:
            return DeliveryNotification.objects.none()

        now = timezone.now()
        expansion_limit = now - timezone.timedelta(seconds=15)

        # 1. Expand Pool on the fly
        # Find packed orders with no current response from this rider,
        # where the rider matches the warehouse district OR 15s has passed.
        available_orders = Order.objects.filter(
            status='packed'
        ).filter(
            Q(warehouse__district=user.assigned_warehouse.district if user.assigned_warehouse else None) |
            Q(packed_at__lte=expansion_limit)
        ).exclude(
            delivery_notifications__rider=user # Expired or rejected shouldn't show again
        )

        new_notifications = []
        for order in available_orders:
            # Only create notification if order hasn't been accepted by someone else
            if not DeliveryAssignment.objects.filter(order=order).exists():
                new_notifications.append(DeliveryNotification(order=order, rider=user))
        
        if new_notifications:
            DeliveryNotification.objects.bulk_create(new_notifications, ignore_conflicts=True)

        return DeliveryNotification.objects.filter(
            rider=user,
            status='pending',
            order__status='packed',
        ).select_related('order', 'order__warehouse').order_by('-notified_at')


class DeliveryOrderListView(generics.ListAPIView):
    """
    Active deliveries assigned to this delivery man.
    Includes current ongoing orders.
    """
    serializer_class = OrderSerializer
    permission_classes = (IsDeliveryMan,)

    def get_queryset(self):
        user = self.request.user
        
        # In-progress statuses
        active_statuses = ['accepted_by_rider', 'reached_warehouse', 'picked_up', 'out_for_delivery']

        assigned = Order.objects.filter(
            delivery_assignment__delivery_man=user,
            status__in=active_statuses,
        ).distinct().order_by('-created_at')

        return assigned


class DeliveryAcceptJobView(APIView):
    """Accept a delivery order."""
    permission_classes = (IsDeliveryMan,)

    def post(self, request, order_pk):
        user = request.user
        try:
            order = Order.objects.get(pk=order_pk, status='packed')
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found or already assigned.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Removed strict warehouse validation here because delivery routing is now strictly geographical.

        # Check if already assigned
        if hasattr(order, 'delivery_assignment') and order.delivery_assignment.delivery_man:
             return Response(
                {'detail': 'This order is already accepted by another rider.'},
                status=status.HTTP_409_CONFLICT
            )

        # Create assignment
        DeliveryAssignment.objects.update_or_create(
            order=order,
            defaults={'delivery_man': user}
        )
        order.status = 'accepted_by_rider'
        order.save()

        # Update notifications
        DeliveryNotification.objects.filter(order=order, rider=user).update(status='accepted', responded_at=timezone.now())
        DeliveryNotification.objects.filter(order=order, status='pending').update(status='expired', responded_at=timezone.now())

        return Response(OrderSerializer(order).data)


class DeliveryRejectJobView(APIView):
    """Reject a delivery order."""
    permission_classes = (IsDeliveryMan,)

    def post(self, request, order_pk):
        user = request.user
        reason = request.data.get('reason', '')

        try:
            order = Order.objects.get(pk=order_pk, status='packed')
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found or no longer available.'},
                status=status.HTTP_404_NOT_FOUND
            )

        notif, _ = DeliveryNotification.objects.get_or_create(
            order=order,
            rider=user,
            defaults={
                'status': 'rejected',
                'responded_at': timezone.now(),
                'rejection_reason': reason,
            }
        )
        notif.status = 'rejected'
        notif.responded_at = timezone.now()
        notif.rejection_reason = reason
        notif.save()

        return Response({'detail': 'Order rejected successfully.'})


class DeliveryCancelJobView(APIView):
    """Cancel an already accepted delivery."""
    permission_classes = (IsDeliveryMan,)

    def post(self, request, order_pk):
        user = request.user
        try:
            order = Order.objects.get(
                pk=order_pk, 
                delivery_assignment__delivery_man=user,
                status__in=['accepted_by_rider', 'reached_warehouse']
            )
        except Order.DoesNotExist:
            return Response({'detail': 'Order cannot be cancelled.'}, status=400)

        # Revert to packed and remove assignment so others get it
        order.status = 'packed'
        order.save()
        order.delivery_assignment.delete()
        
        # Notify other riders
        notify_warehouse_riders(order)

        return Response({'detail': 'Order cancelled and returned to pool.'})


class DeliveryUpdateStatusView(APIView):
    """Step-by-step update of the delivery status."""
    permission_classes = (IsDeliveryMan,)

    def post(self, request, order_pk):
        new_status = request.data.get('status')
        valid_transitions = {
            'accepted_by_rider': 'reached_warehouse',
            'reached_warehouse': 'picked_up',
            'picked_up': 'out_for_delivery',
            'out_for_delivery': 'delivered'
        }

        try:
            order = Order.objects.get(
                pk=order_pk,
                delivery_assignment__delivery_man=request.user
            )
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)

        if order.status not in valid_transitions:
            return Response({'detail': f'Cannot update from status {order.status}'}, status=400)

        expected_new_status = valid_transitions[order.status]
        if new_status and new_status != expected_new_status:
            return Response({'detail': f'Invalid status transition. Next step is {expected_new_status}'}, status=400)
            
        # OTP verification for delivery
        if expected_new_status == 'delivered':
            otp = request.data.get('otp')
            if not otp or otp != order.delivery_otp:
                return Response({'detail': 'Invalid OTP.'}, status=400)
                
            da = order.delivery_assignment
            da.delivered_at = timezone.now()
            da.save()

        order.status = expected_new_status
        order.save()

        return Response(OrderSerializer(order).data)


class DeliveryVerifyOtpView(APIView):
    """Securely verify the order completion via customer-provided OTP."""
    permission_classes = (IsDeliveryMan,)

    def post(self, request, order_pk):
        otp = request.data.get('otp')
        if not otp:
            return Response({'detail': 'OTP is required.'}, status=400)

        assignment = DeliveryAssignment.objects.filter(
            order_id=order_pk, 
            delivery_man=request.user
        ).first()

        if not assignment:
            return Response({'detail': 'You are not assigned to this mission.'}, status=403)

        order = assignment.order
        if order.status != 'out_for_delivery':
            return Response({'detail': 'Order is not in delivery stage.'}, status=400)

        # Robust comparison with stripping
        if str(order.delivery_otp).strip() != str(otp).strip():
             return Response({'detail': f"INVALID HANDOVER CODE: '{otp}' DOES NOT MATCH MISSION KEY."}, status=400)

        # Success - Finalize mission
        try:
            now = timezone.now()
            order.status = 'delivered'
            order.save() # Order doesn't have delivered_at

            # Record delivered_at in the assignment record correctly
            assignment.delivered_at = now
            assignment.save()
            
            return Response({'detail': 'MISSION SUCCESS! REWARD SECURED.', 'status': 'delivered'})
        except Exception as e:
            return Response({'detail': f'Handover Finalization Failed: {str(e)}'}, status=500)


class DeliveryCompletedOrderListView(generics.ListAPIView):
    """Completed deliveries."""
    serializer_class = OrderSerializer
    permission_classes = (IsDeliveryMan,)

    def get_queryset(self):
        return Order.objects.filter(
            delivery_assignment__delivery_man=self.request.user,
            status='delivered',
        ).order_by('-created_at')


class DeliveryStatsView(APIView):
    """Earnings and delivery stats."""
    permission_classes = (IsDeliveryMan,)

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        completed_orders = Order.objects.filter(
            delivery_assignment__delivery_man=user,
            status='delivered'
        )

        today_orders = completed_orders.filter(
            delivery_assignment__delivered_at__date=today
        )

        # Stats
        total_delivered = completed_orders.count()
        today_delivered = today_orders.count()
        
        total_earnings = completed_orders.aggregate(total=Sum('delivery_fee'))['total'] or 0
        today_earnings = today_orders.aggregate(total=Sum('delivery_fee'))['total'] or 0

        active_orders = Order.objects.filter(
            delivery_assignment__delivery_man=user,
            status__in=['accepted_by_rider', 'reached_warehouse', 'picked_up', 'out_for_delivery']
        ).count()

        district = user.assigned_warehouse.get_district_display() if user.assigned_warehouse else 'Unassigned'
        warehouse = user.assigned_warehouse.name if user.assigned_warehouse else 'Unassigned'

        return Response({
            'total_delivered': total_delivered,
            'today_delivered': today_delivered,
            'active_orders': active_orders,
            'total_earnings': float(total_earnings),
            'today_earnings': float(today_earnings),
            'current_location': user.current_location or 'GPS Active',
            'warehouse': warehouse,
            'is_online': user.is_online,
            'vehicle_details': user.vehicle_details or 'Unassigned'
        })


class DeliveryProfileUpdateView(APIView):
    """Update rider documents and vehicle details."""
    permission_classes = (IsDeliveryMan,)

    def post(self, request):
        user = request.user
        data = request.data

        # Fields
        user.full_name = data.get('full_name', user.full_name)
        user.phone_number = data.get('phone_number', user.phone_number)
        user.vehicle_details = data.get('vehicle_details', user.vehicle_details)

        # File Uploads
        if 'profile_photo' in request.FILES:
            user.profile_photo = request.FILES['profile_photo']
        if 'bluebook_image' in request.FILES:
            user.bluebook_image = request.FILES['bluebook_image']
        if 'license_image' in request.FILES:
            user.license_image = request.FILES['license_image']
        if 'vehicle_image' in request.FILES:
            user.vehicle_image = request.FILES['vehicle_image']

        user.save()
        return Response({
            'detail': 'Rider profile updated successfully.',
            'user': UserSerializer(user).data
        })


class OrderChatView(APIView):
    """Chat between various roles (Rider, Customer, Manager, Admin)."""
    from rest_framework.permissions import IsAuthenticated
    permission_classes = (IsAuthenticated,)

    def get(self, request, order_pk):
        ctx = request.query_params.get('context', 'ORDER')
        try:
            order = Order.objects.get(pk=order_pk)
            # Permission check: User must be related to the order or be an Admin
            is_admin = request.user.role == 'admin'
            is_customer = order.user == request.user
            is_rider = hasattr(order, 'delivery_assignment') and order.delivery_assignment.delivery_man == request.user
            is_manager = request.user.role == 'warehouse' and order.warehouse.staff.filter(id=request.user.id).exists()
            
            if not any([is_admin, is_customer, is_rider, is_manager]):
                 return Response({'detail': 'Access denied.'}, status=403)
                
            messages = ChatMessage.objects.filter(order=order, context=ctx).order_by('timestamp')
            return Response(ChatMessageSerializer(messages, many=True).data)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)

    def post(self, request, order_pk):
        try:
            order = Order.objects.get(pk=order_pk)
            ctx = request.data.get('context', 'ORDER')
            msg_text = request.data.get('message')
            msg_type = request.data.get('type', 'text')

            if not msg_text:
                return Response({'detail': 'Message cannot be empty.'}, status=400)

            # Determine receiver based on context
            receiver = None
            if ctx == 'ORDER':
                # Order chat: Rider <-> Customer
                if request.user.role == 'delivery': receiver = order.user
                else: receiver = order.delivery_assignment.delivery_man if hasattr(order, 'delivery_assignment') else None
            elif ctx == 'WAREHOUSE':
                # Warehouse chat: Rider <-> Manager
                if request.user.role == 'delivery':
                     # Find first manager of this warehouse (simplified)
                     receiver = order.warehouse.staff.first()
                else: receiver = order.delivery_assignment.delivery_man if hasattr(order, 'delivery_assignment') else None
            elif ctx == 'SUPPORT':
                # Support chat: User <-> Admin
                if request.user.role == 'admin': receiver = order.user
                else: # Any admin? (simplified)
                    from django.contrib.auth import get_user_model
                    receiver = get_user_model().objects.filter(role='admin').first()

            msg = ChatMessage.objects.create(
                order=order,
                sender=request.user,
                receiver=receiver,
                message=msg_text,
                message_type=msg_type,
                context=ctx
            )
            return Response(ChatMessageSerializer(msg).data)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)
