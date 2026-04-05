import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/api_service.dart';
import '../providers/cart_provider.dart';
import 'product_details_screen.dart';
import 'cart_screen.dart';
import 'home_screen.dart';

class CategoryScreen extends StatefulWidget {
  final int? initialCategoryId;
  const CategoryScreen({Key? key, this.initialCategoryId}) : super(key: key);

  @override
  _CategoryScreenState createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  final Map<int, GlobalKey> _sectionKeys = {};
  List<dynamic> _categories = [];
  List<dynamic> _products = [];
  bool _isLoading = true;
  String _error = '';

  // Sub-groups organized by their Parent Categories
  final Map<String, Map<String, List<String>>> _categoryGroups = {
    'Grocery and Kitchen': {
      'Rice': ['rice'],
      'Daal': ['daal', 'dal'],
      'Cooking Oils': ['oil', 'sunflower', 'mustard', 'olive', 'ghee'],
      'Tea & Coffee': ['tea', 'coffee'],
    },
    'Snacks and Drinks': {
      'chips, cheeseballs, rings and sticks': ['chip', 'cheese', 'ring', 'stick', 'kurkure', 'lays', 'puff', 'pringle'],
      'chocolate and sweets': ['choco', 'sweet', 'candy', 'bar', 'kitkat', 'dairy', 'munch', 'snicker', 'perk'],
      'soft drinks, coke and juice': ['coke', 'juice', 'drink', 'pepsi', 'fanta', 'sprite', 'water', 'frooti', 'real', 'beverage', 'soda', 'limca', 'maaza', 'energy drink', 'redbull', 'sting', 'tea', 'coffee', 'milkshake', 'horlicks', 'bournvita', 'coca', 'cola'],
    },
    'Liquors and Smoke': {
      'hard drinks and liquors': ['vodka', 'gin', 'rum', 'whisky', 'beer', 'liquor', '8848', 'durbar', 'blended', 'reserve', 'old durbar'],
      'smoke': ['cigarette', 'smoke', 'esse', 'lighter'],
    },
    'Beauty and Personal care': {
      'Baby care essential and care': ['baby', 'diaper', 'wipe', 'johnson', 'cerelac', 'himalaya baby', 'pampers', 'mamy poko'],
      'hair care and essential': ['hair', 'shampoo', 'conditioner', 'shampoo', 'vatika', 'sunsilk', 'pantene', 'clinic plus', 'dove shampoo', 'dabur', 'amla', 'head', 'shoulders', 'oil'],
      'skin care and essential': ['skin', 'face', 'cream', 'lotion', 'aloe', 'pond', 'fair', 'nivea', 'moisturizer', 'soap', 'dettol', 'lux', 'lifebuoy', 'santoor', 'pears', 'dove', 'wash'],
      'deoderants and perfume': ['deo', 'perfume', 'spray', 'fogg', 'axe', 'park', 'wildstone', 'cologne', 'fragrance', 'body spray', 'england', 'denver', 'fog', 'titan', 'skinn', 'yardley', 'engage', 'spinz', 'nivea deo', 'secret temptation', 'bellavita', 'beardo', 'roll'],
    },
  };

  @override
  void initState() {
    super.initState();
    _fetchData().then((_) {
      if (widget.initialCategoryId != null && mounted) {
        Future.delayed(const Duration(milliseconds: 300), () {
          _scrollToSection(widget.initialCategoryId!);
        });
      }
    });
  }

  void _scrollToSection(int catId) {
    final key = _sectionKeys[catId];
    if (key?.currentContext != null) {
      Scrollable.ensureVisible(
        key!.currentContext!,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _fetchData() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      final results = await Future.wait([
        ApiService.get('/categories/'),
        ApiService.get('/products/'),
      ]).timeout(const Duration(seconds: 10));
      if (results[0].statusCode == 200 && results[1].statusCode == 200) {
        final catsData = jsonDecode(results[0].body);
        final prodsData = jsonDecode(results[1].body);
        final cats = catsData is List ? catsData : (catsData['results'] ?? []) as List;
        final prodList = prodsData is List ? prodsData : (prodsData['results'] ?? []) as List;
        if (mounted) {
          setState(() {
            _categories = cats;
            _products = prodList;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() { _isLoading = false; _error = 'Backend error ${results[0].statusCode}.'; });
      }
    } catch (e) {
      if (mounted) setState(() { _isLoading = false; _error = 'Cannot connect to server.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFFE62020)))
        : Column(
            children: [
              // Top Shadow Area with Back Button Title
              Container(
                padding: const EdgeInsets.only(top: 60, bottom: 20, left: 16, right: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: const Row(
                  children: [
                    Text('CATEGORIES', style: TextStyle(color: Colors.black, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _categories.length,
                  itemBuilder: (ctx, i) => _buildCategorySection(_categories[i]),
                ),
              ),
            ],
          ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 1, // Category is active
        selectedItemColor: const Color(0xFFE62020),
        unselectedItemColor: Colors.grey,
        backgroundColor: Colors.white,
        elevation: 20,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
        items: [
          const BottomNavigationBarItem(icon: Icon(LucideIcons.home), label: "Home"),
          const BottomNavigationBarItem(icon: Icon(LucideIcons.layoutGrid), label: "Category"),
          const BottomNavigationBarItem(icon: Icon(LucideIcons.shoppingCart), label: "Cart"),
        ],
        onTap: (index) {
          if (index == 0) {
            Navigator.pushReplacement(context, PageRouteBuilder(pageBuilder: (_, __, ___) => HomeScreen(), transitionDuration: Duration.zero));
          } else if (index == 2) {
            Navigator.push(context, MaterialPageRoute(builder: (_) => CartScreen()));
          }
        },
      ),
    );
  }

  Widget _buildCategorySection(dynamic cat) {
    final catName = cat['name'] ?? '';
    final catProducts = _products
        .where((p) => p['category'].toString() == cat['id'].toString())
        .toList();

    if (catProducts.isEmpty) return const SizedBox.shrink();

    // Grouping logic: Strict and category-aware
    final Map<String, List<dynamic>> groups = {};
    final subGroups = _categoryGroups[catName] ?? {};

    for (final p in catProducts) {
      final pName = p['name'].toString().toLowerCase();
      // Using regex to ensure we match whole words only (prevents 'tea' matching 'chocolate')
      for (final entry in subGroups.entries) {
        bool matches = false;
        for (final k in entry.value) {
          final regex = RegExp('\\b${k.toLowerCase()}\\b');
          if (regex.hasMatch(pName)) {
            matches = true;
            break;
          }
        }
        
        if (matches) {
          groups.putIfAbsent(entry.key, () => []).add(p);
          break; // Stop after first match so it only appears in ONE sub-group
        }
      }
    }

    final key = _sectionKeys.putIfAbsent(cat['id'], () => GlobalKey());
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 28, bottom: 18),
          child: Text(
            cat['name'] ?? '',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: -0.8),
          ),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, 
            childAspectRatio: 2.2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: groups.length,
          itemBuilder: (ctx, i) {
            final entry = groups.entries.elementAt(i);
            return _buildGroupTile(catName, entry.key, catProducts);
          },
        ),
      ],
    );
  }

  Widget _buildGroupTile(String parentName, String title, List<dynamic> allProducts) {
    return GestureDetector(
      onTap: () => _openProductList(parentName, title, allProducts),
      child: Container(
        alignment: Alignment.center,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Text(
          title.toUpperCase(),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.black87, letterSpacing: 0.5),
        ),
      ),
    );
  }

  void _openProductList(String parentName, String initialGroup, List<dynamic> allProducts) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SubCategoryGridScreen(
          parentTitle: parentName,
          initialTitle: initialGroup,
          allProducts: allProducts,
          subGroups: _categoryGroups[parentName] ?? {},
        ),
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.orange),
            const SizedBox(height: 16),
            const Text('Connection Error', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 8),
            Text(_error, style: const TextStyle(color: Colors.grey, fontSize: 12), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchData,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE62020),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('RETRY', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── New Screen for showing the actual product grid with Sidebar ───
class SubCategoryGridScreen extends StatefulWidget {
  final String parentTitle;
  final String initialTitle;
  final List<dynamic> allProducts;
  final Map<String, List<String>> subGroups;

  const SubCategoryGridScreen({
    Key? key, 
    required this.parentTitle, 
    required this.initialTitle, 
    required this.allProducts,
    required this.subGroups,
  }) : super(key: key);

  @override
  State<SubCategoryGridScreen> createState() => _SubCategoryGridScreenState();
}

class _SubCategoryGridScreenState extends State<SubCategoryGridScreen> {
  late String _selectedGroup;
  List<dynamic> _filteredProducts = [];

  @override
  void initState() {
    super.initState();
    _selectedGroup = widget.initialTitle;
    _filterProducts();
  }

  void _filterProducts() {
    if (_selectedGroup == 'ALL') {
      _filteredProducts = widget.allProducts;
    } else {
      final keywords = widget.subGroups[_selectedGroup] ?? [];
      _filteredProducts = widget.allProducts.where((p) {
        final pName = p['name'].toString().toLowerCase();
        return keywords.any((k) => RegExp('\\b$k\\b').hasMatch(pName));
      }).toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.black, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(widget.parentTitle.toUpperCase(), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 16)),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(LucideIcons.shoppingCart, color: Colors.black, size: 20),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CartScreen())),
              ),
              if (cartProvider.itemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(color: const Color(0xFFE62020), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1)),
                    constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                    child: Text(
                      '${cartProvider.itemCount}',
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
      body: Row(
        children: [
          // Left Side Navigation Sidebar
          Container(
            width: 110,
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              border: Border(right: BorderSide(color: Colors.grey.shade200)),
            ),
            child: ListView(
              children: [
                _buildSidebarItem('ALL'),
                ...widget.subGroups.keys.map((group) => _buildSidebarItem(group)).toList(),
              ],
            ),
          ),
          // Right Side Product Grid
          Expanded(
            child: _filteredProducts.isEmpty 
              ? const Center(child: Text('No products found here.'))
              : GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 220,
                    childAspectRatio: 0.8,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: _filteredProducts.length,
                  itemBuilder: (ctx, i) => _buildProductCard(context, _filteredProducts[i], cartProvider),
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebarItem(String title) {
    final bool isActive = _selectedGroup == title;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedGroup = title;
          _filterProducts();
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: isActive ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isActive ? const Color(0xFFE62020) : Colors.transparent),
          boxShadow: isActive ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)] : null,
        ),
        child: Column(
          children: [
            Icon(
              isActive ? LucideIcons.checkCircle2 : LucideIcons.package, 
              size: 16, 
              color: isActive ? const Color(0xFFE62020) : Colors.grey.shade400
            ),
            const SizedBox(height: 8),
            Text(
              title.toUpperCase(),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 8, 
                fontWeight: FontWeight.w900, 
                color: isActive ? const Color(0xFFE62020) : Colors.grey.shade600,
                letterSpacing: 0.4
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, dynamic p, CartProvider cart) {
    final name = p['name'] ?? '';
    final finalPrice = p['final_price'] ?? p['price'] ?? '0';
    final imageUrl = p['image_url']?.toString() ?? '';
    final resolvedUrl = imageUrl.startsWith('http') ? imageUrl : '${ApiService.mediaUrl}$imageUrl';

    return _HoverProductCard(
      p: p,
      name: name,
      finalPrice: finalPrice,
      imageUrl: imageUrl,
      resolvedUrl: resolvedUrl,
      cart: cart,
    );
  }
}

class _HoverProductCard extends StatefulWidget {
  final dynamic p;
  final String name;
  final dynamic finalPrice;
  final String imageUrl;
  final String resolvedUrl;
  final CartProvider cart;

  const _HoverProductCard({
    required this.p, 
    required this.name, 
    required this.finalPrice, 
    required this.imageUrl, 
    required this.resolvedUrl,
    required this.cart,
  });

  @override
  State<_HoverProductCard> createState() => _HoverProductCardState();
}

class _HoverProductCardState extends State<_HoverProductCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        transform: _isHovered ? (Matrix4.identity()..scale(1.03)) : Matrix4.identity(),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _isHovered ? const Color(0xFFE62020).withOpacity(0.2) : Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(_isHovered ? 0.08 : 0.04), 
              blurRadius: _isHovered ? 20 : 10, 
              offset: Offset(0, _isHovered ? 8 : 4),
            )
          ],
        ),
        child: GestureDetector(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailsScreen(product: widget.p))),
          child: Column(
            children: [
              // Top Section: Image and Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Bigger Image Section
                    Padding(
                      padding: const EdgeInsets.all(10.0),
                      child: Container(
                        height: 100,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: widget.imageUrl.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: Uri.encodeFull(widget.resolvedUrl), 
                                    fit: BoxFit.contain,
                                    placeholder: (_, __) => const Center(child: SizedBox(width: 15, height: 15, child: CircularProgressIndicator(strokeWidth: 2))),
                                  )
                                : const Icon(LucideIcons.package, size: 30, color: Colors.grey),
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 10 Mins Badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.bolt, color: Colors.orange, size: 10),
                                SizedBox(width: 2),
                                Text('10 MINS', style: TextStyle(color: Colors.orange, fontSize: 8, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            widget.name, 
                            maxLines: 2, 
                            overflow: TextOverflow.ellipsis, 
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: Colors.black87),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Bottom Section: Price and Button (Pushed to bottom)
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'रू${widget.finalPrice}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.black),
                    ),
                    GestureDetector(
                      onTap: () {
                        widget.cart.addToCart(widget.p['id'], 1);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text('${widget.name} added!'), 
                          backgroundColor: const Color(0xFFE62020),
                          behavior: SnackBarBehavior.floating,
                          duration: const Duration(seconds: 1),
                        ));
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE62020),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'ADD',
                          style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
