from django.db import models
from django.conf import settings
from apps.products.models import Product
from apps.warehouses.models import Warehouse
from apps.offers.models import Offer


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'product')

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    @property
    def subtotal(self):
        return self.product.price * self.quantity


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('packed', 'Packed'),
        ('accepted_by_rider', 'Accepted by Rider'),
        ('reached_warehouse', 'Reached Warehouse'),
        ('picked_up', 'Picked Up'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_otp = models.CharField(max_length=6, blank=True, null=True)

    # Address snapshot at order time
    delivery_address = models.TextField()
    delivery_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    packed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.delivery_otp:
            import random
            self.delivery_otp = str(random.randint(100000, 999999))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.pk} by {self.user.username} [{self.status}]"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    # Snapshot prices at order time
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2)
    applied_offer = models.ForeignKey(Offer, on_delete=models.SET_NULL, null=True, blank=True)

    @property
    def subtotal(self):
        return self.final_price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in Order #{self.order.pk}"


class DeliveryAssignment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery_assignment')
    delivery_man = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='deliveries', limit_choices_to={'role': 'delivery'}
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Delivery for Order #{self.order.pk} → {self.delivery_man.username if self.delivery_man else 'Unassigned'}"


class DeliveryNotification(models.Model):
    """
    Notification sent to riders in the same district as the order's warehouse.
    Riders can accept or reject. If accepted, a DeliveryAssignment is created.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='delivery_notifications')
    rider = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='delivery_notifications', limit_choices_to={'role': 'delivery'}
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notified_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        unique_together = ('order', 'rider')
        ordering = ['-notified_at']

    def __str__(self):
        return f"Notification: Order #{self.order.pk} → {self.rider.email} [{self.status}]"


class ChatMessage(models.Model):
    """
    Message in a chat context.
    Types: TEXT, IMAGE, SYSTEM
    """
    TYPES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('system', 'System'),
    )
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    sender = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    message = models.TextField()
    message_type = models.CharField(max_length=10, choices=TYPES, default='text')
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    # Context-awareness
    context = models.CharField(max_length=20, choices=(
        ('ORDER', 'Order related (User/Rider)'),
        ('WAREHOUSE', 'Warehouse related (Rider/Manager)'),
        ('SUPPORT', 'Support related (User/Admin)'),
    ), default='ORDER')

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.email} -> {self.context}: {self.message[:20]}"


class OrderRating(models.Model):
    """
    Customer feedback for a specific delivery mission.
    """
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='rating')
    rider = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='rider_ratings')
    stars = models.PositiveSmallIntegerField(default=5) # 1-5
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating for Order #{self.order.pk} - {self.stars} Stars"
