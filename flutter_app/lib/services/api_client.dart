import 'dart:async';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ApiDiagnosticEntry {
  final String id;
  final String endpoint;
  final String method;
  final int status;
  final bool ok;
  final String message;
  final String timestamp;
  final int durationMs;

  const ApiDiagnosticEntry({
    required this.id,
    required this.endpoint,
    required this.method,
    required this.status,
    required this.ok,
    required this.message,
    required this.timestamp,
    required this.durationMs,
  });
}

class ApiResult<T> {
  final bool ok;
  final int status;
  final T? data;
  final String? error;
  final String? code;

  const ApiResult({
    required this.ok,
    required this.status,
    this.data,
    this.error,
    this.code,
  });
}

class MizoApiClient {
  MizoApiClient._();
  static final MizoApiClient instance = MizoApiClient._();

  final http.Client _client = http.Client();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  ApiDiagnosticEntry? lastSuccess;
  final List<ApiDiagnosticEntry> recentErrors = [];

  Map<String, String> Function()? _authHeadersProvider;

  void setAuthHeadersProvider(Map<String, String> Function() provider) {
    _authHeadersProvider = provider;
  }

  Future<void> saveSecureToken(String key, String value) async {
    try {
      await _secureStorage.write(key: key, value: value);
    } catch (_) {
      // Ignore secure storage error in unit tests without platform channel
    }
  }

  Future<String?> readSecureToken(String key) async {
    try {
      return await _secureStorage.read(key: key);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearSecureTokens() async {
    try {
      await _secureStorage.deleteAll();
    } catch (_) {}
  }

  void recordExternalError(String source, String message, [int status = 500]) {
    final entry = ApiDiagnosticEntry(
      id: 'ext-${DateTime.now().millisecondsSinceEpoch}',
      endpoint: source,
      method: 'CLIENT',
      status: status,
      ok: false,
      message: message,
      timestamp: DateTime.now().toIso8601String(),
      durationMs: 0,
    );
    recentErrors.insert(0, entry);
    if (recentErrors.length > 25) recentErrors.removeLast();
  }

  Future<ApiResult<Map<String, dynamic>>> request(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    Map<String, String>? extraHeaders,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final base = AppConfig.apiBaseUrl.replaceAll(RegExp(r'/+$'), '');
    final uri = Uri.parse('$base$path');
    final sw = Stopwatch()..start();

    try {
      final token = await readSecureToken('mizo_id_token');
      final headers = <String, String>{
        if (body != null) 'Content-Type': 'application/json',
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        ...?_authHeadersProvider?.call(),
        ...?extraHeaders,
      };

      late http.Response res;
      if (method == 'POST') {
        res = await _client
            .post(uri,
                headers: headers, body: body != null ? jsonEncode(body) : null)
            .timeout(timeout);
      } else {
        res = await _client.get(uri, headers: headers).timeout(timeout);
      }

      sw.stop();
      Map<String, dynamic>? parsed;
      if (res.body.isNotEmpty) {
        try {
          final decoded = jsonDecode(res.body);
          if (decoded is Map<String, dynamic>) parsed = decoded;
        } catch (_) {}
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        var msg = parsed?['error']?.toString() ??
            parsed?['message']?.toString() ??
            'Request failed (${res.statusCode})';
        if (res.statusCode == 401) {
          msg = 'Session unauthorized — please sign in again.';
        } else if (res.statusCode == 403) {
          msg = 'Access denied — insufficient permissions.';
        } else if (res.statusCode >= 500 && parsed?['error'] == null) {
          msg = 'Server error (${res.statusCode}) — please retry.';
        }

        recentErrors.insert(
          0,
          ApiDiagnosticEntry(
            id: 'err-${DateTime.now().millisecondsSinceEpoch}',
            endpoint: path,
            method: method,
            status: res.statusCode,
            ok: false,
            message: msg,
            timestamp: DateTime.now().toIso8601String(),
            durationMs: sw.elapsedMilliseconds,
          ),
        );
        if (recentErrors.length > 25) recentErrors.removeLast();

        return ApiResult(
          ok: false,
          status: res.statusCode,
          data: parsed,
          error: msg,
          code: parsed?['code']?.toString(),
        );
      }

      lastSuccess = ApiDiagnosticEntry(
        id: 'ok-${DateTime.now().millisecondsSinceEpoch}',
        endpoint: path,
        method: method,
        status: res.statusCode,
        ok: true,
        message: 'OK',
        timestamp: DateTime.now().toIso8601String(),
        durationMs: sw.elapsedMilliseconds,
      );

      return ApiResult(ok: true, status: res.statusCode, data: parsed);
    } on TimeoutException {
      sw.stop();
      final msg = 'Request timed out after ${timeout.inSeconds}s';
      recordExternalError(path, msg, 408);
      return ApiResult(ok: false, status: 408, error: msg, code: 'TIMEOUT');
    } catch (e) {
      sw.stop();
      final msg = 'Network unavailable: $e';
      recordExternalError(path, msg, 0);
      return ApiResult(
          ok: false, status: 0, error: msg, code: 'NETWORK_ERROR');
    }
  }

  Future<ApiResult<Map<String, dynamic>>> get(String path) =>
      request(path, method: 'GET');

  Future<ApiResult<Map<String, dynamic>>> post(
    String path,
    Map<String, dynamic> body,
  ) =>
      request(path, method: 'POST', body: body);
}
