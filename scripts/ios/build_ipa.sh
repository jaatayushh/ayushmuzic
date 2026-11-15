#!/bin/bash
set -e

echo "=========================================================="
echo "   Building AyushMuzic iOS IPA for iPhone & iPad          "
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
IOS_PROJECT_DIR="$ROOT_DIR/iosApp"
BUILD_DIR="$ROOT_DIR/build/ios"
ARCHIVE_PATH="$BUILD_DIR/AyushMuzic.xcarchive"
PAYLOAD_DIR="$BUILD_DIR/Payload"
OUTPUT_IPA="$ROOT_DIR/build/AyushMuzic.ipa"

mkdir -p "$BUILD_DIR"
rm -rf "$ARCHIVE_PATH" "$PAYLOAD_DIR" "$OUTPUT_IPA"

echo "Step 1: Compiling AyushMuzic via xcodebuild..."
APP_BUNDLE=""

if xcodebuild archive \
    -project "$IOS_PROJECT_DIR/AyushMuzic.xcodeproj" \
    -scheme AyushMuzic \
    -configuration Release \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="" \
    AD_HOC_CODE_SIGNING_ALLOWED=YES; then
    APP_BUNDLE=$(find "$ARCHIVE_PATH/Products/Applications" -name "*.app" 2>/dev/null | head -1)
fi

if [ -z "$APP_BUNDLE" ] || [ ! -d "$APP_BUNDLE" ]; then
    echo "Archive build did not produce .app directly, attempting direct target build..."
    xcodebuild build \
        -project "$IOS_PROJECT_DIR/AyushMuzic.xcodeproj" \
        -target AyushMuzic \
        -configuration Release \
        -sdk iphoneos \
        CONFIGURATION_BUILD_DIR="$BUILD_DIR/Release-iphoneos" \
        CODE_SIGNING_ALLOWED=NO \
        CODE_SIGNING_REQUIRED=NO \
        CODE_SIGN_IDENTITY="" \
        AD_HOC_CODE_SIGNING_ALLOWED=YES
    APP_BUNDLE=$(find "$BUILD_DIR/Release-iphoneos" -name "*.app" 2>/dev/null | head -1)
fi

if [ -z "$APP_BUNDLE" ] || [ ! -d "$APP_BUNDLE" ]; then
    echo "ERROR: Failed to find built .app bundle!"
    exit 1
fi
echo "Found App Bundle: $APP_BUNDLE"

echo "Step 2: Staging Payload directory for IPA packaging..."
mkdir -p "$PAYLOAD_DIR"
cp -R "$APP_BUNDLE" "$PAYLOAD_DIR/"

echo "Step 3: Compressing into standalone IPA package..."
(cd "$BUILD_DIR" && zip -qr "$OUTPUT_IPA" Payload)

if [ -f "$OUTPUT_IPA" ]; then
    echo "SUCCESS: Created AyushMuzic.ipa at $OUTPUT_IPA ($(du -h "$OUTPUT_IPA" | cut -f1))"
else
    echo "ERROR: Failed to generate IPA!"
    exit 1
fi
