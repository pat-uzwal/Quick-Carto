from rest_framework import serializers
from .models import Offer


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = (
            'id', 'name', 'description', 'category', 'product',
            'discount_percentage', 'start_date', 'end_date', 'is_active',
        )
