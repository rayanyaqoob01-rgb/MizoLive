import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config/app_config.dart';

class MizoWebSocketService {
  MizoWebSocketService._();
  static final MizoWebSocketService instance = MizoWebSocketService._();

  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  final _eventsController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get events => _eventsController.stream;

  void connect() {
    disconnect();
    try {
      final baseUri = Uri.parse(AppConfig.apiBaseUrl);
      final wsScheme = baseUri.scheme == 'https' ? 'wss' : 'ws';
      final wsUri = baseUri.replace(scheme: wsScheme, path: '/ws');
      _channel = WebSocketChannel.connect(wsUri);
      _sub = _channel!.stream.listen(
        (raw) {
          try {
            final parsed = jsonDecode(raw.toString());
            if (parsed is Map<String, dynamic>) {
              _eventsController.add(parsed);
            }
          } catch (_) {}
        },
        onError: (_) {},
      );
    } catch (_) {}
  }

  void send(Map<String, dynamic> payload) {
    try {
      _channel?.sink.add(jsonEncode(payload));
    } catch (_) {}
  }

  void disconnect() {
    _sub?.cancel();
    _sub = null;
    _channel?.sink.close();
    _channel = null;
  }
}
