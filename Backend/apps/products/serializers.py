from rest_framework import serializers
from .models import Category, Product
from apps.offers.utils import apply_offer_to_price


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    # Pricing with offers applied
    original_price = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'brand', 'sku', 'description', 
            'mrp', 'selling_price', 'price',
            'category', 'category_name', 'category_slug', 'weight', 'unit',
            'image_url', 'images_json', 'status', 'warehouse',
            'low_stock_threshold', 'is_active',
            'original_price', 'discount_percentage', 'discount_amount', 'final_price',
        )

    def _pricing(self, obj):
        # Cache on the object to avoid repeated DB queries
        if not hasattr(obj, '_pricing_cache'):
            obj._pricing_cache = apply_offer_to_price(obj)
        return obj._pricing_cache

    def get_original_price(self, obj):
        return self._pricing(obj)['original_price']

    def get_discount_percentage(self, obj):
        return self._pricing(obj)['discount_percentage']

    def get_discount_amount(self, obj):
        return self._pricing(obj)['discount_amount']

    def get_final_price(self, obj):
        return self._pricing(obj)['final_price']


class ProductWriteSerializer(serializers.ModelSerializer):
    """Admin-only write serializer with support for professional vault format."""
    product_name = serializers.CharField(source='name', required=False)
    images = serializers.JSONField(source='images_json', required=False)
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'product_name', 'brand', 'sku', 'description', 
            'mrp', 'selling_price', 'price',
            'category', 'weight', 'unit',
            'image_url', 'images', 'images_json', 'status', 
            'warehouse', 'low_stock_threshold'
        )

    def to_internal_value(self, data):
        # Map user-provided keys to model fields
        if 'product_name' in data:
            data['name'] = data.pop('product_name')
        if 'images' in data:
            data['images_json'] = data.pop('images')
            # Set image_url to the first image in the array for legacy support
            if isinstance(data['images_json'], list) and len(data['images_json']) > 0:
                data['image_url'] = data['images_json'][0]
        return super().to_internal_value(data)
