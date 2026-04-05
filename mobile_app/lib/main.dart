import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/customer/providers/cart_provider.dart';
import 'features/auth/screens/landing_screen.dart';
import 'features/customer/screens/home_screen.dart';
import 'features/delivery/screens/rider_dashboard.dart';

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
      theme: AppTheme.lightTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          // If loading, show splash/progress
          if (auth.isLoading) {
             return const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFE62020))));
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
