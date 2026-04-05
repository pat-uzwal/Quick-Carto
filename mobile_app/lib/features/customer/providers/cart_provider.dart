import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/api_service.dart';

class CartProvider with ChangeNotifier {
  List<dynamic> _items = [];
  double _total = 0.0;
  bool _isLoading = false;

  List<dynamic> get items => _items;
  double get total => _total;
  bool get isLoading => _isLoading;
  
  // Safe parsing for itemCount to prevent blank screen crashes on null data
  int get itemCount {
    try {
      return _items.fold(0, (sum, item) {
        final qty = item['quantity'];
        if (qty == null) return sum;
        if (qty is int) return sum + qty;
        return sum + (int.tryParse(qty.toString()) ?? 0);
      });
    } catch (e) {
      debugPrint("ItemCount Calc Error: $e");
      return 0;
    }
  }

  Future<void> fetchCart() async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/cart/');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _items = data['items'] ?? [];
        _total = double.tryParse(data['total']?.toString() ?? '0.0') ?? 0.0;
      }
    } catch (e) {
      debugPrint("Cart Fetch Error: $e");
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> addToCart(int productId, int quantity) async {
    try {
      await ApiService.post('/cart/items/', {
        'product': productId,
        'quantity': quantity
      });
      await fetchCart();
    } catch (e) {
      debugPrint("Add to Cart Error: $e");
    }
  }

  Future<void> updateQuantity(int productId, int quantity) async {
    try {
      if (quantity < 1) {
        await removeItem(productId);
        return;
      }
      await ApiService.post('/cart/items/', {
        'product': productId,
        'quantity': quantity
      });
      await fetchCart();
    } catch (e) {
      debugPrint("Update Quantity Error: $e");
    }
  }

  Future<void> removeItem(int productId) async {
    try {
      await ApiService.delete('/cart/items/$productId/');
      await fetchCart();
    } catch (e) {
      debugPrint("Remove Item Error: $e");
    }
  }

  Future<void> clearCart() async {
    try {
      await ApiService.post('/cart/clear/', {});
      _items = [];
      _total = 0.0;
      notifyListeners();
    } catch (e) {
      debugPrint("Clear Cart Error: $e");
    }
  }
}
