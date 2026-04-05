import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/api_service.dart';
import 'chat_screen.dart';

class MyOrdersScreen extends StatefulWidget {
  const MyOrdersScreen({Key? key}) : super(key: key);

  @override
  _MyOrdersScreenState createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final res = await ApiService.get('/orders/');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _orders = data['results'] ?? data;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'packed': return Colors.purple;
      case 'out_for_delivery': return const Color(0xFFE62020);
      case 'delivered': return Colors.green;
      case 'cancelled': return Colors.grey;
      default: return Colors.grey;
    }
  }

  void _showRatingModal(int orderId, String riderName) {
    int rating = 5;
    String review = '';
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Column(
            children: [
              const Text('⭐', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 8),
              Text('Rate $riderName', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('How was your delivery experience?',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) => GestureDetector(
                  onTap: () => setModal(() => rating = i + 1),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      LucideIcons.star,
                      size: 32,
                      color: i < rating ? Colors.orange : Colors.grey.shade300,
                    ),
                  ),
                )),
              ),
              const SizedBox(height: 16),
              TextField(
                onChanged: (v) => review = v,
                decoration: InputDecoration(
                  hintText: 'Add a comment (optional)...',
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.all(14),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL', style: TextStyle(color: Colors.grey))),
            ElevatedButton(
              onPressed: () async {
                final res = await ApiService.post('/orders/$orderId/rate/', {'stars': rating, 'review': review});
                if (mounted) {
                  Navigator.pop(ctx);
                  if (res.statusCode == 201) {
                    _fetchOrders();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Thanks for your feedback! ❤️'), backgroundColor: Colors.green),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE62020),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('SUBMIT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('My Orders', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black, fontSize: 20)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: Colors.grey.shade100, height: 1),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFE62020)))
          : _orders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.package, size: 80, color: Colors.grey.shade200),
                      const SizedBox(height: 20),
                      const Text('No orders yet', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 8),
                      const Text('Place your first order and track it here.',
                          style: TextStyle(color: Colors.grey, fontSize: 13)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchOrders,
                  color: const Color(0xFFE62020),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    itemCount: _orders.length,
                    itemBuilder: (ctx, i) => _buildOrderCard(_orders[i]),
                  ),
                ),
    );
  }

  Widget _buildOrderCard(dynamic order) {
    final status = order['status'] ?? 'pending';
    final statusDisplay = (order['status_display'] ?? status.replaceAll('_', ' ')).toString().toUpperCase();
    final date = DateTime.tryParse(order['created_at'] ?? '') ?? DateTime.now();
    final items = (order['items'] as List?) ?? [];
    final isRated = order['is_rated'] ?? false;
    final riderName = order['rider_name'] ?? 'Rider';
    final statusColor = _getStatusColor(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // ─── Header ───────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            color: statusColor.withOpacity(0.05),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('ORD #${order['id']}',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text('${date.day}/${date.month}/${date.year}  ${date.hour}:${date.minute.toString().padLeft(2, '0')}',
                        style: const TextStyle(color: Colors.grey, fontSize: 11)),
                  ],
                ),
                Row(
                  children: [
                    // Chat button for active orders
                    if (status != 'delivered' && status != 'cancelled')
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(
                            builder: (_) => ChatScreen(orderId: order['id'], title: 'Rider Chat'),
                          )),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE62020).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(LucideIcons.messageSquare, color: Color(0xFFE62020), size: 18),
                          ),
                        ),
                      ),
                    // Status badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(statusDisplay,
                          style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ─── Items list ───────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...items.take(2).map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(child: Text('📦', style: TextStyle(fontSize: 18))),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(item['product_name'] ?? '',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                      Text('× ${item['quantity']}',
                          style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ),
                )),
                if (items.length > 2)
                  Text('+${items.length - 2} more items',
                      style: const TextStyle(color: Color(0xFFE62020), fontSize: 11, fontWeight: FontWeight.bold)),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Divider(height: 1, color: Color(0xFFF0F0F0)),
                ),

                // ─── Footer: Total + OTP/Rating ───────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('TOTAL', style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                        const SizedBox(height: 2),
                        Text('रू${order['total_amount']}',
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Colors.black)),
                        if (order['payment_method'] != null)
                          Text(order['payment_method'].toString().toUpperCase(),
                              style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w600)),
                      ],
                    ),
                    // OTP box for any active order that is not delivered or cancelled
                    if (status != 'delivered' && status != 'cancelled' && order['delivery_otp'] != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE62020).withOpacity(0.06),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE62020).withOpacity(0.15)),
                        ),
                        child: Column(
                          children: [
                            const Text('HANDOVER OTP', style: TextStyle(color: Color(0xFFE62020), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
                            const SizedBox(height: 4),
                            Text('${order['delivery_otp']}',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: 3, color: Colors.black)),
                          ],
                        ),
                      ),
                    // Rate button
                    if (status == 'delivered' && !isRated)
                      ElevatedButton.icon(
                        onPressed: () => _showRatingModal(order['id'], riderName),
                        icon: const Icon(LucideIcons.star, size: 14, color: Colors.white),
                        label: const Text('RATE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                      ),
                    // Already rated
                    if (status == 'delivered' && isRated)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.star, color: Colors.orange, size: 14),
                            const SizedBox(width: 4),
                            Text('${order['rating']?['stars'] ?? '—'} Stars',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Colors.orange)),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
