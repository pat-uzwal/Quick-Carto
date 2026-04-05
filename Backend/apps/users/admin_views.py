"""
Admin API views — /api/admin/...
All views require Admin role.
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count

from apps.users.permissions import IsAdmin
from apps.users.serializers import UserSerializer
from apps.products.models import Category, Product
from apps.products.serializers import CategorySerializer, ProductWriteSerializer, ProductSerializer
from apps.orders.models import Order

User = get_user_model()


# ── Users ──────────────────────────────────────────────────────────────────────

class AdminUserListView(generics.ListCreateAPIView):
    permission_classes = (IsAdmin,)
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-date_joined')
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email']


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAdmin,)
    serializer_class = UserSerializer
    queryset = User.objects.all()


# ── Products ───────────────────────────────────────────────────────────────────

class AdminProductListView(generics.ListCreateAPIView):
    permission_classes = (IsAdmin,)
    queryset = Product.objects.all().order_by('name')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductSerializer
        return ProductWriteSerializer


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAdmin,)
    queryset = Product.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductSerializer
        return ProductWriteSerializer


# ── Categories ─────────────────────────────────────────────────────────────────

class AdminCategoryListView(generics.ListCreateAPIView):
    permission_classes = (IsAdmin,)
    serializer_class = CategorySerializer
    queryset = Category.objects.all()


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAdmin,)
    serializer_class = CategorySerializer
    queryset = Category.objects.all()


# ── Analytics ──────────────────────────────────────────────────────────────────

class AdminAnalyticsView(APIView):
    permission_classes = (IsAdmin,)

    def get(self, request):
        orders = Order.objects.all()
        data = {
            'total_orders': orders.count(),
            'total_revenue': orders.aggregate(rev=Sum('total_amount'))['rev'] or 0,
            'orders_by_status': dict(
                orders.values_list('status').annotate(count=Count('id')).values_list('status', 'count')
            ),
            'total_users': User.objects.filter(role='user').count(),
            'total_products': Product.objects.count(),
        }
        return Response(data)
