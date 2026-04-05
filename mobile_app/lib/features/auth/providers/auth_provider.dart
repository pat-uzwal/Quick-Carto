import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/api_service.dart';

class AuthProvider with ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    tryRestoreSession();
  }

  /// Initial attempt to load existing session from local storage
  Future<void> tryRestoreSession() async {
    _isLoading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user_data');
      if (userStr != null) {
        _user = jsonDecode(userStr);
      }
    } catch (e) {
      debugPrint("Session Restore Error: $e");
    }
    _isLoading = false;
    notifyListeners();
  }

  /// Standard email + password login
  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiService.post('/auth/login/', {
        'email': email,
        'password': password,
      });

      final data = jsonDecode(res.body);

      if (res.statusCode == 200 || res.statusCode == 201) {
        final role = data['user']['role'].toString().toLowerCase();
        if (role == 'admin' || role == 'warehouse') {
          _error = 'App Restricted! Please use the Web Portal for Admin/Manager Access.';
        } else {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('access_token', data['access']);
          await prefs.setString('refresh_token', data['refresh']);
          await prefs.setString('user_data', jsonEncode(data['user']));
          
          _user = data['user'];
        }
      } else {
        _error = data['detail'] ?? 'Invalid credentials';
      }
    } catch (e) {
      _error = 'Network error: $e';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Verify OTP code and log in the user
  Future<bool> verifyOtp(String email, String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiService.post('/auth/verify-otp/', {
        'email': email,
        'otp': otp,
      });

      final data = jsonDecode(res.body);

      if (res.statusCode == 200) {
        final role = data['user']['role'].toString().toLowerCase();
        if (role == 'admin' || role == 'warehouse') {
          _error = 'App Restricted! Please use the Web Portal for Admin/Manager Access.';
          _isLoading = false;
          notifyListeners();
          return false;
        }

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', data['access']);
        await prefs.setString('refresh_token', data['refresh']);
        await prefs.setString('user_data', jsonEncode(data['user']));

        _user = data['user'];
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['detail'] ?? 'Invalid or expired OTP';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Network error: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Request a new OTP to be sent via email
  Future<bool> requestOtp(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiService.post('/auth/request-otp/', {
        'email': email,
      });

      if (res.statusCode == 200) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        final data = jsonDecode(res.body);
        _error = data['detail'] ?? 'Failed to send OTP';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Network error: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_data');
    _user = null;
    notifyListeners();
  }

  /// Manually update local user data (e.g., after profile update)
  Future<void> updateUser(Map<String, dynamic> userData) async {
    _user = userData;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(userData));
    notifyListeners();
  }

  /// Fetch latest user profile from server
  Future<void> fetchCurrentUser() async {
    try {
      final res = await ApiService.get('/auth/me/');
      if (res.statusCode == 200) {
        final userData = jsonDecode(res.body);
        await updateUser(userData);
      }
    } catch (e) {
      debugPrint("Fetch User Profile Error: $e");
    }
  }
}
