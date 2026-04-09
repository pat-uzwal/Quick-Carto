import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../../../core/api_service.dart';
import '../providers/cart_provider.dart';
import '../../auth/providers/auth_provider.dart';
import 'my_orders_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({Key? key}) : super(key: key);

  @override
  _CheckoutScreenState createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _streetController = TextEditingController();
  final TextEditingController _areaController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _couponController = TextEditingController();
  
  bool _isPlacingOrder = false;
  bool _isValidatingCoupon = false;
  Map<String, dynamic>? _appliedCoupon;
  String? _couponError;
  String _paymentMethod = 'cod';
  
  double _lat = 27.706195;
  double _lng = 85.318856;

  @override
  void initState() {
    super.initState();
    _cityController.text = "Kathmandu Metropolitan";
    _areaController.text = "Bagbazar";

    // Auto-detect & Pre-fill from AuthProvider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null) {
        setState(() {
          _streetController.text = user['current_location']?.toString() ?? '';
          _phoneController.text = user['phone_number']?.toString() ?? '';
        });
      }
    });
  }

  Future<void> _placeOrder() async {
    final cart = Provider.of<CartProvider>(context, listen: false);
    if (cart.items.isEmpty) return;

    if (_streetController.text.isEmpty || _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please fill all address details."), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isPlacingOrder = true);

    try {
      // Combine address fields for backend parity
      final fullAddress = "${_streetController.text}, ${_areaController.text}, ${_cityController.text}";
      
      final res = await ApiService.post('/orders/place/', {
        'delivery_address': fullAddress,
        'delivery_lat': _lat,
        'delivery_lng': _lng,
        'payment_method': _paymentMethod,
        'contact_phone': _phoneController.text,
        'coupon_code': _appliedCoupon?['code'],
      });

      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final otp = data['delivery_otp'] ?? '000000';
        cart.clearCart();
        
        // World-Class Success Dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('🎉', style: TextStyle(fontSize: 60)),
                const SizedBox(height: 16),
                const Text("ORDER CONFIRMED", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 1)),
                const SizedBox(height: 12),
                const Text("SHARE THIS CODE WITH YOUR RIDER FOR SECURE HANDOVER", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(color: const Color(0xFFFDE8E8), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE62020).withOpacity(0.2))),
                  child: Text(otp.toString(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 32, letterSpacing: 8, color: Color(0xFFE62020))),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MyOrdersScreen()));
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE62020), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                    child: const Text("TRACK MISSION", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                  ),
                )
              ],
            ),
          ),
        );
      } else {
        final data = jsonDecode(res.body);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['detail'] ?? "Order failed")));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
    setState(() => _isPlacingOrder = false);
  }

  Future<void> _validateCoupon() async {
    if (_couponController.text.isEmpty) return;
    
    final cart = Provider.of<CartProvider>(context, listen: false);
    setState(() {
      _isValidatingCoupon = true;
      _couponError = null;
    });

    try {
      final res = await ApiService.post('/coupons/validate/', {
        'code': _couponController.text.toUpperCase(),
        'cart_total': cart.total,
      });

      if (res.statusCode == 200) {
        setState(() {
          _appliedCoupon = jsonDecode(res.body);
          _couponController.clear();
        });
      } else {
        final data = jsonDecode(res.body);
        setState(() => _couponError = data['detail'] ?? "Invalid Coupon");
      }
    } catch (e) {
      setState(() => _couponError = "Validation failed");
    } finally {
      setState(() => _isValidatingCoupon = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.black, size: 24),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text("Checkout Flow", style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Branded Title
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("CHECKOUT", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                Container(height: 4, width: 60, color: const Color(0xFFE62020), margin: const EdgeInsets.only(top: 4)),
              ],
            ),
            const SizedBox(height: 32),

            // Delivery Address Block
            _buildWebStyledSection(
              icon: LucideIcons.mapPin,
              iconBg: const Color(0xFFFFF1F1),
              iconColor: const Color(0xFFE62020),
              title: "DELIVERY ADDRESS",
              subtitle: "AUTO-DETECTED LOCATION",
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildWebLabel("STREET ADDRESS"),
                  _buildWebTextField(_streetController, "e.g. Dhyakuja Galli"),
                  const SizedBox(height: 12),
                  // Auto-Detect Button
                  InkWell(
                    onTap: () {
                      final user = Provider.of<AuthProvider>(context, listen: false).user;
                      if (user != null) {
                        setState(() {
                          _streetController.text = user['current_location']?.toString() ?? 'Bagbazar';
                          _areaController.text = 'Bagbazar';
                          _cityController.text = 'Kathmandu';
                        });
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Location matches your profile! 📍")));
                      }
                    },
                    child: Row(
                      children: const [
                        Icon(LucideIcons.navigation, color: Color(0xFFE62020), size: 14),
                        SizedBox(width: 6),
                        Text("Detect Current Location", style: TextStyle(color: Color(0xFFE62020), fontWeight: FontWeight.w900, fontSize: 11)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildWebLabel("AREA / LOCALITY"), _buildWebTextField(_areaController, "Bagbazar")])),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildWebLabel("CITY"), _buildWebTextField(_cityController, "Kathmandu", onChanged: (v) => setState(() {}))])),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildWebLabel("CONTACT PHONE"),
                  _buildWebTextField(_phoneController, "98XXXXXXXX", isPhone: true),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Payment Options Block
            _buildWebStyledSection(
              icon: LucideIcons.wallet,
              iconBg: const Color(0xFFF0FDF4),
              iconColor: Colors.green,
              title: "PAYMENT OPTIONS",
              subtitle: "SELECT YOUR PREFERENCE",
              child: Column(
                children: [
                  _buildPaymentOption('cod', "Cash on Delivery", LucideIcons.banknote, Colors.grey),
                  const SizedBox(height: 12),
                  _buildPaymentOption('khalti', "Khalti Wallet", LucideIcons.creditCard, Colors.purple),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Coupon Section
            _buildWebStyledSection(
              icon: LucideIcons.ticket,
              iconBg: const Color(0xFFFEFCE8),
              iconColor: Colors.orange,
              title: "PROMO CODE",
              subtitle: "HAVE AN AUTH KEY?",
              child: _appliedCoupon != null 
                ? Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.shade100),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("CODE ${_appliedCoupon!['code']} APPLIED", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                            Text("${_appliedCoupon!['discount_percentage']}% EXTRA DISCOUNT SECURED", style: const TextStyle(color: Colors.green, fontWeight: FontWeight.w900, fontSize: 10)),
                          ],
                        ),
                        TextButton(onPressed: () => setState(() => _appliedCoupon = null), child: const Text("REMOVE", style: TextStyle(color: Colors.red, fontWeight: FontWeight.w900, fontSize: 11))),
                      ],
                    ),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _buildWebTextField(_couponController, "E.G. PARTY20"),
                          ),
                          const SizedBox(width: 12),
                          SizedBox(
                            height: 52,
                            child: ElevatedButton(
                              onPressed: _isValidatingCoupon ? null : _validateCoupon,
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                              child: _isValidatingCoupon ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text("APPLY", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11)),
                            ),
                          ),
                        ],
                      ),
                      if (_couponError != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8, left: 4),
                          child: Text("⚠️ $_couponError", style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w900, fontSize: 10)),
                        ),
                    ],
                  ),
            ),

            const SizedBox(height: 32),

            // Web Summary Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20)],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: const Color(0xFFFFF7ED), shape: BoxShape.circle),
                        child: const Icon(LucideIcons.timer, color: Colors.orange, size: 20),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("IN 10 MINUTES", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black87, fontSize: 15)),
                          Text("SERVING FROM ${_cityController.text.split(' ')[0].toUpperCase()} HUB", style: const TextStyle(color: Color(0xFFE62020), fontSize: 9, fontWeight: FontWeight.w900)),
                        ],
                      )
                    ],
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(height: 1)),
                  
                  // Cart Item List
                  ...cart.items.map((item) {
                    final detail = item['product_detail'] ?? {};
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
                            child: Text("${item['quantity']}x", style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(child: Text(detail['name'] ?? 'Product', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700))),
                          Text("Rs ${double.tryParse(detail['final_price']?.toString() ?? '0')?.toStringAsFixed(0)}", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey)),
                        ],
                      ),
                    );
                  }).toList(),

                  const Divider(height: 32),
                  _buildMiniSummary("CART TOTAL", "RS ${cart.total.toStringAsFixed(0)}"),
                  if (_appliedCoupon != null)
                    _buildMiniSummary("COON DISCOUNT", "- RS ${((cart.total * (_appliedCoupon!['discount_percentage'] / 100))).toStringAsFixed(0)}", isGreen: true),
                  _buildMiniSummary("HANDLING FEE", "RS 10"),
                  _buildMiniSummary("DELIVERY FEE", "RS 40", isRed: true),
                  
                  const SizedBox(height: 24),

                  // Grand Total Block (The dark card)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1E2C),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("GRAND TOTAL", style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
                        Text("NPR ${((cart.total + 50) - (_appliedCoupon != null ? (cart.total * (_appliedCoupon!['discount_percentage'] / 100)) : 0)).toStringAsFixed(0)}", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),
            
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE62020),
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  elevation: 12, shadowColor: const Color(0xFFE62020).withOpacity(0.4)
                ),
                onPressed: _isPlacingOrder ? null : _placeOrder,
                child: _isPlacingOrder 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text("CONFIRM ORDER", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.white, letterSpacing: 1)),
              ),
            ),
            const SizedBox(height: 60),
          ],
        ),
      ),
    );
  }

  Widget _buildWebStyledSection({required IconData icon, required Color iconBg, required Color iconColor, required String title, required String subtitle, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20)],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.black87, fontSize: 16)),
                  Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                ],
              )
            ],
          ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(height: 1)),
          child,
        ],
      ),
    );
  }

  Widget _buildWebLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black38, letterSpacing: 0.5)),
    );
  }

  Widget _buildWebTextField(TextEditingController controller, String hint, {bool isPhone = false, Function(String)? onChanged}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(color: const Color(0xFFF9FAFB), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade100)),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
        decoration: InputDecoration(hintText: hint, border: InputBorder.none, hintStyle: const TextStyle(fontSize: 13, color: Colors.grey)),
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
      ),
    );
  }

  Widget _buildPaymentOption(String value, String label, IconData icon, Color color) {
    bool isSelected = _paymentMethod == value;
    return InkWell(
      onTap: () => setState(() => _paymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF9FAFB) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? const Color(0xFFE62020) : Colors.grey.shade100, width: 2),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? const Color(0xFFE62020) : color, size: 22),
            const SizedBox(width: 16),
            Expanded(child: Text(label, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: isSelected ? const Color(0xFFE62020) : Colors.black87))),
            if (isSelected) const Icon(LucideIcons.checkCircle, color: Color(0xFFE62020), size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniSummary(String label, String value, {bool isRed = false, bool isGreen = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isRed ? const Color(0xFFE62020) : (isGreen ? Colors.green : Colors.black38), letterSpacing: 0.5)),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isRed ? const Color(0xFFE62020) : (isGreen ? Colors.green : Colors.black87))),
        ],
      ),
    );
  }
}
