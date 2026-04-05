from django.urls import path
from .views import ActiveOfferListView

urlpatterns = [
    path('offers/', ActiveOfferListView.as_view(), name='offer-list'),
]
