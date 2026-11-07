// Missions boss chronométrées, une par épisode de la Saison 1
function boss(o){ o.boss = true; o.tail = o.tail !== false; o.xp = o.xp || 250; o.timer = o.timer || 480; mis(o); }

boss({ id:'1.8', ch:1, title:'Boss : le rapport de 6 heures', who:'varga2', timer:360,
  story:`6h00, le préfet veut un rapport sur son bureau dans six minutes. Varga lance le chrono : « Les dix suspects les plus âgés du fichier. Identité propre, âge, ville. Tout de suite. »`,
  lesson:`<p>C'est un boss : pas de nouvelle notion, tu combines tout l'épisode. Le chrono tourne, mais tu peux le dépasser, tu gagnes simplement moins de bonus.</p>
<pre class="code">SELECT expression AS alias
FROM table
WHERE condition
ORDER BY critere1 DESC, critere2
LIMIT n;</pre>`,
  task:`Affiche <code>identite</code> (prénom, une espace, nom), <code>age</code> et <code>ville</code> des 10 suspects les plus âgés. Tri : âge décroissant, puis <code>id</code> croissant.`,
  solution:`SELECT prenom || ' ' || nom AS identite, age, ville FROM suspects ORDER BY age DESC, id ASC LIMIT 10;`,
  hints:["prenom || ' ' || nom AS identite","ORDER BY age DESC, id ASC LIMIT 10"],
  check:{ordered:true, strictCols:true},
  success:`Rapport déposé à 6h05. Le préfet hoche la tête. Varga, presque souriante : « Pas mal, la recrue. »`
});
boss({ id:'2.7', ch:2, title:'Boss : le guetteur', who:'varga2',
  story:`Nouvelle déposition au milieu de la nuit : un <b>guetteur</b> faisait le pied de grue devant la banque. Un homme <b>de 20 à 35 ans</b>, <b>petit</b>, <b>tatoué</b>, cheveux <b>noirs ou bruns</b>, <b>sans lunettes</b>. Varga : « Toutes les conditions d'un coup. Pas le temps de faire ça indice par indice. »`,
  lesson:`<p>Une seule requête, six conditions. Attention aux priorités : le OR des couleurs de cheveux doit être entre parenthèses.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>age</code>, <code>pointure</code> des suspects correspondant au signalement.`,
  solution:`SELECT id, prenom, nom, age, pointure FROM suspects WHERE sexe = 'H' AND age BETWEEN 20 AND 35 AND taille = 'Petite' AND tatouages = 'Oui' AND cheveux IN ('Noirs', 'Bruns') AND lunettes = 'Non';`,
  hints:["sexe = 'H' AND age BETWEEN 20 AND 35 AND taille = 'Petite' ...","(cheveux = 'Noirs' OR cheveux = 'Bruns') AND lunettes = 'Non'"],
  success:`Un seul nom. Interpellé à l'aube dans un bar de Courbevoie, le guetteur avoue avoir été payé 2 000 € « par une dame très élégante ».`
});
boss({ id:'3.6', ch:3, title:'Boss : le répertoire troué', who:'byte',
  story:`Le fichier des suspects a été mal saisi. Byte : « Je veux tous les suspects dont le <b>prénom finit par un e</b>, qui vivent à <b>Lille ou Marseille</b>, et dont la couleur de cheveux <b>ou</b> le téléphone est <b>manquant</b>. Chrono ! »`,
  lesson:`<p>Mélange de LIKE, IN, IS NULL et OR. Le OR entre les deux absences doit être entre parenthèses.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>ville</code>, <code>cheveux</code>, <code>telephone</code> des suspects correspondants.`,
  solution:`SELECT id, prenom, nom, ville, cheveux, telephone FROM suspects WHERE prenom LIKE '%e' AND ville IN ('Lille', 'Marseille') AND (cheveux IS NULL OR telephone IS NULL);`,
  hints:["prenom LIKE '%e'","(cheveux IS NULL OR telephone IS NULL)"],
  require:[{re:'IS\\s+NULL', msg:"Teste les absences avec IS NULL."}],
  success:`Les fiches incomplètes partent en correction. Byte : « Une base sale, c'est une enquête qui ment. »`
});
boss({ id:'4.7', ch:4, title:'Boss : le calendrier du crime', who:'juge',
  story:`La juge Amrani veut, pour tous les délits commis en <b>2025</b>, le mois, le trimestre et la gravité. « Et je veux que ce soit trié dans l'ordre du calendrier. Vous avez huit minutes. »`,
  lesson:`<p>Le trimestre se déduit du mois avec un CASE ou un calcul : <code>(mois + 2) / 3</code> en division entière.</p>
<pre class="code">CAST(strftime('%m', date_faits) AS INTEGER)  -- le mois en nombre</pre>`,
  task:`Pour les délits dont <code>date_faits</code> est en 2025, affiche <code>id</code>, <code>date_faits</code>, <code>mois</code> (nombre de 1 à 12), <code>trimestre</code> (1 à 4) et <code>gravite</code> (<code>'Mineur'</code> sous 1 000, <code>'Moyen'</code> sous 20 000, <code>'Majeur'</code> sinon, <code>'Inconnu'</code> si NULL), triés par <code>date_faits</code> puis <code>id</code>.`,
  solution:`SELECT id, date_faits, CAST(strftime('%m', date_faits) AS INTEGER) AS mois, (CAST(strftime('%m', date_faits) AS INTEGER) + 2) / 3 AS trimestre, CASE WHEN prejudice IS NULL THEN 'Inconnu' WHEN prejudice < 1000 THEN 'Mineur' WHEN prejudice < 20000 THEN 'Moyen' ELSE 'Majeur' END AS gravite FROM delits WHERE date_faits LIKE '2025%' ORDER BY date_faits, id;`,
  hints:["WHERE date_faits LIKE '2025%'","(mois + 2) / 3 donne le trimestre en division entière."],
  check:{ordered:true},
  success:`La juge feuillette le tableau. « Enfin quelqu'un qui sait ce qu'est un trimestre. »`
});
boss({ id:'5.8', ch:5, title:'Boss : la tempête de 22 heures', who:'ouali',
  story:`Farid Ouali, le DSI, panique : « Je dois savoir à quelle heure l'attaque a été la plus violente. Pour chaque IP et chaque heure, le nombre d'échecs. Seulement les pics à 50 échecs ou plus. »`,
  lesson:`<p>On peut grouper sur une expression calculée, ici l'heure extraite de l'horodatage :</p>
<pre class="code">GROUP BY ip, strftime('%Y-%m-%d %H', horodatage)</pre>`,
  task:`Affiche <code>ip</code>, <code>heure</code> (format <code>AAAA-MM-JJ HH</code>) et <code>echecs</code> pour les couples ayant au moins 50 échecs, triés par <code>echecs</code> décroissant.`,
  solution:`SELECT ip, strftime('%Y-%m-%d %H', horodatage) AS heure, COUNT(*) AS echecs FROM connexions WHERE succes = 0 GROUP BY ip, heure HAVING COUNT(*) >= 50 ORDER BY echecs DESC;`,
  hints:["strftime('%Y-%m-%d %H', horodatage) AS heure","GROUP BY ip, heure HAVING COUNT(*) >= 50"],
  check:{ordered:true},
  success:`Une demi-heure de pilonnage depuis 203.0.113.66, presque tout entre 22h et 23h. Ouali essuie son front. « Merci. Vraiment. » Personne ne remarque qu'il regarde un peu trop longtemps l'écran.`
});
boss({ id:'6.9', ch:6, title:'Boss : le grand organigramme', who:'varga2', timer:600,
  story:`Varga épingle une feuille blanche au mur : « Pour chaque passage caméra de la nuit sur l'Esplanade, je veux la plaque, le propriétaire s'il existe, et son gang s'il en a un. Toutes les lignes, même les inconnues. »`,
  lesson:`<p>Une chaîne de jointures externes : dès qu'un maillon peut manquer, chaque jointure suivante doit aussi être un LEFT JOIN, sinon les lignes incomplètes disparaissent.</p>`,
  task:`Pour les passages à <code>'Esplanade La Défense'</code> entre 2026-11-13 23:00:00 et 2026-11-14 00:30:00, affiche <code>horodatage</code>, <code>immatriculation</code>, <code>proprietaire</code> (prénom, espace, nom) et <code>gang</code> (nom du gang). Une ligne par passage et par gang.`,
  solution:`SELECT c.horodatage, c.immatriculation, s.prenom || ' ' || s.nom AS proprietaire, g.nom AS gang FROM cameras c LEFT JOIN vehicules v ON v.immatriculation = c.immatriculation LEFT JOIN suspects s ON s.id = v.suspect_id LEFT JOIN membres m ON m.suspect_id = s.id LEFT JOIN gangs g ON g.id = m.gang_id WHERE c.lieu = 'Esplanade La Défense' AND c.${NIGHT};`,
  hints:["Quatre LEFT JOIN : vehicules, suspects, membres, gangs.","La fausse plaque doit rester, avec des NULL."],
  require:[{re:'LEFT\\s+(OUTER\\s+)?JOIN', msg:"Il faut des LEFT JOIN pour garder les plaques inconnues."}],
  success:`Sur le mur, l'Audi du Cercle passée deux fois, et un fantôme. Varga trace un grand cercle orange autour.`
});
boss({ id:'7.7', ch:7, title:'Boss : les innocents', who:'varga',
  story:`L'avocat de Ferrand attaque : « Tout le monde badgeait cette nuit-là ! » Varga veut la liste des employés qui ont badgé <b>avec succès</b> le 13 novembre après 20h00 <b>et</b> qui n'ont <b>jamais</b> appelé le numéro de Vasseur.`,
  lesson:`<p>EXISTS et NOT EXISTS se combinent dans le même WHERE.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code> des employés ayant au moins un accès <code>'OK'</code> entre <code>'2026-11-13 20:00:00'</code> et <code>'2026-11-14 06:00:00'</code> et n'ayant aucun appel dont l'appelant est leur téléphone et l'appelé <code>'0611223344'</code>.`,
  solution:`SELECT e.id, e.prenom, e.nom FROM employes e WHERE EXISTS (SELECT 1 FROM acces_badges b WHERE b.employe_id = e.id AND b.resultat = 'OK' AND b.horodatage BETWEEN '2026-11-13 20:00:00' AND '2026-11-14 06:00:00') AND NOT EXISTS (SELECT 1 FROM appels a WHERE a.appelant = e.telephone AND a.appele = '0611223344');`,
  hints:["WHERE EXISTS (...) AND NOT EXISTS (...)","Dans le NOT EXISTS : a.appelant = e.telephone AND a.appele = '0611223344'"],
  require:[{re:'NOT\\s+EXISTS', msg:"Utilise NOT EXISTS pour « jamais appelé »."}],
  success:`Tous les autres sont mis hors de cause. Ferrand reste seul face aux preuves.`
});
boss({ id:'8.7', ch:8, title:'Boss : toutes les branches', who:'byte', timer:600,
  story:`Byte : « La piste principale, c'est bien. Mais ils ont aussi fait des petits virements de côté. Je veux <b>toutes les branches</b> : chaque compte atteint depuis le coffre par des virements de plus de 1 000 € après 23h00 le 13, avec le chemin complet. »`,
  lesson:`<p>On peut construire un <b>chemin</b> en texte dans une CTE récursive, en concaténant à chaque étape :</p>
<pre class="code">SELECT 'A', 'A'
UNION ALL
SELECT v.compte_dest, p.chemin || ' > ' || v.compte_dest
FROM ...</pre>`,
  task:`Construis <code>branches(compte, chemin, quand)</code> depuis <code>'HEL-COFFRE-01'</code> (chemin <code>'HEL-COFFRE-01'</code>, quand <code>'2026-11-13 23:00:00'</code>) en suivant les virements de plus de 1 000 € postérieurs à <code>quand</code>. Affiche <code>compte</code> et <code>chemin</code> de toutes les lignes.`,
  solution:`WITH RECURSIVE branches(compte, chemin, quand) AS (SELECT 'HEL-COFFRE-01', 'HEL-COFFRE-01', '2026-11-13 23:00:00' UNION ALL SELECT v.compte_dest, b.chemin || ' > ' || v.compte_dest, v.horodatage FROM virements v JOIN branches b ON v.compte_source = b.compte WHERE v.montant > 1000 AND v.horodatage > b.quand) SELECT compte, chemin FROM branches;`,
  hints:["Partie récursive : JOIN branches b ON v.compte_source = b.compte","b.chemin || ' > ' || v.compte_dest"],
  require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."}],
  success:`Trois virements de côté vers des comptes « mules », un rebond derrière l'un d'eux, et un retrait de CH-9131 vers un autre compte de Marchetti. Tout sera gelé dans l'heure.`
});
boss({ id:'9.6', ch:9, title:'Boss : le podium des anciens', who:'varga',
  story:`« Dans chaque gang, je veux les trois membres les plus âgés. S'il y a des ex aequo, ils montent tous sur le podium. »`,
  lesson:`<p><code>DENSE_RANK()</code> donne le même rang aux ex aequo sans laisser de trou : 1, 1, 2, 3. Filtre ensuite sur le rang dans une CTE.</p>`,
  task:`Affiche <code>gang</code>, <code>nom</code>, <code>age</code>, <code>rang</code> (DENSE_RANK par gang, âge décroissant) pour les membres de rang 3 ou moins.`,
  solution:`WITH r AS (SELECT g.nom AS gang, s.nom, s.age, DENSE_RANK() OVER (PARTITION BY g.id ORDER BY s.age DESC) AS rang FROM membres m JOIN gangs g ON g.id = m.gang_id JOIN suspects s ON s.id = m.suspect_id) SELECT gang, nom, age, rang FROM r WHERE rang <= 3;`,
  hints:["DENSE_RANK() OVER (PARTITION BY g.id ORDER BY s.age DESC)","Filtre WHERE rang <= 3 dans une requête externe."],
  require:[{re:'DENSE_RANK', msg:"Utilise DENSE_RANK()."}],
  success:`Les doyens sont convoqués. Le plus vieux des Corbeaux lâche : « Le Cercle ? On n'y entre pas. On y est invité. »`
});
boss({ id:'10.8', ch:10, title:"Boss : l'aube des interpellations", who:'varga2', timer:600,
  story:`5h55, le 16 novembre. Varga : « En une seule transaction : crée la table <code>gardes_a_vue</code>, places-y les deux suspects arrêtés à Paris (217 et 388) avec l'heure <code>'2026-11-16 06:00'</code>, marque leur rôle dans le gang 2 comme <code>'Interpellé'</code>, et valide. Marchetti, c'est la police suisse qui s'en charge. »`,
  lesson:`<p>Tout ou rien : si une instruction échoue au milieu, on fait ROLLBACK et rien n'est appliqué. Si tout passe, COMMIT.</p>
<pre class="code">BEGIN;
CREATE TABLE ...;
INSERT INTO ...;
UPDATE ...;
COMMIT;</pre>`,
  task:`Dans une transaction (<code>BEGIN</code> ... <code>COMMIT</code>) : crée la table avec <code>CREATE TABLE gardes_a_vue (suspect_id INTEGER, debut TEXT);</code>, insère les 2 suspects avec <code>debut = '2026-11-16 06:00'</code>, puis mets <code>role = 'Interpellé'</code> dans <code>membres</code> pour ces suspects et le gang 2.`,
  solution:`BEGIN; CREATE TABLE gardes_a_vue (suspect_id INTEGER, debut TEXT); INSERT INTO gardes_a_vue VALUES (217, '2026-11-16 06:00'), (388, '2026-11-16 06:00'); UPDATE membres SET role = 'Interpellé' WHERE gang_id = 2 AND suspect_id IN (217, 388); COMMIT;`,
  hints:["BEGIN; CREATE TABLE ...; INSERT ...; UPDATE ...; COMMIT;","UPDATE membres SET role = 'Interpellé' WHERE gang_id = 2 AND suspect_id IN (217, 388)"],
  require:[{re:'BEGIN', msg:"Ouvre une transaction avec BEGIN."},{re:'COMMIT', msg:"Valide avec COMMIT."}],
  check:{mode:'dml', verify:["SELECT suspect_id, debut FROM gardes_a_vue","SELECT suspect_id, gang_id, role FROM membres WHERE role = 'Interpellé'"]},
  success:`6h00 pile. Vasseur est déjà en garde à vue depuis le 14 ; ce matin, une porte tombe à Nanterre et une villa est cernée au bord du Léman. La base dit exactement qui est où.`
});
boss({ id:'11.7', ch:11, title:'Boss : le registre des mandats', who:'juge', timer:600,
  story:`La juge exige un registre des mandats <b>infalsifiable</b> : chaque mandat vise un suspect existant, un même suspect ne peut pas avoir deux mandats du même type, et le type est contrôlé. Puis une vue pour son greffier.`,
  lesson:`<p>Une contrainte <code>UNIQUE (col1, col2)</code> porte sur une <b>combinaison</b> de colonnes. On la déclare après les colonnes :</p>
<pre class="code">CREATE TABLE t (
  a INTEGER, b TEXT,
  UNIQUE (a, b)
);</pre>`,
  task:`Crée <code>mandats</code> (<code>id</code> INTEGER PRIMARY KEY, <code>suspect_id</code> INTEGER NOT NULL clé étrangère vers suspects, <code>type</code> TEXT CHECK dans ('Arrêt', 'Perquisition', 'Amener'), <code>emis_le</code> TEXT, UNIQUE (suspect_id, type)). Insère un mandat <code>'Arrêt'</code> pour 217 et 388 (<code>emis_le = '2026-11-15'</code>). Crée la vue <code>v_mandats</code> (nom, prenom, type).`,
  solution:`CREATE TABLE mandats (id INTEGER PRIMARY KEY, suspect_id INTEGER NOT NULL REFERENCES suspects(id), type TEXT CHECK (type IN ('Arrêt', 'Perquisition', 'Amener')), emis_le TEXT, UNIQUE (suspect_id, type)); INSERT INTO mandats (suspect_id, type, emis_le) VALUES (217, 'Arrêt', '2026-11-15'), (388, 'Arrêt', '2026-11-15'); CREATE VIEW v_mandats AS SELECT s.nom, s.prenom, m.type FROM mandats m JOIN suspects s ON s.id = m.suspect_id;`,
  hints:["UNIQUE (suspect_id, type) en fin de CREATE TABLE.","CREATE VIEW v_mandats AS SELECT s.nom, s.prenom, m.type FROM mandats m JOIN suspects s ..."],
  check:{mode:'dml', verify:["SELECT nom, prenom, type FROM v_mandats","SELECT \"table\", \"from\" FROM pragma_foreign_key_list('mandats')","SELECT group_concat(ii.name, ',') FROM pragma_index_list('mandats') il, pragma_index_info(il.name) ii WHERE il.\"unique\" = 1 AND il.origin = 'u'","SELECT \"notnull\" FROM pragma_table_info('mandats') WHERE name = 'suspect_id'","SELECT (SELECT sql FROM sqlite_master WHERE name = 'mandats') LIKE '%Arrêt%Perquisition%Amener%'"]},
  success:`La juge tente d'insérer un doublon pour voir. Refusé. Elle sourit pour la première fois de l'enquête.`
});
boss({ id:'12.5', ch:12, title:"Boss : la carte d'identité de l'attaquant", who:'ouali',
  story:`Ouali : « Pour le rapport à l'ANSSI, il faut un résumé par IP de toutes les tentatives suspectes : logins contenant une apostrophe, un double tiret ou le mot UNION. » Il ajoute, l'air de rien : « Inutile de chercher plus loin que ça. »`,
  lesson:`<p>Plusieurs motifs LIKE reliés par OR, entre parenthèses, puis un GROUP BY.</p>`,
  task:`Affiche <code>ip</code>, <code>tentatives</code>, <code>premiere</code> (MIN horodatage) et <code>derniere</code> (MAX horodatage) des connexions dont le login contient <code>'</code> ou <code>--</code> ou <code>UNION</code>.`,
  solution:`SELECT ip, COUNT(*) AS tentatives, MIN(horodatage) AS premiere, MAX(horodatage) AS derniere FROM connexions WHERE (login LIKE '%''%' OR login LIKE '%--%' OR login LIKE '%UNION%') GROUP BY ip;`,
  hints:["login LIKE '%''%' OR login LIKE '%--%' OR login LIKE '%UNION%'","GROUP BY ip"],
  success:`Une seule IP, quatre minutes d'essais. Rapport envoyé. Byte note dans un coin de son carnet : « Pourquoi Ouali ne voulait pas qu'on cherche plus loin ? »`
});
