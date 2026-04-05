import uuid
import random
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'Customer'),
        ('admin', 'Admin'),
        ('warehouse', 'Warehouse Manager'),
        ('delivery', 'Delivery Partner'),
    )
    VEHICLE_CHOICES = (
        ('bike', 'Bike'),
        ('scooter', 'Scooter'),
        ('cycle', 'Cycle'),
    )
    email = models.EmailField(unique=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, null=True, blank=True)
    is_online = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_location = models.CharField(max_length=255, null=True, blank=True)
    
    # Rider-specific docs
    profile_photo = models.ImageField(upload_to='riders/photos/', null=True, blank=True)
    bluebook_image = models.ImageField(upload_to='riders/bluebooks/', null=True, blank=True)
    license_image = models.ImageField(upload_to='riders/licenses/', null=True, blank=True)
    vehicle_image = models.ImageField(upload_to='riders/vehicles/', null=True, blank=True)
    vehicle_details = models.TextField(null=True, blank=True)
    assigned_warehouse = models.ForeignKey(
        'warehouses.Warehouse', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='staff'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    def save(self, *args, **kwargs):
        if not self.full_name and (self.first_name or self.last_name):
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.street}, {self.city}, {self.state} {self.zip_code}"


class EmailOTP(models.Model):
    """One-time password sent via email. Expires in 5 minutes."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.user.email} — {'✔' if self.is_verified else '✘'}"

    @classmethod
    def generate_for(cls, user):
        """Create a fresh 6-digit OTP for the user, invalidating any old ones."""
        # Expire old unverified OTPs
        cls.objects.filter(user=user, is_verified=False).delete()
        otp_code = str(random.randint(100000, 999999))
        return cls.objects.create(user=user, otp=otp_code)

    def is_valid(self):
        """OTP is valid for 5 minutes and not yet used."""
        if self.is_verified:
            return False
        expiry = self.created_at + timedelta(minutes=5)
        return timezone.now() <= expiry

