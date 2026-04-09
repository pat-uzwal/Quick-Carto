from django.db import models
from apps.products.models import Category, Product
from django.core.validators import MinValueValidator, MaxValueValidator

class Offer(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Optional logic: Target specific category or product
    category = models.ForeignKey(Category, on_delete=models.CASCADE, blank=True, null=True, related_name='offers', help_text="Apply discount to an entire category")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, blank=True, null=True, related_name='offers', help_text="Apply discount to a specific product")
    
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.discount_percentage}% OFF"

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.discount_percentage}% OFF)"

    def is_valid(self, cart_total=0):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False, "Coupon is inactive."
        if now < self.valid_from or now > self.valid_to:
            return False, "Coupon has expired or is not yet active."
        if cart_total < self.min_purchase_amount:
            return False, f"Minimum purchase of NPR {self.min_purchase_amount} required."
        return True, "Valid"
