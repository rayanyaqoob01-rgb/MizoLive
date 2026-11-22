# MizoLive — Multi-Platform Production Deployment & Publishing Guide

## 1. Architecture Overview
- **Shared Cross-Platform Client**: `flutter_app/` (Web, Android `com.mizolive.app`, iOS `com.mizolive.app`)
- **Backend API & WebSocket Signaling**: Express + Agora Token Generator (`server.ts`) hosted on Cloud Run (`https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app`)
- **Database, Auth & Storage**: Firebase Project `gen-lang-client-0785177825`, Firestore Database `ai-studio-mizolive-46ce76ea-01ad-40ad-8cae-408be2034dab`

---

## 2. Website Deployment (Flutter Web + Firebase Hosting)

1. Configure backend environment secrets on Cloud Run / server:
   - `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` (required for live video, PK battles, audio/video party rooms, and calls)
   - `ALLOWED_ORIGINS` (e.g. `https://gen-lang-client-0785177825.web.app,https://gen-lang-client-0785177825.firebaseapp.com`)
2. Build production Web bundle:
   ```bash
   cd flutter_app
   flutter pub get
   flutter build web --release \
     --dart-define=MIZO_API_BASE_URL=https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app
   ```
   Output directory: `flutter_app/build/web/`
3. Deploy to Firebase Hosting (preconfigured in root `firebase.json` and `.firebaserc`):
   ```bash
   cd ..
   firebase login
   firebase deploy --only hosting,firestore:rules,storage
   ```
4. Add your Firebase Hosting domain (`gen-lang-client-0785177825.web.app`) to **Firebase Console → Authentication → Settings → Authorized domains**.

---

## 3. Google Play Store Publishing (Android)

1. Generate your upload keystore once:
   ```bash
   keytool -genkey -v -keystore mizolive-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mizolive
   ```
2. Add your SHA-1 & SHA-256 keystore fingerprints to **Firebase Console → Project Settings → Android App (`com.mizolive.app`)**, download `google-services.json`, and place at `flutter_app/android/app/google-services.json`.
3. Create `flutter_app/android/key.properties` from `key.properties.example` (never commit `.jks` or `key.properties`).
4. Build signed APK & AAB:
   ```bash
   cd flutter_app
   flutter build apk --release --dart-define=MIZO_API_BASE_URL=https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app
   flutter build appbundle --release --dart-define=MIZO_API_BASE_URL=https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app
   ```
5. In **Google Play Console**:
   - Create app `MizoLive` (`com.mizolive.app`)
   - Complete Data Safety, Content Rating, Privacy Policy URL, and App Access declarations
   - Upload `build/app/outputs/bundle/release/app-release.aab` (or `MizoLive-Android-AAB` artifact from GitHub Actions) to Internal Testing / Production track.

---

## 4. Apple App Store Publishing (iOS)

1. In **Apple Developer Portal**:
   - Register App ID `com.mizolive.app` with **Push Notifications** capability
   - Create an **Apple Distribution Certificate** (`.p12`) and an **App Store Provisioning Profile** for `com.mizolive.app`
2. In **Firebase Console**:
   - Add iOS App (`com.mizolive.app`), download `GoogleService-Info.plist` into `flutter_app/ios/Runner/GoogleService-Info.plist`
   - Add `REVERSED_CLIENT_ID` from `GoogleService-Info.plist` into `CFBundleURLSchemes` in `flutter_app/ios/Runner/Info.plist` for iOS Google Sign-In
   - Upload your APNs Authentication Key (`.p8`) to **Firebase Cloud Messaging** settings
3. Configure `flutter_app/ios/ExportOptions.plist` from `ExportOptions.plist.example` with your Apple Team ID and provisioning profile name.
4. On macOS with Xcode 15+:
   ```bash
   cd flutter_app
   flutter pub get
   cd ios && pod install --repo-update && cd ..
   flutter build ipa --release \
     --export-options-plist=ios/ExportOptions.plist \
     --dart-define=MIZO_API_BASE_URL=https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app
   ```
5. Upload `build/ios/ipa/*.ipa` via Apple **Transporter** or `xcrun altool` to **App Store Connect**, complete App Privacy & Age Rating, and submit for review.

---

## 5. GitHub Actions CI/CD Secrets Required (`.github/workflows/build-all-platforms.yml`)
- **Backend URL**: `MIZO_API_BASE_URL`
- **Android**: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `GOOGLE_SERVICES_JSON_BASE64`
- **iOS**: `APPLE_CERTIFICATE_BASE64`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_PROVISIONING_PROFILE_BASE64`, `APPLE_EXPORT_OPTIONS_PLIST_BASE64`, `KEYCHAIN_PASSWORD`, `GOOGLE_SERVICE_INFO_PLIST_BASE64`
