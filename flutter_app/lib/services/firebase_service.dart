import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:image_picker/image_picker.dart';
import '../config/app_config.dart';
import '../models/mizo_models.dart';
import 'api_client.dart';

enum OperationType { create, update, delete, list, get, write }

class PhoneOtpSession {
  final String? verificationId;
  final ConfirmationResult? webConfirmation;
  final bool autoSignedIn;

  const PhoneOtpSession({
    this.verificationId,
    this.webConfirmation,
    this.autoSignedIn = false,
  });
}

class FirebaseDiagnosticsState {
  bool coreReady = false;
  bool authReady = false;
  bool firestoreConnected = false;
  String? firestoreError;
  String fcmStatus = 'pending';
  String remoteConfigStatus = 'defaults';
}

class MizoFirebaseService {
  MizoFirebaseService._();
  static final MizoFirebaseService instance = MizoFirebaseService._();

  final FirebaseDiagnosticsState diagnostics = FirebaseDiagnosticsState();

  FirebaseAuth? _auth;
  FirebaseFirestore? _db;
  FirebaseStorage? _storage;

  FirebaseAuth get auth => _auth!;
  FirebaseFirestore get db => _db!;

  GoogleSignIn _createGoogleSignIn() => GoogleSignIn(
        clientId: kIsWeb ? AppConfig.googleWebClientId : null,
        scopes: const ['email', 'profile'],
      );

  Never _handleFirestoreError(
    Object error,
    OperationType operationType,
    String? path,
  ) {
    final user = _auth?.currentUser;
    final errInfo = <String, dynamic>{
      'error': error.toString(),
      'operationType': operationType.name,
      'path': path,
      'authInfo': {
        'userId': user?.uid,
        'email': user?.email,
        'emailVerified': user?.emailVerified,
        'isAnonymous': user?.isAnonymous,
        'tenantId': user?.tenantId,
        'providerInfo': user?.providerData
                .map((p) => {'providerId': p.providerId, 'email': p.email})
                .toList() ??
            [],
      },
    };
    final encoded = jsonEncode(errInfo);
    MizoApiClient.instance.recordExternalError('firestore/${operationType.name}', encoded, 403);
    throw Exception(encoded);
  }

  Future<void> initialize() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: AppConfig.firebaseOptions);
      }
      _auth = FirebaseAuth.instance;
      _db = FirebaseFirestore.instanceFor(
        app: Firebase.app(),
        databaseId: AppConfig.firestoreDatabaseId,
      );
      _storage = FirebaseStorage.instance;
      diagnostics.coreReady = true;
      diagnostics.authReady = true;

      await testFirestoreConnection();
      await _initRemoteConfig();
      await _initAnalytics();
    } catch (e) {
      diagnostics.coreReady = false;
      diagnostics.firestoreError = e.toString();
      MizoApiClient.instance.recordExternalError('firebase/init', e.toString());
    }
  }

  Future<bool> testFirestoreConnection() async {
    if (_db == null) return false;
    try {
      await _db!
          .collection('test')
          .doc('connection')
          .get(const GetOptions(source: Source.server));
      diagnostics.firestoreConnected = true;
      diagnostics.firestoreError = null;
      return true;
    } catch (e) {
      final msg = e.toString();
      if (msg.toLowerCase().contains('permission')) {
        diagnostics.firestoreConnected = true;
        diagnostics.firestoreError = null;
        return true;
      }
      diagnostics.firestoreConnected = false;
      diagnostics.firestoreError = msg;
      return false;
    }
  }

  Future<void> _initRemoteConfig() async {
    try {
      final rc = FirebaseRemoteConfig.instance;
      await rc.setDefaults({
        'audio_call_rate': 40,
        'video_call_rate': 90,
        'max_room_seats': 12,
        'maintenance_mode': false,
      });
      await rc.fetchAndActivate();
      diagnostics.remoteConfigStatus = 'activated';
    } catch (_) {
      diagnostics.remoteConfigStatus = 'defaults';
    }
  }

  Future<void> _initAnalytics() async {
    try {
      await FirebaseAnalytics.instance.logAppOpen();
    } catch (_) {}
  }

  bool isVerifiedAdmin(User? user) {
    if (user == null) return false;
    return user.emailVerified &&
        (user.email?.toLowerCase() == AppConfig.adminEmail.toLowerCase());
  }

  Stream<User?> authStateChanges() {
    if (_auth == null) return const Stream.empty();
    return _auth!.authStateChanges();
  }

  Future<void> persistSessionToken(User? user) async {
    if (user == null) {
      await MizoApiClient.instance.clearSecureTokens();
      return;
    }
    try {
      final token = await user.getIdToken();
      if (token != null) {
        await MizoApiClient.instance.saveSecureToken('mizo_id_token', token);
      }
    } catch (_) {}
  }

  Future<UserCredential> signInWithGoogle() async {
    if (kIsWeb) {
      final res = await auth.signInWithPopup(GoogleAuthProvider());
      await persistSessionToken(res.user);
      return res;
    }
    final googleUser = await _createGoogleSignIn().signIn();
    if (googleUser == null) {
      throw Exception('Google Sign-In cancelled by user.');
    }
    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    final res = await auth.signInWithCredential(credential);
    await persistSessionToken(res.user);
    return res;
  }

  Future<UserCredential> signInWithEmail(String email, String password) async {
    final res = await auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await persistSessionToken(res.user);
    return res;
  }

  Future<UserCredential> signUpWithEmail(
    String email,
    String password,
    String username,
  ) async {
    final res = await auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    if (username.trim().isNotEmpty) {
      await res.user?.updateDisplayName(username.trim());
    }
    try {
      await res.user?.sendEmailVerification();
    } catch (_) {}
    await persistSessionToken(res.user);
    return res;
  }

  Future<PhoneOtpSession> startPhoneOtp(String phoneNumber) async {
    final trimmed = phoneNumber.trim();
    if (trimmed.isEmpty || !trimmed.startsWith('+')) {
      throw Exception('Enter phone number in E.164 format (e.g. +14155550100).');
    }
    if (kIsWeb) {
      final conf = await auth.signInWithPhoneNumber(trimmed);
      return PhoneOtpSession(webConfirmation: conf);
    }
    final completer = Completer<PhoneOtpSession>();
    await auth.verifyPhoneNumber(
      phoneNumber: trimmed,
      verificationCompleted: (PhoneAuthCredential cred) async {
        final res = await auth.signInWithCredential(cred);
        await persistSessionToken(res.user);
        if (!completer.isCompleted) {
          completer.complete(const PhoneOtpSession(autoSignedIn: true));
        }
      },
      verificationFailed: (FirebaseAuthException e) {
        if (!completer.isCompleted) {
          completer.completeError(
            Exception(e.message ?? 'Phone OTP failed (${e.code}).'),
          );
        }
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!completer.isCompleted) {
          completer.complete(PhoneOtpSession(verificationId: verificationId));
        }
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        if (!completer.isCompleted) {
          completer.complete(PhoneOtpSession(verificationId: verificationId));
        }
      },
    );
    return completer.future;
  }

  Future<UserCredential> verifyPhoneOtp(
    PhoneOtpSession session,
    String smsCode,
  ) async {
    final code = smsCode.trim();
    if (code.length < 4) {
      throw Exception('Enter the SMS verification OTP code.');
    }
    if (session.webConfirmation != null) {
      final res = await session.webConfirmation!.confirm(code);
      await persistSessionToken(res.user);
      return res;
    }
    if (session.verificationId == null) {
      throw Exception('Missing verification ID. Request a new OTP code.');
    }
    final cred = PhoneAuthProvider.credential(
      verificationId: session.verificationId!,
      smsCode: code,
    );
    final res = await auth.signInWithCredential(cred);
    await persistSessionToken(res.user);
    return res;
  }

  Future<void> sendPasswordReset(String email) =>
      auth.sendPasswordResetEmail(email: email.trim());

  Future<UserCredential> signInAsGuest() async {
    final res = await auth.signInAnonymously();
    await persistSessionToken(res.user);
    return res;
  }

  Future<void> linkWithGoogle() async {
    final user = auth.currentUser;
    if (user == null) {
      await signInWithGoogle();
      return;
    }
    if (kIsWeb) {
      await user.linkWithPopup(GoogleAuthProvider());
      return;
    }
    final googleUser = await _createGoogleSignIn().signIn();
    if (googleUser == null) throw Exception('Google linking cancelled.');
    final googleAuth = await googleUser.authentication;
    final cred = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    await user.linkWithCredential(cred);
  }

  Future<void> changePassword(String currentPwd, String newPwd) async {
    final user = auth.currentUser;
    if (user == null || user.email == null) {
      throw Exception('Password change requires an email/password account.');
    }
    final cred = EmailAuthProvider.credential(
      email: user.email!,
      password: currentPwd,
    );
    await user.reauthenticateWithCredential(cred);
    await user.updatePassword(newPwd);
  }

  Future<void> signOut() async {
    try {
      await _createGoogleSignIn().signOut();
    } catch (_) {}
    await _auth?.signOut();
    await MizoApiClient.instance.clearSecureTokens();
  }

  Future<void> deleteAccount() async {
    final user = auth.currentUser;
    if (user == null) throw Exception('No active account.');
    await user.delete();
    await MizoApiClient.instance.clearSecureTokens();
  }

  Future<String?> registerPushNotifications() async {
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission();
      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        diagnostics.fcmStatus = 'permission_denied';
        return null;
      }
      final token = await messaging.getToken();
      diagnostics.fcmStatus = token != null ? 'ready' : 'unavailable';
      final user = _auth?.currentUser;
      if (token != null && user != null && _db != null) {
        final path = 'users/${user.uid}/private/info';
        try {
          await _db!
              .collection('users')
              .doc(user.uid)
              .collection('private')
              .doc('info')
              .set({
            'uid': user.uid,
            'fcmToken': token,
            'updatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
        } catch (e) {
          _handleFirestoreError(e, OperationType.write, path);
        }
      }
      return token;
    } catch (e) {
      diagnostics.fcmStatus = kIsWeb
          ? 'needs_web_vapid_key'
          : 'needs_platform_push_config';
      MizoApiClient.instance.recordExternalError('firebase/fcm', e.toString());
      return null;
    }
  }

  Future<void> syncProfileToFirestore(UserProfile profile) async {
    final user = _auth?.currentUser;
    if (user == null || user.isAnonymous || _db == null) return;

    final path = 'users/${user.uid}';
    final ref = _db!.collection('users').doc(user.uid);
    try {
      final snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          'uid': user.uid,
          'userId': profile.userId,
          'username': profile.username.trim().substring(
              0, profile.username.trim().length.clamp(1, 40)),
          'bio': profile.bio.substring(0, profile.bio.length.clamp(0, 240)),
          'avatar': profile.avatar,
          'coverImage': profile.coverImage,
          'profileTheme': profile.profileTheme,
          'profilePrivacy': profile.profilePrivacy,
          'level': profile.level.clamp(1, 99),
          'xp': profile.xp,
          'verified': false,
          'vipLevel': 0,
          'svipLevel': 0,
          'followersCount': profile.followers,
          'followingCount': profile.following,
          'totalLikes': 7500,
          'totalProfileViews': profile.totalProfileViews,
          'equippedFrameId': profile.equippedFrameId ?? '',
          'equippedEntryId': profile.equippedEntryId ?? '',
          'equippedAssetId': profile.equippedAssetId ?? '',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      } else {
        await ref.update({
          'username': profile.username.trim().substring(
              0, profile.username.trim().length.clamp(1, 40)),
          'bio': profile.bio.substring(0, profile.bio.length.clamp(0, 240)),
          'avatar': profile.avatar,
          'coverImage': profile.coverImage,
          'profileTheme': profile.profileTheme,
          'profilePrivacy': profile.profilePrivacy,
          'equippedFrameId': profile.equippedFrameId ?? '',
          'equippedEntryId': profile.equippedEntryId ?? '',
          'equippedAssetId': profile.equippedAssetId ?? '',
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      try {
        _handleFirestoreError(e, OperationType.write, path);
      } catch (_) {}
    }
  }

  Future<void> submitReportToFirestore({
    required String targetName,
    required String targetType,
    required String reason,
  }) async {
    final user = _auth?.currentUser;
    if (user == null || _db == null) return;
    try {
      final safeId = targetName
          .replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_')
          .substring(0, targetName.length.clamp(0, 80));
      await _db!.collection('reports').add({
        'reporterUid': user.uid,
        'targetId': safeId.isEmpty ? 'target' : safeId,
        'targetName': targetName,
        'targetType': targetType,
        'reason': reason,
        'status': 'open',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      try {
        _handleFirestoreError(e, OperationType.create, 'reports');
      } catch (_) {}
    }
  }

  Future<String?> uploadXFile(String folder, XFile file) async {
    final user = _auth?.currentUser;
    if (user == null || _storage == null) return null;
    try {
      final bytes = await file.readAsBytes();
      final rawName = file.name.isNotEmpty ? file.name : 'upload.bin';
      final safeName = rawName.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
      final path = folder == 'profile'
          ? 'users/${user.uid}/profile/${DateTime.now().millisecondsSinceEpoch}_$safeName'
          : '$folder/${user.uid}/${DateTime.now().millisecondsSinceEpoch}_$safeName';
      final lower = safeName.toLowerCase();
      final contentType = lower.endsWith('.mp4') || lower.endsWith('.mov')
          ? 'video/mp4'
          : 'image/jpeg';
      final ref = _storage!.ref(path);
      await ref.putData(bytes, SettableMetadata(contentType: contentType));
      return await ref.getDownloadURL();
    } catch (e) {
      MizoApiClient.instance.recordExternalError('storage/upload', e.toString());
      return null;
    }
  }
}
