# Opération Minuit

Serious game en bande dessinée pour apprendre le SQL, créé par Cybersup. L'élève mène une enquête policière : chaque indice s'obtient en écrivant une requête SQL sur la base de l'enquête (suspects, appels, trafic réseau, transactions...).

- 310 missions réparties en chapitres, des quêtes annexes et des quêtes cachées, des boss au chrono et des quiz.
- Le SQL tourne dans le navigateur (SQLite en WebAssembly) pour afficher les résultats tout de suite, et un petit serveur corrige les réponses : les solutions et les indices ne sont jamais envoyés au navigateur.
- Un classement par classe, avec connexion par prénom et nom, ou par compte Google d'un domaine choisi.
- Un **mode difficile** optionnel : les mêmes missions sur de vrais moteurs, PostgreSQL 16, MariaDB 11, Oracle 23ai Free et SQL Server 2022, chacun avec son dialecte.

## Installation rapide

Il faut Docker avec Docker Compose (Docker Desktop sur Mac ou Windows, ou Docker Engine sur Linux).

```
git clone https://github.com/laurentbiagiotti-netizen/operation-minuit.git
cd operation-minuit
cp .env.exemple .env
docker compose up -d --build
```

Ouvrir ensuite http://localhost:8590 dans un navigateur. C'est tout : le jeu, la correction et le classement fonctionnent.

Pour arrêter : `docker compose down`. Le classement est gardé dans un volume Docker et survit aux redémarrages.

## Réglages (fichier .env)

| Variable | Rôle | Par défaut |
|---|---|---|
| `HOST_PORT` | Port sur lequel le jeu répond | `8590` |
| `BIND_ADDR` | Adresse d'écoute (`127.0.0.1` pour n'ouvrir le jeu qu'à la machine, utile derrière un proxy) | `0.0.0.0` |
| `GOOGLE_CLIENT_ID` | Active la connexion Google (voir plus bas) | vide, connexion par prénom et nom uniquement |
| `ALLOWED_DOMAIN` | Seuls les comptes Google de ce domaine sont acceptés | `votre-domaine.fr` |
| `COMPOSE_PROFILES` | Moteurs à lancer pour le mode difficile : les mêmes noms que `HARD_ENGINES` (ou `difficile` pour les quatre) | vide |
| `HARD_ENGINES` | Moteurs du mode difficile, séparés par des virgules : `pg,maria,oracle,mssql` | vide |
| `HARD_ADMIN_PASSWORD`, `HARD_READER_PASSWORD`, `HARD_WORKER_PASSWORD` | Mots de passe des moteurs (obligatoires pour le mode difficile) | vides |

Après une modification du `.env`, relancer `docker compose up -d --build`.

## Activer le mode difficile

Le mode difficile demande plus de ressources : compter environ 12 Go de mémoire pour les quatre moteurs, et 3 à 5 minutes au premier démarrage, le temps de charger les bases.

1. Générer trois mots de passe solides, par exemple avec `openssl rand -base64 18`. SQL Server exige au moins 8 caractères avec majuscules, minuscules et chiffres : `openssl rand -base64 18` convient.
2. Les mettre dans le `.env`, avec les moteurs voulus :

```
COMPOSE_PROFILES=pg,maria,oracle,mssql
HARD_ENGINES=pg,maria,oracle,mssql
HARD_ADMIN_PASSWORD=...
HARD_READER_PASSWORD=...
HARD_WORKER_PASSWORD=...
```

3. Relancer `docker compose up -d --build`. Le bouton « Mode difficile » apparaît dans le jeu quand les moteurs sont prêts.

On peut ne lancer qu'une partie des moteurs, par exemple `COMPOSE_PROFILES=pg,maria` et `HARD_ENGINES=pg,maria` : c'est beaucoup plus léger (environ 4 Go). Sur un Mac à puce Apple (ARM), l'image SQL Server n'existe pas en version ARM : se limiter à `pg,maria,oracle`.

Le classement du mode difficile est séparé et n'affiche que les comptes connectés avec Google.

## Activer la connexion Google

1. Dans la console Google Cloud de votre organisation : API et services, Écran de consentement OAuth, type « Interne ».
2. Identifiants, Créer des identifiants, ID client OAuth, type « Application Web ». Origine JavaScript autorisée : l'adresse publique du jeu, par exemple `https://jeu.votre-domaine.fr`.
3. Mettre l'ID client dans `GOOGLE_CLIENT_ID` et votre domaine dans `ALLOWED_DOMAIN`, puis relancer.

L'API vérifie le jeton auprès de Google et refuse tout compte dont le domaine n'est pas `ALLOWED_DOMAIN`.

## Mettre le jeu en ligne

Le jeu se place derrière n'importe quel proxy HTTPS (Nginx Proxy Manager, Caddy, Traefik...) qui renvoie vers `http://<machine>:8590`. Si le proxy tourne sur la même machine, mettre `BIND_ADDR` sur l'adresse que le proxy utilise pour joindre le jeu, pour que le port 8590 ne soit pas ouvert sur Internet.

Le script `deploy.sh` envoie le dossier sur un serveur par SSH et y lance `remote_deploy.sh`. Renseigner d'abord `SERVER` et `REMOTE_DIR`, en haut du script ou en variables d'environnement :

```
SERVER=utilisateur@adresse-du-serveur REMOTE_DIR=/home/utilisateur/operation-minuit ./deploy.sh
```

## Sécurité

- Les conteneurs tournent sans droits root, en lecture seule quand c'est possible, avec des limites de mémoire et de processus.
- Le mode normal rejoue chaque requête sur une copie neuve de la base SQLite, avec une limite de temps et sans accès aux fichiers.
- En mode difficile, les élèves passent par un compte en lecture seule ou par des bases de travail jetables, remises à zéro après chaque requête qui modifie des données ; les requêtes trop longues sont coupées.
- Les secrets vivent uniquement dans `.env`, qui n'est pas versionné.

## Contenu du dépôt

- `site/` : le jeu assemblé (une page `index.html` et ses images), servi par nginx.
- `api/` : le serveur Python (classement, correction du mode normal, mode difficile). `api/hard/` contient les traductions des missions par moteur et les données de l'enquête.
- `docker-compose.yml`, `Dockerfile`, `nginx.conf` : le déploiement.
- `sources/jeu/` : les sources du jeu (missions, histoire, quêtes, moteur du jeu).
- `sources/difficile/` : les outils du mode difficile (chargement des bases, vérification des 310 missions par moteur).

## Modifier le jeu

Les missions sont dans `sources/jeu/missions*.js` et `sides*.js`, l'histoire dans `story*.js`, le moteur du jeu dans `app.js`. Pour reconstruire le site après une modification :

```
cd sources/jeu
npm install
python3 build.py
```

`build.py` met à jour `site/` et `api/hard/normal.json` (les solutions et les indices, que seul le serveur connaît). Relancer ensuite `docker compose up -d --build` à la racine du dépôt.

