#!/bin/bash

wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y git npm
sudo npm install -g ts-node mongodb @types/node
git clone https://github.com/dcep93/spotify_artist_traverse.git
cd spotify_artist_traverse
vim node/secrets.json
ts-node node/run.ts
