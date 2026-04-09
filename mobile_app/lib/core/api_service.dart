import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:8000/api/';
    if (defaultTargetPlatform == TargetPlatform.android) return 'http://10.0.2.2:8000/api/';
    return 'http://127.0.0.1:8000/api/';
  }

  static String get mediaUrl => baseUrl.replaceAll('/api/', '');

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Force Django to ignore HTML redirects
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Unified Web-Harmony API Engine (Indestructible Handshake)
  static Future<http.Response> post(String endpoint, Map<String, dynamic> body, {bool isFleet = false}) async {
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    final url = '$baseUrl$cleanEndpoint';
    return await http.post(Uri.parse(url), headers: await _getHeaders(), body: jsonEncode(body)).timeout(const Duration(seconds: 15));
  }

  static Future<http.Response> get(String endpoint, {bool isFleet = false}) async {
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    final url = '$baseUrl$cleanEndpoint';
    return await http.get(Uri.parse(url), headers: await _getHeaders()).timeout(const Duration(seconds: 15));
  }

  static Future<http.Response> put(String endpoint, Map<String, dynamic> body, {bool isFleet = false}) async {
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return await http.put(Uri.parse('$baseUrl$cleanEndpoint'), headers: await _getHeaders(), body: jsonEncode(body)).timeout(const Duration(seconds: 15));
  }

  static Future<http.Response> patch(String endpoint, Map<String, dynamic> body, {bool isFleet = false}) async {
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return await http.patch(Uri.parse('$baseUrl$cleanEndpoint'), headers: await _getHeaders(), body: jsonEncode(body)).timeout(const Duration(seconds: 15));
  }

  static Future<http.Response> delete(String endpoint, {bool isFleet = false}) async {
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return await http.delete(Uri.parse('$baseUrl$cleanEndpoint'), headers: await _getHeaders()).timeout(const Duration(seconds: 15));
  }

  static Future<http.MultipartRequest> multipartRequest(String endpoint, {String method = 'POST', bool isFleet = false}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    var request = http.MultipartRequest(method, Uri.parse('$baseUrl$endpoint'));
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    return request;
  }

  static Future<http.MultipartFile> fromFile(XFile file, String field) async {
    return await http.MultipartFile.fromPath(field, file.path);
  }
}
