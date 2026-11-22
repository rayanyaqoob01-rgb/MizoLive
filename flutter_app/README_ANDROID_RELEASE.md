# MizoLive Flutter Android Release Guide

## 1. Prerequisites
- Flutter SDK (stable, Dart >= 3.4)
- Java 17 (Temurin JDK 17)
- Android SDK Platform 35 + Build-Tools 35.0.0

## 2. Generate Play Store Upload Keystore (Once)
```bash
keytool -genkey -v \
  -keystore mizolive-upload-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias mizolive
```
Copy `android/key.properties.example` to `android/key.properties` and fill in your keystore path and passwords (never commit `key.properties` or `.jks` files).

## 3. Add Android Firebase Configuration
Download `google-services.json` for `com.mizolive.app` from Firebase Project `gen-lang-client-0785177825` (including your SHA-1/SHA-256 keystore fingerprints for Google Sign-In) and place it at:
`flutter_app/android/app/google-services.json`

## 4. Build Commands
```bash
cd flutter_app
flutter pub get
flutter analyze
flutter test

# Signed Release APK (direct Android installation)
flutter build apk --release \
  --dart-define=MIZO_API_BASE_URL=https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app

# Signed Release AAB (Google Play Store upload)
flutter build appbundle --release \
  --dart-define=MIZO_API_BASE_URL=https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app
```

## 5. GitHub Actions CI/CD Secrets
Configure these repository secrets in GitHub to run `.github/workflows/android-release.yml`:
- `ANDROID_KEYSTORE_BASE64`: `base64 -w0 mizolive-upload-key.jks`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `GOOGLE_SERVICES_JSON_BASE64` (optional, recommended for FCM + Google Sign-In)
- `MIZO_API_BASE_URL` (optional override; defaults to the live Cloud Run URL)
