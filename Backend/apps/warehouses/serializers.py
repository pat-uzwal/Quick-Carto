from rest_framework import serializers
from .models import Warehouse, Inventory, StockLog


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'

class StockLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLog
        fields = '__all__'

class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_image = serializers.URLField(source='product.image_url', read_only=True)
    product_category_name = serializers.CharField(source='product.category.name', read_only=True)
    available_stock = serializers.ReadOnlyField()
    stock_status = serializers.ReadOnlyField()
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = Inventory
        fields = (
            'id', 'warehouse', 'warehouse_name', 'product', 'product_name', 'product_sku',
            'product_image', 'product_category_name',
            'stock_quantity', 'reserved_stock', 'available_stock', 'low_stock_threshold', 'stock_status', 
            'last_updated'
        )
