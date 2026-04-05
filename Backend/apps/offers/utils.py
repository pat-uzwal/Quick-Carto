from django.utils import timezone
from django.db.models import Q
from .models import Offer


def get_active_offer_for_product(product):
    """
    Returns the best active offer for a given Product instance,
    checking product-level first, then category-level.
    Returns None if no offer found.
    """
    now = timezone.now()
    # Product-level offer takes priority
    product_offer = Offer.objects.filter(
        product=product,
        is_active=True,
        start_date__lte=now,
        end_date__gte=now
    ).order_by('-discount_percentage').first()

    if product_offer:
        return product_offer

    # Fall back to category-level offer
    category_offer = Offer.objects.filter(
        category=product.category,
        product__isnull=True,
        is_active=True,
        start_date__lte=now,
        end_date__gte=now
    ).order_by('-discount_percentage').first()

def bulk_get_offers_for_products(products_list):
    """
    Returns a dict {product_id: best_offer} for all products in the list.
    More efficient than calling get_active_offer_for_product for each item.
    """
    now = timezone.now()
    product_ids = [p.id for p in products_list]
    category_ids = list(set(p.category_id for p in products_list))

    # All active offers for these products or categories
    active_offers = Offer.objects.filter(
        is_active=True,
        start_date__lte=now,
        end_date__gte=now
    ).filter(
        Q(product_id__in=product_ids) |
        Q(category_id__in=category_ids, product__isnull=True)
    ).order_by('-discount_percentage')

    results = {}
    for product in products_list:
        # Best product offer
        best_p = next((o for o in active_offers if o.product_id == product.id), None)
        if best_p:
            results[product.id] = best_p
            continue
        
        # Best category offer
        best_c = next((o for o in active_offers if o.category_id == product.category_id and o.product_id is None), None)
        results[product.id] = best_c
    
    return results


def apply_offer_to_price(product, offer=None):
    """
    Returns a dict with:
      - original_price
      - discount_percentage
      - discount_amount
      - final_price
      - offer (Offer instance or None)
    """
    if offer is None:
        offer = get_active_offer_for_product(product)
    
    original_price = product.price
    if offer:
        discount_amount = (offer.discount_percentage / 100) * original_price
        final_price = original_price - discount_amount
    else:
        discount_amount = 0
        final_price = original_price
    return {
        'original_price': float(original_price),
        'discount_percentage': float(offer.discount_percentage) if offer else 0,
        'discount_amount': float(discount_amount),
        'final_price': float(final_price),
        'offer': offer,
    }
