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
APP_DIR="$PAYLOAD_DIR/AyushMuzic.app"
OUTPUT_IPA="$ROOT_DIR/build/AyushMuzic.ipa"

mkdir -p "$BUILD_DIR"
rm -rf "$ARCHIVE_PATH" "$PAYLOAD_DIR" "$OUTPUT_IPA"

if command -v xcodebuild >/dev/null 2>&1; then
    echo "Step 1: Compiling AyushMuzic via xcodebuild (macOS host)..."
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
    mkdir -p "$PAYLOAD_DIR"
    cp -R "$APP_BUNDLE" "$PAYLOAD_DIR/"
else
    echo "Step 1: Staging AyushMuzic iOS Bundle (cross-platform packaging on Linux)..."
    mkdir -p "$APP_DIR"
    
    # Copy Info.plist and PkgInfo
    cp "$IOS_PROJECT_DIR/AyushMuzic/Info.plist" "$APP_DIR/"
    cp "$IOS_PROJECT_DIR/AyushMuzic/PkgInfo" "$APP_DIR/"
    
    # Copy ARM64 Mach-O executable
    cp "$IOS_PROJECT_DIR/AyushMuzic/AyushMuzic" "$APP_DIR/"
    chmod +x "$APP_DIR/AyushMuzic"
    
    # Copy www web application bundle
    cp -R "$IOS_PROJECT_DIR/AyushMuzic/www" "$APP_DIR/"
    
    # Copy App Icons
    ICON_SRC="$IOS_PROJECT_DIR/AyushMuzic/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"
    if [ -f "$ICON_SRC" ]; then
        cp "$ICON_SRC" "$APP_DIR/AppIcon.png"
        cp "$ICON_SRC" "$APP_DIR/AppIcon60x60@2x.png"
        cp "$ICON_SRC" "$APP_DIR/AppIcon60x60@3x.png"
        cp "$ICON_SRC" "$APP_DIR/AppIcon76x76@2x~ipad.png"
    fi
    echo "Staged app bundle at: $APP_DIR"
fi

echo "Step 2: Compressing Payload into standalone IPA package..."
mkdir -p "$ROOT_DIR/build"
(cd "$BUILD_DIR" && zip -qr "$OUTPUT_IPA" Payload)

if [ -f "$OUTPUT_IPA" ]; then
    echo "SUCCESS: Created AyushMuzic.ipa at $OUTPUT_IPA ($(du -h "$OUTPUT_IPA" | cut -f1))"
else
    echo "ERROR: Failed to generate IPA!"
    exit 1
fi
