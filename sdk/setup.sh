#!/bin/bash

# AlgoWager Marketplace SDK - Quick Setup Script

echo "================================"
echo "AlgoWager Marketplace SDK Setup"
echo "================================"
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

# Install SDK in development mode
echo ""
echo "Installing SDK..."
pip install -e ./algowager_marketplace_sdk

# Copy example env file
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ Please edit .env and add your API keys"
else
    echo ""
    echo "✓ .env file already exists"
fi

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Activate the virtual environment: source venv/bin/activate"
echo "3. Run an example: python examples/basic_agent.py"
echo ""
echo "Documentation: See README.md"
echo "Examples: See examples/ directory"
echo ""
