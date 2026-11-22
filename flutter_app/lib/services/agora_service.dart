import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';
import 'api_client.dart';

enum AgoraStatus {
  idle,
  connecting,
  connected,
  credentialsMissing,
  permissionDenied,
  error,
}

class AgoraSessionResult {
  final bool ok;
  final AgoraStatus status;
  final String message;
  final String? channelName;

  const AgoraSessionResult({
    required this.ok,
    required this.status,
    required this.message,
    this.channelName,
  });
}

class MizoAgoraService extends ChangeNotifier {
  MizoAgoraService._();
  static final MizoAgoraService instance = MizoAgoraService._();

  RtcEngine? _engine;
  AgoraStatus status = AgoraStatus.idle;
  String? activeChannel;
  String? statusDetail;
  bool micMuted = false;
  bool cameraMuted = false;
  bool flashOn = false;
  bool usingFrontCamera = true;
  final Set<int> remoteUids = {};

  Future<bool> _ensurePermissions({required bool withVideo}) async {
    final perms = <Permission>[Permission.microphone];
    if (withVideo) perms.add(Permission.camera);
    final statuses = await perms.request();
    final micOk = statuses[Permission.microphone]?.isGranted ?? false;
    final camOk = !withVideo || (statuses[Permission.camera]?.isGranted ?? false);
    return micOk && camOk;
  }

  Future<AgoraSessionResult> joinChannel({
    required String channelName,
    required bool isPublisher,
    required bool withVideo,
  }) async {
    status = AgoraStatus.connecting;
    statusDetail = 'Requesting media permissions and Agora token...';
    notifyListeners();

    final hasPerms = await _ensurePermissions(withVideo: withVideo);
    if (!hasPerms) {
      status = AgoraStatus.permissionDenied;
      statusDetail = 'Camera/Microphone permission denied by user.';
      notifyListeners();
      return AgoraSessionResult(
        ok: false,
        status: status,
        message: statusDetail!,
      );
    }

    final tokenRes = await MizoApiClient.instance.post('/api/agora/token', {
      'channelName': channelName,
      'role': isPublisher ? 'publisher' : 'subscriber',
    });

    if (!tokenRes.ok || tokenRes.data == null) {
      final isMissing =
          tokenRes.status == 503 || tokenRes.code == 'AGORA_CREDENTIALS_MISSING';
      status = isMissing ? AgoraStatus.credentialsMissing : AgoraStatus.error;
      statusDetail = tokenRes.error ??
          'AGORA_APP_ID / AGORA_APP_CERTIFICATE missing on server.';
      notifyListeners();
      return AgoraSessionResult(
        ok: false,
        status: status,
        message: statusDetail!,
      );
    }

    final appId = tokenRes.data!['appId']?.toString() ?? '';
    final token = tokenRes.data!['token']?.toString() ?? '';
    final uid = (tokenRes.data!['uid'] as num?)?.toInt() ?? 0;

    if (appId.isEmpty || token.isEmpty) {
      status = AgoraStatus.credentialsMissing;
      statusDetail = 'Invalid Agora token payload from server.';
      notifyListeners();
      return AgoraSessionResult(
        ok: false,
        status: status,
        message: statusDetail!,
      );
    }

    try {
      await leaveChannel();
      final engine = createAgoraRtcEngine();
      await engine.initialize(RtcEngineContext(appId: appId));

      engine.registerEventHandler(RtcEngineEventHandler(
        onJoinChannelSuccess: (connection, elapsed) {
          status = AgoraStatus.connected;
          activeChannel = connection.channelId;
          statusDetail = 'Connected to Agora RTC (${connection.channelId})';
          notifyListeners();
        },
        onUserJoined: (connection, remoteUid, elapsed) {
          remoteUids.add(remoteUid);
          notifyListeners();
        },
        onUserOffline: (connection, remoteUid, reason) {
          remoteUids.remove(remoteUid);
          notifyListeners();
        },
        onConnectionStateChanged: (connection, state, reason) {
          if (state == ConnectionStateType.connectionStateFailed ||
              state == ConnectionStateType.connectionStateDisconnected) {
            statusDetail = 'Agora state: ${state.name}';
            notifyListeners();
          }
        },
      ));

      if (withVideo) {
        await engine.enableVideo();
        if (isPublisher) await engine.startPreview();
      } else {
        await engine.enableAudio();
      }

      await engine.setClientRole(
        role: isPublisher
            ? ClientRoleType.clientRoleBroadcaster
            : ClientRoleType.clientRoleAudience,
      );

      await engine.joinChannel(
        token: token,
        channelId: channelName,
        uid: uid,
        options: ChannelMediaOptions(
          autoSubscribeAudio: true,
          autoSubscribeVideo: withVideo,
          publishCameraTrack: isPublisher && withVideo,
          publishMicrophoneTrack: isPublisher,
        ),
      );

      _engine = engine;
      activeChannel = channelName;
      status = AgoraStatus.connected;
      statusDetail = 'Agora RTC active ($channelName)';
      notifyListeners();

      return AgoraSessionResult(
        ok: true,
        status: status,
        message: statusDetail!,
        channelName: channelName,
      );
    } catch (e) {
      status = AgoraStatus.error;
      statusDetail = 'Agora RTC join failed: $e';
      notifyListeners();
      return AgoraSessionResult(
        ok: false,
        status: status,
        message: statusDetail!,
      );
    }
  }

  Future<void> toggleMic() async {
    micMuted = !micMuted;
    await _engine?.muteLocalAudioStream(micMuted);
    notifyListeners();
  }

  Future<void> toggleCamera() async {
    cameraMuted = !cameraMuted;
    await _engine?.muteLocalVideoStream(cameraMuted);
    notifyListeners();
  }

  Future<void> switchCamera() async {
    usingFrontCamera = !usingFrontCamera;
    await _engine?.switchCamera();
    notifyListeners();
  }

  Future<void> toggleFlash() async {
    flashOn = !flashOn;
    try {
      await _engine?.setCameraTorchOn(flashOn);
    } catch (_) {}
    notifyListeners();
  }

  Future<void> leaveChannel() async {
    try {
      if (_engine != null) {
        await _engine!.leaveChannel();
        await _engine!.release();
      }
    } catch (_) {}
    _engine = null;
    activeChannel = null;
    remoteUids.clear();
    micMuted = false;
    cameraMuted = false;
    flashOn = false;
    status = AgoraStatus.idle;
    notifyListeners();
  }
}
