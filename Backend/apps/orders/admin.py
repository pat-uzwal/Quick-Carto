from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem, DeliveryAssignment
from .payment_models import Payment

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    inlines = [CartItemInline]
    list_display = ('user', 'updated_at')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = [OrderItemInline]
    list_display = ('id', 'user', 'status', 'total_amount', 'warehouse', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__username',)


@admin.register(DeliveryAssignment)
class DeliveryAssignmentAdmin(admin.ModelAdmin):
    list_display = ('order', 'delivery_man', 'assigned_at', 'delivered_at')
