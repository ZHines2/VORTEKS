#!/bin/bash

# Icon generation script for Steam desktop builds
# This script converts the main icon to Windows ICO and macOS ICNS formats

echo "Generating desktop app icons for Steam builds..."

# Check if ImageMagick is available (for ICO generation)
if command -v convert &> /dev/null; then
    echo "Converting PNG to ICO for Windows..."
    
    # Create 256x256 ICO file for Windows
    convert vortexicon.png -resize 256x256 icons/icon-256x256.ico
    
    echo "Windows ICO created: icons/icon-256x256.ico"
else
    echo "ImageMagick not available. Skipping ICO generation."
    echo "Install ImageMagick with: sudo apt-get install imagemagick"
fi

# Check if iconutil is available (macOS only, for ICNS generation)
if command -v iconutil &> /dev/null; then
    echo "Converting PNG to ICNS for macOS..."
    
    # Create iconset directory
    mkdir -p icons/icon.iconset
    
    # Generate different sizes for ICNS
    convert vortexicon.png -resize 16x16 icons/icon.iconset/icon_16x16.png
    convert vortexicon.png -resize 32x32 icons/icon.iconset/icon_16x16@2x.png
    convert vortexicon.png -resize 32x32 icons/icon.iconset/icon_32x32.png
    convert vortexicon.png -resize 64x64 icons/icon.iconset/icon_32x32@2x.png
    convert vortexicon.png -resize 128x128 icons/icon.iconset/icon_128x128.png
    convert vortexicon.png -resize 256x256 icons/icon.iconset/icon_128x128@2x.png
    convert vortexicon.png -resize 256x256 icons/icon.iconset/icon_256x256.png
    convert vortexicon.png -resize 512x512 icons/icon.iconset/icon_256x256@2x.png
    convert vortexicon.png -resize 512x512 icons/icon.iconset/icon_512x512.png
    convert vortexicon.png -resize 1024x1024 icons/icon.iconset/icon_512x512@2x.png
    
    # Create ICNS file
    iconutil -c icns icons/icon.iconset
    
    # Move to final location
    mv icons/icon.icns icons/icon-512x512.icns
    
    # Clean up
    rm -rf icons/icon.iconset
    
    echo "macOS ICNS created: icons/icon-512x512.icns"
else
    echo "iconutil not available (not on macOS). Skipping ICNS generation."
    echo "ICNS files can be generated on macOS using this script."
fi

# For Linux, use existing PNG files (AppImage will use 512x512 PNG)
echo "Linux will use existing PNG icons"

echo "Icon generation complete!"
echo ""
echo "Generated files:"
echo "- icons/icon-256x256.ico (Windows)"
echo "- icons/icon-512x512.icns (macOS - if on macOS)"
echo "- icons/icon-512x512.png (Linux - already exists)"