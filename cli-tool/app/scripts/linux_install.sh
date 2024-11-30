#!/bin/bash

# Set the DEBIAN_FRONTEND to noninteractive to disable prompts
export DEBIAN_FRONTEND=noninteractive

# Set the timezone to a default value (e.g., UTC)
echo "Etc/UTC" > /etc/timezone
dpkg-reconfigure -f noninteractive tzdata

# Update package index
echo "Updating package index..."
apt update -y

# Install curl
echo "Installing curl..."
apt install -y curl

# Install Node.js and npm (from the official NodeSource repository)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -  # For Node.js 16 (LTS)
apt install -y nodejs

# Verify Node installation
echo "Node.js and npm versions:"
node -v
npm -v

# Install Python 3 and related dependencies
echo "Installing Python..."
apt install -y python3 python3-pip python3-dev

# Verify Python and Pip installation
echo "Python and pip versions:"
python3 --version
pip3 --version
tail -f /dev/null
