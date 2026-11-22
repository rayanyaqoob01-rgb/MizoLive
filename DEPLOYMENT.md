# MizoLive — Multi-Platform Production Deployment & Publishing Guide

## 1. Architecture Overview
- **Primary Client (Web, Android, iOS)**: React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Capacitor 8 (`com.mizolive.app`, `dist/`)
- **Backend API & WebSocket Signaling**: Express + Agora Token Generator (`server.ts`) hosted on Cloud Run (`https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app`)
- **Database, Auth & Storage**: Firebase Project `gen-lang-client-0785177825`, Firestore Database `ai-studio-mizolive-46ce76ea-01ad-40ad-8cae-408be2034dab`

---

## 2. Website Deployment (Vite Production `dist/` + Firebase Hosting)

1. Configure backend environment secrets on Cloud Run / server:
   - `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` (required for live video, PK battles, audio/video party rooms, and calls)
   - `ALLOWED_ORIGINS` (`https://gen-lang-client-0785177825.web.app,https://gen-lang-client-0785177825.firebaseapp.com`)
2. Build production Web bundle locally (or download `MizoLive-Web` artifact from GitHub Actions):
   ```bash
   npm ci
   VITE_API_BASE_URL="https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app" npm run build
   ```
   Output directory: `dist/`
3. Deploy to Firebase Hosting (preconfigured in root `firebase.json` and `.firebaserc`):
   ```bash
   firebase login
   firebase deploy --only hosting,firestore:rules,storage
   ```
4. Ensure `gen-lang-client-0785177825.web.app` and `gen-lang-client-0785177825.firebaseapp.com` are listed in **Firebase Console → Authentication → Settings → Authorized domains**.

---

## 3. Google Play Store Publishing (Capacitor Android — JDK 21 & API 36)

1. Generate your Android upload keystore once:
   ```bash
   keytool -genkey -v -keystore mizolive-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mizolive
   ```
2. Add your SHA-1 & SHA-256 keystore fingerprints in **Firebase Console → Project Settings → Android App (`com.mizolive.app`)**, download `google-services.json`, and place at `android/app/google-services.json` (or store Base64 in `GOOGLE_SERVICES_JSON_BASE64`).
3. Create `android/key.properties` from `android/key.properties.example` for local builds (or configure GitHub Secrets for CI).
4. Build APK & Play Store AAB locally:
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   ./gradlew assembleRelease bundleRelease
   ```
5. In **Google Play Console**:
   - Create app `MizoLive` (`com.mizolive.app`)
   - Complete Data Safety, Content Rating, Privacy Policy URL, and App Access declarations
   - Upload `MizoLive-release.aab` (from `MizoLive-Android-Release-AAB` GitHub Actions artifact or `android/app/build/outputs/bundle/release/`) to Internal Testing / Production track.

---

## 4. Apple App Store Publishing (Capacitor iOS — Swift Package Manager)

1. In **Apple Developer Portal**:
   - Register App ID `com.mizolive.app` with **Push Notifications** capability
   - Create an **Apple Distribution Certificate** (`.p12`) and an **App Store Provisioning Profile** for `com.mizolive.app`
2. In **Firebase Console**:
   - Add iOS App (`com.mizolive.app`), download `GoogleService-Info.plist` into `ios/App/App/GoogleService-Info.plist`
   - Upload your APNs Authentication Key (`.p8`) to **Firebase Cloud Messaging** settings
3. Configure `ios/App/ExportOptions.plist` from `ios/App/ExportOptions.plist.example` with your Apple Team ID and provisioning profile name.
4. On macOS with Xcode 15+:
   ```bash
   npm ci
   npm run build
   npx cap sync ios
   xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -sdk iphoneos -archivePath build/MizoLive.xcarchive archive
   xcodebuild -exportArchive -archivePath build/MizoLive.xcarchive -exportOptionsPlist ios/App/ExportOptions.plist -exportPath build/ipa
   ```
5. Upload `MizoLive-iOS.ipa` via Apple **Transporter** or `xcrun altool` to **App Store Connect**, complete App Privacy & Age Rating, and submit for review.

---

## 5. GitHub Actions CI/CD Secrets Required
- **Optional Backend URL Override**: `VITE_API_BASE_URL` (defaults to Cloud Run production URL)
- **Android**: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `GOOGLE_SERVICES_JSON_BASE64` (optional)
- **iOS**: `APPLE_CERTIFICATE_BASE64`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_PROVISIONING_PROFILE_BASE64`, `APPLE_EXPORT_OPTIONS_PLIST_BASE64`, `KEYCHAIN_PASSWORD`, `GOOGLE_SERVICE_INFO_PLIST_BASE64` (optional)
