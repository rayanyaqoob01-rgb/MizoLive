import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class AppConfig {
  static const String appName = 'MizoLive';
  static const String tagline = 'Live · Connect · Enjoy';
  static const String packageId = 'com.mizolive.app';
  static const String iosBundleId = 'com.mizolive.app';
  static const String adminEmail = 'rayanyaqoob01@gmail.com';
  static const String firestoreDatabaseId =
      'ai-studio-mizolive-46ce76ea-01ad-40ad-8cae-408be2034dab';

  static const String googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue:
        '918229305609-b2o4v9hko5iiotveksqdilst5qqu20jq.apps.googleusercontent.com',
  );

  // Passed at build/run time via --dart-define=MIZO_API_BASE_URL=...
  static const String apiBaseUrl = String.fromEnvironment(
    'MIZO_API_BASE_URL',
    defaultValue:
        'https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app',
  );

  static const String agoraAppIdOverride =
      String.fromEnvironment('AGORA_APP_ID', defaultValue: '');

  static const String firebaseWebApiKey = String.fromEnvironment(
    'FIREBASE_WEB_API_KEY',
    defaultValue: 'AIzaSyBmMJCfHiXTg2qZorYERaPKARC239XISyo',
  );

  static const String firebaseWebAppId = String.fromEnvironment(
    'FIREBASE_WEB_APP_ID',
    defaultValue: '1:918229305609:web:cd2de27f1862e854c4ebd8',
  );

  static const String firebaseAndroidApiKey = String.fromEnvironment(
    'FIREBASE_ANDROID_API_KEY',
    defaultValue: 'AIzaSyBmMJCfHiXTg2qZorYERaPKARC239XISyo',
  );

  static const String firebaseAndroidAppId = String.fromEnvironment(
    'FIREBASE_ANDROID_APP_ID',
    defaultValue: '1:918229305609:web:cd2de27f1862e854c4ebd8',
  );

  static const String firebaseIosApiKey = String.fromEnvironment(
    'FIREBASE_IOS_API_KEY',
    defaultValue: 'AIzaSyBmMJCfHiXTg2qZorYERaPKARC239XISyo',
  );

  static const String firebaseIosAppId = String.fromEnvironment(
    'FIREBASE_IOS_APP_ID',
    defaultValue: '1:918229305609:web:cd2de27f1862e854c4ebd8',
  );

  static FirebaseOptions get firebaseOptions {
    if (kIsWeb) {
      return const FirebaseOptions(
        apiKey: firebaseWebApiKey,
        appId: firebaseWebAppId,
        messagingSenderId: '918229305609',
        projectId: 'gen-lang-client-0785177825',
        authDomain: 'gen-lang-client-0785177825.firebaseapp.com',
        storageBucket: 'gen-lang-client-0785177825.firebasestorage.app',
      );
    }
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return const FirebaseOptions(
        apiKey: firebaseIosApiKey,
        appId: firebaseIosAppId,
        messagingSenderId: '918229305609',
        projectId: 'gen-lang-client-0785177825',
        authDomain: 'gen-lang-client-0785177825.firebaseapp.com',
        storageBucket: 'gen-lang-client-0785177825.firebasestorage.app',
        iosBundleId: iosBundleId,
      );
    }
    return const FirebaseOptions(
      apiKey: firebaseAndroidApiKey,
      appId: firebaseAndroidAppId,
      messagingSenderId: '918229305609',
      projectId: 'gen-lang-client-0785177825',
      authDomain: 'gen-lang-client-0785177825.firebaseapp.com',
      storageBucket: 'gen-lang-client-0785177825.firebasestorage.app',
    );
  }
}
