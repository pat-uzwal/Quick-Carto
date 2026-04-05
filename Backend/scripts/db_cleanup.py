import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product
from apps.warehouses.models import Warehouse, Inventory

def cleanup_dummies_and_sync_inventory():
    dummy_skus = ['BAS-574', 'REF-768', 'ORG-280', 'LAY-580']
    
    print(f"Cleaning dummy products with SKUs: {dummy_skus}...")
    deleted_count, _ = Product.objects.filter(sku__in=dummy_skus).delete()
    print(f"Deleted {deleted_count} dummy products.")

    warehouses = Warehouse.objects.all()
    products = Product.objects.all()

    print(f"Syncing inventory for {products.count()} products across {warehouses.count()} warehouses...")
    
    created_count = 0
    for warehouse in warehouses:
        for product in products:
            obj, created = Inventory.objects.get_or_create(
                warehouse=warehouse,
                product=product,
                defaults={'stock_quantity': 0, 'reserved_stock': 0}
            )
            if created:
                created_count += 1
                
    print(f"Inventory sync complete. Created {created_count} new stock records.")

if __name__ == "__main__":
    cleanup_dummies_and_sync_inventory()
