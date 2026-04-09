import os
import django
import random
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, Category
from apps.warehouses.models import Warehouse, Inventory

def populate_products():
    print("--- Seeding Sample Products ---")
    
    products_by_category = {
        'Grocery and Kitchen': [
            {'name': 'Basmati Rice', 'brand': 'Fortune', 'price': '120.00', 'unit': 'kg', 'unit_quantity': '1'},
            {'name': 'Refined Oil', 'brand': 'Soya Health', 'price': '210.00', 'unit': 'liter', 'unit_quantity': '1'},
            {'name': 'Organic Moong Dal', 'brand': 'Tata Sampann', 'price': '150.00', 'unit': 'kg', 'unit_quantity': '1'},
        ],
        'Snacks and Drinks': [
            {'name': 'Lays Classic Salted', 'brand': 'PepsiCo', 'price': '50.00', 'unit': 'pcs', 'unit_quantity': '1'},
            {'name': 'Coca Cola 250ml', 'brand': 'Coke', 'price': '40.00', 'unit': 'pcs', 'unit_quantity': '1'},
            {'name': 'Dark Chocolate', 'brand': 'Amul', 'price': '100.00', 'unit': 'pcs', 'unit_quantity': '1'},
        ],
        'Liquors and Smoke': [
            {'name': 'Old Durbar Whisky', 'brand': 'Mount Everest', 'price': '2500.00', 'unit': 'pcs', 'unit_quantity': '1'},
            {'name': 'Tuborg Strong Beer', 'brand': 'Carlsberg', 'price': '350.00', 'unit': 'pcs', 'unit_quantity': '1'},
        ],
        'Beauty and Personal care': [
            {'name': 'Dove Soap', 'brand': 'Unilever', 'price': '60.00', 'unit': 'pcs', 'unit_quantity': '1'},
            {'name': 'Head & Shoulders', 'brand': 'P&G', 'price': '300.00', 'unit': 'pcs', 'unit_quantity': '1'},
        ]
    }

    warehouses = list(Warehouse.objects.all())
    if not warehouses:
        print("Error: No warehouses found. Run populate_warehouses first.")
        return

    for cat_name, product_list in products_by_category.items():
        try:
            category = Category.objects.get(name=cat_name)
        except Category.DoesNotExist:
            print(f"Skipping {cat_name} (Category not found)")
            continue
            
        for p_data in product_list:
            prod, created = Product.objects.get_or_create(
                name=p_data['name'],
                category=category,
                defaults={
                    'brand': p_data['brand'],
                    'sku': f"{p_data['name'][:3].upper()}-{random.randint(100,999)}",
                    'price': Decimal(p_data['price']),
                    'selling_price': Decimal(p_data['price']),
                    'mrp': Decimal(p_data['price']) * Decimal('1.2'),
                    'unit_type': 'l' if p_data['unit'] == 'liter' else p_data['unit'],
                    'weight_volume': p_data['unit_quantity'] + p_data['unit'],
                    'is_active': True
                }
            )
            if created:
                print(f"Created Product: {prod.name} in {cat_name}")
                # Create initial inventory for each warehouse
                for wh in warehouses:
                    Inventory.objects.create(
                        warehouse=wh,
                        product=prod,
                        stock_quantity=random.randint(50, 200)
                    )
            else:
                print(f"Product already exists: {prod.name}")

if __name__ == "__main__":
    populate_products()
