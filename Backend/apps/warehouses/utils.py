import math
from django.db.models import Prefetch
from .models import Warehouse, Inventory


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in kilometers between two (lat, lng) points."""
    try:
        R = 6371  # Earth radius in km
        phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
        dphi = math.radians(float(lat2) - float(lat1))
        dlambda = math.radians(float(lng2) - float(lng1))
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return 2 * R * math.asin(math.sqrt(a))
    except (ValueError, TypeError):
        return float('inf')


def find_nearest_warehouse(user_lat: float, user_lng: float, product_quantities: dict):
    """
    Optimized version using bulk lookups.
    """
    product_ids = list(product_quantities.keys())
    # Prefetch inventory for active warehouses
    active_warehouses = Warehouse.objects.filter(is_active=True).prefetch_related(
        Prefetch('inventory', queryset=Inventory.objects.filter(product_id__in=product_ids))
    )

    warehouses = []
    for warehouse in active_warehouses:
        distance = haversine_distance(user_lat, user_lng, float(warehouse.latitude), float(warehouse.longitude))
        warehouses.append((warehouse, distance))

    if not warehouses:
        return None

    # Sort to find the absolute nearest warehouse to the user
    warehouses.sort(key=lambda x: x[1])
    nearest_warehouse = warehouses[0][0]

    # Verify if THIS nearest warehouse has the stock
    stock_map = {inv.product_id: inv.stock_quantity for inv in nearest_warehouse.inventory.all()}
    
    for pid, qty in product_quantities.items():
        if stock_map.get(pid, 0) < qty:
            return None # Fail the order because the nearest warehouse is out of stock

    return nearest_warehouse


def deduct_inventory(warehouse, order_items):
    """
    Optimized deduction.
    """
    product_ids = [item.product_id for item in order_items]
    inventories = Inventory.objects.filter(warehouse=warehouse, product_id__in=product_ids)
    item_map = {item.product_id: item.quantity for item in order_items}
    
    for inv in inventories:
        inv.stock_quantity -= item_map.get(inv.product_id, 0)
        inv.save()
