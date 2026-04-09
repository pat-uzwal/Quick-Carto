import os
import django
import random
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order, OrderItem
from apps.products.models import Product, Category
from apps.warehouses.models import Warehouse
from apps.users.models import User

def populate_orders():
    print("--- Seeding Sample Orders ---")
    
    # Get required data
    users = list(User.objects.filter(role='user')) # Real customers
    if not users:
        print("No users with 'user' role found. Using all users...")
        users = list(User.objects.all())
    
    warehouses = list(Warehouse.objects.all())
    products = list(Product.objects.all())
    
    if not warehouses or not products:
        print("Error: Need warehouses and products to create orders.")
        return

    # Create 5-10 sample orders
    for i in range(8):
        user = random.choice(users)
        warehouse = random.choice(warehouses)
        
        order = Order.objects.create(
            user=user,
            warehouse=warehouse,
            status=random.choice(['pending', 'packed', 'out_for_delivery', 'delivered']),
            delivery_address=f"House No. {random.randint(1, 100)}, {warehouse.name} Area",
            delivery_lat=27.7, # Simplified
            delivery_lng=85.3,
            delivery_fee=Decimal('50.00'),
        )
        
        # Add 1-3 items to order
        num_items = random.randint(1, 3)
        selected_prods = random.sample(products, num_items)
        
        total = Decimal('0')
        for prod in selected_prods:
            qty = random.randint(1, 5)
            # Use price from product or default
            price = prod.price if hasattr(prod, 'price') else Decimal('100.00')
            
            OrderItem.objects.create(
                order=order,
                product=prod,
                quantity=qty,
                unit_price=price,
                final_price=price
            )
            total += price * qty
            
        order.subtotal = total
        order.total_amount = total + order.delivery_fee
        order.save()
        
        print(f"Created Order #{order.id} for {user.username} - Total: रू {order.total_amount}")

if __name__ == "__main__":
    populate_orders()
