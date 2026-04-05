import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.warehouses.models import Warehouse, Inventory
from apps.products.models import Product

def sync_three_warehouses():
    # 1. Define the 3 core hubs
    warehouse_specs = [
        {'name': 'Kathmandu', 'code': 'WH-KTM', 'address': 'Kathmandu, Nepal', 'lat': 27.7172, 'lng': 85.3240},
        {'name': 'Bhaktapur', 'code': 'WH-BKT', 'address': 'Bhaktapur, Nepal', 'lat': 27.6710, 'lng': 85.4298},
        {'name': 'Lalitpur', 'code': 'WH-LTP', 'address': 'Lalitpur, Nepal', 'lat': 27.6644, 'lng': 85.3188},
    ]

    print("Purging legacy warehouse nodes...")
    # Delete all warehouses to ensure exact match of the 3 requested
    # (Cascade deletes inventory and logs automatically)
    Warehouse.objects.all().delete()
    print("All legacy hubs purged.")

    new_hubs = []
    for spec in warehouse_specs:
        wh = Warehouse.objects.create(
            name=spec['name'],
            code=spec['code'],
            address=spec['address'],
            latitude=spec['lat'],
            longitude=spec['lng']
        )
        new_hubs.append(wh)
        print(f"Created Hub: {wh.name}")

    # 2. Re-sync inventory for all real products
    products = Product.objects.all()
    print(f"Syncing {products.count()} products to the new 3-hub matrix...")
    
    created_count = 0
    for wh in new_hubs:
        for product in products:
            Inventory.objects.create(
                warehouse=wh,
                product=product,
                stock_quantity=100 if 'Coca' in product.name or 'Pepsi' in product.name else 0, # Give some starting stock to popular items
                reserved_stock=0
            )
            created_count += 1
                
    print(f"Master Sync Complete. {created_count} stock records deployed across 3 hubs.")

if __name__ == "__main__":
    sync_three_warehouses()
