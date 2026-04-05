from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, AddressViewSet, RequestOTPView, VerifyOTPView, ResetPasswordView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'addresses', AddressViewSet, basename='address')

# For auth structure expected by frontend (/api/auth/...)
auth_patterns = [
    path('register/', UserViewSet.as_view({'post': 'register'}), name='auth-register'),
    path('login/', UserViewSet.as_view({'post': 'login'}), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('me/', UserViewSet.as_view({'get': 'me'}), name='auth-me'),
]

urlpatterns = [
    # Auth endpoints (/api/auth/register, /api/auth/login, etc.)
    path('auth/', include(auth_patterns)),
    
    # Standard ViewSet Router (/api/users/, /api/addresses/)
    path('', include(router.urls)),
]
