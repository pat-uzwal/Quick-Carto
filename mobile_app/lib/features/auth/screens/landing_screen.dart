import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'login_screen.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Background Aesthetic
          Positioned(
            top: -100, right: -50,
            child: Container(width: 300, height: 300, decoration: BoxDecoration(color: const Color(0xFFE62020).withOpacity(0.05), shape: BoxShape.circle)),
          ),
          Positioned(
            bottom: -50, left: -50,
            child: Container(width: 250, height: 250, decoration: BoxDecoration(color: const Color(0xFFE62020).withOpacity(0.05), shape: BoxShape.circle)),
          ),
          
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32.0),
              physics: const ClampingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 80),
                  // Improved Hero Logo Container (No more square-in-circle clash)
                  Container(
                    width: 300, height: 300,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8E8E8), // Match the logo's light gray
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 40, offset: const Offset(0, 20)),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(32),
                      child: Image.asset('assets/logo.png', fit: BoxFit.cover),
                    ),
                  ),
                  const SizedBox(height: 60),
                  const Text(
                    "QUICKCARTO",
                    style: TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: -2),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    "Your neighborhood grocery store\ndelivered in minutes.",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.grey, height: 1.6, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 80),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 68,
                    child: ElevatedButton(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => LoginScreen())),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE62020),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        elevation: 10, shadowColor: const Color(0xFFE62020).withOpacity(0.4),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Text("GET STARTED", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 18, letterSpacing: 1.5)),
                          SizedBox(width: 14),
                          Icon(LucideIcons.arrowRight, color: Colors.white, size: 24),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    "LOCAL PRODUCE • FRESH MEAT • DRINKS",
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
