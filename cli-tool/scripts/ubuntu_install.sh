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


# Install Node.js
echo "Installing Node.js..."
apt install -y nodejs

# Verify Node installation
echo "Node.js and npm versions:"
node -v
npm -v

# Install Python
echo "Installing Python..."
apt install -y python3

# Install Pip
echo "Installing Pip..."
apt install -y pip

# Verify Python and Pip installation
echo "Python and pip versions:"
python3 --version
pip --version
pip3 --version
tail -f /dev/null



