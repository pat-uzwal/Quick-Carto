import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:image_picker/image_picker.dart';
import 'package:vibration/vibration.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/screens/login_screen.dart';
import '../../../core/api_service.dart';
import '../../customer/screens/chat_screen.dart';

class RiderDashboard extends StatefulWidget {
  const RiderDashboard({Key? key}) : super(key: key);

  @override
  _RiderDashboardState createState() => _RiderDashboardState();
}

class _RiderDashboardState extends State<RiderDashboard> with TickerProviderStateMixin {
  bool _isOnline = false;
  List<dynamic> _activeOrders = [];
  List<dynamic> _completedOrders = [];
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  Map<String, dynamic> _stats = {};
  String _currentAddress = "Kathmandu Hub";
  int _selectedIndex = 0;
  
  static const Color accentRed = Color(0xFFE62020);
  static const Color darkCard = Color(0xFF0F172A); // Deeper, more modern midnight blue
  static const Color successGreen = Color(0xFF10B981);
  static const Color surfaceCloud = Color(0xFFF1F5F9); // Slightly cooler gray-blue background
  static const Color luxuryGold = Color(0xFFF59E0B);
  
  late AnimationController _pulseController;
  final ImagePicker _picker = ImagePicker();
  
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  
  XFile? _avatarImage;
  XFile? _bluebookImage;
  XFile? _licenseImage;
  XFile? _vehicleImage;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))..repeat(reverse: true);
    _fetchRiderData();
    _determinePosition();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (mounted) {
        setState(() {
          _nameController.text = auth.user?['full_name'] ?? '';
          _phoneController.text = auth.user?['phone_number'] ?? '';
        });
      }
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  List<dynamic> _parseList(dynamic data) {
    if (data is Map && data.containsKey('results')) return data['results'] as List<dynamic>;
    if (data is List) return data as List<dynamic>;
    return [];
  }

  Future<void> _fetchRiderData() async {
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      
      final responses = await Future.wait([
        ApiService.get('/delivery/stats/', isFleet: true),
        ApiService.get('/delivery/orders/', isFleet: true),
        ApiService.get('/delivery/orders/completed/', isFleet: true),
        ApiService.get('/delivery/notifications/', isFleet: true),
      ]);
      
      await auth.fetchCurrentUser();
      
      if (mounted) {
        if (responses.every((res) => res.statusCode == 200)) {
          final newNotifs = _parseList(jsonDecode(responses[3].body));
          if (newNotifs.length > _notifications.length && !kIsWeb) Vibration.vibrate(duration: 800);
          
          setState(() {
            _stats = jsonDecode(responses[0].body);
            _activeOrders = _parseList(jsonDecode(responses[1].body));
            _completedOrders = _parseList(jsonDecode(responses[2].body));
            _notifications = newNotifs;
            _isOnline = _stats['is_online'] ?? false;
          });
        }
        setState(() => _isLoading = false);
      }
    } catch (e) { if (mounted) setState(() => _isLoading = false); }
  }

  Future<void> _determinePosition() async { }

  Future<void> _updateStatus(int orderId, String status) async {
    try {
      final res = await ApiService.post('/delivery/orders/$orderId/update-status/', {'status': status}, isFleet: true);
      if (res.statusCode == 200) { _fetchRiderData(); }
      else {
        final data = jsonDecode(res.body);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['detail'] ?? "SYNC ERROR"), backgroundColor: accentRed));
      }
    } catch (e) { debugPrint("Status err: $e"); }
  }

  Future<void> _showOtpDialog(int orderId) async {
    final TextEditingController otpController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(45)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 20),
            Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: accentRed.withOpacity(0.04), shape: BoxShape.circle), child: const Text("🚀", style: TextStyle(fontSize: 50))),
            const SizedBox(height: 24),
            const Text("VERIFY DELIVERY", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: 0.5)),
            const SizedBox(height: 8),
            const Text("ENTER THE 6-DIGIT CUSTOMER KEY", style: TextStyle(color: Colors.black26, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
            const SizedBox(height: 48),
            TextField(
              controller: otpController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              autofocus: true,
              style: const TextStyle(letterSpacing: 25, fontSize: 36, fontWeight: FontWeight.w900, color: accentRed),
              decoration: InputDecoration(
                filled: true, 
                fillColor: surfaceCloud, 
                contentPadding: const EdgeInsets.all(32),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(25), borderSide: BorderSide.none),
                hintText: "000000",
                hintStyle: TextStyle(color: Colors.black.withOpacity(0.05), letterSpacing: 25)
              ),
              onChanged: (v) { if (v.length == 6) { /* auto-next logic if needed */ }},
            ),
            const SizedBox(height: 48),
            StatefulBuilder(builder: (ctx, setDialogState) {
              bool isVerifying = false;
              return SizedBox(
                width: double.infinity,
                height: 75,
                child: ElevatedButton(
                  onPressed: isVerifying ? null : () async {
                    final cleanOtp = otpController.text.trim();
                    if (cleanOtp.length != 6) return;
                    setDialogState(() => isVerifying = true);
                    try {
                      final res = await ApiService.post('/delivery/orders/$orderId/verify-otp/', {'otp': cleanOtp}, isFleet: true);
                      if (res.statusCode == 200) {
                        Navigator.pop(ctx);
                        _fetchRiderData();
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("MISSION SUCCESS! REWARD SECURED 🏆"), backgroundColor: successGreen));
                      } else {
                        final data = jsonDecode(res.body);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['detail'] ?? "INVALID CODE"), backgroundColor: accentRed));
                      }
                    } catch (fmt) { /* Silent fail fallback */ } 
                    finally { if (mounted) setDialogState(() => isVerifying = false); }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: successGreen, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)), elevation: 15, shadowColor: successGreen.withOpacity(0.4)),
                  child: isVerifying 
                    ? const CircularProgressIndicator(color: Colors.white) 
                    : const Text("FINALIZE MISSION", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 2)),
                ),
              );
            }),
            const SizedBox(height: 24),
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("CANCEL", style: TextStyle(color: Colors.black26, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1))),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _stats.isEmpty) {
      return const Scaffold(backgroundColor: surfaceCloud, body: Center(child: CircularProgressIndicator(color: accentRed)));
    }
    
    return Scaffold(
      backgroundColor: surfaceCloud,
      body: Stack(children: [
        _buildTabBody(),
        if (_isLoading) Positioned(top: 0, left: 0, right: 0, child: LinearProgressIndicator(color: accentRed, backgroundColor: accentRed.withOpacity(0.1), minHeight: 2)),
      ]),
      bottomNavigationBar: _buildEliteNav(),
    );
  }

  Widget _buildTabBody() {
    return IndexedStack(index: _selectedIndex, children: [_buildHomeView(), _buildOrdersView(), _buildEarningsView(), _buildProfileView()]);
  }

  Widget _buildHomeView() {
    return RefreshIndicator(
      onRefresh: _fetchRiderData,
      color: accentRed,
      child: Stack(children: [
        // Subtle background decoration
        Positioned(top: -100, right: -100, child: Container(width: 300, height: 300, decoration: BoxDecoration(color: accentRed.withOpacity(0.04), shape: BoxShape.circle))),
        Positioned(top: 400, left: -150, child: Container(width: 400, height: 400, decoration: BoxDecoration(color: Colors.blue.withOpacity(0.03), shape: BoxShape.circle))),
        
        ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          children: [
            const SizedBox(height: 60),
            _buildEliteHeader(),
            const SizedBox(height: 48),
            if (_activeOrders.isNotEmpty) ..._activeOrders.map((o) => _buildGlossyMissionCard(o)).toList(),
            if (_notifications.isNotEmpty) ..._notifications.map((n) => _buildEliteOfferCard(n)).toList(),
            if (_activeOrders.isEmpty && _notifications.isEmpty) _buildGlossyEmptyState(),
            const SizedBox(height: 48),
            _buildEliteStatsGrid(),
            const SizedBox(height: 100),
          ],
        ),
      ]),
    );
  }

  Widget _buildEliteHeader() {
    return Row(
      children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          GestureDetector(onTap: _toggleOnline, child: AnimatedContainer(duration: const Duration(milliseconds: 300), padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), decoration: BoxDecoration(color: _isOnline ? successGreen : darkCard, borderRadius: BorderRadius.circular(30), boxShadow: [BoxShadow(color: (_isOnline ? successGreen : Colors.black).withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 5))]), child: Row(children: [Icon(_isOnline ? LucideIcons.zap : LucideIcons.power, color: Colors.white, size: 14), const SizedBox(width: 8), Text(_isOnline ? "OPERATIONAL" : "STANDBY", style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5))]))),
          const SizedBox(height: 20),
          Row(children: [const Icon(LucideIcons.mapPin, color: accentRed, size: 14), const SizedBox(width: 8), Text(_currentAddress.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.5, color: Colors.black38))])
        ]),
        const Spacer(),
        GestureDetector(
          onTap: () => setState(() => _selectedIndex = 3),
          child: Container(
            width: 58, 
            height: 58, 
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white, 
              borderRadius: BorderRadius.circular(22), 
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 25, offset: const Offset(0, 10))]
            ), 
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Consumer<AuthProvider>(
                builder: (ctx, auth, child) {
                  final user = auth.user;
                  if (user?['profile_photo'] != null) {
                    final url = user!['profile_photo'].toString().startsWith('http') 
                        ? user['profile_photo'] 
                        : '${ApiService.mediaUrl}${user['profile_photo']}';
                    return Image.network(url, fit: BoxFit.cover);
                  }
                  return const Center(child: Icon(LucideIcons.user, color: accentRed, size: 28));
                },
              ),
            ),
          ),
        )
      ],
    );
  }

  Widget _buildGlossyMissionCard(dynamic o) {
    final s = o['status'] ?? 'accepted_by_rider';
    String btnText = "NEXT STEP";
    Color btnColor = accentRed;
    VoidCallback? onAction;

    if (s == 'accepted_by_rider') { btnText = "ARRIVE AT HUB"; onAction = () => _updateStatus(o['id'], 'reached_warehouse'); }
    else if (s == 'reached_warehouse') { btnText = "PICK UP ORDER"; onAction = () => _updateStatus(o['id'], 'picked_up'); }
    else if (s == 'picked_up') { btnText = "START DELIVERY"; onAction = () => _updateStatus(o['id'], 'out_for_delivery'); }
    else if (s == 'out_for_delivery') { btnText = "MARK DELIVERED"; btnColor = successGreen; onAction = () => _showOtpDialog(o['id']); }

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(35), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 40, offset: const Offset(0, 20))]),
      child: Column(children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: accentRed.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: const Text("ACTIVE MISSION", style: TextStyle(color: accentRed, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1))),
          Text("ORD #${o['id']}", style: const TextStyle(color: Colors.black26, fontWeight: FontWeight.w900, fontSize: 10)),
        ]),
        const SizedBox(height: 32),
        ListTile(contentPadding: EdgeInsets.zero, leading: Container(width: 50, height: 50, decoration: BoxDecoration(color: surfaceCloud, borderRadius: BorderRadius.circular(15)), child: const Icon(LucideIcons.home, color: Colors.blue, size: 20)), title: Text(o['warehouse_name'] ?? 'KATHMANDU HUB', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)), subtitle: Text(o['delivery_address'] ?? 'Customer Residence', style: const TextStyle(fontSize: 12, color: Colors.black38))),
        const SizedBox(height: 40),
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 65, 
                child: ElevatedButton(
                  onPressed: onAction, 
                  style: ElevatedButton.styleFrom(backgroundColor: btnColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)), elevation: 15, shadowColor: btnColor.withOpacity(0.4)), 
                  child: Text(btnText, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2))
                )
              ),
            ),
            const SizedBox(width: 12),
            Container(
              height: 65, 
              width: 65,
              decoration: BoxDecoration(color: darkCard, borderRadius: BorderRadius.circular(22), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)]),
              child: IconButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(orderId: o['id'], title: "CHAT WITH CUSTOMER"))),
                icon: const Icon(LucideIcons.messageSquare, color: Colors.white, size: 24)
              ),
            )
          ],
        ),
      ]),
    );
  }

  Widget _buildEliteOfferCard(dynamic n) {
     return ScaleTransition(
       scale: Tween(begin: 0.95, end: 1.05).animate(_pulseController),
       child: Container(
         margin: const EdgeInsets.only(bottom: 24),
         padding: const EdgeInsets.all(32),
         decoration: BoxDecoration(color: darkCard, borderRadius: BorderRadius.circular(40), boxShadow: [BoxShadow(color: accentRed.withOpacity(0.3), blurRadius: 40, offset: const Offset(0, 20))]),
         child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text("NEW PING AVAILABLE", style: TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 2)), const SizedBox(height: 12), Text(n['warehouse_name'] ?? 'KATHMANDU HUB', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20))]),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [const Text("REWARD", style: TextStyle(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.w900)), Text("रू ${n['total_amount']}", style: const TextStyle(color: successGreen, fontWeight: FontWeight.w900, fontSize: 22))]),
            ]),
            const SizedBox(height: 40),
            Row(children: [
              Expanded(child: SizedBox(height: 65, child: ElevatedButton(onPressed: () => _acceptJob(n['order_id']), style: ElevatedButton.styleFrom(backgroundColor: accentRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22))), child: const Text("ACCEPT MISSION", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2))))),
              const SizedBox(width: 12),
              OutlinedButton(onPressed: () => _rejectJob(n['order_id']), style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white24), padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))), child: const Text("REJECT", style: TextStyle(color: Colors.white38, fontWeight: FontWeight.bold, fontSize: 10))),
            ]),
         ]),
       ),
     );
  }

  Widget _buildGlossyEmptyState() {
     return Container(
       padding: const EdgeInsets.symmetric(vertical: 80), 
       child: Column(children: [
         Container(
           padding: const EdgeInsets.all(32),
           decoration: BoxDecoration(color: accentRed.withOpacity(0.05), shape: BoxShape.circle),
           child: const Icon(LucideIcons.package2, size: 60, color: accentRed)
         ), 
         const SizedBox(height: 24), 
         const Text("RELAX & WAIT", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 1)), 
         const Text("No active missions currently assigned. Stand by.", style: TextStyle(color: Colors.black26, fontSize: 13, fontWeight: FontWeight.bold))
       ])
     );
  }

  Widget _buildEliteStatsGrid() {
     return Row(children: [
        _buildEliteStatTile("EFFICIENCY", "${_stats['shift_success'] ?? 0}%", successGreen, isDark: false),
        const SizedBox(width: 12),
        _buildEliteStatTile("MISSIONS", "${_stats['total_delivered'] ?? 0}", Colors.white, isDark: true),
        const SizedBox(width: 12),
        _buildEliteStatTile("EARNINGS", "रू${_stats['total_earnings'] ?? 0}", luxuryGold, isDark: false),
     ]);
  }

  Widget _buildEliteStatTile(String l, String v, Color c, {bool isDark = false}) {
     return Expanded(
       child: Container(
         padding: const EdgeInsets.all(22), 
         decoration: BoxDecoration(
           color: isDark ? darkCard : Colors.white, 
           borderRadius: BorderRadius.circular(32), 
           boxShadow: [
             BoxShadow(color: (isDark ? Colors.black : c).withOpacity(isDark ? 0.2 : 0.08), blurRadius: 30, offset: const Offset(0, 15)),
           ]
         ), 
         child: Column(
           crossAxisAlignment: CrossAxisAlignment.start, 
           children: [
             Opacity(opacity: 0.6, child: Text(l, style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1.5))), 
             const SizedBox(height: 12), 
             Text(v, style: TextStyle(color: isDark ? Colors.white : (c == Colors.white ? accentRed : c), fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5))
           ]
         )
       )
     );
  }

  Widget _buildProfileView() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      children: [
        const SizedBox(height: 60),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text("PARTNER IDENTITY", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
          IconButton(onPressed: _logout, icon: const Icon(LucideIcons.logOut, color: accentRed))
        ]),
        const Text("MANAGE YOUR MISSION CREDENTIALS", style: TextStyle(color: Colors.black26, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
        const SizedBox(height: 48),
        Center(child: _buildEliteIdentityForm()),
        const SizedBox(height: 100),
      ],
    );
  }

  Widget _buildEliteIdentityForm() {
    return Column(children: [
       _buildEliteAvatarSection(),
       const SizedBox(height: 48),
       _buildEliteField("OFFICIAL NAME", _nameController, LucideIcons.user),
       const SizedBox(height: 24),
       _buildEliteField("PHONE LINE", _phoneController, LucideIcons.phone),
       const SizedBox(height: 48),
       const Row(children: [Text("CORE DOCUMENTS", style: TextStyle(color: accentRed, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)), Spacer(), Icon(LucideIcons.shieldCheck, color: accentRed, size: 16)]),
       const SizedBox(height: 24),
       Row(children: [
          _buildEliteDocItem("BLUEBOOK", _bluebookImage, 'bluebook'),
          const SizedBox(width: 16),
          _buildEliteDocItem("LICENSE", _licenseImage, 'license'),
          const SizedBox(width: 16),
          _buildEliteDocItem("VEHICLE", _vehicleImage, 'vehicle'),
        ]),
        const SizedBox(height: 60),
        SizedBox(width: double.infinity, height: 65, child: ElevatedButton(onPressed: _updateProfile, style: ElevatedButton.styleFrom(backgroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)), elevation: 12), child: const Text("COMMIT CHANGES", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2)))),
    ]);
  }

  Widget _buildEliteAvatarSection() {
     return Consumer<AuthProvider>(
       builder: (ctx, auth, child) {
         final user = auth.user;
         ImageProvider? imageProvider;
         if (_avatarImage != null) {
           imageProvider = FileImage(File(_avatarImage!.path));
         } else if (user?['profile_photo'] != null) {
           final url = user!['profile_photo'].toString().startsWith('http') 
              ? user['profile_photo'] 
              : '${ApiService.mediaUrl}${user['profile_photo']}';
           imageProvider = NetworkImage(url);
         }

         return GestureDetector(
           onTap: () => _pickImage('avatar'),
           child: Stack(alignment: Alignment.bottomRight, children: [
             Container(
               width: 140, 
               height: 140, 
               decoration: BoxDecoration(
                 color: Colors.white, 
                 borderRadius: BorderRadius.circular(50), 
                 border: Border.all(color: Colors.white, width: 5), 
                 boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 40)], 
                 image: imageProvider != null ? DecorationImage(image: imageProvider, fit: BoxFit.cover) : null
               ), 
               child: imageProvider == null ? const Center(child: Icon(LucideIcons.user, size: 64, color: Colors.black12)) : null
             ),
             Container(padding: const EdgeInsets.all(8), decoration: const BoxDecoration(color: accentRed, shape: BoxShape.circle), child: const Icon(LucideIcons.camera, color: Colors.white, size: 16)),
           ]),
         );
       },
     );
  }

  Widget _buildEliteField(String l, TextEditingController c, IconData i) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(l, style: const TextStyle(color: Colors.black26, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
      const SizedBox(height: 12),
      TextField(controller: c, decoration: InputDecoration(prefixIcon: Icon(i, color: accentRed, size: 18), filled: true, fillColor: Colors.white, contentPadding: const EdgeInsets.all(22), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: accentRed, width: 2)))),
    ]);
  }

  Widget _buildEliteDocItem(String l, XFile? img, String t) {
     return Expanded(child: Consumer<AuthProvider>(
       builder: (ctx, auth, child) {
         final user = auth.user;
         ImageProvider? imageProvider;
         final field = '${t}_image';
         if (img != null) {
           imageProvider = FileImage(File(img.path));
         } else if (user?[field] != null) {
            final url = user![field].toString().startsWith('http') 
                ? user[field] 
                : '${ApiService.mediaUrl}${user[field]}';
            imageProvider = NetworkImage(url);
         }

         return GestureDetector(onTap: () => _pickImage(t), child: Column(children: [
           Container(
             height: 100, 
             decoration: BoxDecoration(
               color: Colors.white, 
               borderRadius: BorderRadius.circular(25), 
               boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15)], 
               image: imageProvider != null ? DecorationImage(image: imageProvider, fit: BoxFit.cover) : null
             ), 
             child: imageProvider == null ? const Center(child: Icon(LucideIcons.fileText, color: Colors.blueAccent, size: 24)) : null
           ),
           const SizedBox(height: 12),
           Text(l, style: const TextStyle(color: Colors.black26, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
         ]));
       },
     ));
  }

  Future<void> _updateProfile() async {
    setState(() => _isLoading = true);
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      var request = await ApiService.multipartRequest('/delivery/profile/update/', isFleet: true);
      request.fields['full_name'] = _nameController.text;
      request.fields['phone_number'] = _phoneController.text;
      if (_avatarImage != null) request.files.add(await ApiService.fromFile(_avatarImage!, 'profile_photo'));
      if (_bluebookImage != null) request.files.add(await ApiService.fromFile(_bluebookImage!, 'bluebook_image'));
      if (_licenseImage != null) request.files.add(await ApiService.fromFile(_licenseImage!, 'license_image'));
      if (_vehicleImage != null) request.files.add(await ApiService.fromFile(_vehicleImage!, 'vehicle_image'));
      var response = await request.send();
      if (response.statusCode == 200) {
        final respStr = await response.stream.bytesToString();
        final data = jsonDecode(respStr);
        if (data['user'] != null) {
          auth.updateUser(data['user']);
        }
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("IDENTITY UPDATED! 🪪"), backgroundColor: successGreen));
      }
    } catch (e) { debugPrint("Sync err: $e"); }
    _fetchRiderData();
  }

  Future<void> _logout() async {
     showDialog(context: context, builder: (ctx) => AlertDialog(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)), title: const Text("END SHIFT?", style: TextStyle(fontWeight: FontWeight.w900)), content: const Text("Are you sure you want to log out from the fleet?"), actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("CANCEL")), ElevatedButton(onPressed: () async { Navigator.pop(ctx); final auth = Provider.of<AuthProvider>(context, listen: false); await auth.logout(); if (mounted) { Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => LoginScreen()), (route) => false); } }, style: ElevatedButton.styleFrom(backgroundColor: accentRed), child: const Text("LOGOUT", style: TextStyle(color: Colors.white)))]));
  }

  Widget _buildEliteNav() {
    return Container(padding: const EdgeInsets.all(24), child: Container(padding: const EdgeInsets.symmetric(vertical: 12), decoration: BoxDecoration(color: darkCard, borderRadius: BorderRadius.circular(35), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 40)]), child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [_buildNavIcon(0, LucideIcons.home), _buildNavIcon(1, LucideIcons.package), _buildNavIcon(2, LucideIcons.wallet), _buildNavIcon(3, LucideIcons.user)])));
  }

  Widget _buildNavIcon(int i, IconData icon) {
    bool active = _selectedIndex == i;
    return GestureDetector(
      onTap: () {
         if (!active) {
            if (!kIsWeb) Vibration.vibrate(duration: 20);
            setState(() => _selectedIndex = i);
         }
      }, 
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300), 
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.all(active ? 16 : 12), 
        decoration: BoxDecoration(
          color: active ? accentRed : Colors.transparent, 
          borderRadius: BorderRadius.circular(24),
          boxShadow: active ? [BoxShadow(color: accentRed.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 8))] : null
        ), 
        child: Icon(icon, color: active ? Colors.white : Colors.white24, size: active ? 26 : 24)
      )
    );
  }

  Widget _buildOrdersView() { return ListView(padding: const EdgeInsets.all(24), children: [const SizedBox(height: 60), const Text("MISSION LOG", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900)), const SizedBox(height: 32), if (_activeOrders.isEmpty && _completedOrders.isEmpty) _buildGlossyEmptyState() else ...[..._activeOrders.map((o) => _buildGlossyHistoryItem(o)), ..._completedOrders.map((o) => _buildGlossyHistoryItem(o))]]); }
  Widget _buildGlossyHistoryItem(dynamic o) { return Container(margin: const EdgeInsets.only(bottom: 16), padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)), child: Row(children: [Icon(LucideIcons.package, color: accentRed, size: 20), const SizedBox(width: 16), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text("Order #${o['id']}", style: const TextStyle(fontWeight: FontWeight.w900)), Text(o['delivery_address'] ?? 'Customer Address', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.black26, fontSize: 11, fontWeight: FontWeight.bold))])), Text("रू${o['total_amount']}", style: const TextStyle(color: successGreen, fontWeight: FontWeight.w900))])); }
  Widget _buildEarningsView() { return ListView(padding: const EdgeInsets.all(24), children: [const SizedBox(height: 60), const Text("PAYOUT CENTER", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900)), const SizedBox(height: 32), _buildGlossyEarningsCard()]); }
  Widget _buildGlossyEarningsCard() { return Container(padding: const EdgeInsets.all(32), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(35), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 40)]), child: Column(children: [const Text("TOTAL REWARD BALANCE", style: TextStyle(color: Colors.black26, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)), const SizedBox(height: 16), Text("रू ${_stats['total_earnings'] ?? 0}", style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: accentRed)), const SizedBox(height: 48), Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text("MISSIONS", style: TextStyle(color: Colors.black26, fontSize: 8, fontWeight: FontWeight.w900)), Text("${_stats['total_delivered'] ?? 0}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18))]), Column(crossAxisAlignment: CrossAxisAlignment.end, children: [const Text("LAST SHIFT", style: TextStyle(color: Colors.black26, fontSize: 8, fontWeight: FontWeight.w900)), Text("रू${_stats['today_earnings'] ?? 0}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18))])])])); }
  
  Future<void> _toggleOnline() async { try { final res = await ApiService.post('/delivery/toggle-online/', {}, isFleet: true); if (res.statusCode == 200) { setState(() => _isOnline = jsonDecode(res.body)['is_online']); _fetchRiderData(); } } catch (e) { debugPrint("Toggle err: $e"); } }
  Future<void> _acceptJob(int id) async { 
    try { 
      debugPrint("ATTEMPTING MISSION ACCEPTANCE: ORDER #$id");
      final res = await ApiService.post('/delivery/orders/$id/accept/', {}); 
      if (res.statusCode == 200) { 
        _fetchRiderData(); 
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("MISSION CLAIMED! 🚛 HERO READY."), backgroundColor: successGreen)); 
      } else {
        final data = jsonDecode(res.body);
        final msg = data['message'] ?? data['detail'] ?? "ALREADY CLAIMED";
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("MISSION FAILED: $msg"), backgroundColor: accentRed));
        _fetchRiderData(); // Clear stale notification
      }
    } catch (e) { 
      debugPrint("Accept err: $e"); 
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("HANDSHAKE FAILED: $e"), backgroundColor: accentRed));
    } 
  }

  Future<void> _rejectJob(int id) async {
    try {
      final res = await ApiService.post('/delivery/orders/$id/reject/', {});
      if (res.statusCode == 200) {
        setState(() => _notifications.removeWhere((n) => n['order_id'] == id));
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("MISSION DEFERRED. UNLOCKING HUB."), backgroundColor: Colors.black));
      }
    } catch (e) { debugPrint("Reject err: $e"); }
  }

  Future<void> _pickImage(String type) async {
    showModalBottomSheet(context: context, shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))), builder: (_) => Container(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [const Text("SELECT DOCUMENT SOURCE", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 1)), const SizedBox(height: 32), _buildSourceItem(LucideIcons.camera, "CAMERA", () => _handlePick(type, ImageSource.camera)), const SizedBox(height: 16), _buildSourceItem(LucideIcons.image, "GALLERY", () => _handlePick(type, ImageSource.gallery))])));
  }

  Future<void> _handlePick(String type, ImageSource s) async {
    Navigator.pop(context);
    try {
      final img = await _picker.pickImage(source: s);
      if (img != null) setState(() { 
        if (type == 'avatar') _avatarImage = img; 
        else if (type == 'bluebook') _bluebookImage = img;
        else if (type == 'license') _licenseImage = img;
        else if (type == 'vehicle') _vehicleImage = img;
      });
    } catch (e) { debugPrint("Pick err: $e"); }
  }

  Widget _buildSourceItem(IconData i, String l, VoidCallback o) {
    return ListTile(onTap: o, leading: CircleAvatar(backgroundColor: surfaceCloud, child: Icon(i, color: accentRed, size: 20)), title: Text(l, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)));
  }
}
