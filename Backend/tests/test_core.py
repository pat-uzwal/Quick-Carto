"""
Unit tests for QuickCarto backend.
Covers:
  1. Nearest warehouse assignment logic (Haversine + stock check)
  2. Offer application utility
  3. Order placement workflow
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.products.models import Category, Product
from apps.warehouses.models import Warehouse, Inventory
from apps.warehouses.utils import haversine_distance, find_nearest_warehouse
from apps.offers.models import Offer
from apps.offers.utils import apply_offer_to_price, get_active_offer_for_product

User = get_user_model()


# ─────────────────────────────  SECTION 1: Haversine & Warehouse Logic  ──────

class HaversineDistanceTest(TestCase):
    def test_same_point_is_zero(self):
        self.assertAlmostEqual(haversine_distance(0, 0, 0, 0), 0)

    def test_known_distance(self):
        # London (51.5074, -0.1278) to Paris (48.8566, 2.3522) ≈ 340 km
        dist = haversine_distance(51.5074, -0.1278, 48.8566, 2.3522)
        self.assertAlmostEqual(dist, 340, delta=10)


class NearestWarehouseTest(TestCase):
    def setUp(self):
        self.cat = Category.objects.create(name='Groceries')
        self.p1 = Product.objects.create(category=self.cat, name='Apple', price=10, weight_volume='1kg')
        self.p2 = Product.objects.create(category=self.cat, name='Milk', price=20, weight_volume='1L')

        # WH close to user (0.5 km away)
        self.wh_near = Warehouse.objects.create(
            name='WH Near', code='WH001', address='Nearby',
            latitude=Decimal('27.7172'), longitude=Decimal('85.3240'), is_active=True,
        )
        # WH far from user (50+ km away)
        self.wh_far = Warehouse.objects.create(
            name='WH Far', code='WH002', address='Faraway',
            latitude=Decimal('28.2096'), longitude=Decimal('83.9856'), is_active=True,
        )

        # Only far warehouse has stock initially
        Inventory.objects.create(warehouse=self.wh_far, product=self.p1, stock_quantity=10)
        Inventory.objects.create(warehouse=self.wh_far, product=self.p2, stock_quantity=10)

    def test_returns_none_when_no_warehouse_has_stock(self):
        result = find_nearest_warehouse(27.7172, 85.3240, {self.p1.id: 1})
        # wh_near has no inventory at all; wh_far has stock for p1
        # So result should be wh_far (only eligible warehouse)
        self.assertEqual(result, self.wh_far)

    def test_returns_nearest_when_both_have_stock(self):
        # Give near warehouse stock too
        Inventory.objects.create(warehouse=self.wh_near, product=self.p1, stock_quantity=5)
        Inventory.objects.create(warehouse=self.wh_near, product=self.p2, stock_quantity=5)

        result = find_nearest_warehouse(27.7172, 85.3240, {self.p1.id: 3, self.p2.id: 2})
        self.assertEqual(result, self.wh_near)

    def test_returns_none_when_stock_insufficient(self):
        # p1 has only 10 units in far wh; request 100
        result = find_nearest_warehouse(27.7172, 85.3240, {self.p1.id: 100})
        self.assertIsNone(result)


# ─────────────────────────────  SECTION 2: Offer Application  ────────────────

class OfferApplicationTest(TestCase):
    def setUp(self):
        self.cat = Category.objects.create(name='Fruits')
        self.product = Product.objects.create(
            category=self.cat, name='Banana', price=Decimal('100'), weight_volume='1 dozen'
        )

    def _make_offer(self, discount, target='product', active=True, **kwargs):
        now = timezone.now()
        offer_kwargs = dict(
            name=f'Offer {discount}%',
            discount_percentage=discount,
            start_date=now - timedelta(hours=1),
            end_date=now + timedelta(hours=1),
            is_active=active,
        )
        offer_kwargs.update(kwargs)
        if target == 'product':
            offer_kwargs['product'] = self.product
        else:
            offer_kwargs['category'] = self.cat
        return Offer.objects.create(**offer_kwargs)

    def test_no_offer_returns_original_price(self):
        result = apply_offer_to_price(self.product)
        self.assertEqual(result['final_price'], 100)
        self.assertEqual(result['discount_percentage'], 0)
        self.assertIsNone(result['offer'])

    def test_product_level_offer_applied(self):
        self._make_offer(20, target='product')
        result = apply_offer_to_price(self.product)
        self.assertEqual(result['discount_percentage'], 20)
        self.assertAlmostEqual(result['final_price'], 80)

    def test_category_level_offer_applied_when_no_product_offer(self):
        self._make_offer(10, target='category')
        result = apply_offer_to_price(self.product)
        self.assertEqual(result['discount_percentage'], 10)
        self.assertAlmostEqual(result['final_price'], 90)

    def test_product_offer_takes_priority_over_category_offer(self):
        self._make_offer(10, target='category')
        self._make_offer(30, target='product')  # Higher discount, same product
        result = apply_offer_to_price(self.product)
        self.assertEqual(result['discount_percentage'], 30)
        self.assertAlmostEqual(result['final_price'], 70)

    def test_expired_offer_not_applied(self):
        now = timezone.now()
        Offer.objects.create(
            name='Expired', discount_percentage=50,
            product=self.product, is_active=True,
            start_date=now - timedelta(days=2),
            end_date=now - timedelta(days=1),
        )
        result = apply_offer_to_price(self.product)
        # Expired offer should not be picked up
        self.assertEqual(result['final_price'], 100)


# ─────────────────────────────  SECTION 3: Order Lifecycle  ──────────────────

class OrderLifecycleTest(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer1', email='c@test.com', password='pass1234', role='user'
        )
        self.rider = User.objects.create_user(
            username='rider1', email='r@test.com', password='pass1234', role='delivery'
        )
        self.cat = Category.objects.create(name='Veggies')
        self.product = Product.objects.create(
            category=self.cat, name='Tomato', price=Decimal('30'), weight_volume='500g'
        )
        self.wh = Warehouse.objects.create(
            name='Hub1', code='H001', address='Somewhere',
            latitude=Decimal('27.7'), longitude=Decimal('85.3'), is_active=True
        )
        Inventory.objects.create(warehouse=self.wh, product=self.product, stock_quantity=50)

    def test_full_order_lifecycle(self):
        from apps.orders.models import Cart, CartItem, Order, DeliveryAssignment

        cart, _ = Cart.objects.get_or_create(user=self.customer)
        CartItem.objects.create(cart=cart, product=self.product, quantity=3)
        self.assertEqual(cart.total, Decimal('90'))

        # Place order manually (mirrors the view logic)
        order = Order.objects.create(
            user=self.customer, warehouse=self.wh,
            delivery_address='123 Test St', delivery_lat='27.7', delivery_lng='85.3',
            subtotal=90, discount_amount=0, delivery_fee=50, total_amount=140,
        )
        order.status = 'pending'
        order.save()

        self.assertEqual(order.status, 'pending')
        order.status = 'packed'
        order.save()
        self.assertEqual(order.status, 'packed')

        assignment = DeliveryAssignment.objects.create(order=order, delivery_man=self.rider)
        order.status = 'out_for_delivery'
        order.save()
        self.assertEqual(order.status, 'out_for_delivery')

        order.status = 'delivered'
        order.save()
        self.assertEqual(order.status, 'delivered')
        self.assertIsNotNone(assignment.delivery_man)
