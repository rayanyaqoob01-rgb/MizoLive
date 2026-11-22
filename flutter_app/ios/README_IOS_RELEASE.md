# MizoLive iOS Release & App Store Publishing Guide

## 1. Prerequisites
- macOS with Xcode 15+ and CocoaPods (`sudo gem install cocoapods`)
- Flutter SDK (stable)
- Active Apple Developer Program membership

## 2. Signing & Firebase Setup
1. Set your Team and Provisioning Profile for bundle identifier `com.mizolive.app`.
2. Download `GoogleService-Info.plist` for iOS (`com.mizolive.app`) from Firebase Project `gen-lang-client-0785177825` and place at:
   `flutter_app/ios/Runner/GoogleService-Info.plist`
3. Copy the `REVERSED_CLIENT_ID` from `GoogleService-Info.plist` into `CFBundleURLSchemes` in `flutter_app/ios/Runner/Info.plist` for iOS Google Sign-In.
4. Copy `flutter_app/ios/ExportOptions.plist.example` to `ExportOptions.plist` with your Apple Team ID and App Store provisioning profile name.

## 3. Build Commands
```bash
cd flutter_app
flutter pub get
cd ios && pod install --repo-update && cd ..
flutter build ipa --release \
  --export-options-plist=ios/ExportOptions.plist \
  --dart-define=MIZO_API_BASE_URL=https://ais-dev-my3putbruhvu76iatjzmm7-15664674133.asia-northeast1.run.app
```
Generated `.ipa` output: `flutter_app/build/ios/ipa/`
