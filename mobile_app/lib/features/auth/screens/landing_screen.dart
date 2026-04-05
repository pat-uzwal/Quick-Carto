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
            child: Padding(
              padding: const EdgeInsets.all(40.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),
                  // Premium Logo/Emoji
                  Container(
                    height: 140, width: 140,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE62020),
                      borderRadius: BorderRadius.circular(48),
                      boxShadow: [BoxShadow(color: const Color(0xFFE62020).withOpacity(0.3), blurRadius: 40, offset: const Offset(0, 15))],
                    ),
                    child: const Center(child: Text("🛒", style: TextStyle(fontSize: 70))),
                  ),
                  const SizedBox(height: 48),
                  const Text(
                    "QUICKCARTO",
                    style: TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: -1.5),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    "Ultra-fast local delivery\nin under 10 minutes.",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.grey, height: 1.5, letterSpacing: -0.2),
                  ),
                  const Spacer(),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 64,
                    child: ElevatedButton(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => LoginScreen())),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE62020),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        elevation: 20, shadowColor: const Color(0xFFE62020).withOpacity(0.3),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Text("GET STARTED", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 16, letterSpacing: 1)),
                          SizedBox(width: 12),
                          Icon(LucideIcons.arrowRight, color: Colors.white, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    "LOCAL PRODUCE • FRESH MEAT • DRINKS",
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
