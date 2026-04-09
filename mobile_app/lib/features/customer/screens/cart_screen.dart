import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/api_service.dart';
import '../providers/cart_provider.dart';
import 'checkout_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({Key? key}) : super(key: key);

  Widget _buildProductImage(dynamic item) {
    final detail = item['product_detail'] ?? {};
    final imageUrl = detail['image_url']?.toString() ?? '';
    if (imageUrl.isNotEmpty) {
      final url = imageUrl.startsWith('http') ? imageUrl : '${ApiService.mediaUrl}$imageUrl';
      return CachedNetworkImage(
        imageUrl: url,
        width: 64,
        height: 64,
        fit: BoxFit.contain,
        errorWidget: (_, __, ___) => const Center(child: Text('🛒', style: TextStyle(fontSize: 28))),
      );
    }
    return const Center(child: Text('🛒', style: TextStyle(fontSize: 28)));
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: AppBar(
        title: const Text('BASKET HUB', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.chevronLeft, color: Colors.black, size: 20), onPressed: () => Navigator.pop(context)),
        centerTitle: true,
      ),
      body: cart.isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFE62020)))
          : cart.items.isEmpty
              ? _buildEmptyState(context)
              : ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    // Branded Title (Web Parity)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("CHECKOUT BASKET", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                        const SizedBox(height: 8),
                        Container(height: 5, width: 80, decoration: BoxDecoration(color: const Color(0xFFE62020), borderRadius: BorderRadius.circular(10))),
                      ],
                    ),
                    const SizedBox(height: 48),

                    // Hub Origin Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text("ITEM DISPATCH CENTER", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5)),
                            Text("LALITPUR HUB • VERIFIED", style: TextStyle(color: Color(0xFFE62020), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Elite Item List
                    ...cart.items.map((item) {
                      final detail = item['product_detail'] ?? {};
                      final productId = item['product'] is Map ? item['product']['id'] : item['product'];
                      final qty = item['quantity'] as int? ?? 1;
                      final price = double.tryParse(detail['final_price']?.toString() ?? detail['price']?.toString() ?? '0') ?? 0;
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 30, offset: const Offset(0, 10))],
                        ),
                        child: Row(
                          children: [
                            Container(
                              height: 80, width: 80,
                              decoration: BoxDecoration(color: const Color(0xFFF9FAFB), borderRadius: BorderRadius.circular(20)),
                              child: ClipRRect(borderRadius: BorderRadius.circular(20), child: _buildProductImage(item)),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(detail['name'] ?? 'Product', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                                  const SizedBox(height: 6),
                                  const Text("FRESH PACKED", style: TextStyle(color: Colors.green, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                                  const SizedBox(height: 12),
                                  Text("रू ${price.toStringAsFixed(0)}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFFE62020))),
                                ],
                              ),
                            ),
                            
                            // Improved Horizontal Quantity Control
                            Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFE62020),
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [BoxShadow(color: const Color(0xFFE62020).withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(LucideIcons.minus, color: Colors.white, size: 16),
                                    onPressed: () => cart.updateQuantity(productId, qty - 1),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                  ),
                                  Text("$qty", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                                  IconButton(
                                    icon: const Icon(LucideIcons.plus, color: Colors.white, size: 16),
                                    onPressed: () => cart.updateQuantity(productId, qty + 1),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                  ),
                                ],
                              ),
                            )
                          ],
                        ),
                      );
                    }).toList(),

                    const SizedBox(height: 48),
                    
                    // Bill Details Section (Web Exact)
                    const Text("BILL SUMMARY", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 24),

                    _buildSummaryRow("HUB SUBTOTAL", "रू ${cart.total.toStringAsFixed(0)}"),
                    _buildSummaryRow("REGIONAL DELIVERY", "रू 40"),
                    
                    // Zap Free Delivery Banner
                    if (cart.total < 500)
                      Container(
                        margin: const EdgeInsets.symmetric(vertical: 24),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(color: const Color(0xFFFFF1F1), borderRadius: BorderRadius.circular(25), border: Border.all(color: const Color(0xFFE62020).withOpacity(0.05))),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.zap, color: Color(0xFFE62020), size: 18),
                            const SizedBox(width: 16),
                            Expanded(child: RichText(text: TextSpan(
                              style: const TextStyle(color: Color(0xFFE62020), fontSize: 11, fontWeight: FontWeight.bold, height: 1.5),
                              children: [
                                const TextSpan(text: "UNLOCK "),
                                const TextSpan(text: "FREE DELIVERY", style: TextStyle(fontWeight: FontWeight.w900, decoration: TextDecoration.underline)),
                                TextSpan(text: " BY ADDING रू ${(500 - cart.total).toStringAsFixed(0)} MORE."),
                              ]
                            )))
                          ],
                        ),
                      ),

                    _buildSummaryRow("HUB PLATFORM FEE", "रू 10"),
                    const SizedBox(height: 32),
                    const Divider(color: Colors.black12),
                    const SizedBox(height: 32),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("GRAND TOTAL", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.black26, letterSpacing: 1)),
                            const SizedBox(height: 4),
                            Row(
                              children: const [
                                Icon(LucideIcons.shieldCheck, color: Colors.green, size: 14),
                                SizedBox(width: 6),
                                Text("SECURE CHECKOUT", style: TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                              ],
                            )
                          ],
                        ),
                        Text("रू ${(cart.total + 50).toStringAsFixed(0)}", style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900)),
                      ],
                    ),
                    const SizedBox(height: 120),
                  ],
                ),
      bottomSheet: cart.items.isEmpty ? null : Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(color: Colors.white),
        child: SizedBox(
          width: double.infinity,
          height: 75,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE62020),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
              elevation: 20,
              shadowColor: const Color(0xFFE62020).withOpacity(0.4),
            ),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CheckoutScreen())),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("रू ${(cart.total + 50).toStringAsFixed(0)}", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                Row(
                  children: const [
                    Text("PROCEED", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 2)),
                    SizedBox(width: 12),
                    Icon(LucideIcons.chevronRight, color: Colors.white, size: 24),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQtyBtn(IconData icon, VoidCallback onTap) {
    return InkWell(onTap: onTap, child: Container(padding: const EdgeInsets.all(8), child: Icon(icon, color: Colors.white, size: 18)));
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black38, letterSpacing: 1)),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(width: 140, height: 140, decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 40)]), child: const Center(child: Text("🛍️", style: TextStyle(fontSize: 60)))),
            const SizedBox(height: 48),
            const Text("BASKET IS EMPTY", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
            const SizedBox(height: 12),
            const Text("Syncing with your active missions. Track your orders for handover codes.", textAlign: TextAlign.center, style: TextStyle(color: Colors.black26, fontSize: 13, fontWeight: FontWeight.bold, height: 1.5)),
            const SizedBox(height: 60),
            SizedBox(
              width: double.infinity,
              height: 65,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE62020), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)), elevation: 15, shadowColor: const Color(0xFFE62020).withOpacity(0.3)),
                child: const Text("CONTINUE SHOPPING", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
