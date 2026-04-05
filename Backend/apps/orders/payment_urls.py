from django.urls import path
from .payment_views import VerifyKhaltiPaymentView

urlpatterns = [
    path('verify-khalti/', VerifyKhaltiPaymentView.as_view(), name='verify-khalti'),
]
