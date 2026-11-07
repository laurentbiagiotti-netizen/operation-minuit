#!/usr/bin/env bash
set -euo pipefail

SERVER="${SERVER:-utilisateur@adresse-du-serveur}"
SSH_PORT="22"
REMOTE_DIR="${REMOTE_DIR:-/home/utilisateur/operation-minuit}"
HOST_PORT="8590"

cd "$(dirname "$0")"
[ -f site/index.html ] || { echo "site/index.html introuvable : lance le script depuis le dossier operation-minuit"; exit 1; }

echo "1/3 Empaquetage"
EXTRA=""; [ -f .env ] && EXTRA=".env"
tar --exclude='*.tar.gz' -czf /tmp/operation-minuit.tar.gz Dockerfile nginx.conf docker-compose.yml remote_deploy.sh site api $EXTRA

echo "2/3 Envoi vers $SERVER:$REMOTE_DIR"
ssh -p "$SSH_PORT" "$SERVER" "mkdir -p $REMOTE_DIR"
scp -P "$SSH_PORT" /tmp/operation-minuit.tar.gz "$SERVER:$REMOTE_DIR/"
rm -f /tmp/operation-minuit.tar.gz

echo "3/3 Construction et lancement (mot de passe sudo du serveur demandé)"
ssh -tt -p "$SSH_PORT" "$SERVER" "cd $REMOTE_DIR && rm -rf site api && tar xzf operation-minuit.tar.gz && rm operation-minuit.tar.gz && chmod +x remote_deploy.sh && bash remote_deploy.sh $HOST_PORT"

echo "Termine. Le port utilise est affiche juste au-dessus (ligne OK)."
