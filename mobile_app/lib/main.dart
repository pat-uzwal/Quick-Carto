import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/customer/providers/cart_provider.dart';
import 'features/auth/screens/landing_screen.dart';
import 'features/customer/screens/home_screen.dart';
import 'features/delivery/screens/rider_dashboard.dart';
import 'core/widgets/app_logo.dart';

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
          // If we are still initializing/loading authenticaton, show splash
          if (auth.isLoading) {
             return Scaffold(
               backgroundColor: Colors.white,
               body: Center(
                 child: const AppLogo(scale: 0.8),
               ),
             );
          }
          
          // Always open by landing page first as requested
          // The Landing Page itself will handle the transition to Login/Home
          return const LandingScreen();
        },
      ),
    );
  }
}
