import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.products.models import Category

categories = [
    {"name": "Grocery and Kitchen", "image_url": "https://cdn-icons-png.flaticon.com/512/3724/3724720.png"},
    {"name": "Snacks and Drinks", "image_url": "https://cdn-icons-png.flaticon.com/512/2819/2819194.png"},
    {"name": "Liquors and Smoke", "image_url": "https://cdn-icons-png.flaticon.com/512/1118/1118944.png"},
    {"name": "Beauty and Personal care", "image_url": "https://cdn-icons-png.flaticon.com/512/2822/2822552.png"}
]

for cat_data in categories:
    cat, created = Category.objects.get_or_create(
        name=cat_data["name"],
        defaults={"image_url": cat_data["image_url"]}
    )
    if not created:
        cat.image_url = cat_data["image_url"]
        cat.save()
        print(f"Updated: {cat.name}")
    else:
        print(f"Created: {cat.name}")

print("Categories populated successfully!")
