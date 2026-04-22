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
        fields = (
            'id', 'username', 'email', 'full_name', 'phone_number', 'role', 
            'latitude', 'longitude', 'current_location', 'assigned_warehouse', 
            'assigned_warehouse_name', 'addresses', 'profile_photo', 
            'bluebook_image', 'license_image', 'vehicle_image', 'vehicle_details', 
            'is_online', 'is_approved'
        )
        read_only_fields = ('role', 'id')


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer used by Admins to manage all user fields including role and warehouse."""
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = '__all__'

    def create(self, validated_data):
        password = validated_data.pop('password', 'Staff@123')
        # Extract M2M fields
        groups = validated_data.pop('groups', [])
        user_permissions = validated_data.pop('user_permissions', [])
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        
        if groups: user.groups.set(groups)
        if user_permissions: user.user_permissions.set(user_permissions)
        
        user.save()
        return user


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
        # We perform manual check to provide specific error messages as requested by the user.
        # This overrides the default generic "No active account found" message.
        username = attrs.get('username') or attrs.get('email')
        password = attrs.get('password')

        try:
            # Check if user exists (checking by email or username depending on what was provided)
            # Since standard TokenObtainPairSerializer uses 'username' as the field name even if it's email
            user_obj = User.objects.filter(email=username).first() or User.objects.filter(username=username).first()
            
            if not user_obj:
                raise serializers.ValidationError({
                    "detail": "No account found with this identifier. Please check your email or register."
                })
            
            if not user_obj.check_password(password):
                raise serializers.ValidationError({
                    "detail": "Incorrect password. Please try again or reset your password."
                })
                
            if not user_obj.is_active:
                raise serializers.ValidationError({
                    "detail": "This account is currently disabled."
                })

        except serializers.ValidationError as e:
            raise e
        except Exception:
            # Fallback for any other errors during manual check
            pass

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
