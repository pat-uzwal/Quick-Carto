from django.contrib import admin
from .models import Warehouse, Inventory

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'latitude', 'longitude', 'is_active')
    search_fields = ('name', 'code')

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('warehouse', 'product', 'stock_quantity', 'last_updated')
    list_filter = ('warehouse',)
    search_fields = ('product__name', 'warehouse__name')
