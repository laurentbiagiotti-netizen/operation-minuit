# Quêtes annexes et quêtes cachées : brief commun

Jeu : « Opération Minuit », serious game SQL en BD (SQLite 3.45 via sql.js, dans le navigateur). Code dans /home/claude/build.
Chapitres et missions existants : missions1.js, missions2.js, missions_boss.js, missions3.js, missions4.js, missions6.js, missions5.js, story*.js. Données : schema.sql, data.sql à data5.sql (générées par gen_data*.py). LIS les missions de tes chapitres et le schéma avant d'écrire : les quêtes doivent prolonger l'enquête du chapitre, avec les mêmes personnages (Byte = Nora Kessler, la commissaire Inès Varga, etc.) et le même ton.

Pour CHAQUE chapitre de ta tranche, écris exactement 2 quêtes :
- une quête annexe : id '<ch>.A', side:'annexe', xp:120. Visible dès l'ouverture de l'épisode. Une piste secondaire de l'enquête (un détail laissé de côté, un témoin, une vérification) qui fait pratiquer les notions du chapitre sous un autre angle.
- une quête cachée : id '<ch>.S', side:'cachee', xp:200. Révélée seulement quand toutes les missions principales de l'épisode sont résolues. C'est une découverte surprenante : un secret enfoui dans les données (une anomalie, un nom qui revient, un message dissimulé, un lien avec une autre affaire). Un peu plus difficile que la moyenne du chapitre, elle peut combiner la notion du chapitre et des notions antérieures. Son champ `teaser` (une phrase) s'affiche au moment où elle se révèle.

Format (mêmes champs que les missions existantes, à copier fidèlement) :
mis({ id:'9.A', ch:9, side:'annexe', xp:120, title:'...',
  story:`réplique d'un personnage (HTML simple, <code>, <b>)`,
  lesson:`<p>rappel court de la notion utile, avec un exemple <pre class="code">...</pre> qui ne donne pas la solution</p>`,
  task:`consigne précise : colonnes attendues (noms exacts si colNames), filtre, tri`,
  solution:`requête SQL de référence`,
  hints:["indice 1","indice 2, plus précis"],
  check:{ ... },            // mêmes options que les missions existantes : strictCols, colNames, order, mode:'dml' + verify:[...], etc.
  require:[{re:'...', msg:'...'}],   // facultatif, comme dans les missions existantes
  success:`réplique de conclusion`
});
Pour une cachée, ajoute teaser:`...` (une phrase d'accroche).
Le résultat attendu est calculé en exécutant `solution` ; la consigne doit donc rendre le résultat UNIQUE (colonnes et tri explicites quand l'ordre compte, pas d'égalités ambiguës dans un LIMIT).

Contraintes :
- N'écris QUE dans ton fichier sidesN.js. Ne modifie aucun autre fichier, et n'ajoute aucune donnée : utilise uniquement les tables et lignes existantes (chercher dans les données un vrai détail intéressant pour la quête cachée, avec node peek.js ou sql.js).
- Notions limitées à celles déjà vues jusqu'au chapitre (pas de fenêtrage au chapitre 3, etc.). Pas de GROUPING SETS/ROLLUP (absent de SQLite).
- Résultat non vide, raisonnable (idéalement 1 à 30 lignes), déterministe.
- Style : français, tutoiement côté personnages comme dans le jeu, pas de tiret cadratin (—), pas d'esperluette (&) dans les textes, écrire « Cybersup ». Personnes et sociétés fictives uniquement (celles de la base).
- Vérifie : cd /home/claude/build && timeout 600 node test.js 2>&1 | grep -E "\.(A|S) |PROBL" doit montrer OK pour tes quêtes et 0 problème au total. Teste aussi au moins une variante fausse plausible par quête (elle doit échouer) et une variante juste écrite autrement (elle doit passer), avec un petit script à toi hors de test.js (inspire-toi du bloc V de test.js, sans modifier test.js).
- Termine par un rapport court : liste id, titre, notion, nombre de lignes du résultat, et le secret de chaque quête cachée.
