# VORTEKS Mobile App Store Guide

This guide explains how to build and submit VORTEKS to the iOS App Store and Google Play Store.

## Prerequisites

### For iOS
- macOS with Xcode installed
- Apple Developer Account ($99/year)
- CocoaPods installed (`sudo gem install cocoapods`)

### For Android
- Android Studio installed
- Java Development Kit (JDK) 11 or later
- Google Play Console Account ($25 one-time fee)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the web assets and sync with native platforms:
```bash
npm run sync
```

## Building for iOS

1. Open the iOS project in Xcode:
```bash
npx cap open ios
```

2. In Xcode:
   - Select your development team in the Signing & Capabilities tab
   - Change the Bundle Identifier if needed (com.zhines2.vorteks)
   - Set your deployment target (iOS 13.0+)
   - Archive the app (Product → Archive)
   - Upload to App Store Connect

## Building for Android

1. Open the Android project in Android Studio:
```bash
npx cap open android
```

2. In Android Studio:
   - Build → Generate Signed Bundle / APK
   - Choose Android App Bundle (AAB)
   - Create or use existing keystore
   - Build release bundle
   - Upload to Google Play Console

## App Store Metadata

### App Name
VORTEKS - Unicode Card Battler

### Description
A tactical card battler featuring strategic gameplay with unique Unicode aesthetics. Battle AI opponents with distinct personas using energy management, card combinations, and special quirks. Features 13 unique cards, 5 AI personalities, and progressive unlock system.

### Keywords
card game, strategy, tactical, retro, unicode, indie game, single player

### Category
Games > Card

### Age Rating
4+ (suitable for all ages)

### Privacy Policy
Required for App Store submission. Create at: https://privacypolicytemplate.net/

### Screenshots Required
- iPhone (6.5", 5.5")
- iPad (12.9", 2nd gen)
- Android Phone
- Android Tablet

## App Store Requirements Checklist

### iOS App Store
- [ ] App uses HTTPS (handled by Capacitor)
- [ ] App supports latest iOS version
- [ ] App has proper icons (1024x1024 for App Store)
- [ ] App has launch screens
- [ ] Privacy policy URL
- [ ] App description and metadata
- [ ] Screenshots for all required device sizes

### Google Play Store
- [ ] App targets API level 33+ (Android 13)
- [ ] App bundle (AAB) under 150MB
- [ ] App has proper icons and screenshots
- [ ] Privacy policy URL
- [ ] Content rating questionnaire completed
- [ ] Store listing with description and graphics

## Build Commands

```bash
# Copy web assets to native platforms
npm run sync

# Build and run on iOS simulator
npm run ios

# Build and run on Android emulator  
npm run android

# Copy assets only
npm run copy-assets
```

## Troubleshooting

### iOS Issues
- If CocoaPods fails: `cd ios && pod install --repo-update`
- If build fails: Clean build folder in Xcode (Cmd+Shift+K)

### Android Issues
- If Gradle sync fails: File → Invalidate Caches and Restart
- If build fails: Check Android SDK and build tools are updated

## Revenue and Marketing

### Monetization Options
- Paid app ($2.99 - $4.99 recommended for premium card games)
- In-app purchases (additional card packs, themes)
- Freemium with full unlock ($1.99)

### ASO (App Store Optimization)
- Use relevant keywords in title and description
- High-quality screenshots showing gameplay
- Respond to user reviews
- Regular updates to maintain ranking

## Submission Timeline

- **iOS**: 1-7 days review time
- **Android**: 1-3 days review time
- **Initial submission**: May take longer for new developer accounts

Both platforms require regular updates to maintain visibility and ranking.