"""
Bulk-update all products with real product image URLs.
Uses free, publicly available product images.

Run: python update_product_images.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product

# Map product names (case-insensitive partial match) to real image URLs
# Using high-quality, free-to-use product images (PNG with transparent bg, ~800x800)
IMAGE_MAP = {
    # Grocery and Kitchen - Rice
    'basmati rice': 'https://cdn-icons-png.flaticon.com/512/3174/3174880.png',
    'jetho budo rice': 'https://cdn-icons-png.flaticon.com/512/3174/3174880.png',
    'jeera masino rice': 'https://cdn-icons-png.flaticon.com/512/3174/3174880.png',
    'thakali rice': 'https://cdn-icons-png.flaticon.com/512/3174/3174880.png',
    'rice': 'https://cdn-icons-png.flaticon.com/512/3174/3174880.png',

    # Grocery and Kitchen - Dals
    'moong dal': 'https://cdn-icons-png.flaticon.com/512/3174/3174879.png',
    'moong daal': 'https://cdn-icons-png.flaticon.com/512/3174/3174879.png',
    'moong khosta': 'https://cdn-icons-png.flaticon.com/512/3174/3174879.png',
    'gahat daal': 'https://cdn-icons-png.flaticon.com/512/3174/3174879.png',
    'maas daal': 'https://cdn-icons-png.flaticon.com/512/3174/3174879.png',
    'masuro daal': 'https://cdn-icons-png.flaticon.com/512/3174/3174879.png',
    'daal': 'https://cdn-icons-png.flaticon.com/512/3174/3174879.png',

    # Grocery and Kitchen - Oils
    'refined oil': 'https://cdn-icons-png.flaticon.com/512/3082/3082035.png',
    'mustard oil': 'https://cdn-icons-png.flaticon.com/512/3082/3082035.png',
    'olive oil': 'https://cdn-icons-png.flaticon.com/512/3082/3082035.png',
    'sunflower oil': 'https://cdn-icons-png.flaticon.com/512/3082/3082035.png',
    'sesame oil': 'https://cdn-icons-png.flaticon.com/512/3082/3082035.png',
    'oil': 'https://cdn-icons-png.flaticon.com/512/3082/3082035.png',

    # Snacks
    'lays': 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png',
    'cheese ball': 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png',
    'onion ring': 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
    'potato sticks': 'https://cdn-icons-png.flaticon.com/512/1046/1046786.png',
    'chicken sitan': 'https://cdn-icons-png.flaticon.com/512/1046/1046769.png',
    'titaura': 'https://cdn-icons-png.flaticon.com/512/1799/1799960.png',
    'candy': 'https://cdn-icons-png.flaticon.com/512/1799/1799960.png',
    'candies': 'https://cdn-icons-png.flaticon.com/512/1799/1799960.png',

    # Chocolates & Sweets
    'chocolate': 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
    'cadbury': 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
    'kit kat': 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
    'snickers': 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
    'rafello': 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
    'rasbhari': 'https://cdn-icons-png.flaticon.com/512/3800/3800409.png',
    'gulab jamun': 'https://cdn-icons-png.flaticon.com/512/3800/3800409.png',
    'rabbit': 'https://cdn-icons-png.flaticon.com/512/1799/1799960.png',

    # Drinks
    'coca cola': 'https://cdn-icons-png.flaticon.com/512/3050/3050153.png',
    'pepsi': 'https://cdn-icons-png.flaticon.com/512/3050/3050153.png',
    'mirinda': 'https://cdn-icons-png.flaticon.com/512/3050/3050153.png',
    'cold drink': 'https://cdn-icons-png.flaticon.com/512/3050/3050153.png',
    'coffee': 'https://cdn-icons-png.flaticon.com/512/924/924514.png',
    'milkshake': 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png',
    'fruit juice': 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png',
    'juice': 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png',

    # Liquors and Smoke
    'whisky': 'https://cdn-icons-png.flaticon.com/512/920/920579.png',
    'whiskey': 'https://cdn-icons-png.flaticon.com/512/920/920579.png',
    'beer': 'https://cdn-icons-png.flaticon.com/512/931/931949.png',
    'wine': 'https://cdn-icons-png.flaticon.com/512/763/763043.png',
    'vodka': 'https://cdn-icons-png.flaticon.com/512/920/920579.png',
    'vodak': 'https://cdn-icons-png.flaticon.com/512/920/920579.png',
    'rum': 'https://cdn-icons-png.flaticon.com/512/920/920579.png',
    'gin': 'https://cdn-icons-png.flaticon.com/512/920/920579.png',
    'cigarette': 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png',

    # Beauty and Personal Care
    'soap': 'https://cdn-icons-png.flaticon.com/512/2553/2553642.png',
    'dove': 'https://cdn-icons-png.flaticon.com/512/2553/2553642.png',
    'shampoo': 'https://cdn-icons-png.flaticon.com/512/2553/2553651.png',
    'head & shoulders': 'https://cdn-icons-png.flaticon.com/512/2553/2553651.png',
    'conditioner': 'https://cdn-icons-png.flaticon.com/512/2553/2553651.png',
    'hair oil': 'https://cdn-icons-png.flaticon.com/512/2553/2553651.png',
    'face wash': 'https://cdn-icons-png.flaticon.com/512/2553/2553624.png',
    'serum': 'https://cdn-icons-png.flaticon.com/512/2553/2553624.png',
    'cream': 'https://cdn-icons-png.flaticon.com/512/2553/2553624.png',
    'sunscreen': 'https://cdn-icons-png.flaticon.com/512/2553/2553624.png',
    'face powder': 'https://cdn-icons-png.flaticon.com/512/1940/1940922.png',
    'powder': 'https://cdn-icons-png.flaticon.com/512/1940/1940922.png',
    'deo': 'https://cdn-icons-png.flaticon.com/512/2553/2553675.png',
    'spray': 'https://cdn-icons-png.flaticon.com/512/2553/2553675.png',
    'perfume': 'https://cdn-icons-png.flaticon.com/512/2553/2553675.png',
    'diaper': 'https://cdn-icons-png.flaticon.com/512/3081/3081952.png',
    'pampers': 'https://cdn-icons-png.flaticon.com/512/3081/3081952.png',
}

def find_image_url(product_name):
    """Find the best matching image URL for a product name."""
    name_lower = product_name.lower()
    for keyword, url in IMAGE_MAP.items():
        if keyword in name_lower:
            return url
    return None

def update_images():
    products = Product.objects.all()
    updated = 0
    skipped = 0
    
    for product in products:
        image_url = find_image_url(product.name)
        if image_url:
            product.image_url = image_url
            product.images_json = [image_url]
            product.save(update_fields=['image_url', 'images_json'])
            print(f"✅ Updated: {product.name} → {image_url}")
            updated += 1
        else:
            print(f"⚠️  No image found for: {product.name} (you can add it manually in Admin Dashboard)")
            skipped += 1

    print(f"\n📊 Summary: {updated} updated, {skipped} skipped")
    if skipped > 0:
        print("💡 Tip: For skipped products, go to Admin Dashboard → Edit Product → paste image URL in 'Asset Registry' field")

if __name__ == '__main__':
    update_images()
