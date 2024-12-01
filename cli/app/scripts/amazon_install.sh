#!/bin/sh

# This script sets up Python and JavaScript development environments on Amazon Linux.
# It installs Node.js (via nvm and the NodeSource repository) and Python 3 (with pip), 
# ensuring both ecosystems are configured for development.

# Update system packages
yum update -y

# Install nvm (Node Version Manager) and configure it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh

# Add NodeSource repository and install Node.js
yum install https://rpm.nodesource.com/pub_21.x/nodistro/repo/nodesource-release-nodistro-1.noarch.rpm -y
yum install nodejs -y --setopt=nodesource-nodejs.module_hotfixes=1

# Install Python 3 and pip
yum install python3 python3-pip -y

# Verify installations
node -v
npm -v
python3 --version
pip3 --version
