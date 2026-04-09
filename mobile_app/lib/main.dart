import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/customer/providers/cart_provider.dart';
import 'features/auth/screens/landing_screen.dart';
import 'features/customer/screens/home_screen.dart';
import 'features/delivery/screens/rider_dashboard.dart';

class GlobalScrollBehavior extends MaterialScrollBehavior {
  @override
  Set<PointerDeviceKind> get dragDevices => {
    PointerDeviceKind.touch,
    PointerDeviceKind.mouse,
    PointerDeviceKind.trackpad,
  };

  @override
  Widget buildOverscrollIndicator(BuildContext context, Widget child, ScrollableDetails details) {
    return child; // Disable the "Stretch" effect entirely
  }
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const QuickcartoApp(),
    ),
  );
}

class QuickcartoApp extends StatelessWidget {
  const QuickcartoApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Quickcarto',
      debugShowCheckedModeBanner: false,
      scrollBehavior: GlobalScrollBehavior(),
      theme: AppTheme.lightTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          // If loading, show splash/progress
          if (auth.isLoading) {
             return Scaffold(
               backgroundColor: Colors.white,
               body: Center(
                 child: Column(
                   mainAxisAlignment: MainAxisAlignment.center,
                   children: [
                     Container(
                       height: 180, width: 180,
                       decoration: BoxDecoration(
                         color: const Color(0xFFF3F4F6), // Match light gray aesthetic
                         borderRadius: BorderRadius.circular(28),
                         boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20)],
                       ),
                       child: ClipRRect(
                         borderRadius: BorderRadius.circular(28),
                         child: Image.asset('assets/logo.png', fit: BoxFit.cover),
                       ),
                     ),
                     const SizedBox(height: 24),
                     const SizedBox(width: 40, child: LinearProgressIndicator(color: Color(0xFFE62020), backgroundColor: Color(0xFFF3F4F6))),
                   ],
                 ),
               ),
             );
          }
          
          // If authenticated, route based on role
          if (auth.isAuthenticated) {
            final role = auth.user?['role']?.toString().toLowerCase();
            if (role == 'delivery') {
              return const RiderDashboard();
            }
            return const HomeScreen(); // Customer Dashboard
          }
          
          // Otherwise show Landing Screen
          return const LandingScreen();
        },
      ),
    );
  }
}
