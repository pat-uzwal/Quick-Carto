from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    UNIT_CHOICES = [
        ('kg', 'Kilogram'),
        ('l', 'Liter'),
        ('pcs', 'Pieces'),
    ]

    STATUS_CHOICES = [
        ('ready', 'Ready for Dispatch'),
        ('out_of_stock', 'Out of Stock'),
    ]

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255, verbose_name="Display Name")
    brand = models.CharField(max_length=100, blank=True, null=True)
    sku = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    
    # Pricing Matrix (NPR)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Maximum Retail Price in रू")
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Discounted Selling Price in रू")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Final Transactional Price")
    
    # Logistics Node
    weight = models.FloatField(default=0, help_text="Numeric weight/volume")
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='pcs')
    
    # Visual Assets (Multi-images handled as JSON or CSV for simplicity in MVP)
    image_url = models.TextField(blank=True, null=True, help_text="Primary Asset URL")
    images_json = models.JSONField(default=list, blank=True, help_text="Gallery Registry")
    
    # Inventory Safeguard
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ready')
    warehouse = models.CharField(max_length=100, default='Kathmandu Hub', help_text="Primary Supply Node")
    low_stock_threshold = models.IntegerField(default=10, help_text="Critical Alert Threshold")
    
    # Legacy/Compatibility
    weight_volume = models.CharField(max_length=50, blank=True, null=True)
    unit_type = models.CharField(max_length=10, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"
