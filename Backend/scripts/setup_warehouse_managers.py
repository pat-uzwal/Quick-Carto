import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.warehouses.models import Warehouse

def setup_warehouse_managers():
    # 1. Delete ALL existing warehouse manager users
    deleted_count, _ = User.objects.filter(role='warehouse').delete()
    print(f"Purged {deleted_count} old warehouse manager accounts.")

    # 2. Define the 3 new managers
    managers = [
        {
            'email': 'manager.kathmandu@quickcarto.com',
            'username': 'manager_ktm',
            'full_name': 'Kathmandu Manager',
            'password': 'KTM@Manager2025',
            'warehouse_name': 'Kathmandu',
        },
        {
            'email': 'manager.bhaktapur@quickcarto.com',
            'username': 'manager_bkt',
            'full_name': 'Bhaktapur Manager',
            'password': 'BKT@Manager2025',
            'warehouse_name': 'Bhaktapur',
        },
        {
            'email': 'manager.lalitpur@quickcarto.com',
            'username': 'manager_ltp',
            'full_name': 'Lalitpur Manager',
            'password': 'LTP@Manager2025',
            'warehouse_name': 'Lalitpur',
        },
    ]

    print("\n--- Creating New Warehouse Managers ---")
    for spec in managers:
        try:
            warehouse = Warehouse.objects.get(name=spec['warehouse_name'])
        except Warehouse.DoesNotExist:
            print(f"[ERROR] Warehouse '{spec['warehouse_name']}' not found! Run sync_3_warehouses.py first.")
            continue

        user = User.objects.create_user(
            email=spec['email'],
            username=spec['username'],
            password=spec['password'],
            full_name=spec['full_name'],
            role='warehouse',
            is_active=True,
            assigned_warehouse=warehouse,
        )
        print(f"   Created: {user.email} | Password: {spec['password']} | Hub: {warehouse.name}")

    print("\n Warehouse Manager Setup Complete!")
    print("="*55)
    print(f"{'HUB':<20} {'EMAIL':<40} {'PASSWORD'}")
    print("-"*55)
    for spec in managers:
        print(f"  {spec['warehouse_name']:<18} {spec['email']:<40} {spec['password']}")
    print("="*55)

if __name__ == "__main__":
    setup_warehouse_managers()
