from django.urls import path
from .delivery_views import (
    DeliveryOrderListView, DeliveryCompletedOrderListView,
    DeliveryUpdateStatusView, DeliveryAcceptJobView, DeliveryRejectJobView,
    DeliveryCancelJobView, DeliveryNotificationListView, DeliveryStatsView,
    ToggleOnlineStatusView, DeliveryProfileUpdateView, OrderChatView,
    DeliveryVerifyOtpView,
)

urlpatterns = [
    path('delivery/toggle-online/', ToggleOnlineStatusView.as_view(), name='delivery-toggle-online'),
    path('delivery/orders/', DeliveryOrderListView.as_view(), name='delivery-order-list'),
    path('delivery/orders/completed/', DeliveryCompletedOrderListView.as_view(), name='delivery-completed'),
    path('delivery/orders/<int:order_pk>/update-status/', DeliveryUpdateStatusView.as_view(), name='delivery-update'),
    path('delivery/orders/<int:order_pk>/accept/', DeliveryAcceptJobView.as_view(), name='delivery-accept'),
    path('delivery/orders/<int:order_pk>/reject/', DeliveryRejectJobView.as_view(), name='delivery-reject'),
    path('delivery/orders/<int:order_pk>/cancel/', DeliveryCancelJobView.as_view(), name='delivery-cancel'),
    path('delivery/orders/<int:order_pk>/verify-otp/', DeliveryVerifyOtpView.as_view(), name='delivery-verify-otp'),
    path('delivery/notifications/', DeliveryNotificationListView.as_view(), name='delivery-notifications'),
    path('delivery/stats/', DeliveryStatsView.as_view(), name='delivery-stats'),
    path('delivery/profile/update/', DeliveryProfileUpdateView.as_view(), name='delivery-profile-update'),
    path('delivery/orders/<int:order_pk>/chat/', OrderChatView.as_view(), name='delivery-order-chat'),
]
