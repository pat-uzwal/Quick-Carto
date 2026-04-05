from django.db import models
from apps.products.models import Product

class Warehouse(models.Model):
    DISTRICT_CHOICES = [
        ('kathmandu', 'Kathmandu'),
        ('lalitpur', 'Lalitpur'),
        ('bhaktapur', 'Bhaktapur'),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    address = models.TextField()
    district = models.CharField(max_length=20, choices=DISTRICT_CHOICES, default='kathmandu')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code}) — {self.get_district_display()}"

class Inventory(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='inventory')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory')
    
    # Stock Tracking
    stock_quantity = models.PositiveIntegerField(default=0, help_text="Total Physical Stock")
    reserved_stock = models.PositiveIntegerField(default=0, help_text="Committed to pending orders")
    low_stock_threshold = models.PositiveIntegerField(default=10)
    
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('warehouse', 'product')
        verbose_name_plural = 'Inventories'

    @property
    def available_stock(self):
        return max(0, self.stock_quantity - self.reserved_stock)

    @property
    def stock_status(self):
        if self.available_stock <= 0:
            return 'out_of_stock'
        if self.available_stock <= self.low_stock_threshold:
            return 'low_stock'
        return 'in_stock'

    def __str__(self):
        return f"{self.warehouse.name} - {self.product.name} (Available: {self.available_stock})"

class StockLog(models.Model):
    ACTION_CHOICES = [
        ('restock', 'Restocked'),
        ('order', 'Order Placed (Reserved)'),
        ('shipped', 'Order Shipped (Deducted)'),
        ('canceled', 'Order Canceled (Restored)'),
        ('damage', 'Damaged/Expired'),
        ('transfer', 'Warehouse Transfer'),
    ]
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    quantity = models.IntegerField(help_text="Impact on stock_quantity or reserved_stock")
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.action} - {self.inventory.product.name} ({self.quantity}) at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
