#!/bin/ash

yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
yum install https://rpm.nodesource.com/pub_21.x/nodistro/repo/nodesource-release-nodistro-1.noarch.rpm -y
yum install nodejs -y --setopt=nodesource-nodejs.module_hotfixes=1
yum install python34 python34-pip -y
node -v
npm -v
python3 --version
pip3 --version
