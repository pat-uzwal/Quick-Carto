import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/api_service.dart';
import '../providers/cart_provider.dart';
import 'cart_screen.dart';

class ProductDetailsScreen extends StatefulWidget {
  final dynamic product;
  const ProductDetailsScreen({Key? key, required this.product}) : super(key: key);

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  bool _addingToCart = false;

  String _getEmoji(String name, String catName) {
    final n = (name + catName).toLowerCase();
    if (n.contains('grocery') || n.contains('kitchen') || n.contains('rice') || n.contains('dal')) return '🛒';
    if (n.contains('snack') || n.contains('drink') || n.contains('coke') || n.contains('pepsi')) return '🥤';
    if (n.contains('liquor') || n.contains('whisky') || n.contains('beer') || n.contains('wine')) return '🥃';
    if (n.contains('beauty') || n.contains('soap') || n.contains('shampoo')) return '💄';
    if (n.contains('milk') || n.contains('dairy') || n.contains('cheese')) return '🥛';
    if (n.contains('meat') || n.contains('chicken') || n.contains('fish')) return '🥩';
    if (n.contains('bread') || n.contains('bakery')) return '🍞';
    if (n.contains('oil')) return '🫙';
    if (n.contains('chocolate') || n.contains('candy')) return '🍫';
    return '📦';
  }

  Widget _buildProductImage() {
    final imageUrl = widget.product['image_url']?.toString() ?? '';
    final name = widget.product['name']?.toString() ?? '';
    final catName = widget.product['category_name']?.toString() ?? '';
    if (imageUrl.isNotEmpty) {
      final url = imageUrl.startsWith('http')
          ? imageUrl
          : '${ApiService.mediaUrl}$imageUrl';
      return CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.contain,
        placeholder: (_, __) => const Center(child: CircularProgressIndicator(color: Color(0xFFE62020))),
        errorWidget: (_, __, ___) => Center(child: Text(_getEmoji(name, catName), style: const TextStyle(fontSize: 120))),
      );
    }
    return Center(child: Text(_getEmoji(name, catName), style: const TextStyle(fontSize: 120)));
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final cart = Provider.of<CartProvider>(context);
    final name = p['name']?.toString() ?? '';
    final finalPrice = p['final_price'] ?? p['price'] ?? '0';
    final originalPrice = p['original_price'] ?? p['mrp'];
    final discountPct = (p['discount_percentage'] ?? 0) as num;
    final description = p['description']?.toString() ?? '';
    final weight = p['weight']?.toString() ?? '';
    final unit = p['unit']?.toString() ?? '';
    final brand = p['brand']?.toString() ?? '';
    final catName = p['category_name']?.toString() ?? '';

    // Check if item is already in cart
    final cartItem = cart.items.where((i) => i['product'].toString() == p['id'].toString()).toList();
    final inCartQty = cartItem.isNotEmpty ? (cartItem.first['quantity'] as int? ?? 0) : 0;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(name.toUpperCase(), style: const TextStyle(color: Colors.black, fontSize: 13, fontWeight: FontWeight.w900)),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(LucideIcons.shoppingCart, color: Colors.black, size: 20),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CartScreen())),
              ),
              if (cart.itemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(color: const Color(0xFFE62020), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1)),
                    constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                    child: Text(
                      '${cart.itemCount}',
                      style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Product Image ─────────────────────────────
            Container(
              height: 280,
              width: double.infinity,
              color: Colors.grey.shade50,
              child: Stack(
                children: [
                  Positioned.fill(child: _buildProductImage()),
                  if (discountPct > 0)
                    Positioned(
                      top: 16, left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFFff4500), Color(0xFFff7300)]),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('${discountPct.toStringAsFixed(0)}% OFF',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900)),
                      ),
                    ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ─── Brand ─────────────────────────────────
                  if (brand.isNotEmpty)
                    Text(brand.toUpperCase(),
                        style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.5)),

                  // ─── Name ──────────────────────────────────
                  const SizedBox(height: 8),
                  Text(name, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, height: 1.2, color: Colors.black)),

                  // ─── Weight ────────────────────────────────
                  if (weight.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text('$weight $unit',
                          style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w700, fontSize: 13)),
                    ),

                  // ─── Delivery badge ────────────────────────
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.orange.shade100),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(LucideIcons.zap, color: Colors.orange, size: 13),
                        SizedBox(width: 5),
                        Text('10 MIN DELIVERY', style: TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                      ],
                    ),
                  ),

                  // ─── Price ─────────────────────────────────
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Divider(height: 1, color: Color(0xFFF0F0F0)),
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('रू$finalPrice',
                          style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.black, height: 1)),
                      const SizedBox(width: 12),
                      if (originalPrice != null && discountPct > 0) ...[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('रू$originalPrice',
                                style: const TextStyle(
                                    decoration: TextDecoration.lineThrough,
                                    fontSize: 16,
                                    color: Colors.grey,
                                    fontWeight: FontWeight.bold)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.orange.shade50,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text('${discountPct.toStringAsFixed(0)}% OFF',
                                  style: const TextStyle(color: Color(0xFFff4500), fontSize: 9, fontWeight: FontWeight.w900)),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 28),

                  // ─── ADD / QTY Controls ────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: inCartQty == 0
                        ? ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE62020),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 8,
                              shadowColor: const Color(0xFFE62020).withOpacity(0.4),
                            ),
                            onPressed: _addingToCart
                                ? null
                                : () async {
                                    setState(() => _addingToCart = true);
                                    await cart.addToCart(p['id'], 1);
                                    if (mounted) setState(() => _addingToCart = false);
                                  },
                            child: _addingToCart
                                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text('ADD TO CART', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1, color: Colors.white)),
                          )
                        : Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFE62020),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: IconButton(
                                    icon: const Icon(LucideIcons.minus, color: Colors.white, size: 20),
                                    onPressed: () => cart.updateQuantity(p['id'], inCartQty - 1),
                                  ),
                                ),
                                Text('$inCartQty',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                                Expanded(
                                  child: IconButton(
                                    icon: const Icon(LucideIcons.plus, color: Colors.white, size: 20),
                                    onPressed: () => cart.updateQuantity(p['id'], inCartQty + 1),
                                  ),
                                ),
                              ],
                            ),
                          ),
                  ),

                  // ─── Description ───────────────────────────
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 28),
                    const Text('ABOUT THIS PRODUCT',
                        style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                    const SizedBox(height: 10),
                    Text(description,
                        style: const TextStyle(fontSize: 14, color: Colors.black87, height: 1.6, fontWeight: FontWeight.w500)),
                  ],

                  const SizedBox(height: 28),

                  // ─── Why QuickCarto ────────────────────────
                  const Text('WHY QUICKCARTO?',
                      style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                  const SizedBox(height: 16),
                  _buildWhyItem('⚡', 'Superfast Delivery', 'Delivered to your doorstep in under 10 minutes from local hubs.'),
                  _buildWhyItem('💎', 'Best Prices & Offers', 'Best price destination with awesome offers directly from manufacturers.'),
                  _buildWhyItem('🛡️', 'Quality Guaranteed', 'All products are sourced and quality checked before dispatch.'),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWhyItem(String emoji, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(14)),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 22))),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
