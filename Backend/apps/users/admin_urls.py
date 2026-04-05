from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.admin_views import (
    AdminUserListView, AdminUserDetailView,
    AdminAnalyticsView,
)
from apps.products.admin_views import AdminProductViewSet, AdminCategoryViewSet
from apps.warehouses.admin_views import AdminWarehouseViewSet, AdminInventoryViewSet, AdminStockLogListView
from apps.orders.admin_views import AdminOrderViewSet

router = DefaultRouter()
router.register(r'admin/products', AdminProductViewSet, basename='admin-product')
router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'admin/warehouses', AdminWarehouseViewSet, basename='admin-warehouse')
router.register(r'admin/inventory', AdminInventoryViewSet, basename='admin-inventory')
router.register(r'admin/orders', AdminOrderViewSet, basename='admin-order')

urlpatterns = [
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/stock-logs/', AdminStockLogListView.as_view(), name='admin-stock-logs'),
    path('', include(router.urls)),
]
