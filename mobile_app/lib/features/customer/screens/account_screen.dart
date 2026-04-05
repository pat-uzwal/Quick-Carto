import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/screens/login_screen.dart';
import 'my_orders_screen.dart';
import '../../../core/api_service.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({Key? key}) : super(key: key);

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  int _activeTab = 0; // 0=Profile, 1=Orders, 2=Address, 3=Wishlist, 4=Settings

  // Profile edit state
  bool _isEditing = false;
  bool _isSaving = false;
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  // Settings state
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  bool _orderUpdates = true;
  bool _promotions = false;

  // Address state
  List<dynamic> _addresses = [];
  bool _loadingAddresses = false;

  // Wishlist state
  List<dynamic> _wishlist = [];
  bool _loadingWishlist = false;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    _nameCtrl.text = user?['full_name'] ?? '';
    _phoneCtrl.text = user?['phone_number'] ?? '';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchAddresses() async {
    setState(() => _loadingAddresses = true);
    try {
      final res = await ApiService.get('/addresses/');
      if (res.statusCode == 200 && mounted) {
        final data = jsonDecode(res.body);
        setState(() => _addresses = data is List ? data : (data['results'] ?? []));
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingAddresses = false);
  }

  Future<void> _fetchWishlist() async {
    setState(() => _loadingWishlist = true);
    try {
      final res = await ApiService.get('/wishlist/');
      if (res.statusCode == 200 && mounted) {
        final data = jsonDecode(res.body);
        setState(() => _wishlist = data is List ? data : (data['results'] ?? []));
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingWishlist = false);
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    try {
      final res = await ApiService.patch('/users/me/', {
        'full_name': _nameCtrl.text,
        'phone_number': _phoneCtrl.text,
      });
      if (mounted) {
        if (res.statusCode == 200) {
          setState(() => _isEditing = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated!'), backgroundColor: Colors.green),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not save — check your connection.'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (_) {
      if (mounted) setState(() => _isEditing = false);
    }
    if (mounted) setState(() => _isSaving = false);
  }

  void _switchTab(int tab) {
    setState(() => _activeTab = tab);
    if (tab == 2 && _addresses.isEmpty) _fetchAddresses();
    if (tab == 3 && _wishlist.isEmpty) _fetchWishlist();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user ?? {};
    final name = user['full_name']?.isNotEmpty == true ? user['full_name'] : (user['username'] ?? 'User');
    final email = user['email'] ?? '';

    final tabs = [
      {'label': 'Profile', 'icon': LucideIcons.user},
      {'label': 'Orders', 'icon': LucideIcons.shoppingBag},
      {'label': 'Address', 'icon': LucideIcons.mapPin},
      {'label': 'Wishlist', 'icon': LucideIcons.heart},
      {'label': 'Settings', 'icon': LucideIcons.settings},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.black, size: 28),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('My Account', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black, fontSize: 18)),
        actions: [
          TextButton.icon(
            onPressed: () async {
              await auth.logout();
              if (mounted) {
                Navigator.pushAndRemoveUntil(context,
                    MaterialPageRoute(builder: (_) => LoginScreen()), (r) => false);
              }
            },
            icon: const Icon(LucideIcons.logOut, color: Color(0xFFE62020), size: 16),
            label: const Text('Sign Out', style: TextStyle(color: Color(0xFFE62020), fontWeight: FontWeight.w900, fontSize: 12)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // ─── User header ───────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Row(
              children: [
                Container(
                  width: 60, height: 60,
                  decoration: const BoxDecoration(color: Color(0xFFE62020), shape: BoxShape.circle),
                  child: const Icon(LucideIcons.user, color: Colors.white, size: 32),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.black)),
                    const SizedBox(height: 2),
                    Text(email, style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
            ),
          ),
          // ─── Tab bar ───────────────────────────────────────
          Container(
            color: Colors.white,
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: tabs.length,
              itemBuilder: (_, i) {
                final selected = _activeTab == i;
                return GestureDetector(
                  onTap: () => _switchTab(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: selected ? const Color(0xFFE62020) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Icon(tabs[i]['icon'] as IconData, size: 14,
                            color: selected ? Colors.white : Colors.grey),
                        const SizedBox(width: 6),
                        Text(tabs[i]['label'] as String,
                            style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 12,
                                color: selected ? Colors.white : Colors.grey.shade700)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Container(height: 1, color: Colors.grey.shade100),
          // ─── Content ───────────────────────────────────────
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildTabContent(user),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(Map user) {
    switch (_activeTab) {
      case 0: return _buildProfileTab(user);
      case 1: return _buildOrdersTab();
      case 2: return _buildAddressTab();
      case 3: return _buildWishlistTab();
      case 4: return _buildSettingsTab();
      default: return const SizedBox();
    }
  }

  // ══════════════════════════════════════════════════════
  // PROFILE TAB
  // ══════════════════════════════════════════════════════
  Widget _buildProfileTab(Map user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionCard(
          title: 'Profile Details',
          child: Column(
            children: [
              _buildField('Full Name', _isEditing
                  ? TextField(controller: _nameCtrl, decoration: _inputDeco('Your full name'), style: const TextStyle(fontWeight: FontWeight.bold))
                  : _fieldValue(user['full_name'] ?? 'Not set')),
              const SizedBox(height: 16),
              _buildField('Email Address', Row(
                children: [
                  Expanded(child: _fieldValue(user['email'] ?? '')),
                  const Icon(LucideIcons.checkCircle, color: Colors.green, size: 16),
                ],
              )),
              const SizedBox(height: 16),
              _buildField('Phone Number', _isEditing
                  ? TextField(controller: _phoneCtrl, decoration: _inputDeco('+977 98XXXXXXXX'), keyboardType: TextInputType.phone, style: const TextStyle(fontWeight: FontWeight.bold))
                  : _fieldValue(user['phone_number'] ?? 'Not set')),
              const SizedBox(height: 16),
              _buildField('Account Role', _fieldValue(user['role'] == 'customer' ? 'Customer' : (user['role'] ?? 'Customer'))),
              const SizedBox(height: 24),
              Row(
                children: [
                  if (_isEditing) ...[
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isSaving ? null : _saveProfile,
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE62020), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(vertical: 14)),
                        child: _isSaving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('SAVE CHANGES', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton(
                      onPressed: () => setState(() => _isEditing = false),
                      style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20)),
                      child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ] else
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => setState(() => _isEditing = true),
                        icon: const Icon(LucideIcons.pencil, size: 14, color: Colors.white),
                        label: const Text('EDIT DETAILS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(vertical: 14)),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _sectionCard(
          title: 'Quick Actions',
          child: Column(
            children: [
              _quickAction(LucideIcons.shoppingBag, 'My Orders', 'View all your past orders', () => _switchTab(1)),
              _quickAction(LucideIcons.heart, 'Wishlist', 'Products saved for later', () => _switchTab(3)),
              _quickAction(LucideIcons.mapPin, 'Saved Addresses', 'Manage delivery addresses', () => _switchTab(2)),
              _quickAction(LucideIcons.messageCircle, 'Customer Support', 'Reach us anytime, 24/7', _openSupport),
              _quickAction(LucideIcons.lightbulb, 'Suggest a Product', 'Tell us what you\'d like to see', _openSuggest),
            ],
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════
  // ORDERS TAB
  // ══════════════════════════════════════════════════════
  Widget _buildOrdersTab() {
    return ElevatedButton.icon(
      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyOrdersScreen())),
      icon: const Icon(LucideIcons.shoppingBag, color: Colors.white),
      label: const Text('VIEW ALL ORDERS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE62020), minimumSize: const Size(double.infinity, 54), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
    );
  }

  // ══════════════════════════════════════════════════════
  // ADDRESS TAB
  // ══════════════════════════════════════════════════════
  Widget _buildAddressTab() {
    if (_loadingAddresses) return const Center(child: CircularProgressIndicator(color: Color(0xFFE62020)));

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Delivery Addresses', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            TextButton.icon(
              onPressed: _showAddAddressDialog,
              icon: const Icon(LucideIcons.plus, size: 14, color: Color(0xFFE62020)),
              label: const Text('Add New', style: TextStyle(color: Color(0xFFE62020), fontWeight: FontWeight.w900)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_addresses.isEmpty)
          _emptyState(LucideIcons.mapPin, 'No addresses saved',
              'Add a delivery address to checkout faster.')
        else
          ...(_addresses.map((addr) => _addressCard(addr))),
      ],
    );
  }

  Widget _addressCard(dynamic addr) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: addr['is_default'] == true ? const Color(0xFFE62020) : Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(LucideIcons.mapPin, color: Color(0xFFE62020), size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(addr['street'] ?? addr['address'] ?? 'Address', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                if (addr['city'] != null)
                  Text('${addr['city']}, ${addr['state'] ?? ''} ${addr['zip_code'] ?? ''}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
          if (addr['is_default'] == true)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
              child: const Text('DEFAULT', style: TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.w900)),
            ),
        ],
      ),
    );
  }

  void _showAddAddressDialog() {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Add Address', style: TextStyle(fontWeight: FontWeight.w900)),
        content: TextField(
          controller: ctrl,
          maxLines: 2,
          decoration: _inputDeco('e.g. Bagbazar, Kathmandu'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (ctrl.text.length < 5) return;
              Navigator.pop(context);
              try {
                await ApiService.post('/addresses/', {'street': ctrl.text, 'city': 'Kathmandu'});
                _fetchAddresses();
              } catch (_) {}
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE62020), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: const Text('SAVE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════
  // WISHLIST TAB
  // ══════════════════════════════════════════════════════
  Widget _buildWishlistTab() {
    if (_loadingWishlist) return const Center(child: CircularProgressIndicator(color: Color(0xFFE62020)));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('My Wishlist', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        const SizedBox(height: 16),
        if (_wishlist.isEmpty)
          _emptyState(LucideIcons.heart, 'Your wishlist is empty',
              'Save products for later by tapping the heart icon.')
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2, childAspectRatio: 0.8, crossAxisSpacing: 12, mainAxisSpacing: 12,
            ),
            itemCount: _wishlist.length,
            itemBuilder: (_, i) {
              final item = _wishlist[i];
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Center(child: Text('📦', style: TextStyle(fontSize: 40))),
                    const SizedBox(height: 8),
                    Text(item['product_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                    const Spacer(),
                    Text('रू${item['price'] ?? ''}', style: const TextStyle(color: Color(0xFFE62020), fontWeight: FontWeight.w900, fontSize: 14)),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════
  // SETTINGS TAB
  // ══════════════════════════════════════════════════════
  Widget _buildSettingsTab() {
    return Column(
      children: [
        _sectionCard(
          title: 'Notifications',
          child: Column(
            children: [
              _toggleRow('Email Notifications', 'Order updates & offers via email', _emailNotifications,
                  (v) => setState(() => _emailNotifications = v)),
              _toggleRow('Push Notifications', 'App alerts for orders & promos', _pushNotifications,
                  (v) => setState(() => _pushNotifications = v)),
              _toggleRow('Order Updates', 'Track your orders in real-time', _orderUpdates,
                  (v) => setState(() => _orderUpdates = v)),
              _toggleRow('Promotions & Offers', 'Exclusive deals and flash sales', _promotions,
                  (v) => setState(() => _promotions = v)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _sectionCard(
          title: 'Support & More',
          child: Column(
            children: [
              _quickAction(LucideIcons.messageCircle, 'Customer Support', '24/7 help & FAQ', _openSupport),
              _quickAction(LucideIcons.lightbulb, 'Suggest a Product', 'Request a new product', _openSuggest),
              _quickAction(LucideIcons.link, 'Link Device', 'Manage linked devices', _openLinkDevice),
              _quickAction(LucideIcons.shieldCheck, 'Privacy Policy', 'How we handle your data', _openPrivacy),
              _quickAction(LucideIcons.fileText, 'Terms of Service', 'Our terms and conditions', _openTerms),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _sectionCard(
          title: 'Danger Zone',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final auth = Provider.of<AuthProvider>(context, listen: false);
                    await auth.logout();
                    if (mounted) {
                      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => LoginScreen()), (r) => false);
                    }
                  },
                  icon: const Icon(LucideIcons.logOut, color: Color(0xFFE62020), size: 16),
                  label: const Text('Sign Out', style: TextStyle(color: Color(0xFFE62020), fontWeight: FontWeight.w900)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFE62020)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Support actions ─────────────────────────────────────
  void _openSupport() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Customer Support', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
            const SizedBox(height: 6),
            const Text('We\'re here to help 24/7.', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            _supportOption('📞', 'Call Us', '+977-1-XXXXXXX'),
            _supportOption('📧', 'Email Us', 'support@quickcarto.com'),
            _supportOption('💬', 'Live Chat', 'Start a chat session'),
            _supportOption('❓', 'FAQ', 'Browse frequently asked questions'),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _supportOption(String emoji, String title, String subtitle) {
    return ListTile(
      leading: Text(emoji, style: const TextStyle(fontSize: 24)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      trailing: const Icon(LucideIcons.chevronRight, size: 16, color: Colors.grey),
      onTap: () {},
    );
  }

  void _openSuggest() {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Suggest a Product', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
            const SizedBox(height: 6),
            const Text('Tell us what you\'d like to order from QuickCarto.', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 20),
            TextField(
              controller: ctrl,
              maxLines: 3,
              decoration: _inputDeco('e.g. Organic Honey 500g by XYZ Brand...'),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Thanks for your suggestion! 🙏'), backgroundColor: Colors.green),
                  );
                },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE62020), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(vertical: 14)),
                child: const Text('SUBMIT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openLinkDevice() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(children: [Icon(LucideIcons.smartphone, size: 20), SizedBox(width: 8), Text('Linked Devices', style: TextStyle(fontWeight: FontWeight.w900))]),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('This device is currently linked to your account.', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(LucideIcons.smartphone, color: Color(0xFFE62020), size: 20),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('This Device', style: TextStyle(fontWeight: FontWeight.w800)),
                      Text('Currently active', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }

  void _openPrivacy() => _openInfoSheet('Privacy Policy',
      'QuickCarto collects minimal data to operate the service. We never sell your data. All information is encrypted and stored securely on our servers in Nepal.');

  void _openTerms() => _openInfoSheet('Terms of Service',
      'By using QuickCarto, you agree to our terms. Orders are fulfilled from local warehouses. Delivery times may vary. All prices are in NPR. Returns are accepted within 24 hours of delivery.');

  void _openInfoSheet(String title, String body) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
            const SizedBox(height: 16),
            Text(body, style: const TextStyle(color: Colors.black87, fontSize: 14, height: 1.6)),
            const SizedBox(height: 24),
            SizedBox(width: double.infinity, child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('Close', style: TextStyle(color: Colors.white)),
            )),
          ],
        ),
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────
  Widget _sectionCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.black)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildField(String label, Widget value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
        const SizedBox(height: 6),
        value,
      ],
    );
  }

  Widget _fieldValue(String text) => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade100)),
    child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
  );

  InputDecoration _inputDeco(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: Colors.grey),
    filled: true,
    fillColor: Colors.grey.shade50,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE62020))),
    contentPadding: const EdgeInsets.all(14),
  );

  Widget _quickAction(IconData icon, String title, String sub, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: const Color(0xFFFDE8E8), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: const Color(0xFFE62020), size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  Text(sub, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, color: Colors.grey, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _toggleRow(String title, String sub, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                Text(sub, style: const TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          ),
          Switch(value: value, onChanged: onChanged, activeColor: const Color(0xFFE62020)),
        ],
      ),
    );
  }

  Widget _emptyState(IconData icon, String title, String sub) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200, style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.black87)),
          const SizedBox(height: 4),
          Text(sub, style: const TextStyle(color: Colors.grey, fontSize: 12), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
