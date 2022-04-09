#!/bin/bash
tar czf fileServer.tar.gz connection logger middleware modules utils index.js package.json
scp -i ~/.ssh/danlu.in.pem fileServer.tar.gz ubuntu@3.108.216.80:~/
rm fileServer.tar.gz
ssh -i ~/.ssh/danlu.in.pem ubuntu@3.108.216.80<<'ENDSSH'
mkdir fileServer
sudo tar xf fileServer.tar.gz -C fileServer
rm fileServer.tar.gz
ENDSSH