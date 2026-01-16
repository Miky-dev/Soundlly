#!/bin/bash

# setup_aws.sh
# Script to automate basic setup for Soundlly on Ubuntu EC2
# Run this on your server: bash setup_aws.sh

echo "--- Starting Server Setup ---"

# 1. Update System
echo "[1/5] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Git and Curl
echo "[2/5] Installing Git and Curl..."
sudo apt install -y git curl

# 3. Install Node.js (v20 LTS recommended)
echo "[3/5] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2 (Process Manager)
echo "[4/5] Installing PM2..."
sudo npm install -g pm2

# 5. Check Versions
echo "[5/5] Checking installed versions..."
node -v
npm -v
pm2 -v
git --version

echo "--- Setup Complete! ---"
echo "You can now clone your repository."
