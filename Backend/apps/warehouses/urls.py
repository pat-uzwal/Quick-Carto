from django.urls import path
from .views import (
    WarehouseOrderListView, WarehouseOrderPackView,
    WarehouseInventoryView, WarehouseInventoryUpdateView, AssignDeliveryView,
    WarehouseDashboardView, WarehouseCustomerListView, WarehouseReportsView,
)

urlpatterns = [
    path('warehouse/orders/', WarehouseOrderListView.as_view(), name='wh-order-list'),
    path('warehouse/orders/<int:pk>/pack/', WarehouseOrderPackView.as_view(), name='wh-order-pack'),
    path('warehouse/inventory/', WarehouseInventoryView.as_view(), name='wh-inventory-list'),
    path('warehouse/inventory/<int:pk>/', WarehouseInventoryUpdateView.as_view(), name='wh-inventory-detail'),
    path('warehouse/orders/<int:order_pk>/assign-delivery/', AssignDeliveryView.as_view(), name='wh-assign-delivery'),
    path('warehouse/analytics/', WarehouseDashboardView.as_view(), name='wh-analytics'),
    path('warehouse/customers/', WarehouseCustomerListView.as_view(), name='wh-customers'),
    path('warehouse/reports/', WarehouseReportsView.as_view(), name='wh-reports'),
]
