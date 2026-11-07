// GRANDE FINALE : OPÉRATION MINOTAURE (épisode 41) : tout le SQL du jeu, et un peu plus
const Z_SQL = "b AS (SELECT sous_station, AVG(kwh) AS m, sqrt(AVG(kwh * kwh) - AVG(kwh) * AVG(kwh)) AS sd FROM releves_electriques WHERE horodatage < '2028-03-01' GROUP BY sous_station), r AS (SELECT sous_station, AVG(kwh) AS m FROM releves_electriques WHERE horodatage >= '2028-03-01' GROUP BY sous_station), z AS (SELECT b.sous_station, b.m AS avant, r.m AS apres, (r.m - b.m) / b.sd AS z FROM b JOIN r ON r.sous_station = b.sous_station)";
const REG_SQL = "c AS (SELECT horodatage, json_extract(metriques, '$.acc') AS y FROM minotaure_checkpoints ORDER BY epoch DESC LIMIT 48), x0 AS (SELECT julianday(MIN(horodatage)) AS j FROM c), pts AS (SELECT (julianday(c.horodatage) - x0.j) * 24 AS x, c.y FROM c, x0), s AS (SELECT COUNT(*) AS n, SUM(x) AS sx, SUM(y) AS sy, SUM(x * x) AS sxx, SUM(x * y) AS sxy FROM pts), reg AS (SELECT (n * sxy - sx * sy) / (n * sxx - sx * sx) AS a, (sy - (n * sxy - sx * sy) / (n * sxx - sx * sx) * sx) / n AS b FROM s)";
const C2_SQL = "iv AS (SELECT host, domaine, ip_dest, (julianday(horodatage) - julianday(LAG(horodatage) OVER (PARTITION BY host, domaine ORDER BY horodatage))) * 86400 AS dt FROM proxy_logs WHERE domaine NOT IN (SELECT domaine FROM domaines_connus)), st AS (SELECT host, domaine, ip_dest, COUNT(dt) AS n, AVG(dt) AS m, sqrt(AVG(dt * dt) - AVG(dt) * AVG(dt)) AS sd FROM iv WHERE dt IS NOT NULL GROUP BY host, domaine, ip_dest HAVING COUNT(dt) >= 50), c2 AS (SELECT DISTINCT ip_dest FROM st WHERE sd / m < 0.05)";
const TEL_SQL = "f AS (SELECT DISTINCT numero FROM bornages WHERE antenne = 'Fleury-Mérogis'), lien AS (SELECT appelant AS x, appele AS y FROM communications UNION SELECT appele, appelant FROM communications)";

chap({ id:41, season:5, code:'41', title:'Minotaure', subtitle:'La grande finale : les quatre affaires se rejoignent, une nuit, un compte à rebours',
  intro:`<p>20 mars 2028, 22h. En perquisitionnant le bureau de Maxime Delorme, la brigade a trouvé un carnet. Et depuis son arrestation, elle avait déjà le numéro de cellule trouvé dans sa valise : celui de <b>Farid Ouali</b>, le Cartographe, à Fleury-Mérogis.</p>
<p>Les six serveurs volés à DataSeine n'ont pas disparu. Ils tournent quelque part, jour et nuit, pour entraîner <b>MINOTAURE</b> : une IA nourrie des données des trois premières affaires, volées en mars par l'Hydre (les règles antifraude d'Hélios, le plan du réseau TransSeine, le jeu de données de VIGIE). Quand elle aura fini d'apprendre, elle videra des milliers de comptes en virements trop petits pour déclencher une alerte.</p>
<p>Toutes les tables du jeu sont ouvertes. Tu as une nuit.</p>
<p class="quote">« Le Cartographe ne dessine pas des plans. Il dessine des labyrinthes. Et au centre d'un labyrinthe, il y a toujours un monstre. » (Inès Varga)</p>`,
  oracle:`<p>Cet épisode rassemble des techniques de niveau professionnel : agrégats avec <code>ORDER BY</code> interne (<code>LISTAGG ... WITHIN GROUP</code> en Oracle, <code>string_agg(... ORDER BY ...)</code> en PostgreSQL), score z, « gaps and islands », régression linéaire (Oracle et PostgreSQL ont même <code>REGR_SLOPE</code> et <code>REGR_INTERCEPT</code>), plus court chemin dans un graphe avec une CTE récursive, détection de fan-in et transaction de blocage. Ce sont des questions classiques d'entretien d'embauche en data.</p>`,
  quiz:[
    {q:"La technique « gaps and islands » sert à :", o:["Trouver des NULL","Regrouper des lignes consécutives (heures, jours, numéros) en blocs continus","Supprimer des doublons","Faire une jointure externe"], a:1, e:"Astuce : valeur moins ROW_NUMBER() est constante à l'intérieur d'un bloc continu."},
    {q:"Un score z de 50 signifie :", o:["50 % d'augmentation","La valeur est à 50 écarts-types de la moyenne habituelle : une anomalie massive","Une erreur de calcul","Une valeur normale"], a:1, e:"Au-delà de 3, on parle déjà d'anomalie."},
    {q:"Dans une CTE récursive de recherche de chemin, la condition <code>instr(chemin, t.vers) = 0</code> :", o:["Trie les résultats","Empêche de repasser par une station déjà visitée, donc les boucles infinies","Calcule la distance","Ne sert à rien"], a:1, e:"Sans elle, la récursion tourne en rond. La borne sur le total limite aussi l'exploration."},
    {q:"Pente d'une régression linéaire en SQL :", o:["AVG(y) / AVG(x)","(n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²)","MAX(y) − MIN(y)","SUM(x * y)"], a:1, e:"La méthode des moindres carrés, avec cinq agrégats seulement."}
  ]});

mis({ id:'41.1', ch:41, xp:200, title:'Le carnet', who:'byte',
  story:`Byte feuillette le carnet de Delorme : « Dix phrases banales sur deux pages. Trop banales. Sur chaque ligne, regarde la lettre à la position égale au numéro de la ligne : la ligne 1 donne sa 1re lettre, la ligne 2 sa 2e... » Table <code>carnet_delorme</code> (page, ligne, texte).`,
  lesson:`<p><code>substr(texte, n, 1)</code> extrait le caractère numéro n. Pour assembler les morceaux dans le bon ordre, <code>group_concat</code> accepte un <code>ORDER BY</code> à l'intérieur de ses parenthèses (SQLite 3.44 et plus) :</p>
<pre class="code">SELECT group_concat(prenom, ', ' ORDER BY age DESC) FROM suspects;</pre>`,
  task:`Affiche <code>message</code> : la concaténation (séparateur vide <code>''</code>) des lettres en MAJUSCULES, page par page puis ligne par ligne.`,
  solution:`SELECT group_concat(UPPER(substr(texte, ligne, 1)), '' ORDER BY page, ligne) AS message FROM carnet_delorme;`,
  hints:["substr(texte, ligne, 1)","group_concat(UPPER(...), '' ORDER BY page, ligne)"], check:{strictCols:true},
  success:`<b>DEDALE0400</b>. Dédale, l'architecte du labyrinthe. Et 04:00. Byte regarde l'horloge : 22h07. « Il nous reste moins de six heures. »`
});
mis({ id:'41.2', ch:41, xp:200, title:'La faim des machines', who:'byte',
  story:`« Six serveurs de calcul, ça consomme autant qu'un immeuble. Quelque part dans Paris, une sous-station électrique a changé de comportement le 1er mars. » Table <code>releves_electriques</code> : un relevé par sous-station et par heure.`,
  lesson:`<p>Le <b>score z</b> mesure à combien d'écarts-types de son habitude se trouve une valeur : <code>(nouvelle moyenne - ancienne moyenne) / écart-type ancien</code>. SQLite n'a pas de fonction d'écart-type, mais :</p>
<pre class="code">écart-type = sqrt(AVG(x * x) - AVG(x) * AVG(x))</pre>
<p>Chaque sous-station est comparée à <b>elle-même</b> : une petite station qui triple est plus suspecte qu'une grosse qui gagne 10 %.</p>`,
  task:`Pour chaque sous-station, calcule <code>avant</code> (moyenne des kWh avant le '2028-03-01'), <code>apres</code> (moyenne à partir de cette date) et <code>z</code> (avec l'écart-type de la période « avant »). Affiche <code>sous_station</code>, <code>avant</code>, <code>apres</code>, <code>z</code>, tous arrondis à 1 décimale, par <code>z</code> décroissant.`,
  solution:`WITH ${Z_SQL} SELECT sous_station, ROUND(avant, 1) AS avant, ROUND(apres, 1) AS apres, ROUND(z, 1) AS z FROM z ORDER BY z DESC;`,
  hints:["Une CTE « avant » avec AVG et l'écart-type, une CTE « après » avec AVG, puis une jointure.","sqrt(AVG(kwh * kwh) - AVG(kwh) * AVG(kwh))"], check:{ordered:true, orderKeys:[3]},
  success:`SST Bercy grimpe de 12 % : les travaux du quai, connus de tous. Mais <b>SST Dédale</b>, une sous-station qui alimente une station fantôme fermée depuis 1939, passe de 2 kWh à plus de 40. Score z : plus de cent. La moyenne des autres est à moins de 1.`
});
mis({ id:'41.3', ch:41, xp:200, title:'Les îlots', who:'byte',
  story:`« Si l'on sait depuis quand les machines tournent sans interruption, on saura où en est l'entraînement. Trouve les périodes continues où SST Dédale dépasse 20 kWh. »`,
  lesson:`<p>Le problème des <b>gaps and islands</b> (trous et îlots) : regrouper des lignes consécutives. L'astuce : numérote chaque heure (<code>n</code>), puis soustrais un <code>ROW_NUMBER()</code>. À l'intérieur d'un bloc continu, la différence reste constante ; elle change à chaque trou.</p>
<pre class="code">n :            10 11 12  15 16  20
ROW_NUMBER :    1  2  3   4  5   6
n - ROW_NUMBER: 9  9  9  11 11  14   → 3 îlots</pre>
<p>Le numéro d'heure : <code>CAST(ROUND((julianday(horodatage) - julianday('2028-02-15')) * 24) AS INTEGER)</code>.</p>`,
  task:`Pour <code>sous_station = 'SST Dédale'</code> et <code>kwh &gt; 20</code>, affiche <code>debut</code>, <code>fin</code> (premier et dernier horodatage de chaque îlot) et <code>heures</code> (nombre de relevés), par <code>debut</code>.`,
  solution:`WITH h AS (SELECT horodatage, CAST(ROUND((julianday(horodatage) - julianday('2028-02-15')) * 24) AS INTEGER) AS n FROM releves_electriques WHERE sous_station = 'SST Dédale' AND kwh > 20), g AS (SELECT horodatage, n - ROW_NUMBER() OVER (ORDER BY n) AS grp FROM h) SELECT MIN(horodatage) AS debut, MAX(horodatage) AS fin, COUNT(*) AS heures FROM g GROUP BY grp ORDER BY debut;`,
  hints:["CTE h : le numéro d'heure n","CTE g : n - ROW_NUMBER() OVER (ORDER BY n) AS grp, puis GROUP BY grp"], require:[{re:'ROW_NUMBER', msg:"Utilise ROW_NUMBER() pour former les îlots."}], check:{ordered:true},
  success:`Trois îlots. Deux coupures en mars, dont celle du 4 que le carnet redoutait. Le troisième dure depuis le 11 mars à 22h, sans interruption : MINOTAURE est dans la dernière ligne droite.`
});
boss({ id:'41.4', ch:41, tail:false, xp:300, timer:900, title:'Boss : le compte à rebours', who:'byte',
  story:`Byte a intercepté le tableau de bord de l'entraînement : table <code>minotaure_checkpoints</code>, un point par heure, avec un JSON de métriques (<code>acc</code> = exactitude). « Quand <code>acc</code> atteindra 0,99, MINOTAURE se lancera tout seul. Sur les 48 derniers points, la courbe est une droite. Prolonge-la. »`,
  lesson:`<p>Une <b>régression linéaire</b> (y = a·x + b) en SQL, avec cinq agrégats :</p>
<pre class="code">a = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²)
b = (Σy − a·Σx) / n
x cible = (0,99 − b) / a</pre>
<p>Prends x = nombre d'heures depuis le plus ancien des 48 points. L'heure prévue est alors <code>julianday(début) + x_cible / 24</code>, que <code>strftime('%Y-%m-%d %H:%M', ...)</code> remet en date lisible. <code>json_extract(metriques, '$.acc')</code> lit l'exactitude.</p>`,
  task:`Sur les 48 derniers checkpoints (par <code>epoch</code>), affiche <code>pente</code> (gain d'exactitude par heure, arrondi à 5 décimales) et <code>heure_limite</code> (format <code>AAAA-MM-JJ HH:MM</code>), heure à laquelle la droite atteint 0,99.`,
  solution:`WITH ${REG_SQL} SELECT ROUND(a, 5) AS pente, strftime('%Y-%m-%d %H:%M', (SELECT j FROM x0) + (0.99 - b) / a / 24) AS heure_limite FROM reg;`,
  hints:["CTE c : ORDER BY epoch DESC LIMIT 48, avec json_extract","CTE des points (x en heures), CTE des sommes, CTE de a et b","strftime('%Y-%m-%d %H:%M', j0 + (0.99 - b) / a / 24)"], require:[{re:'json_extract', msg:"Lis l'exactitude avec json_extract."}],
  success:`Le 21 mars vers <b>4h</b>, comme dans le carnet. Varga prend son manteau : « Haddad, vous venez de Marseille pour rien si on arrive en retard. On y va. »`
});
mis({ id:'41.5', ch:41, xp:200, title:'Le téléphone de la cellule', who:'haddad',
  story:`Haddad : « Ouali ne peut pas piloter tout ça seul depuis sa cellule. Il a un téléphone en contrebande, et quelqu'un sur place. Cherche les chaînes d'exactement deux appels qui partent d'un numéro capté par l'antenne de Fleury-Mérogis et arrivent à un numéro capté par l'antenne qui couvre la station Dédale. » Tables <code>bornages</code>, <code>antennes</code>, <code>communications</code>, <code>abonnes</code>.`,
  lesson:`<p>Un appel relie deux numéros dans les deux sens : on rend le graphe <b>non orienté</b> en empilant les deux directions.</p>
<pre class="code">lien AS (SELECT appelant AS x, appele AS y FROM communications
         UNION
         SELECT appele, appelant FROM communications)</pre>
<p>Deux sauts : <code>lien l1 JOIN lien l2 ON l2.x = l1.y</code>.</p>`,
  task:`Affiche <code>depart</code>, <code>relais</code>, <code>arrivee</code> et <code>titulaire</code> (de l'arrivée, via <code>abonnes</code>, peut être NULL) pour ces chaînes en deux sauts (DISTINCT).`,
  solution:`WITH ${TEL_SQL}, cible AS (SELECT DISTINCT b.numero FROM bornages b JOIN antennes a ON a.antenne = b.antenne WHERE a.station = 'Dédale') SELECT DISTINCT f.numero AS depart, l1.y AS relais, l2.y AS arrivee, ab.titulaire FROM f JOIN lien l1 ON l1.x = f.numero JOIN lien l2 ON l2.x = l1.y JOIN cible ON cible.numero = l2.y LEFT JOIN abonnes ab ON ab.numero = l2.y;`,
  hints:["CTE f : numéros captés à Fleury ; CTE cible : numéros captés par l'antenne dont la station est 'Dédale'","f JOIN lien l1 ON l1.x = f.numero JOIN lien l2 ON l2.x = l1.y JOIN cible ON cible.numero = l2.y"],
  success:`Un prépayé dans la cellule, un prépayé relais, et au bout : <b>Paul Ricci</b>, capté toute la soirée sous la station Dédale. Haddad pâlit : « Ricci. Calanques Fret. Le port de Marseille. »`
});
mis({ id:'41.6', ch:41, xp:200, title:'Qui paie l\'électricité ?', who:'byte',
  story:`« Une station fantôme qui consomme, ça se paie. Le contrat de SST Dédale est réglé par une société (<code>sous_stations.payeur_siren</code>). Remonte toute la chaîne de propriété. »`,
  lesson:`<p>Même récursion qu'aux épisodes 18 et 27, avec une différence : une personne peut détenir une société par <b>plusieurs chemins</b>. On additionne donc ses parts avec <code>SUM</code> et <code>GROUP BY</code>.</p>`,
  task:`Partant du payeur de 'SST Dédale', affiche <code>beneficiaire</code> (sans <code>PERSONNE:</code>) et <code>part</code> (somme des parts réelles, arrondie à 1 décimale) des personnes, par part décroissante.`,
  solution:`WITH RECURSIVE ch(siren, part) AS (SELECT payeur_siren, 100.0 FROM sous_stations WHERE nom = 'SST Dédale' UNION ALL SELECT p.detenteur, c.part * p.pct / 100 FROM participations p JOIN ch c ON p.detenue = c.siren) SELECT REPLACE(siren, 'PERSONNE:', '') AS beneficiaire, ROUND(SUM(part), 1) AS part FROM ch WHERE siren LIKE 'PERSONNE:%' GROUP BY siren ORDER BY part DESC;`,
  hints:["Point de départ : SELECT payeur_siren, 100.0 FROM sous_stations WHERE nom = 'SST Dédale'","GROUP BY siren et SUM(part) à la fin"], require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."}], check:{ordered:true},
  success:`Labyrinthe Énergie, créée le 2 février. 40 % pour <b>Farid Ouali</b>, via sa société de conseil. 29,4 % pour <b>Paul Ricci</b>, via Calanques Fret. Le Cartographe et l'associé de Delorme paient la même facture.`
});
mis({ id:'41.7', ch:41, xp:250, title:'La tête de l\'Hydre', who:'byte',
  story:`« Le serveur de commande de l'Hydre, celui que le logiciel espion contactait toutes les dix minutes en mars, il est bien quelque part. Recalcule les balises de la Saison 4 et regarde où est installée la ligne internet de leur adresse IP. » Tables <code>proxy_logs</code>, <code>domaines_connus</code>, <code>lignes_internet</code>, <code>societes</code>.`,
  lesson:`<p>Révision de l'épisode 36 : intervalle entre deux connexions avec <code>LAG</code>, puis moyenne et écart-type par (host, domaine). Une balise automatique a un <b>coefficient de variation</b> (écart-type / moyenne) minuscule. On écarte les domaines connus et on exige au moins 50 intervalles.</p>`,
  task:`Pour les IP de destination des balises (coefficient de variation inférieur à 0,05, au moins 50 intervalles, domaine absent de <code>domaines_connus</code>), affiche <code>ip</code>, <code>station</code> et <code>abonne</code> (nom de la société abonnée à la ligne).`,
  solution:`WITH ${C2_SQL} SELECT l.ip, l.station, so.nom AS abonne FROM c2 JOIN lignes_internet l ON l.ip = c2.ip_dest JOIN societes so ON so.siren = l.abonne_siren;`,
  hints:["Reprends la détection de balises de 36.4.","JOIN lignes_internet l ON l.ip = c2.ip_dest JOIN societes ON siren = abonne_siren"], require:[{re:'LAG', msg:"Calcule les intervalles avec LAG."}],
  success:`La ligne du serveur de l'Hydre est installée dans un local technique de la station <b>Dédale</b>, au nom de Labyrinthe Énergie. Les quatre affaires convergent vers le même quai.`
});
boss({ id:'41.8', ch:41, tail:false, xp:300, timer:900, title:'Boss : le labyrinthe', who:'varga2',
  story:`Varga, dans la voiture : « On entre par la Préfecture. Le réseau TransSeine est fermé la nuit, certains tunnels sont inondés (<code>etat = 'ferme'</code>). Donne-moi le chemin le plus court jusqu'à Dédale. » Table <code>troncons</code> (de, vers, minutes, etat), chaque tronçon dans les deux sens.`,
  lesson:`<p>Plus court chemin avec une CTE récursive : on part du départ, on ajoute un tronçon à chaque étape en mémorisant le <b>chemin</b> et le <b>total</b>.</p>
<pre class="code">WITH RECURSIVE p(noeud, chemin, total) AS (
  SELECT 'Départ', 'Départ', 0
  UNION ALL
  SELECT t.vers, p.chemin || ' > ' || t.vers, p.total + t.minutes
  FROM p JOIN troncons t ON t.de = p.noeud
  WHERE instr(p.chemin, t.vers) = 0     -- pas de boucle
    AND p.total + t.minutes &lt;= 60        -- on borne l'exploration
)
SELECT ... ORDER BY total LIMIT 1;</pre>`,
  task:`Affiche <code>chemin</code> (stations séparées par <code>' &gt; '</code>, de 'Préfecture' à 'Dédale') et <code>minutes</code> du trajet le plus court par les tronçons ouverts.`,
  solution:`WITH RECURSIVE p(noeud, chemin, total) AS (SELECT 'Préfecture', 'Préfecture', 0 UNION ALL SELECT t.vers, p.chemin || ' > ' || t.vers, p.total + t.minutes FROM p JOIN troncons t ON t.de = p.noeud WHERE t.etat = 'ouvert' AND instr(p.chemin, t.vers) = 0 AND p.total + t.minutes <= 60 AND p.noeud <> 'Dédale') SELECT chemin, total AS minutes FROM p WHERE noeud = 'Dédale' ORDER BY total LIMIT 1;`,
  hints:["Partie initiale : SELECT 'Préfecture', 'Préfecture', 0","Conditions : t.etat = 'ouvert', instr(p.chemin, t.vers) = 0, total <= 60","Finale : WHERE noeud = 'Dédale' ORDER BY total LIMIT 1"], require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."}],
  success:`Vingt minutes, par Châtelet, Bastille et Gare de Lyon. Le tunnel direct de Bastille est inondé : sans la requête, l'équipe y serait entrée. Il est 3h24.`
});
mis({ id:'41.9', ch:41, xp:300, title:'Couper le fil', who:'byte',
  story:`Byte a accès à la file d'attente de MINOTAURE (<code>file_minotaure</code>). « Je ne peux pas l'arrêter, mais je peux bloquer ses virements. Lesquels ? Des milliers de petits montants, depuis des comptes différents, vers une poignée de comptes mules. Un vrai virement, lui, ne converge pas vers le même compte depuis des dizaines de sources. »`,
  lesson:`<p>Le <b>fan-in</b> : un compte qui reçoit de très nombreuses sources différentes. C'est la signature d'un compte mule. Le blocage se fait dans une transaction, pour pouvoir annuler en cas d'erreur.</p>
<pre class="code">BEGIN;
UPDATE t SET statut = '...' WHERE compte_dest IN (
  SELECT compte_dest FROM t GROUP BY compte_dest
  HAVING COUNT(DISTINCT compte_source) &gt;= 10);
COMMIT;</pre>`,
  task:`Dans une transaction, passe à <code>'bloque'</code> le statut des virements <code>'en_attente'</code> dont le compte destinataire reçoit d'au moins 10 comptes sources distincts.`,
  solution:`BEGIN; UPDATE file_minotaure SET statut = 'bloque' WHERE statut = 'en_attente' AND compte_dest IN (SELECT compte_dest FROM file_minotaure GROUP BY compte_dest HAVING COUNT(DISTINCT compte_source) >= 10); COMMIT;`,
  hints:["Sous-requête : GROUP BY compte_dest HAVING COUNT(DISTINCT compte_source) >= 10","N'oublie pas BEGIN; et COMMIT;"], require:[{re:'BEGIN', msg:"Fais-le dans une transaction (BEGIN ... COMMIT)."}],
  check:{mode:'dml', verify:["SELECT statut, COUNT(*), ROUND(SUM(montant), 2) FROM file_minotaure GROUP BY statut ORDER BY statut","SELECT COUNT(DISTINCT compte_dest) FROM file_minotaure WHERE statut = 'bloque'"]},
  success:`208 virements bloqués, plus de 200 000 € qui ne quitteront pas Hélios. Les virements légitimes de la nuit passent normalement. À 3h47, la brigade descend l'escalier de service de la station Gare de Lyon.`
});
boss({ id:'41.10', ch:41, tail:false, title:'Boss final : au centre du labyrinthe', xp:1000, timer:2400, who:'varga2',
  story:`La juge Amrani est en ligne : « Je signe le mandat si votre requête tient debout toute seule. » Écris <b>une seule requête</b> qui renvoie une ligne avec :<ol>
<li><code>station</code> : la station de la sous-station au <b>plus fort score z</b> (calcul de 41.2) ;</li>
<li><code>minutes</code> : la durée du plus court chemin de 'Préfecture' à cette station par les tronçons ouverts ;</li>
<li><code>heure_limite</code> : l'heure prévue par la régression des 48 derniers checkpoints (format <code>AAAA-MM-JJ HH:MM</code>) ;</li>
<li><code>serveur</code> : l'IP de la balise de la Saison 4 (même détection qu'en 41.7) dont la ligne est installée dans cette station ;</li>
<li><code>complice</code> : la personne qui détient <b>plus de 25 %</b> du payeur de cette sous-station <b>et</b> qui est titulaire d'un numéro, capté par l'antenne de cette station, joignable en deux appels depuis un numéro capté à 'Fleury-Mérogis'.</li></ol>`,
  lesson:`<p>Un seul <code>WITH RECURSIVE</code> peut contenir plusieurs CTE, récursives ou non. Construis une CTE par brique (anomalie, chemin, régression, balise, propriété, téléphonie), puis assemble-les dans le SELECT final avec des sous-requêtes scalaires.</p>
<p>Seuls les points d'entrée de l'énoncé sont autorisés comme valeurs : '2028-03-01', 'Préfecture', 'ouvert', 'Fleury-Mérogis', 48, 0,99 et 25 (et pour la balise, 0,05 et 50). Le nom de la station, de la sous-station, du complice, des numéros ou des sociétés doit être retrouvé par la requête.</p>`,
  task:`Affiche <code>station</code>, <code>minutes</code>, <code>heure_limite</code>, <code>serveur</code> et <code>complice</code>.`,
  solution:`WITH RECURSIVE ${Z_SQL}, anomalie AS (SELECT ss.nom, ss.station, ss.payeur_siren FROM sous_stations ss JOIN z ON z.sous_station = ss.nom ORDER BY z.z DESC LIMIT 1), p(noeud, chemin, total) AS (SELECT 'Préfecture', 'Préfecture', 0 UNION ALL SELECT t.vers, p.chemin || ' > ' || t.vers, p.total + t.minutes FROM p JOIN troncons t ON t.de = p.noeud WHERE t.etat = 'ouvert' AND instr(p.chemin, t.vers) = 0 AND p.total + t.minutes <= 60 AND p.noeud <> (SELECT station FROM anomalie)), trajet AS (SELECT MIN(total) AS minutes FROM p WHERE noeud = (SELECT station FROM anomalie)), ${REG_SQL}, limite AS (SELECT strftime('%Y-%m-%d %H:%M', (SELECT j FROM x0) + (0.99 - b) / a / 24) AS h FROM reg), ch(siren, part) AS (SELECT payeur_siren, 100.0 FROM anomalie UNION ALL SELECT pa.detenteur, ch.part * pa.pct / 100 FROM participations pa JOIN ch ON pa.detenue = ch.siren), benef AS (SELECT REPLACE(siren, 'PERSONNE:', '') AS nom FROM ch WHERE siren LIKE 'PERSONNE:%' GROUP BY siren HAVING SUM(part) > 25), ${TEL_SQL}, cible AS (SELECT DISTINCT b.numero FROM bornages b JOIN antennes an ON an.antenne = b.antenne WHERE an.station = (SELECT station FROM anomalie)), tel AS (SELECT DISTINCT ab.titulaire FROM f JOIN lien l1 ON l1.x = f.numero JOIN lien l2 ON l2.x = l1.y JOIN cible ON cible.numero = l2.y JOIN abonnes ab ON ab.numero = l2.y), ${C2_SQL}, serveur AS (SELECT l.ip FROM c2 JOIN lignes_internet l ON l.ip = c2.ip_dest WHERE l.station = (SELECT station FROM anomalie)) SELECT (SELECT station FROM anomalie) AS station, (SELECT minutes FROM trajet) AS minutes, (SELECT h FROM limite) AS heure_limite, (SELECT ip FROM serveur) AS serveur, nom AS complice FROM benef WHERE nom IN (SELECT titulaire FROM tel);`,
  hints:["Reprends 41.2 pour l'anomalie, 41.8 pour le chemin, 41.4 pour l'heure, 41.6 et 41.5 pour le complice, 41.7 pour le serveur.","Remplace chaque valeur trouvée (station, sous-station) par une sous-requête sur ta CTE anomalie.","Dans la récursion du chemin, la station d'arrivée devient (SELECT station FROM anomalie)."],
  require:[{re:'RECURSIVE', msg:"Le chemin et la propriété exigent une CTE récursive."},{re:'json_extract', msg:"La régression exige json_extract."},{re:'^(?![\\s\\S]*(D[ée]dale|Ricci|Paul|Ouali|Farid|SST\\s+D|192\\.0\\.2|update|Bercy|Gare de Lyon|Labyrinthe|Calanques|5120|0759|0612|LT60))', msg:"Ne recopie aucune valeur trouvée avant (station, sous-station, personne, antenne, société, numéro) : la requête doit tout retrouver seule."}],
  check:{strictCols:true},
  success:`3h52. La porte de service de la station Dédale cède. Au fond du quai, six serveurs ronronnent sous des bâches. Paul Ricci a encore la main sur le clavier. Byte débranche le câble réseau à 3h54. MINOTAURE ne finira jamais d'apprendre.`
});
