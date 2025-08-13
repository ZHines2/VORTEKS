#!/bin/bash

# Quick Steam build test script
# This script builds and tests the desktop version of VORTEKS

echo "🎮 VORTEKS Steam Build Test"
echo "=========================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Build web assets
echo "🔧 Building web assets..."
npm run build

# Test Electron in development mode
echo "🖥️ Testing desktop app..."
echo "Press Ctrl+C to stop when done testing"
echo ""

npm run electron-dev