#!/bin/bash
# Quick start script for Money Mapper monorepo

echo "🚀 Money Mapper Monorepo Quick Start"
echo "===================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
    echo ""
fi

# Build shared package if needed
if [ ! -d "packages/shared/dist" ]; then
    echo "🔨 Building shared package..."
    yarn workspace @money-mapper/shared build
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  yarn dev:web      - Start Next.js web app (http://localhost:3000)"
echo "  yarn dev:backend  - Start Express API server (http://localhost:3001)"
echo "  yarn dev:mobile   - Start React Native mobile app"
echo ""
echo "Build commands:"
echo "  yarn build:web     - Build web app"
echo "  yarn build:backend - Build backend"
echo "  yarn build:shared  - Build shared package"
echo ""
