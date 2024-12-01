#!/bin/bash

dnf update -y
dnf install nodejs -y
dnf install python3 python-pip

# Verify installations
node -v
npm -v
python3 --version
pip3 --version
