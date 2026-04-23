#!/bin/bash
# Generate self-signed SSL certificate for offline/air-gapped deployment
# Run this once before starting the system

mkdir -p nginx/certs

openssl req -x509 \
  -newkey rsa:4096 \
  -keyout nginx/certs/key.pem \
  -out nginx/certs/cert.pem \
  -days 365 \
  -nodes \
  -subj "/C=IN/ST=Delhi/L=Delhi/O=SIEM System/CN=siem-server"

echo "✅ SSL certificates generated in nginx/certs/"
echo "   cert.pem — certificate"
echo "   key.pem  — private key"
echo ""
echo "Now run: docker-compose up --build"
