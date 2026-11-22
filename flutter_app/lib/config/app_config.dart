import 'package:firebase_core/firebase_core.dart';

class AppConfig {
  static const String appName = 'MizoLive';
  static const String tagline = 'Live · Connect · Enjoy';
  static const String packageId = 'com.mizolive.app';
  static const String adminEmail = 'rayanyaqoob01@gmail.com';
  static const String firestoreDatabaseId =
      'ai-studio-mizolive-46ce76ea-01ad-40ad-8cae-408be2034dab';

  // Passed at build/run time via --dart-define=MIZO_API_BASE_URL=...
  static const String apiBaseUrl = String.fromEnvironment(
    'MIZO_API_BASE_URL',
    defaultValue:
        'https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app',
  );

  // Optional Agora App ID override; primary token & App ID fetched from /api/agora/token
  static const String agoraAppIdOverride =
      String.fromEnvironment('AGORA_APP_ID', defaultValue: '');

  // Optional Android Firebase config overrides via --dart-define
  static const String firebaseAndroidApiKey = String.fromEnvironment(
    'FIREBASE_ANDROID_API_KEY',
    defaultValue: 'AIzaSyBmMJCfHiXTg2qZorYERaPKARC239XISyo',
  );

  static const String firebaseAndroidAppId = String.fromEnvironment(
    'FIREBASE_ANDROID_APP_ID',
    defaultValue: '1:918229305609:web:cd2de27f1862e854c4ebd8',
  );

  static FirebaseOptions get firebaseOptions => const FirebaseOptions(
        apiKey: firebaseAndroidApiKey,
        appId: firebaseAndroidAppId,
        messagingSenderId: '918229305609',
        projectId: 'gen-lang-client-0785177825',
        authDomain: 'gen-lang-client-0785177825.firebaseapp.com',
        storageBucket: 'gen-lang-client-0785177825.firebasestorage.app',
      );
}
