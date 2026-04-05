from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Address, EmailOTP

User = get_user_model()


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ('id', 'street', 'city', 'state', 'zip_code', 'latitude', 'longitude', 'is_default')


class UserSerializer(serializers.ModelSerializer):
    assigned_warehouse_name = serializers.CharField(source='assigned_warehouse.name', read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'full_name', 'phone_number', 'role', 
            'latitude', 'longitude', 'current_location', 'assigned_warehouse', 
            'assigned_warehouse_name', 'profile_photo', 'bluebook_image', 
            'license_image', 'vehicle_image', 'vehicle_details', 'is_online', 
            'is_approved'
        )
        read_only_fields = ('role', 'id')


class UserDetailSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)
    assigned_warehouse_name = serializers.CharField(source='assigned_warehouse.name', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'phone_number', 'role', 'latitude', 'longitude', 'current_location', 'assigned_warehouse', 'assigned_warehouse_name', 'addresses')
        read_only_fields = ('role', 'id')


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'full_name', 'phone_number', 'role')
        extra_kwargs = {
            'username': {'required': False},
            'phone_number': {'required': True, 'allow_blank': False}
        }

    def create(self, validated_data):
        username = validated_data.get('username') or validated_data['email']
        user = User.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data.get('role', 'user'),
        )
        return user


class UserLoginSerializer(TokenObtainPairSerializer):
    """Overrides simplejwt login to provide user data and check verification status."""
    def validate(self, attrs):
        data = super().validate(attrs)
        # Staff accounts (admin, warehouse, delivery) are pre-verified — no OTP needed.
        # Only customer self-registrations require OTP verification.
        staff_roles = ('admin', 'warehouse', 'delivery')
        is_verified = (
            self.user.is_superuser or
            self.user.role in staff_roles or
            EmailOTP.objects.filter(user=self.user, is_verified=True).exists()
        )
        
        from rest_framework.exceptions import AuthenticationFailed
        if not is_verified:
            raise AuthenticationFailed("Account is not verified. Please verify your OTP.")

            
        user_data = UserSerializer(self.user).data
        if self.user.is_superuser:
            user_data['role'] = 'admin'
            
        data['user'] = user_data
        return data


class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)
