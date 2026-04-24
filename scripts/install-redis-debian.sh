#!/usr/bin/env bash
# Install Redis on Ubuntu/Debian (localhost only). Run on your dev machine and on the production app server.
set -euo pipefail

sudo apt-get update
sudo apt-get install -y redis-server

# Prefer systemd supervision (Ubuntu default package)
if grep -q '^supervised no' /etc/redis/redis.conf 2>/dev/null; then
  sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
fi

# Loopback only (IPv4 + IPv6). Must be "::1", not "-::1" — the latter breaks Redis startup.
sudo sed -i 's/^bind 127\.0\.0\.1 -::1$/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
if ! grep -qE '^bind 127\.0\.0\.1' /etc/redis/redis.conf; then
  sudo sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
fi

sudo systemctl enable redis-server
sudo systemctl restart redis-server

redis-cli ping

echo ""
echo "OK. Add to .env.local (dev) and production env:"
echo "  REDIS_URL=redis://127.0.0.1:6379"
echo "With password: REDIS_URL=redis://:YOUR_PASSWORD@127.0.0.1:6379"
