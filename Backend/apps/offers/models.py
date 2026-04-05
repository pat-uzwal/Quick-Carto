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
