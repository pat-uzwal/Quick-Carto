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
    
    # Targeting Restrictions
    valid_categories = models.ManyToManyField(Category, blank=True, related_name='exclusive_coupons', help_text="If set, coupon only applies to items in these categories")
    valid_products = models.ManyToManyField(Product, blank=True, related_name='exclusive_coupons', help_text="If set, coupon only applies to these specific products")

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.discount_percentage}% OFF)"

    def is_valid(self, cart_total=0, cart_items=None):
        from django.utils import timezone
        now = timezone.now()
        
        if not self.is_active:
            return False, "Coupon is inactive."
            
        if now < self.valid_from or now > self.valid_to:
            return False, "Coupon has expired or is not yet active."
            
        if cart_total < self.min_purchase_amount:
            return False, f"Minimum purchase of NPR {self.min_purchase_amount} required."

        # Check for item restrictions
        has_cats = self.valid_categories.exists()
        has_prods = self.valid_products.exists()
        
        if has_cats or has_prods:
            if cart_items is None:
                # If we don't have items to check yet, assume valid for now (prevents blocker in simple validation)
                return True, "Valid"
                
            valid_cat_ids = set(self.valid_categories.values_list('id', flat=True))
            valid_prod_ids = set(self.valid_products.values_list('id', flat=True))
            
            eligible_count = 0
            for item in cart_items:
                # item can be an OrderItem or CartItem or simple dict
                pid = getattr(item.product, 'id', None) or item.product_id
                cid = getattr(item.product, 'category_id', None)
                
                if pid in valid_prod_ids or cid in valid_cat_ids:
                    eligible_count += 1
            
            if eligible_count == 0:
                return False, "None of the items in your cart are eligible for this coupon."

        return True, "Valid"
