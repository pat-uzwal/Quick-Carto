from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailOTP, Address
from .permissions import (
    IsAdmin, IsWarehouseManager, IsDeliveryMan, IsCustomer,
    IsAdminOrWarehouse, IsAdminOrDelivery
)
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    UserDetailSerializer, AddressSerializer, RequestOTPSerializer,
    VerifyOTPSerializer, ResetPasswordSerializer
)

User = get_user_model()


# ── Beautiful HTML email template builder ────────────────────────────────────────

def _build_otp_email_html(otp_code, title, greeting, message, footer_note=""):
    """Generate a beautiful branded HTML email for OTP delivery."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#E62020 0%,#cc1b1b 100%);padding:32px 40px;text-align:center;">
                                <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">🛒 My Basket</h1>
                                <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">{title}</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;">
                                <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:800;">{greeting}</h2>
                                <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">{message}</p>

                                <!-- OTP Box -->
                                <div style="background:#fef2f2;border:2px dashed #E62020;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
                                    <p style="margin:0 0 8px;color:#E62020;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
                                    <p style="margin:0;color:#1a1a2e;font-size:42px;font-weight:900;letter-spacing:12px;font-family:'Courier New',monospace;">{otp_code}</p>
                                </div>

                                <!-- Warning -->
                                <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 24px;">
                                    <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">
                                        ⏰ This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
                                    </p>
                                </div>

                                <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
                                    If you didn't request this code, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                                <p style="margin:0;color:#9ca3af;font-size:12px;">
                                    {footer_note if footer_note else "© 2026 My Basket. All rights reserved."}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def _build_welcome_email_html(user_name):
    """Generate a beautiful welcome email after first OTP verification."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
                                <div style="font-size:48px;margin-bottom:12px;">🎉</div>
                                <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900;">Welcome to My Basket!</h1>
                                <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600;">Your account has been verified</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;">
                                <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:800;">Hey {user_name}! 👋</h2>
                                <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                                    Your email has been verified successfully. You're all set to start using My Basket!
                                </p>

                                <div style="background:#f0fdf4;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
                                    <p style="margin:0;color:#166534;font-size:14px;font-weight:700;">
                                        ✅ Account Verified &bull; Ready to Go!
                                    </p>
                                </div>

                                <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
                                    Start exploring products, add items to your cart, and enjoy quick delivery right to your doorstep.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                                <p style="margin:0;color:#9ca3af;font-size:12px;">
                                    © 2026 My Basket. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def _send_otp_email(user_email, otp_code, purpose='verify'):
    """Send a beautifully formatted OTP email."""
    templates = {
        'verify': {
            'subject': '🔐 My Basket — Verify Your Account',
            'title': 'Email Verification',
            'greeting': 'Verify Your Email',
            'message': 'Thank you for signing up! Please enter the code below in the app to verify your email address and activate your account.',
        },
        'login': {
            'subject': '🔑 My Basket — Your Login OTP',
            'title': 'Login Verification',
            'greeting': 'Login Request',
            'message': 'We received a sign-in request for your account. Enter the code below to proceed with your login.',
        },
        'reset': {
            'subject': '🔒 My Basket — Password Reset OTP',
            'title': 'Password Reset',
            'greeting': 'Reset Your Password',
            'message': 'We received a password reset request for your account. Enter the code below to set a new password.',
        },
    }
    t = templates.get(purpose, templates['verify'])

    html_body = _build_otp_email_html(
        otp_code=otp_code,
        title=t['title'],
        greeting=t['greeting'],
        message=t['message'],
    )

    send_mail(
        subject=t['subject'],
        message=f'Your My Basket verification code is: {otp_code}',  # plain-text fallback
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        html_message=html_body,
        fail_silently=False,
    )


# ── Views ────────────────────────────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    """
    Handle User registration, authentication, and administrative tasks.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['register', 'login']:
            return [AllowAny()]
        if self.action in ['me']:
            return [IsAuthenticated()]
        if self.action in ['customers', 'warehouse_managers', 'delivery_men', 'change_role']:
            return [IsAdmin()]
        return super().get_permissions()

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny])
    def register(self, request):
        """User registration endpoint."""
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate and send verification OTP
        otp_obj = EmailOTP.generate_for(user)
        try:
            _send_otp_email(user.email, otp_obj.otp, purpose='verify')
            email_status = "sent"
        except Exception as e:
            print(f"SMTP Error: {e}")
            email_status = "failed"

        return Response({
            'message': 'Registration successful. Please check your email for the verification OTP.',
            'email_status': email_status,
            'email': user.email,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny])
    def login(self, request):
        """Standard JWT login wrapper."""
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return the current logged-in user details."""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def update_location(self, request):
        """Update current GPS coordinates and location name."""
        user = request.user
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        loc_name = request.data.get('location_name')

        if lat: user.latitude = lat
        if lng: user.longitude = lng
        if loc_name: user.current_location = loc_name
        
        user.save()
        return Response({
            'detail': 'Location synchronized.',
            'current_location': user.current_location
        })

    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin])
    def customers(self, request):
        """List all users with the customer (user) role."""
        users = User.objects.filter(role='user')
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin])
    def warehouse_managers(self, request):
        """List all users with the warehouse role."""
        users = User.objects.filter(role='warehouse')
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin])
    def delivery_men(self, request):
        """List all users with the delivery role."""
        users = User.objects.filter(role='delivery')
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'], permission_classes=[IsAdmin])
    def change_role(self, request, pk=None):
        """Allow admins to update a user's role."""
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role not in dict(User.ROLE_CHOICES):
            return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        user.role = new_role
        user.save()
        return Response({'detail': f'User role updated to {new_role}.'})


class AddressViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for User addresses.
    """
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['POST'])
    def set_default(self, request, pk=None):
        """Mark an address as the default for the user."""
        address = self.get_object()
        # Set all other addresses to False
        Address.objects.filter(user=request.user).update(is_default=False)
        address.is_default = True
        address.save()
        return Response({'detail': 'Address set as default.'})


# ── Keep OTP views separate for cleaner UI logic ────────────────────────────────

class RequestOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RequestOTPSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        otp_obj = EmailOTP.generate_for(user)
        try:
            _send_otp_email(user.email, otp_obj.otp, purpose='login')
            return Response({'detail': 'OTP sent to your email.'})
        except Exception as e:
            print(f"SMTP Error on OTP request: {e}")
            return Response({'detail': 'Failed to send OTP. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = VerifyOTPSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp_code = serializer.validated_data['otp']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        otp_obj = EmailOTP.objects.filter(user=user, otp=otp_code, is_verified=False).first()
        if not otp_obj or not otp_obj.is_valid():
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_verified = True
        otp_obj.save()

        # Send Welcome Email after first verification
        if not user.otps.filter(is_verified=True).exclude(pk=otp_obj.pk).exists():
            try:
                user_name = user.full_name or user.username
                html_body = _build_welcome_email_html(user_name)
                send_mail(
                    subject='🎉 Welcome to My Basket!',
                    message=f'Verified successfully! Welcome {user_name}.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_body,
                    fail_silently=True,
                )
            except Exception:
                pass  # Welcome email is non-critical

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        })


class ResetPasswordView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ResetPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp_code = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        otp_obj = EmailOTP.objects.filter(user=user, otp=otp_code, is_verified=False).first()
        if not otp_obj or not otp_obj.is_valid():
            return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_verified = True
        otp_obj.save()
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password reset successfully.'})
