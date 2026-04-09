from django.contrib import admin
from .models import Offer, Coupon

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_percentage', 'category', 'product', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active', 'start_date', 'end_date')
    search_fields = ('name',)

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percentage', 'min_purchase_amount', 'valid_to', 'is_active')
    list_filter = ('is_active', 'valid_from', 'valid_to')
    search_fields = ('code',)
