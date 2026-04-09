import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.warehouses.models import Warehouse

def populate_warehouses():
    warehouses_data = [
        {'name': 'Kathmandu Main Hub', 'code': 'KTM-01', 'address': 'Baneshwor, Kathmandu', 'lat': 27.6915, 'lng': 85.342, 'is_active': True},
        {'name': 'Lalitpur Distribution Center', 'code': 'LAL-02', 'address': 'Patan, Lalitpur', 'lat': 27.671, 'lng': 85.324, 'is_active': True},
        {'name': 'Bhaktapur Storage Point', 'code': 'BKT-03', 'address': 'Suryabinayak, Bhaktapur', 'lat': 27.672, 'lng': 85.428, 'is_active': True},
    ]

    print("--- Seeding Warehouses ---")
    for wh_data in warehouses_data:
        wh, created = Warehouse.objects.get_or_create(
            code=wh_data['code'],
            defaults={
                'name': wh_data['name'],
                'address': wh_data['address'],
                'latitude': wh_data['lat'],
                'longitude': wh_data['lng'],
                'is_active': wh_data['is_active']
            }
        )
        if created:
            print(f"Created Warehouse: {wh.name}")
        else:
            print(f"Warehouse already exists: {wh.name}")

if __name__ == "__main__":
    populate_warehouses()
