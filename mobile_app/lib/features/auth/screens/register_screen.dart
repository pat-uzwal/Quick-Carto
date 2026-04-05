import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/api_service.dart';
import 'dart:convert';
import 'login_screen.dart';
import 'otp_verification_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  String _selectedRole = 'user'; // 'user' or 'delivery'
  bool _isLoading = false;

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final res = await ApiService.post('/auth/register/', {
        'email': _email.text.trim(),
        'password': _password.text.trim(),
        'full_name': _name.text.trim(),
        'phone_number': _phone.text.trim(),
        'role': _selectedRole,
      });

      final data = jsonDecode(res.body);

      if (res.statusCode == 201) {
        // Registration successful — navigate to OTP verification
        final email = data['email'] ?? _email.text.trim();
        final emailStatus = data['email_status'] ?? 'sent';

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                emailStatus == 'sent'
                    ? '✅ OTP sent to $email! Check your inbox.'
                    : '⚠️ Registered, but OTP email failed. Use "Resend" on next screen.',
              ),
              backgroundColor: emailStatus == 'sent' ? Colors.green.shade600 : Colors.orange,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );

          // Navigate to OTP verification screen
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => OtpVerificationScreen(email: email),
            ),
          );
        }
      } else {
        // Parse error message
        String errorMsg = 'Registration failed';
        if (data is Map) {
          if (data.containsKey('detail')) {
            errorMsg = data['detail'];
          } else {
            // Get first field error
            final firstKey = data.keys.first;
            final val = data[firstKey];
            if (val is List && val.isNotEmpty) {
              errorMsg = '$firstKey: ${val[0]}';
            } else if (val is String) {
              errorMsg = val;
            }
          }
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMsg),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Network error: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }

    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
          onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => LoginScreen())),
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: Container(
            padding: const EdgeInsets.all(32.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)
              ]
            ),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text("Create Account", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.black)),
                  const Text("Join Quickcarto to start shopping or delivering", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w700)),
                  
                  const SizedBox(height: 32),
                  
                  // Role Toggle
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedRole = 'user'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: _selectedRole == 'user' ? Colors.red.shade50 : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: _selectedRole == 'user' ? const Color(0xFFE62020) : Colors.grey.shade200, width: 2)
                            ),
                            child: const Center(child: Text("Customer", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black))),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedRole = 'delivery'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: _selectedRole == 'delivery' ? Colors.red.shade50 : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: _selectedRole == 'delivery' ? const Color(0xFFE62020) : Colors.grey.shade200, width: 2)
                            ),
                            child: const Center(child: Text("Delivery Partner", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.black))),
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  TextFormField(
                    controller: _name,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                    decoration: const InputDecoration(prefixIcon: Icon(LucideIcons.user, color: Colors.grey), hintText: "Full Name"),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                    decoration: const InputDecoration(prefixIcon: Icon(LucideIcons.mail, color: Colors.grey), hintText: "Email Address"),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required';
                      if (!v.contains('@') || !v.contains('.')) return 'Enter a valid email';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                    decoration: const InputDecoration(prefixIcon: Icon(LucideIcons.phone, color: Colors.grey), hintText: "Phone Number"),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _password,
                    obscureText: true,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                    decoration: const InputDecoration(prefixIcon: Icon(LucideIcons.lock, color: Colors.grey), hintText: "Password"),
                    validator: (v) => v!.length < 8 ? 'Min 8 characters' : null,
                  ),
                  
                  const SizedBox(height: 12),

                  // Info note about OTP
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.shade100),
                    ),
                    child: Row(
                      children: [
                        Icon(LucideIcons.mail, size: 16, color: Colors.blue.shade600),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "A verification OTP will be sent to your email",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.blue.shade700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleRegister,
                      child: _isLoading 
                         ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                         : const Text("REGISTER NOW", style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 16)),
                    ),
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
