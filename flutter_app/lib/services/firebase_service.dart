import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../config/app_config.dart';
import '../models/mizo_models.dart';
import 'api_client.dart';

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
    final googleUser = await GoogleSignIn().signIn();
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
    final googleUser = await GoogleSignIn().signIn();
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
      await GoogleSignIn().signOut();
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
      }
      return token;
    } catch (e) {
      diagnostics.fcmStatus = 'needs_google_services_json';
      MizoApiClient.instance.recordExternalError('firebase/fcm', e.toString());
      return null;
    }
  }

  Future<void> syncProfileToFirestore(UserProfile profile) async {
    final user = _auth?.currentUser;
    if (user == null || user.isAnonymous || _db == null) return;

    final ref = _db!.collection('users').doc(user.uid);
    try {
      final snap = await ref.get();
      final payload = <String, dynamic>{
        'uid': user.uid,
        'userId': profile.userId,
        'username': profile.username,
        'bio': profile.bio,
        'avatar': profile.avatar,
        'coverImage': profile.coverImage,
        'profileTheme': profile.profileTheme,
        'profilePrivacy': profile.profilePrivacy,
        'level': profile.level.clamp(1, 99),
        'xp': profile.xp,
        'equippedFrameId': profile.equippedFrameId ?? '',
        'equippedEntryId': profile.equippedEntryId ?? '',
        'equippedAssetId': profile.equippedAssetId ?? '',
        'updatedAt': FieldValue.serverTimestamp(),
      };
      if (!snap.exists) {
        payload['verified'] = false;
        payload['vipLevel'] = 0;
        payload['svipLevel'] = 0;
        payload['followersCount'] = profile.followers;
        payload['followingCount'] = profile.following;
        payload['totalLikes'] = 7500;
        payload['totalProfileViews'] = profile.totalProfileViews;
        payload['createdAt'] = FieldValue.serverTimestamp();
      }
      await ref.set(payload, SetOptions(merge: true));
    } catch (e) {
      MizoApiClient.instance
          .recordExternalError('firestore/syncProfile', e.toString(), 403);
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
      MizoApiClient.instance
          .recordExternalError('firestore/report', e.toString(), 403);
    }
  }

  Future<String?> uploadFile(String folder, File file) async {
    final user = _auth?.currentUser;
    if (user == null || _storage == null) return null;
    try {
      final name = '${DateTime.now().millisecondsSinceEpoch}_${file.uri.pathSegments.last}';
      final path = folder == 'profile'
          ? 'users/${user.uid}/profile/$name'
          : '$folder/${user.uid}/$name';
      final ref = _storage!.ref(path);
      await ref.putFile(file);
      return await ref.getDownloadURL();
    } catch (e) {
      MizoApiClient.instance.recordExternalError('storage/upload', e.toString());
      return null;
    }
  }
}
