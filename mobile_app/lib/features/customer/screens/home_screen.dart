import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/screens/login_screen.dart';
import 'cart_screen.dart';
import 'category_screen.dart';
import 'account_screen.dart';
import 'product_details_screen.dart';
import '../providers/cart_provider.dart';
import '../../../core/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _products = [];
  List<dynamic> _categories = [];
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = true;
  String? _userDefinedLocation;

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
    // Fetch cart on entry to keep counters synced
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CartProvider>(context, listen: false).fetchCart();
    });
  }

  Future<void> _fetchInitialData() async {
    try {
      final resProds = await ApiService.get('/products/');
      final resCats = await ApiService.get('/categories/');
      
      if (mounted) {
        if (resProds.statusCode == 200 && resCats.statusCode == 200) {
          final prodData = jsonDecode(resProds.body);
          final catData = jsonDecode(resCats.body);
          setState(() {
            _products = prodData is List ? prodData : (prodData['results'] ?? []) as List;
            _categories = catData is List ? catData : (catData['results'] ?? []) as List;
            _isLoading = false;
          });
        } else {
          // Fail gracefully but show the screen
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      debugPrint("Full Fetch Error: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showLocationPicker() {
    final TextEditingController locController = TextEditingController(text: _userDefinedLocation);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Set Delivery Location", style: TextStyle(fontWeight: FontWeight.w900)),
        content: TextField(
          controller: locController,
          decoration: const InputDecoration(hintText: "Enter area, street, or city...", prefixIcon: Icon(LucideIcons.mapPin, color: Color(0xFFE62020))),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("CANCEL")),
          ElevatedButton(
            onPressed: () { setState(() => _userDefinedLocation = locController.text); Navigator.pop(ctx); },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE62020)),
            child: const Text("SAVE", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        toolbarHeight: 80,
        backgroundColor: Colors.white, elevation: 0,
        centerTitle: false,
        title: Row(
          children: [
            GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountScreen())),
              child: const CircleAvatar(backgroundColor: Color(0xFFFDE8E8), radius: 20, child: Icon(LucideIcons.user, color: Color(0xFFE62020), size: 20)),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(children: [Text("Delivery in ", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)), Text("10 mins", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFFE62020)))]),
                GestureDetector(onTap: _showLocationPicker, child: Row(children: [Text(_userDefinedLocation ?? (auth.user?['current_location'] ?? 'Detecting...'), style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)), const SizedBox(width: 4), const Icon(LucideIcons.chevronDown, size: 12, color: Colors.grey)]))
              ],
            ),
          ],
        ),
        actions: [IconButton(icon: const Icon(LucideIcons.logOut, color: Colors.grey, size: 20), onPressed: () async { await auth.logout(); Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => LoginScreen())); })],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFFE62020)))
        : CustomScrollView(
            slivers: [
              // Search Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200, width: 1.5)),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
                      decoration: const InputDecoration(icon: Icon(LucideIcons.search, color: Colors.grey, size: 20), hintText: "Search groceries & drinks...", border: InputBorder.none),
                    ),
                  ),
                ),
              ),

              // Hero Banners
              SliverToBoxAdapter(
                child: SizedBox(
                   height: 180,
                   child: ListView(
                     scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16),
                     children: [
                       _buildWebHeroBanner(color: const Color(0xFFE62020), badge: '#LETSQUICKCARTO', title: 'You stay home while we haul.', subtitle: '10 MIN • FREE DELIVERY', imagePath: 'images/home banner.webp'),
                       const SizedBox(width: 16),
                       _buildWebHeroBanner(color: const Color(0xFF1E1E2C), badge: 'OFFERS VAULT 🍾', title: 'Happy Hour Deals', subtitle: 'AUTH KEY: PARTY20', isDark: true, imagePath: 'images/offers.jpg'),
                     ],
                   ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 32)),

              // Search Results OR Category Sections
              if (_searchQuery.isNotEmpty)
                _buildSearchResultsSliver()
              else if (_categories.isEmpty && !_isLoading)
                const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(40), child: Text("Marketplace is being updated...", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)))))
              else
                ..._categories.map((cat) => _buildCategorySection(cat, cart)).toList(),
                
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
      bottomNavigationBar: _buildBottomNav(cart),
    );
  }

  Widget _buildCategorySection(dynamic cat, CartProvider cart) {
    final prods = _products.where((p) => p['category'].toString() == cat['id'].toString()).toList();
    if (prods.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
    
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(cat['name'].toString().toUpperCase(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)), Container(height: 3, width: 40, color: const Color(0xFFE62020), margin: const EdgeInsets.only(top: 4))]),
                GestureDetector(onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CategoryScreen(initialCategoryId: cat['id']))), child: const Text("SEE ALL >", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFE62020)))),
              ],
            ),
          ),
          SizedBox(height: 310, child: ListView.builder(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), itemCount: prods.length, itemBuilder: (ctx, i) => _buildProductCard(prods[i], cart))),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSearchResultsSliver() {
    final filtered = _products.where((p) => (p['name'] ?? '').toString().toLowerCase().contains(_searchQuery)).toList();
    return SliverToBoxAdapter(
      child: Column(
        children: [
          Padding(padding: const EdgeInsets.all(16), child: Text("SEARCH RESULTS FOR \"${_searchQuery.toUpperCase()}\"", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey))),
          if (filtered.isEmpty) const Padding(padding: EdgeInsets.all(40), child: Text("No items found.", style: TextStyle(color: Colors.grey)))
          else GridView.builder(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), padding: const EdgeInsets.symmetric(horizontal: 10), gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(maxCrossAxisExtent: 180, childAspectRatio: 0.55, crossAxisSpacing: 8, mainAxisSpacing: 8), itemCount: filtered.length, itemBuilder: (ctx, i) => _buildProductCard(filtered[i], Provider.of<CartProvider>(context, listen: false))),
        ],
      ),
    );
  }

  Widget _buildWebHeroBanner({required Color color, required String title, required String subtitle, required String badge, required String imagePath, bool isDark = false}) {
    return Container(
      width: 400, margin: const EdgeInsets.only(right: 16), padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(24), image: DecorationImage(image: CachedNetworkImageProvider(Uri.encodeFull('${ApiService.mediaUrl}/$imagePath')), fit: BoxFit.cover, colorFilter: ColorFilter.mode(Colors.black.withOpacity(isDark ? 0.4 : 0.2), BlendMode.darken))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)), child: Text(badge, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900))), const Spacer(), Text(title, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, height: 1.1)), const SizedBox(height: 8), Text(subtitle, style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12, fontWeight: FontWeight.w600))]),
    );
  }

  Widget _buildProductCard(dynamic p, CartProvider cart) {
    final cartItem = cart.items.where((i) => i['product'].toString() == p['id'].toString()).toList();
    final inCartQty = cartItem.isNotEmpty ? (int.tryParse(cartItem.first['quantity'].toString()) ?? 0) : 0;

    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailsScreen(product: p))),
      child: Container(
        width: 160, margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.black.withOpacity(0.05)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))]),
        child: Column(
          children: [
            Expanded(
               child: Container(
                 width: double.infinity, decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: const BorderRadius.vertical(top: Radius.circular(20))),
                 child: ClipRRect(borderRadius: const BorderRadius.vertical(top: Radius.circular(20)), child: _buildProductImage(p)),
               ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p['name']?.toString() ?? 'Product', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('रू${p['final_price'] ?? p['price'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFE62020))),
                      if (inCartQty == 0)
                        GestureDetector(
                          onTap: () => cart.addToCart(p['id'], 1),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                            decoration: BoxDecoration(color: const Color(0xFFE62020), borderRadius: BorderRadius.circular(10)),
                            child: const Text('ADD', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11)),
                          ),
                        )
                      else
                        Text('$inCartQty', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFFE62020))),
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductImage(dynamic p) {
    var url = p['image_url']?.toString() ?? '';
    if (url.isEmpty) return const Center(child: Icon(LucideIcons.shoppingBag, color: Colors.black12, size: 40));
    final resolvedUrl = url.startsWith('http') ? url : '${ApiService.mediaUrl}/$url';
    return CachedNetworkImage(imageUrl: Uri.encodeFull(resolvedUrl), fit: BoxFit.contain, errorWidget: (_, __, ___) => const Center(child: Icon(LucideIcons.shoppingBag, color: Colors.black12, size: 40)));
  }

  Widget _buildBottomNav(CartProvider cart) {
    return BottomNavigationBar(
      selectedItemColor: const Color(0xFFE62020), unselectedItemColor: Colors.grey, backgroundColor: Colors.white, elevation: 20, type: BottomNavigationBarType.fixed,
      items: [
        const BottomNavigationBarItem(icon: Icon(LucideIcons.home), label: "Home"),
        const BottomNavigationBarItem(icon: Icon(LucideIcons.layoutGrid), label: "Category"),
        BottomNavigationBarItem(icon: Stack(clipBehavior: Clip.none, children: [const Icon(LucideIcons.shoppingCart), if (cart.items.isNotEmpty) Positioned(right: -8, top: -8, child: Container(padding: const EdgeInsets.all(5), decoration: const BoxDecoration(color: Color(0xFFE62020), shape: BoxShape.circle), child: Text('${cart.items.length}', style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold))))]), label: "Cart"),
      ],
      onTap: (index) {
        if (index == 1) Navigator.push(context, MaterialPageRoute(builder: (_) => const CategoryScreen()));
        if (index == 2) Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
      },
    );
  }
}
