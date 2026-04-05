"""
Background Celery tasks for QuickCarto.
Triggered on order placement, inventory thresholds, etc.
"""
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task
def notify_warehouse_new_order(order_id: int, warehouse_name: str):
    """
    Simulate notifying warehouse manager of a new order.
    In production, replace with email/push/WebSocket notification.
    """
    logger.info(f"[NOTIFY] New order #{order_id} assigned to warehouse '{warehouse_name}'.")
    # e.g., send_mail(...) or push via Django Channels


@shared_task
def notify_delivery_man_assignment(order_id: int, delivery_man_username: str):
    """Notify a delivery man that an order has been assigned to them."""
    logger.info(f"[NOTIFY] Order #{order_id} assigned to rider '{delivery_man_username}'.")


@shared_task
def expire_stale_offers():
    """
    Mark offers as inactive if their end_date has passed.
    Schedule this as a Celery Beat periodic task (every hour).
    """
    from django.utils import timezone
    from apps.offers.models import Offer

    expired_count = Offer.objects.filter(is_active=True, end_date__lt=timezone.now()).update(is_active=False)
    logger.info(f"[OFFERS] Expired {expired_count} stale offer(s).")
    return expired_count


@shared_task
def update_low_stock_alert(warehouse_id: int, product_id: int, current_stock: int):
    """Alert warehouse manager when stock falls below threshold."""
    THRESHOLD = 5
    if current_stock <= THRESHOLD:
        logger.warning(
            f"[STOCK] Warehouse {warehouse_id} — Product {product_id} stock is LOW: {current_stock} units remaining."
        )
