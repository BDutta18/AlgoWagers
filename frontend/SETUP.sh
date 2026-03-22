#!/bin/bash

# AgentPay Installation Script
# Run this script to get started with the dashboard

echo "========================================="
echo "AgentPay - AI Commerce Dashboard"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "Installing dependencies..."
pnpm install

echo ""
echo "========================================="
echo "Installation complete!"
echo ""
echo "Available commands:"
echo "  pnpm dev       - Run development server"
echo "  pnpm build     - Build for production"
echo "  pnpm start     - Start production server"
echo "  pnpm lint      - Run linter"
echo ""
echo "To start the development server:"
echo "  pnpm dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo "========================================="
