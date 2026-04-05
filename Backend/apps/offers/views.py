from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import Offer
from .serializers import OfferSerializer


class ActiveOfferListView(generics.ListAPIView):
    """Public endpoint: list currently active offers."""
    serializer_class = OfferSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        now = timezone.now()
        return Offer.objects.filter(is_active=True, start_date__lte=now, end_date__gte=now)
