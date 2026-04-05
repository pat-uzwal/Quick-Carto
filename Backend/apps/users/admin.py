from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Address

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Info', {'fields': ('role', 'phone_number')}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(Address)
