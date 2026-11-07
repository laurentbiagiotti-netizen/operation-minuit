#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-8590}"
if [ -f .port ]; then PORT="$(cat .port)"; fi
if sudo docker compose version >/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi
sudo $DC down --remove-orphans >/dev/null 2>&1 || true
port_pris() {
  if command -v ss >/dev/null 2>&1 && sudo ss -ltnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$1\$"; then return 0; fi
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && return 0
  sudo docker ps --format '{{.Ports}}' 2>/dev/null | grep -qE "[:.]$1->" && return 0
  return 1
}
while port_pris "$PORT"; do PORT=$((PORT+1)); done
echo "$PORT" > .port
echo "Port retenu : $PORT"
sudo HOST_PORT="$PORT" $DC up -d --build --force-recreate
sleep 3
sudo HOST_PORT="$PORT" $DC ps
BIND="$(grep -E '^BIND_ADDR=' .env 2>/dev/null | tail -n 1 | cut -d= -f2 | tr -d '\r\n ' || true)"
H="${BIND:-127.0.0.1}"; [ "$H" = "0.0.0.0" ] && H=127.0.0.1
sleep 2
if curl -fsS "http://$H:$PORT/api/config" >/dev/null; then echo "Classement : OK"; else echo "ATTENTION : l'API du classement ne répond pas (sudo docker logs operation-minuit-api)"; fi
if curl -fsS "http://$H:$PORT/healthz" >/dev/null; then echo "OK : le jeu répond sur le port $PORT (adresse $H)"; else echo "ATTENTION : pas de réponse sur le port $PORT"; exit 1; fi
