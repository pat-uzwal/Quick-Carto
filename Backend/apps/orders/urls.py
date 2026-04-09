from django.urls import path
from .views import (
    CartView, CartItemView, ClearCartView, CartSyncView,
    PlaceOrderView, OrderListView, OrderDetailView, NearestWarehouseView,
    OrderRatingView, ValidateCouponView
)

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/items/', CartItemView.as_view(), name='cart-items'),
    path('cart/items/<int:product_id>/', CartItemView.as_view(), name='cart-item-delete'),
    path('cart/clear/', ClearCartView.as_view(), name='cart-clear'),
    path('cart/sync/', CartSyncView.as_view(), name='cart-sync'),
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/place/', PlaceOrderView.as_view(), name='place-order'),
    path('nearest-warehouse/', NearestWarehouseView.as_view(), name='nearest-warehouse'),
    path('orders/<int:order_pk>/rate/', OrderRatingView.as_view(), name='order-rate'),
    path('coupons/validate/', ValidateCouponView.as_view(), name='validate-coupon'),
]
