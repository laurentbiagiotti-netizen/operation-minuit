# Mode difficile : traduction des missions dans un vrai moteur

Le jeu « Opération Minuit » (/home/claude/build, SQLite dans le navigateur) a 310 missions (228 principales + 82 quêtes annexes et cachées). Le mode difficile fait résoudre les mêmes enquêtes sur un vrai moteur : PostgreSQL 16, MariaDB 11, Oracle 23ai Free ou SQL Server 2022. Le serveur exécute la requête de l'étudiant et la corrige.

Tout est dans /home/claude/hard :
- expected.json : pour chaque mission, l'énoncé (task), la solution SQLite, le setup, les verify, et le résultat attendu calculé sur SQLite (expected pour les lectures, sqlite_verify pour les DML).
- ddl/<moteur>.sql et ddl/model.json : la structure réelle chargée dans chaque moteur (types inférés : DATETIME/TIMESTAMP, DATE, JSON, entiers, réels, texte ; identités auto-incrémentées sur les id). Les moteurs sont lancés et chargés (base de référence `minuit` + bases de travail).
- engine.py : exécution et correction ; check.py : ton outil de vérification.

## Ce que tu produis
Un fichier JSON `dialects/<moteur>.<tranche>.json` (ex. `dialects/pg.a.json`), objet { id_mission: entrée }. Écris-le au fur et à mesure (par chapitre) et vérifie-le souvent.

Entrée pour une mission de lecture :
{ "solution": "requête du dialecte", "hints": ["indice 1", "indice 2 plus précis"], "note": "facultatif : en une ou deux phrases, ce qui change dans ce moteur pour cette mission (fonction, syntaxe)" }
Champs facultatifs :
- "setup": script du dialecte à exécuter avant (si la mission SQLite a un setup) ; la mission tourne alors dans une base de travail.
- "worker": true si la requête doit tourner dans une base de travail (par exemple parce qu'elle crée un objet temporaire).
- "require": liste [{ "re": "regex", "msg": "message" }] pour remplacer les règles SQLite (par défaut les règles SQLite sont gardées ; mets [] si elles n'ont pas de sens dans ce moteur, adapte-les si elles citent une fonction propre à SQLite).
- "expected_from_solution": true uniquement si le résultat ne PEUT PAS être identique à SQLite pour une raison de moteur (explique dans note) ; à éviter.
- "skip": "raison en français" si la mission est impossible dans ce moteur (à garder exceptionnel, par ex. une notion purement SQLite). Le jeu affichera ce message.

Entrée pour une mission DML (kind 'dml' : INSERT, UPDATE, DELETE, transactions, CREATE TABLE, vues, index, triggers) :
{ "solution": "...", "verify": ["requêtes du dialecte qui lisent l'état de la base"], "hints": [...], "note": "..." }
- Les verify doivent produire le même résultat que les verify SQLite (sqlite_verify) après ta solution. Quand une verify SQLite lit la structure (pragma_table_info, sqlite_master...), réécris-la avec le catalogue du moteur (information_schema, pg_catalog, user_tab_columns, sys.columns...) pour produire les mêmes valeurs. Si c'est vraiment impossible à l'identique, mets "verify_free": "raison" et écris des verify qui contrôlent la même chose (le résultat attendu sera alors celui obtenu après ta solution).
- La mission tourne dans une base de travail réinitialisée après chaque exécution.

Mission plan (kind 'plan', EXPLAIN QUERY PLAN en SQLite) : { "solution": "CREATE INDEX ...; puis l'instruction qui affiche le plan dans ce moteur", "contains": "texte que la sortie du plan doit contenir (en général le nom de l'index)", ... }. La sortie prise en compte est le dernier jeu de résultats. Si l'optimiseur refuse l'index sur ces petits volumes, cherche une requête de plan qui le montre (indice de requête, statistiques) ; sinon skip avec la raison.

## Règles
- La réponse attendue est la même que dans le jeu : même nombre de lignes, mêmes valeurs (arrondies à 4 décimales), mêmes colonnes ; l'ordre compte seulement si opts.ordered. Les noms de colonnes sont comparés sans tenir compte de la casse. Les dates et horodatages sont comparés sous la forme 'YYYY-MM-DD' et 'YYYY-MM-DD HH:MM:SS'. Ce que la mission demande dans task (colonnes, alias, tri) doit rester valable dans le dialecte.
- Écris du SQL idiomatique et propre au moteur (c'est le but pédagogique) : fonctions de date du moteur, LIMIT/FETCH FIRST/TOP, STRING_AGG/LISTAGG/GROUP_CONCAT, JSON du moteur (jsonb, JSON_TABLE, OPENJSON...), CTE récursives (WITH RECURSIVE ou non selon le moteur), triggers dans la syntaxe du moteur.
- Pièges connus : MariaDB et SQL Server ont été configurés sensibles à la casse (collation binaire / CS) comme SQLite ; LIKE y est donc sensible à la casse alors qu'en SQLite LIKE ne l'est pas (adapte avec LOWER ou ILIKE). Division entière : SQLite et PostgreSQL et SQL Server tronquent 7/2, MariaDB et Oracle non. Oracle : les colonnes `date` et `session` s'écrivent "DATE" et "SESSION" (mots réservés), les chaînes vides valent NULL, les noms de colonnes ressortent en majuscules (sans importance pour la correction). SQL Server : les scripts sont découpés sur les lignes GO (CREATE TRIGGER doit être seul dans son lot). Oracle : un bloc PL/SQL (trigger, BEGIN ... END) se termine par une ligne contenant seulement « / ».
- Indices (hints) : en français, tutoiement, qui guident vers la syntaxe du moteur sans donner toute la réponse (le 2e peut donner la structure). Pas de tiret cadratin (—), pas d'esperluette (&) : écris « et ». Écris « Cybersup ».
- Ne modifie AUCUN autre fichier que tes dialects/<moteur>.<tranche>.json. N'écris pas dans les bases de référence. N'utilise que les bases de travail de ta variable HARD_WORKERS.

## Vérifier
cd /home/claude/hard && <variables d'env données> python3 check.py <moteur> [ids...]
Tout doit être OK (et WARN seulement si un indice manque). Essaie aussi quelques requêtes fausses : python3 check.py <moteur> --try <id> "<requête>" doit répondre ok:false.
Termine par un rapport court : nombre OK, liste des skip avec raison, pièges rencontrés.
