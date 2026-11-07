# Opération Minuit : déploiement Docker

Serious game SQL de Cybersup. C'est un site 100 % statique : une page `index.html` (moteur SQLite en WebAssembly et toutes les données intégrés) et un dossier `img/` de 371 images. Aucune base de données ni backend côté serveur : le SQL tourne dans le navigateur de l'étudiant.

Le conteneur est un nginx non root (port 8080 dans le conteneur, 8590 sur le serveur), en lecture seule, avec compression gzip (8 Mo de page qui passent en 1,4 Mo) et cache long sur les images.

## Contenu

- `Dockerfile` : image nginx-unprivileged avec le site.
- `nginx.conf` : gzip, en-têtes de sécurité, cache, route de santé `/healthz`.
- `docker-compose.yml` : lancement avec redémarrage automatique et durcissement (lecture seule, aucune capability).
- `site/` : le jeu.

## Déploiement sur la Dedibox Scaleway (depuis le Mac)

Le script `deploy.sh` envoie le jeu sur `utilisateur@adresse-du-serveur`, dans `/home/utilisateur/operation-minuit`, puis lance `sudo docker compose up -d --build` (le mot de passe sudo du serveur est demandé). Le jeu écoute sur le port hôte **8590**.

Depuis un terminal, dans le dossier `operation-minuit` :

```
chmod +x deploy.sh
./deploy.sh
```

Le script s'arrête avec `OK : le jeu répond sur le port 8590` si tout va bien. Si le port 8590 est déjà pris, le changer à deux endroits : `docker-compose.yml` (`"8590:8080"`) et `deploy.sh` (`HOST_PORT`).

## Mettre le jeu sur un nom de domaine en HTTPS (nginx-proxy-manager)

1. Chez le registrar, créer un enregistrement DNS A `jeu.votre-domaine.fr` vers `adresse-du-serveur`.
2. Dans l'interface NPM (port 81) : Hosts, Proxy Hosts, Add Proxy Host.
   - Domain Names : `jeu.votre-domaine.fr`
   - Scheme : `http`, Forward Hostname / IP : `adresse-du-serveur`, Forward Port : `8590`
   - Cocher Block Common Exploits
   - Onglet SSL : Request a new SSL Certificate, Force SSL, HTTP/2 Support
3. Enregistrer, puis ouvrir `https://jeu.votre-domaine.fr`.

## Installation manuelle (autre serveur)

```
docker compose up -d --build
curl http://localhost:8590/healthz
```

## Mettre à jour le jeu

Remplacer le contenu de `site/` par la nouvelle version, puis relancer `./deploy.sh` depuis le Mac.

La page `index.html` est servie sans cache : les étudiants ont la nouvelle version au prochain chargement. Leur progression est gardée dans leur navigateur (localStorage) et n'est pas perdue.

## Suivi de classe

Sur le serveur, le suivi automatique de la version claude.ai (synchronisation via l'organisation) n'existe pas. Le mode « par code » fonctionne normalement : chaque étudiant clique sur « Copier mon code pour le formateur » (accueil, encadré Ma classe) et l'envoie ; le formateur colle les codes dans l'Espace formateur (lien en bas de page).

## Dépendance externe

La page charge les polices Archivo Black, DM Sans et DM Mono depuis Google Fonts. Sans accès internet, le jeu fonctionne avec des polices de remplacement.

## Classement et connexion

Le kit lance deux conteneurs :
- `operation-minuit` : nginx, qui sert le jeu et transmet `/api/` à l'API ;
- `operation-minuit-api` : l'API du classement (Python, base SQLite dans le volume Docker `minuit-data`, conservé entre deux déploiements).

Au premier lancement, le jeu demande à l'étudiant sa classe, puis son prénom et son nom, ou une connexion Google réservée aux comptes @votre-domaine.fr. Le classement public n'affiche que le prénom, l'initiale du nom, la classe et le score (meilleur XP conservé).

### Activer la connexion Google @votre-domaine.fr

1. Dans la console Google Cloud de l'organisation votre-domaine.fr : API et services, Écran de consentement OAuth, type « Interne ».
2. Identifiants, Créer des identifiants, ID client OAuth, type « Application Web ». Origine JavaScript autorisée : `https://jeu.votre-domaine.fr`.
3. Copier l'ID client dans un fichier `.env` à côté de `deploy.sh` (modèle : `.env.exemple`), sur la ligne `GOOGLE_CLIENT_ID=`.
4. Relancer `./deploy.sh`.

Sans ID client, seul le formulaire prénom et nom est proposé. La connexion Google exige que le jeu soit servi en HTTPS sur l'origine déclarée.

L'API vérifie le jeton auprès de Google et refuse tout compte dont le domaine n'est pas votre-domaine.fr.

### Sauvegarder ou remettre à zéro le classement

```
sudo docker cp operation-minuit-api:/data/classement.db ./classement-sauvegarde.db
```

Pour repartir de zéro : `sudo docker compose down`, puis `sudo docker volume rm operation-minuit_minuit-data`, puis `./remote_deploy.sh`.

## Mode difficile (PostgreSQL, MariaDB, Oracle, SQL Server)

Le mode difficile fait résoudre les 310 missions sur un vrai moteur. Le serveur exécute la requête de l'étudiant et la corrige ; l'XP est doublée et le classement « Mode difficile » est calculé par le serveur.

Il ajoute quatre conteneurs (profil Docker `difficile`) : `minuit-pg`, `minuit-maria`, `minuit-oracle` et `minuit-mssql`. Ils partagent le réseau du conteneur du jeu et n'exposent aucun port : seule l'API les joint. Au démarrage, l'API charge la base de l'enquête dans chaque moteur (environ 2 minutes, SQL Server est le plus lent), puis le mode apparaît dans le jeu.

Activation, dans le fichier `.env` :
```
HARD_ENGINES=pg,maria,oracle,mssql
COMPOSE_PROFILES=difficile
HARD_ADMIN_PASSWORD=...
HARD_READER_PASSWORD=...
HARD_WORKER_PASSWORD=...
```
Pour le couper : vider `HARD_ENGINES` et `COMPOSE_PROFILES`, puis relancer `./deploy.sh`.

Besoins : environ 7 Go de RAM et **environ 12 Go de disque libre** pour les images (Oracle 2,8 Go, SQL Server 2,4 Go, MariaDB et PostgreSQL 0,9 Go) et leurs données.

Sécurité : lecture seule pour les missions de lecture, bases de travail jetables (remises à zéro après chaque mission qui modifie), comptes sans privilège système, délai maximum de quelques secondes par requête, 40 requêtes par minute et par adresse IP, inscription obligatoire.

Si un moteur redémarre seul, relancer l'API pour recharger ses données : `sudo docker restart operation-minuit-api`.

## Sources

- `site/` et `api/` : ce qui est déployé (le jeu déjà assemblé et le serveur).
- `sources/jeu/` : les sources du jeu (missions, histoire, quêtes, moteur du jeu). `build.py` assemble `site/index.html` ; `export_normal.js` sépare ce que le navigateur reçoit de ce que seul le serveur connaît (solutions, indices).
- `sources/difficile/` : les outils du mode difficile (traductions par moteur, chargement des bases, vérification des 310 missions).

Les secrets (mots de passe des moteurs, identifiant Google) vivent uniquement dans le fichier `.env`, qui n'est pas versionné. Copier `.env.exemple` en `.env` et le remplir. Dans `deploy.sh`, renseigner `SERVER` et `REMOTE_DIR` (ou les passer en variables d'environnement).
