// Quêtes annexes et cachées, saison 4
// (utilise les constantes SPRAY, BEACON et IOC_SETUP de missions6.js)

/* ============ 32 ============ */
mis({ id:'32.A', ch:32, side:'annexe', xp:120, title:'La liste de l\'attaquant', who:'benali',
  story:`Benali : « Un pulvérisateur ne tape pas au hasard : il a une liste de comptes. Je veux savoir, service par service, combien de comptes existent et combien il a essayés. Si un service manque à l'appel, c'est peut-être qu'il le gardait pour plus tard. »`,
  lesson:`<p>On compte <b>tous</b> les comptes d'un service, et en même temps ceux qui remplissent une condition, avec une somme conditionnelle. La condition peut contenir une sous-requête :</p>
<pre class="code">SELECT ville, COUNT(*) AS total,
       SUM(CASE WHEN id IN (SELECT suspect_id FROM delits) THEN 1 ELSE 0 END) AS fiches
FROM suspects GROUP BY ville;</pre>
<p>Un service sans aucun compte visé apparaît alors avec 0, ce qu'un simple WHERE aurait fait disparaître.</p>`,
  task:`Avec la CTE des IP à au moins 100 échecs (comme en 32.3), affiche pour chaque <code>service</code> de <code>comptes_ad</code> : <code>comptes</code> (nombre de comptes) et <code>vises</code> (comptes ayant au moins un échec depuis une de ces IP), par <code>service</code>.`,
  solution:`WITH ${SPRAY} SELECT c.service, COUNT(*) AS comptes, SUM(CASE WHEN c.login IN (SELECT login FROM auth_logs WHERE resultat = 'echec' AND source_ip IN (SELECT source_ip FROM spray)) THEN 1 ELSE 0 END) AS vises FROM comptes_ad c GROUP BY c.service ORDER BY c.service;`,
  hints:["Pars de comptes_ad et GROUP BY service : c'est la seule façon de garder les services à 0.","SUM(CASE WHEN c.login IN (SELECT login FROM auth_logs WHERE resultat = 'echec' AND source_ip IN (SELECT source_ip FROM spray)) THEN 1 ELSE 0 END)"],
  check:{ordered:true},
  success:`53 comptes visés sur 77, environ deux tiers de chaque service. Un seul service à zéro : <b>INFO (prestataire)</b>, c'est-à-dire Clément Varenne. Et en comptabilité, Nadia Perrin n'est pas sur la liste non plus. Byte : « Les deux comptes qui comptent le plus dans la suite de l'histoire sont justement ceux qu'il n'a pas essayés. Pour eux, il avait un autre plan. »`
});
mis({ id:'32.S', ch:32, side:'cachee', xp:200, title:'Les machines fantômes', who:'byte',
  teaser:`Une adresse qui ne figure dans aucun inventaire s'est connectée au serveur de fichiers.`,
  story:`Byte : « Toutes les machines de la ville sont dans <code>postes</code>, avec leur IP. Alors explique-moi pourquoi des connexions réussies, hors VPN, viennent d'adresses qui n'y sont pas. Une machine qui n'existe pas ne devrait pas pouvoir ouvrir de session. »`,
  lesson:`<p>Pour trouver ce qui est <b>absent</b> d'une liste de référence : <code>NOT IN (SELECT ...)</code>. Puis on agrège par adresse, avec <code>group_concat(DISTINCT ... ORDER BY ...)</code> pour résumer qui et quoi :</p>
<pre class="code">SELECT ville, group_concat(DISTINCT nom ORDER BY nom) AS noms
FROM suspects WHERE ville NOT IN (SELECT ville FROM agences)
GROUP BY ville;</pre>`,
  task:`Pour les connexions réussies de méthode différente de 'vpn' dont la <code>source_ip</code> n'est pas une IP de <code>postes</code>, affiche par IP source : <code>source_ip</code>, <code>comptes</code> (logins distincts), <code>machines</code> (dest_host distincts, dans l'ordre alphabétique, avec group_concat), <code>connexions</code>, <code>premiere</code> et <code>derniere</code>, par <code>premiere</code>.`,
  solution:`SELECT source_ip, group_concat(DISTINCT login) AS comptes, group_concat(DISTINCT dest_host ORDER BY dest_host) AS machines, COUNT(*) AS connexions, MIN(horodatage) AS premiere, MAX(horodatage) AS derniere FROM auth_logs WHERE resultat = 'succes' AND methode <> 'vpn' AND source_ip NOT IN (SELECT ip FROM postes) GROUP BY source_ip ORDER BY premiere;`,
  hints:["WHERE resultat = 'succes' AND methode <> 'vpn' AND source_ip NOT IN (SELECT ip FROM postes)","GROUP BY source_ip, puis group_concat(DISTINCT dest_host ORDER BY dest_host)"],
  check:{ordered:true},
  success:`Deux fantômes. <b>10.10.7.60</b> : le portable de Clément Varenne, le prestataire, venu les 2 et 4 mars, et qui a fait ce jour-là une maintenance sur <b>PC-COMPTA-07</b>. Retiens ce nom de machine. <b>10.99.0.5</b> : une adresse que personne n'a jamais attribuée, utilisée par svc_backup trois minutes après chacune de ses connexions VPN depuis 192.0.2.150. Benali blêmit : « Il ne s'est pas contenté de passer la porte. Il a branché sa propre machine dans notre réseau. »`
});

/* ============ 33 ============ */
mis({ id:'33.A', ch:33, side:'annexe', xp:120, title:'Service par service', who:'benali',
  story:`Benali : « Je dois écrire aux chefs de service avant midi. Pour chacun : combien d'agents ont été visés par la fausse facture, combien l'ont vraiment reçue, et combien ont cliqué. »`,
  lesson:`<p>Le login se trouve <b>avant</b> le @ de l'adresse : <code>substr(adresse, 1, instr(adresse, '@') - 1)</code>. Une fois extrait, il sert de clé de jointure vers <code>comptes_ad</code>. Pour compter plusieurs choses dans un même GROUP BY, on additionne des CASE :</p>
<pre class="code">SUM(CASE WHEN verdict = '...' THEN 1 ELSE 0 END)</pre>`,
  task:`Pour les mails de 'factures@eaux-de-seine-fr.com', affiche par <code>service</code> (de comptes_ad) : <code>vises</code> (mails), <code>recus</code> (verdict 'livre') et <code>cliqueurs</code> (destinataires ayant cliqué sur une URL contenant 'eaux-de-seine-fr.com'), par <code>service</code>.`,
  solution:`WITH r AS (SELECT substr(destinataire, 1, instr(destinataire, '@') - 1) AS login, verdict FROM mail_logs WHERE expediteur = 'factures@eaux-de-seine-fr.com') SELECT c.service, COUNT(*) AS vises, SUM(CASE WHEN r.verdict = 'livre' THEN 1 ELSE 0 END) AS recus, SUM(CASE WHEN r.login IN (SELECT login FROM clics WHERE url LIKE '%eaux-de-seine-fr.com%') THEN 1 ELSE 0 END) AS cliqueurs FROM r JOIN comptes_ad c ON c.login = r.login GROUP BY c.service ORDER BY c.service;`,
  hints:["CTE r : substr(destinataire, 1, instr(destinataire, '@') - 1) AS login, et le verdict","JOIN comptes_ad sur le login, puis trois agrégats dont deux SUM(CASE ...)"],
  check:{ordered:true},
  success:`Huit services touchés, aucun épargné. Cinq clics en tout, un par service au maximum, et jamais deux dans le même bureau. Benali : « Ils ne se sont pas passé le mot. Chacun a cru être le seul à recevoir une relance. »`
});
mis({ id:'33.S', ch:33, side:'cachee', xp:200, title:'Le faux guichet', who:'byte',
  teaser:`Le faux site de la régie avait une adresse, et elle ressemble beaucoup à une autre.`,
  story:`Byte : « Un clic, c'est une URL. Derrière l'URL il y a un domaine, et derrière le domaine une adresse IP que le proxy a forcément vue passer. Suis les cinq cliqueurs jusqu'au serveur qui leur a répondu, puis regarde à qui appartient la ligne (<code>lignes_internet</code>, <code>societes</code>). »`,
  lesson:`<p>Le domaine d'une URL est entre <code>https://</code> (8 caractères) et le <b>premier</b> <code>/</code> qui suit. On découpe en deux temps, comme en 33.1 :</p>
<pre class="code">substr(u, 9)                                  -- après 'https://'
substr(u, 9, instr(substr(u, 9), '/') - 1)    -- jusqu'au premier '/'</pre>
<p>Pour relier deux journaux dans le temps, on joint sur un intervalle : <code>x.horodatage BETWEEN k.horodatage AND datetime(k.horodatage, '+60 seconds')</code>.</p>`,
  task:`Pour chaque clic, extrais le domaine de l'URL et garde ceux absents de <code>domaines_connus</code>. Retrouve les connexions proxy du poste du cliqueur (via <code>postes.utilisateur</code>) vers ce domaine dans les 60 secondes qui suivent le clic, puis la ligne de l'IP de destination et son abonné. Affiche <code>domaine</code>, <code>ip</code>, <code>abonne</code> (nom de la société), <code>adresse</code> et <code>visites</code> (nombre de connexions).`,
  solution:`WITH k AS (SELECT horodatage, login, substr(url, 9, instr(substr(url, 9), '/') - 1) AS dom FROM clics) SELECT k.dom AS domaine, x.ip_dest AS ip, s.nom AS abonne, l.adresse, COUNT(*) AS visites FROM k JOIN postes p ON p.utilisateur = k.login JOIN proxy_logs x ON x.host = p.hostname AND x.domaine = k.dom AND x.horodatage BETWEEN k.horodatage AND datetime(k.horodatage, '+60 seconds') JOIN lignes_internet l ON l.ip = x.ip_dest JOIN societes s ON s.siren = l.abonne_siren WHERE k.dom NOT IN (SELECT domaine FROM domaines_connus) GROUP BY k.dom, x.ip_dest, s.nom, l.adresse;`,
  hints:["CTE k : horodatage, login et substr(url, 9, instr(substr(url, 9), '/') - 1) AS dom","Jointures : postes (utilisateur = login), proxy_logs (host, domaine, intervalle de 60 s), lignes_internet, societes","Filtre final : dom NOT IN (SELECT domaine FROM domaines_connus)"],
  success:`<b>192.0.2.80</b>, une ligne louée chez NordHost, un hébergeur de Roubaix. Rien d'illégal en soi. Mais Byte pose le doigt sur l'écran : « 192.0.2.80. La pulvérisation venait de 192.0.2.150. Même bloc d'adresses, à quelques numéros près. Le faux guichet et le bélier sortent du même quartier d'Internet. » Ce n'est pas encore une preuve. C'est une piste qui ne se refermera pas.`
});

/* ============ 34 ============ */
mis({ id:'34.A', ch:34, side:'annexe', xp:120, title:'Les orphelins', who:'byte',
  story:`Byte : « Dans l'arbre, certains rundll32 n'ont pas de parent connu : leur ppid ne correspond à aucun processus journalisé. C'est la signature d'une tâche planifiée, lancée par un service système qu'on ne voit pas. Compte ces orphelins, jour par jour. »`,
  lesson:`<p>Avec un <b>LEFT JOIN</b>, une ligne sans correspondance est gardée, et les colonnes de la table de droite valent NULL. C'est la façon classique de trouver « ceux qui n'ont pas de... » :</p>
<pre class="code">SELECT s.nom FROM suspects s
LEFT JOIN vehicules v ON v.suspect_id = s.id
WHERE v.immatriculation IS NULL;</pre>
<p>Ici on fait un LEFT JOIN de <code>process_logs</code> sur elle-même, du fils vers le père.</p>`,
  task:`Pour les processus 'rundll32.exe' dont la ligne de commande contient 'upd.dll' et dont le parent (même host, pid = ppid) est absent de <code>process_logs</code>, affiche <code>host</code>, <code>jour</code> (date), <code>executions</code>, <code>premiere</code> et <code>derniere</code>, par <code>jour</code>.`,
  solution:`SELECT f.host, date(f.horodatage) AS jour, COUNT(*) AS executions, MIN(f.horodatage) AS premiere, MAX(f.horodatage) AS derniere FROM process_logs f LEFT JOIN process_logs p ON p.host = f.host AND p.pid = f.ppid WHERE f.process = 'rundll32.exe' AND f.ligne_commande LIKE '%upd.dll%' AND p.pid IS NULL GROUP BY f.host, jour ORDER BY jour;`,
  hints:["LEFT JOIN process_logs p ON p.host = f.host AND p.pid = f.ppid","WHERE ... AND p.pid IS NULL, puis GROUP BY host, date(horodatage)"],
  check:{ordered:true},
  success:`Toutes les demi-heures, à 40 secondes près, du 6 mars 9h45 au 7 mars 14h45 : la tâche « MAJ_Adobe » relance la charge 59 fois. Puis plus rien. Byte : « Il n'en a plus besoin. Depuis 2h36 le 7 mars, il est installé sur SRV-FICHIERS. On ne garde pas la clé de la cave quand on a celle du coffre. »`
});
mis({ id:'34.S', ch:34, side:'cachee', xp:200, title:'Le poste qui travaille seul', who:'byte',
  teaser:`Pendant que sa propriétaire était en congés, PC-COMPTA-07 a continué sa journée de travail.`,
  story:`Byte : « Chaque processus porte le login de celui qui l'a lancé. Et <code>deplacements</code> dit qui n'était pas à son bureau. Sur les postes de travail (type 'poste'), cherche les processus lancés par quelqu'un pendant un de ses déplacements, et compte ses connexions réussies sur la même période. »`,
  lesson:`<p>Une jointure sur un <b>intervalle</b> relie un événement à la période qui le contient :</p>
<pre class="code">JOIN periodes p ON p.qui = e.qui
               AND e.horodatage BETWEEN p.debut AND p.fin</pre>
<p>Une sous-requête corrélée dans le SELECT peut ensuite compter, pour chaque groupe, ce qui s'est passé dans un autre journal sur la même période.</p>`,
  task:`Pour les processus de <code>process_logs</code> lancés sur un poste de type 'poste' par un login pendant un de ses déplacements, affiche par login, déplacement et host : <code>login</code>, <code>lieu</code>, <code>host</code>, <code>processus</code> (nombre), <code>programmes</code> (noms de processus distincts, dans l'ordre alphabétique, avec group_concat), <code>premier</code> et <code>connexions</code> (succès de ce login dans <code>auth_logs</code> pendant ce déplacement), par <code>premier</code> puis <code>host</code>.`,
  solution:`SELECT f.login, d.lieu, f.host, COUNT(*) AS processus, group_concat(DISTINCT f.process ORDER BY f.process) AS programmes, MIN(f.horodatage) AS premier, (SELECT COUNT(*) FROM auth_logs a WHERE a.login = f.login AND a.resultat = 'succes' AND a.horodatage BETWEEN d.debut AND d.fin) AS connexions FROM process_logs f JOIN deplacements d ON d.login = f.login AND f.horodatage BETWEEN d.debut AND d.fin JOIN postes po ON po.hostname = f.host AND po.type = 'poste' GROUP BY f.login, d.id, d.lieu, d.debut, d.fin, f.host ORDER BY premier, f.host;`,
  hints:["JOIN deplacements d ON d.login = f.login AND f.horodatage BETWEEN d.debut AND d.fin, puis JOIN postes avec type = 'poste'","GROUP BY login, déplacement, host ; connexions = sous-requête corrélée sur auth_logs entre d.debut et d.fin"],
  check:{ordered:true},
  success:`Deux cas, deux histoires. Sofia Lopez, en formation à Lille : un seul <code>inventaire.ps1</code>, lancé à 10h00 pile sur deux machines à la fois. Un script planifié, rien de plus. Mais <b>Nadia Perrin</b>, en congés les 13 et 14 mars : huit programmes ouverts à des heures de bureau (explorer, outlook, excel, chrome, winword), et <b>zéro</b> connexion. Personne n'a tapé son mot de passe. Byte : « Quelqu'un pilote sa session à distance et rejoue sa journée type pour que le poste ait l'air normal. Le patient zéro n'est pas guéri : il sert de déguisement. »`
});

/* ============ 35 ============ */
mis({ id:'35.A', ch:35, side:'annexe', xp:120, title:'Les horaires des admins', who:'benali',
  story:`Benali : « Chaque compte à privilèges a ses habitudes. Un tableau simple : pour chaque compte admin, ses connexions réussies la nuit, le jour et le soir. Ce qui sort du rang, on le verra tout de suite. »`,
  lesson:`<p><code>strftime('%H', horodatage)</code> donne l'heure en texte ('00' à '23'), qu'on convertit avec <code>CAST(... AS INTEGER)</code>. Trois SUM(CASE ...) découpent la journée en tranches dans un seul GROUP BY :</p>
<pre class="code">SUM(CASE WHEN CAST(strftime('%H', h) AS INTEGER) BETWEEN 12 AND 13
         THEN 1 ELSE 0 END) AS midi</pre>`,
  task:`Pour les succès des comptes <code>admin = 1</code>, affiche <code>login</code>, <code>nuit</code> (0h à 5h59), <code>jour</code> (6h à 19h59) et <code>soir</code> (20h à 23h59), par <code>login</code>.`,
  solution:`SELECT a.login, SUM(CASE WHEN CAST(strftime('%H', a.horodatage) AS INTEGER) < 6 THEN 1 ELSE 0 END) AS nuit, SUM(CASE WHEN CAST(strftime('%H', a.horodatage) AS INTEGER) BETWEEN 6 AND 19 THEN 1 ELSE 0 END) AS jour, SUM(CASE WHEN CAST(strftime('%H', a.horodatage) AS INTEGER) >= 20 THEN 1 ELSE 0 END) AS soir FROM auth_logs a JOIN comptes_ad c ON c.login = a.login WHERE c.admin = 1 AND a.resultat = 'succes' GROUP BY a.login ORDER BY a.login;`,
  hints:["JOIN comptes_ad, WHERE admin = 1 AND resultat = 'succes', GROUP BY login","Trois SUM(CASE WHEN CAST(strftime('%H', a.horodatage) AS INTEGER) ... THEN 1 ELSE 0 END)"],
  check:{ordered:true},
  success:`Lopez, Ndiaye et le compte de supervision ne travaillent que de jour. svc_backup a ses quatorze sessions du soir (la sauvegarde de 23h) et <b>quatre de nuit</b> : les deux visites de l'attaquant, VPN puis serveur de fichiers. Et Varenne, prestataire de jour, compte <b>six connexions nocturnes</b>, toutes après son départ pour Lyon.`
});
mis({ id:'35.S', ch:35, side:'cachee', xp:200, title:'Le chemin de l\'eau', who:'byte',
  teaser:`Le compte de Varenne n'est pas allé que vers le contrôleur de domaine.`,
  story:`Byte : « Le boss s'arrêtait à DC01. Mais le graphe des sauts de adm.varenne a d'autres branches. Relance la même récursion, et cherche cette fois les chemins qui finissent sur une machine industrielle (<code>postes.type = 'ot'</code>), celles qui pilotent les réservoirs. »`,
  lesson:`<p>Même CTE récursive qu'au boss 35.5 : une ligne de départ, puis une jointure sur les arêtes <b>postérieures</b> au saut précédent. On peut transporter dans la récursion une colonne qui ne change pas (l'heure du premier saut), et filtrer la destination à la fin par une jointure vers <code>postes</code>.</p>
<pre class="code">c(dest, chemin, t, depart) AS (
  SELECT dest, src || ' &gt; ' || dest, t, t FROM aretes WHERE ...
  UNION ALL
  SELECT e.dest, c.chemin || ' &gt; ' || e.dest, e.t, c.depart FROM c JOIN aretes e ...)</pre>`,
  task:`Avec les succès de 'adm.varenne' à partir du '2028-03-06' (comme en 35.5), affiche DISTINCT <code>chemin</code> (partant de 'PC-COMPTA-07', machines séparées par ' &gt; '), <code>depart</code> (horodatage du premier saut) et <code>arrivee</code> (horodatage du dernier saut) des chemins qui arrivent sur une machine de type 'ot'.`,
  solution:`WITH RECURSIVE aretes AS (SELECT p.hostname AS src, a.dest_host AS dest, a.horodatage AS t FROM auth_logs a JOIN postes p ON p.ip = a.source_ip WHERE a.login = 'adm.varenne' AND a.resultat = 'succes' AND a.horodatage >= '2028-03-06'), c(dest, chemin, t, depart) AS (SELECT dest, src || ' > ' || dest, t, t FROM aretes WHERE src = 'PC-COMPTA-07' UNION ALL SELECT e.dest, c.chemin || ' > ' || e.dest, e.t, c.depart FROM c JOIN aretes e ON e.src = c.dest AND e.t > c.t AND instr(c.chemin, e.dest) = 0) SELECT DISTINCT c.chemin, c.depart, c.t AS arrivee FROM c JOIN postes po ON po.hostname = c.dest WHERE po.type = 'ot';`,
  hints:["Reprends le boss 35.5 et ajoute une colonne depart transportée telle quelle dans la récursion.","Finale : JOIN postes po ON po.hostname = c.dest WHERE po.type = 'ot', avec SELECT DISTINCT"],
  require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."}],
  success:`PC-COMPTA-07, SRV-FICHIERS, la passerelle SCADA, puis <b>HMI-MONTSOURIS</b>, l'écran qui commande le réservoir de Montsouris, le 12 mars à 3h00. Parti le 7 mars, arrivé cinq jours plus tard. Et le 7 mars à 3h12, il avait déjà visité la passerelle : du repérage. Byte regarde l'horloge du rapport de la régie des eaux : « La pression s'effondre à 3h10. Le chemin de l'eau, c'était celui-là. »`
});

/* ============ 36 ============ */
mis({ id:'36.A', ch:36, side:'annexe', xp:120, title:'Papillons et métronomes', who:'byte',
  story:`Byte : « Avant d'accuser une machine d'être trop régulière, il faut savoir à quoi ressemble un humain. Pour chaque domaine, calcule le coefficient de variation de chaque couple machine et domaine, puis fais-en la moyenne. On verra où passe la frontière. »`,
  lesson:`<p>Agréger un agrégat : on calcule d'abord une statistique par couple (host, domaine) dans une CTE, puis on regroupe à nouveau, par domaine cette fois :</p>
<pre class="code">WITH par_suspect AS (SELECT suspect_id, ville, COUNT(*) AS n FROM delits GROUP BY 1, 2)
SELECT ville, AVG(n) FROM par_suspect GROUP BY ville;</pre>`,
  task:`Pour les couples (host, domaine) d'au moins 10 intervalles (calculés avec LAG comme en 36.3), affiche par domaine : <code>domaine</code>, <code>couples</code> (nombre de couples) et <code>cv_moyen</code> (moyenne des coefficients de variation, arrondie à 2 décimales), par <code>cv_moyen</code>.`,
  solution:`WITH iv AS (SELECT host, domaine, (julianday(horodatage) - julianday(LAG(horodatage) OVER (PARTITION BY host, domaine ORDER BY horodatage))) * 86400 AS dt FROM proxy_logs), st AS (SELECT host, domaine, AVG(dt) AS m, sqrt(AVG(dt * dt) - AVG(dt) * AVG(dt)) AS sd FROM iv WHERE dt IS NOT NULL GROUP BY host, domaine HAVING COUNT(dt) >= 10) SELECT domaine, COUNT(*) AS couples, ROUND(AVG(sd / m), 2) AS cv_moyen FROM st GROUP BY domaine ORDER BY cv_moyen;`,
  hints:["CTE des intervalles avec LAG PARTITION BY host, domaine ; CTE par couple avec HAVING COUNT(dt) >= 10","Puis GROUP BY domaine et ROUND(AVG(sd / m), 2)"],
  require:[{re:'LAG', msg:"Calcule les intervalles avec LAG."}],
  check:{ordered:true, orderKeys:[2]},
  success:`Deux métronomes : l'antivirus (cv de 0, une connexion par heure, à la seconde) et cdn-update-check.net (0,01). Tous les autres domaines, ceux des humains, tournent autour de 0,9. Entre les deux, un vide immense : la frontière n'est pas subtile. Byte : « Les humains sont des papillons. Les machines, des métronomes. Le seul métronome inconnu, c'est lui. »`
});
mis({ id:'36.S', ch:36, side:'cachee', xp:200, title:'Le premier battement', who:'byte',
  teaser:`Le cœur artificiel s'est mis à battre quelques secondes après une naissance que tu connais déjà.`,
  story:`Byte : « Un cœur qui bat, il a bien fallu le mettre en marche. Pour chaque machine qui porte une balise, compare l'heure du premier battement avec l'heure où <i>upd.dll</i> a été chargée pour la première fois sur cette même machine (épisode 34). Et regarde aussi quand il a battu pour la dernière fois. »`,
  lesson:`<p>On réutilise la détection de balises (36.4), puis, pour chaque couple trouvé, des <b>sous-requêtes scalaires corrélées</b> vont chercher une valeur dans d'autres tables :</p>
<pre class="code">SELECT b.host,
  (SELECT MIN(horodatage) FROM autre_table x WHERE x.host = b.host AND ...) AS ...
FROM b</pre>`,
  task:`Pour les couples détectés comme balises (cv &lt; 0.05, au moins 50 intervalles, domaine absent de <code>domaines_connus</code>), affiche <code>host</code>, <code>chargement</code> (premier processus 'rundll32.exe' dont la ligne de commande contient 'upd.dll' sur ce host), <code>premier_battement</code> et <code>dernier_battement</code> (première et dernière connexion du host vers ce domaine) et <code>secondes</code> (délai entre chargement et premier battement, arrondi), par <code>chargement</code>.`,
  solution:`WITH ${BEACON}, b AS (SELECT DISTINCT host, domaine FROM st WHERE sd / m < 0.05 AND domaine NOT IN (SELECT domaine FROM domaines_connus)), t AS (SELECT b.host, (SELECT MIN(horodatage) FROM process_logs p WHERE p.host = b.host AND p.process = 'rundll32.exe' AND p.ligne_commande LIKE '%upd.dll%') AS chargement, (SELECT MIN(horodatage) FROM proxy_logs x WHERE x.host = b.host AND x.domaine = b.domaine) AS premier_battement, (SELECT MAX(horodatage) FROM proxy_logs x WHERE x.host = b.host AND x.domaine = b.domaine) AS dernier_battement FROM b) SELECT host, chargement, premier_battement, dernier_battement, ROUND((julianday(premier_battement) - julianday(chargement)) * 86400) AS secondes FROM t ORDER BY chargement;`,
  hints:["Reprends la détection de 36.4 dans une CTE b (host, domaine)","Trois sous-requêtes corrélées : MIN sur process_logs, MIN et MAX sur proxy_logs","(julianday(premier_battement) - julianday(chargement)) * 86400"],
  require:[{re:'LAG', msg:"Retrouve les balises avec LAG, comme en 36.4."}],
  check:{ordered:true},
  success:`Neuf secondes sur PC-COMPTA-07, dix sur SRV-FICHIERS. Chaque fois que rundll32 charge <i>upd.dll</i>, le cœur se met à battre dans les secondes qui suivent : la DLL <b>est</b> la balise, la preuve est faite deux fois. Et il bat encore le 14 mars vers 23h, sur les deux machines. Benali débranche les deux câbles lui-même.`
});

/* ============ 37 ============ */
mis({ id:'37.A', ch:37, side:'annexe', xp:120, title:'Le bruit de couverture', who:'byte',
  story:`Byte : « Un tunnel DNS seul au milieu de la nuit, ça se remarque. Regarde tout ce que SRV-FICHIERS a demandé au DNS entre 0h30 et 2h le 9 mars. Je parie qu'il n'était pas seul. »`,
  lesson:`<p>Révision : un GROUP BY sur une fenêtre de temps, avec plusieurs mesures. <code>COUNT(DISTINCT requete)</code> distingue les questions <b>répétées</b> (toujours la même) des questions <b>toutes différentes</b> (des données qui défilent).</p>`,
  task:`Pour host 'SRV-FICHIERS' entre '2028-03-09 00:30:00' et '2028-03-09 02:00:00', affiche <code>domaine</code>, <code>requetes</code>, <code>distinctes</code> et <code>longueur_moy</code> (arrondie à 1 décimale), par <code>requetes</code> décroissant.`,
  solution:`SELECT domaine, COUNT(*) AS requetes, COUNT(DISTINCT requete) AS distinctes, ROUND(AVG(length(requete)), 1) AS longueur_moy FROM dns_logs WHERE host = 'SRV-FICHIERS' AND horodatage BETWEEN '2028-03-09 00:30:00' AND '2028-03-09 02:00:00' GROUP BY domaine ORDER BY requetes DESC;`,
  hints:["WHERE host = 'SRV-FICHIERS' AND horodatage BETWEEN ... AND ...","GROUP BY domaine, COUNT(DISTINCT requete), ROUND(AVG(length(requete)), 1)"],
  check:{ordered:true},
  success:`Vingt fois la même question, <code>www.meteo-seine.fr</code>, un domaine connu et inoffensif, pendant que huit questions toutes différentes partent vers tunnel-meteo.net. Byte : « Du bruit de couverture. Il a noyé son tunnel dans de la fausse météo, avec un nom de domaine assorti. Pour un œil fatigué, cette nuit-là, SRV-FICHIERS consultait juste le temps qu'il fait. »`
});
mis({ id:'37.S', ch:37, side:'cachee', xp:200, title:'Les dix minutes du colis', who:'byte',
  teaser:`Deux minutes avant le premier morceau du tunnel, quelqu'un a fait l'inventaire.`,
  story:`Byte : « Le tunnel commence à une heure précise. Mets côte à côte, dans une seule frise, tout ce que les journaux ont vu entre 0h30 et ce premier morceau : les connexions réussies, les processus lancés, et le premier morceau lui-même, décodé. »`,
  lesson:`<p>Une frise mélange plusieurs journaux avec <b>UNION ALL</b> : chaque SELECT doit fournir le même nombre de colonnes, dans le même ordre. La borne de fin peut être une sous-requête :</p>
<pre class="code">... WHERE horodatage BETWEEN '...' AND (SELECT MIN(horodatage) FROM ...)</pre>
<p>Pour le morceau décodé : la partie hexadécimale est entre le premier et le deuxième point, et <code>CAST(unhex(x) AS TEXT)</code> la relit.</p>`,
  task:`Avec t0 = première requête vers 'tunnel-meteo.net', affiche <code>quand</code>, <code>journal</code>, <code>compte</code>, <code>machine</code> et <code>detail</code>, par <code>quand</code>, pour : les succès de <code>auth_logs</code> entre '2028-03-09 00:30:00' et t0 ('auth', login, dest_host, methode) ; les processus de <code>process_logs</code> sur la même période ('process', login, host, ligne_commande) ; la requête DNS de t0 ('dns', NULL, host, le morceau décodé).`,
  solution:`WITH t0 AS (SELECT MIN(horodatage) AS h FROM dns_logs WHERE domaine = 'tunnel-meteo.net') SELECT horodatage AS quand, 'auth' AS journal, login AS compte, dest_host AS machine, methode AS detail FROM auth_logs WHERE resultat = 'succes' AND horodatage BETWEEN '2028-03-09 00:30:00' AND (SELECT h FROM t0) UNION ALL SELECT horodatage, 'process', login, host, ligne_commande FROM process_logs WHERE horodatage BETWEEN '2028-03-09 00:30:00' AND (SELECT h FROM t0) UNION ALL SELECT horodatage, 'dns', NULL, host, CAST(unhex(substr(substr(requete, instr(requete, '.') + 1), 1, instr(substr(requete, instr(requete, '.') + 1), '.') - 1)) AS TEXT) FROM dns_logs WHERE domaine = 'tunnel-meteo.net' AND horodatage = (SELECT h FROM t0) ORDER BY quand;`,
  hints:["Trois SELECT de cinq colonnes reliés par UNION ALL, un seul ORDER BY quand à la fin","La borne de fin : (SELECT MIN(horodatage) FROM dns_logs WHERE domaine = 'tunnel-meteo.net')","Le morceau : CAST(unhex(...) AS TEXT) sur le texte entre le premier et le deuxième point"],
  require:[{re:'UNION\\s+ALL', msg:"Empile les journaux avec UNION ALL."},{re:'unhex', msg:"Décode le morceau avec unhex."}],
  check:{ordered:true},
  success:`0h52 : svc_backup entre par le VPN. 0h55 : il ouvre SRV-FICHIERS. 1h00 : sous le nom de <b>adm.varenne</b>, un PowerShell liste tout <code>D:\\Partages\\Projets</code>. 1h02 : « HYDRE&gt;MINOTAURE | lo », le premier morceau part. Deux identités volées, une seule main, dix minutes. Byte : « Il a fait l'inventaire avant de faire le colis. Il savait exactement ce qu'il venait chercher. »`
});

/* ============ 38 ============ */
mis({ id:'38.A', ch:38, side:'annexe', xp:120, title:'Les six réservoirs', who:'haddad',
  story:`Haddad : « Avant d'accuser Montsouris d'être la seule cible, je veux voir les six sites. Pour chacun, la moyenne glissante sur une heure, et ses extrêmes le 12 mars. »`,
  lesson:`<p>Une moyenne glissante qui <b>inclut</b> la ligne courante :</p>
<pre class="code">AVG(x) OVER (PARTITION BY site ORDER BY h
             ROWS BETWEEN 5 PRECEDING AND CURRENT ROW)</pre>
<p>Six relevés toutes les dix minutes : une heure. La moyenne lisse les pics isolés mais suit les vraies chutes. On calcule la fenêtre sur toute la série, puis on filtre la date dans la requête externe.</p>`,
  task:`Calcule pour chaque relevé la moyenne glissante sur 6 relevés (le relevé et les 5 précédents du même site), puis affiche pour le '2028-03-12' : <code>site</code>, <code>plus_basse</code> et <code>plus_haute</code> (minimum et maximum de cette moyenne, arrondis à 2 décimales), par <code>plus_basse</code>.`,
  solution:`WITH m AS (SELECT site, horodatage, AVG(valeur) OVER (PARTITION BY site ORDER BY horodatage ROWS BETWEEN 5 PRECEDING AND CURRENT ROW) AS mm FROM capteurs) SELECT site, ROUND(MIN(mm), 2) AS plus_basse, ROUND(MAX(mm), 2) AS plus_haute FROM m WHERE date(horodatage) = '2028-03-12' GROUP BY site ORDER BY plus_basse;`,
  hints:["CTE : AVG(valeur) OVER (PARTITION BY site ORDER BY horodatage ROWS BETWEEN 5 PRECEDING AND CURRENT ROW)","Requête externe : WHERE date(horodatage) = '2028-03-12' GROUP BY site"],
  check:{ordered:true, orderKeys:[1]},
  success:`Montsouris tombe à 1,08 bar de moyenne sur une heure. Les autres restent dans leur couloir habituel ; Ivry descend un peu, la faute à son capteur fatigué. Haddad : « Une frappe chirurgicale, sur un seul réservoir, celui qui alimente le sud. Ce n'est pas un vandale qui a fait ça. C'est quelqu'un qui a lu les plans. »`
});
mis({ id:'38.S', ch:38, side:'cachee', xp:200, title:'Les alarmes étouffées', who:'haddad',
  teaser:`Cette nuit-là, les alarmes de Montsouris auraient dû sonner. Combien de fois ?`,
  story:`Haddad : « À 3h02, il a baissé le seuil d'alarme de 3 à 0,5 bar. Je veux savoir ce que ça a acheté. Pour chaque relevé de Montsouris sous 3 bars (le seuil normal), retrouve le seuil en vigueur à ce moment-là : l'alarme a-t-elle sonné, ou a-t-elle été étouffée ? »`,
  lesson:`<p>La valeur « en vigueur » à un instant donné, c'est la dernière modification <b>antérieure</b> à cet instant. Une sous-requête corrélée avec ORDER BY ... DESC LIMIT 1 la retrouve :</p>
<pre class="code">(SELECT o.nouvelle FROM commandes_ot o
 WHERE o.site = c.site AND o.parametre = '...' AND o.horodatage &lt;= c.horodatage
 ORDER BY o.horodatage DESC LIMIT 1)</pre>
<p>Avant la première modification, il n'y a rien : <code>COALESCE(..., 3.0)</code> donne le seuil normal.</p>`,
  task:`Pour les relevés de 'Réservoir Montsouris' de valeur inférieure à 3.0, calcule le seuil en vigueur (dernière commande 'seuil_alarme' du site à cet instant ou avant, sinon 3.0). Affiche <code>alarme</code> ('sonnée' si la valeur est sous le seuil en vigueur, sinon 'étouffée'), <code>releves</code>, <code>premier</code> et <code>dernier</code>, par <code>premier</code>.`,
  solution:`WITH r AS (SELECT c.horodatage, c.valeur, COALESCE((SELECT o.nouvelle FROM commandes_ot o WHERE o.site = c.site AND o.parametre = 'seuil_alarme' AND o.horodatage <= c.horodatage ORDER BY o.horodatage DESC LIMIT 1), 3.0) AS seuil FROM capteurs c WHERE c.site = 'Réservoir Montsouris') SELECT CASE WHEN valeur < seuil THEN 'sonnée' ELSE 'étouffée' END AS alarme, COUNT(*) AS releves, MIN(horodatage) AS premier, MAX(horodatage) AS dernier FROM r WHERE valeur < 3.0 GROUP BY alarme ORDER BY premier;`,
  hints:["CTE : chaque relevé avec COALESCE((SELECT o.nouvelle ... ORDER BY o.horodatage DESC LIMIT 1), 3.0) AS seuil","Puis CASE WHEN valeur < seuil THEN 'sonnée' ELSE 'étouffée' END, GROUP BY ce CASE"],
  check:{ordered:true},
  success:`<b>21 alarmes étouffées</b>, de 3h10 à 6h30 : plus de trois heures de silence total pendant que le sud de Paris n'avait plus d'eau. Les seules qui ont sonné (cinq, de 6h40 à 7h20) l'ont fait <b>après</b> que Sofia Lopez a remis le seuil à 3 bars. Haddad : « Elle n'a pas été réveillée par une alarme. Elle a été réveillée par les habitants. Le pirate avait acheté trois heures d'avance avec un seul chiffre. »`
});

/* ============ 39 ============ */
mis({ id:'39.A', ch:39, side:'annexe', xp:120, title:'Le pivot', who:'benali',
  story:`Benali : « Un IOC en appelle un autre. Pour chaque domaine de la table <code>ioc</code>, regarde vers quelles IP le proxy l'a vu partir, et ajoute celles qu'on n'a pas encore. Les analystes appellent ça pivoter. »`,
  lesson:`<p>Un <code>INSERT ... SELECT</code> peut se protéger lui-même des doublons : on exclut ce qui est déjà dans la table cible avec <code>NOT IN</code>. Sans ce filtre, la contrainte <code>UNIQUE</code> de <code>valeur</code> ferait échouer toute l'insertion.</p>
<pre class="code">INSERT INTO t (a, b) SELECT DISTINCT 'x', col FROM source
WHERE ... AND col NOT IN (SELECT b FROM t);</pre>`,
  setup: IOC_SETUP,
  task:`Insère dans <code>ioc</code> (type, valeur, source) une ligne ('ip', ip_dest, 'pivot') pour chaque IP de destination distincte des connexions <code>proxy_logs</code> vers un domaine IOC, si cette IP n'est pas déjà un IOC.`,
  solution:`INSERT INTO ioc (type, valeur, source) SELECT DISTINCT 'ip', ip_dest, 'pivot' FROM proxy_logs WHERE domaine IN (SELECT valeur FROM ioc WHERE type = 'domaine') AND ip_dest NOT IN (SELECT valeur FROM ioc);`,
  hints:["INSERT INTO ioc (type, valeur, source) SELECT DISTINCT 'ip', ip_dest, 'pivot' FROM proxy_logs WHERE ...","domaine IN (SELECT valeur FROM ioc WHERE type = 'domaine') AND ip_dest NOT IN (SELECT valeur FROM ioc)"],
  require:[{re:'INSERT', msg:"Ajoute les IOC avec un INSERT."},{re:'SELECT', msg:"Les IP doivent venir d'une requête (INSERT ... SELECT)."},{re:'^(?![\\s\\S]*192\\.0\\.2\\.80)', msg:"Ne tape pas l'IP : la requête doit la trouver seule."}],
  check:{mode:'dml', verify:["SELECT type, valeur, source FROM ioc ORDER BY type, valeur"]},
  success:`Une seule IP nouvelle : <b>192.0.2.80</b>, celle du faux site de la régie, derrière eaux-de-seine-fr.com. Le domaine pourra changer de nom demain, l'adresse est désormais surveillée. Benali : « Six IOC. La sentinelle a un œil de plus. »`
});
mis({ id:'39.S', ch:39, side:'cachee', xp:200, title:'Rejouer l\'histoire', who:'benali',
  teaser:`Et si la sentinelle avait existé dès le 1er mars ?`,
  story:`Benali : « Je veux savoir si tout ça valait la peine. Crée une copie vide du proxy, pose dessus la même sentinelle, et rejoue les quinze jours de journaux dans l'ordre. On verra à quelle heure la première alerte aurait sonné, machine par machine. »`,
  lesson:`<p>Un trigger se déclenche à <b>chaque</b> ligne insérée, même quand les lignes arrivent par milliers avec un <code>INSERT ... SELECT</code>. C'est la façon de tester une règle de détection sur l'historique : on rejoue les événements dans une table surveillée.</p>
<pre class="code">CREATE TRIGGER trg AFTER INSERT ON copie WHEN ...
BEGIN INSERT INTO alertes (...) VALUES (NEW....); END;
INSERT INTO copie SELECT ... FROM journal ORDER BY horodatage;</pre>`,
  setup: IOC_SETUP,
  task:`Crée <code>rejeu</code> (horodatage TEXT, host TEXT, domaine TEXT, ip_dest TEXT), <code>alertes</code> (id INTEGER PRIMARY KEY, horodatage TEXT, host TEXT, cible TEXT) et un trigger <code>trg_rejeu</code> qui, après chaque insertion dans <code>rejeu</code> dont le domaine est un IOC de type 'domaine' ou l'IP un IOC de type 'ip', insère (horodatage, host, cible = domaine) dans <code>alertes</code>. Rejoue ensuite tout <code>proxy_logs</code> dans <code>rejeu</code>, par horodatage. Termine par <code>SELECT host, MIN(horodatage) AS premiere, COUNT(*) AS alertes FROM alertes GROUP BY host ORDER BY premiere</code>.`,
  solution:`CREATE TABLE rejeu (horodatage TEXT, host TEXT, domaine TEXT, ip_dest TEXT); CREATE TABLE alertes (id INTEGER PRIMARY KEY, horodatage TEXT, host TEXT, cible TEXT); CREATE TRIGGER trg_rejeu AFTER INSERT ON rejeu WHEN NEW.domaine IN (SELECT valeur FROM ioc WHERE type = 'domaine') OR NEW.ip_dest IN (SELECT valeur FROM ioc WHERE type = 'ip') BEGIN INSERT INTO alertes (horodatage, host, cible) VALUES (NEW.horodatage, NEW.host, NEW.domaine); END; INSERT INTO rejeu (horodatage, host, domaine, ip_dest) SELECT horodatage, host, domaine, ip_dest FROM proxy_logs ORDER BY horodatage; SELECT host, MIN(horodatage) AS premiere, COUNT(*) AS alertes FROM alertes GROUP BY host ORDER BY premiere;`,
  hints:["Deux CREATE TABLE, puis CREATE TRIGGER trg_rejeu AFTER INSERT ON rejeu WHEN ... BEGIN INSERT INTO alertes ... END;","Le rejeu : INSERT INTO rejeu (horodatage, host, domaine, ip_dest) SELECT horodatage, host, domaine, ip_dest FROM proxy_logs ORDER BY horodatage;"],
  require:[{re:'CREATE\\s+TRIGGER', msg:"Il faut créer un trigger : c'est lui qui doit produire les alertes."}],
  check:{mode:'dml', verify:["SELECT host, MIN(horodatage), COUNT(*) FROM alertes GROUP BY host ORDER BY 2", "SELECT COUNT(*) FROM rejeu", "INSERT INTO rejeu (horodatage, host, domaine, ip_dest) VALUES ('2028-03-15 10:00:00', 'PC-TEST', 'nouveau-site.net', '192.0.2.150'), ('2028-03-15 10:01:00', 'PC-TEST', 'meteo-seine.fr', '203.0.113.22'); SELECT horodatage, host, cible FROM alertes WHERE host = 'PC-TEST'"]},
  success:`Première alerte : <b>6 mars, 9h14 et 0 seconde</b>, PC-COMPTA-07, quand Nadia Perrin ouvre le lien du faux mail. Word n'a ouvert la facture piégée qu'à 9h14 et 40 secondes. Benali repose sa tasse : « Quarante secondes. Avec ce trigger, on avait quarante secondes d'avance sur la macro. Il n'y aurait pas eu d'Hydre. » Il imprime le résultat et l'affiche au mur du SOC.`
});

/* ============ 40 ============ */
mis({ id:'40.A', ch:40, side:'annexe', xp:120, title:'Les autres lignes', who:'benali',
  story:`Benali : « <code>lignes_internet</code> contient quatre lignes, pas deux. Avant d'attribuer quoi que ce soit, je veux le profil de chacune : son abonné, son adresse, et ce qu'elle a fait dans nos journaux. On ne conclut jamais sur un seul indice. »`,
  lesson:`<p>Des <b>sous-requêtes scalaires corrélées</b> dans le SELECT comptent, pour chaque ligne de la requête principale, ce qui la concerne dans d'autres tables :</p>
<pre class="code">SELECT s.nom,
  (SELECT COUNT(*) FROM delits d WHERE d.suspect_id = s.id) AS nb
FROM suspects s;</pre>`,
  task:`Pour chaque ligne de <code>lignes_internet</code>, affiche <code>ip</code>, <code>abonne</code> (nom de la société), <code>adresse</code>, <code>echecs</code> (échecs d'authentification venant de cette IP) et <code>connexions_proxy</code> (connexions proxy vers cette IP), par <code>ip</code>.`,
  solution:`SELECT l.ip, s.nom AS abonne, l.adresse, (SELECT COUNT(*) FROM auth_logs a WHERE a.source_ip = l.ip AND a.resultat = 'echec') AS echecs, (SELECT COUNT(*) FROM proxy_logs x WHERE x.ip_dest = l.ip) AS connexions_proxy FROM lignes_internet l JOIN societes s ON s.siren = l.abonne_siren ORDER BY l.ip;`,
  hints:["JOIN societes s ON s.siren = l.abonne_siren","Deux sous-requêtes COUNT(*) corrélées sur l.ip"],
  check:{ordered:true},
  success:`Labyrinthe Énergie : la pulvérisation et la balise. NordHost : le faux site, une ligne louée chez un hébergeur. Et Fibre Est, une box résidentielle de Créteil : quarante échecs le 8 mars en vingt minutes, sur dix comptes, sans aucun succès et sans aucun lien avec le reste. Benali : « Un curieux, ou un maladroit. Sans les autres indices, on l'aurait peut-être accusé. C'est pour ça qu'on croise. »`
});
mis({ id:'40.S', ch:40, side:'cachee', xp:200, title:'La jumelle', who:'varga',
  teaser:`Labyrinthe Énergie n'est pas née seule : une autre société a vu le jour trois jours plus tôt.`,
  story:`Varga : « Une société écran naît rarement seule. Retrouve l'abonné de la ligne de la pulvérisation, puis les sociétés créées à une semaine près. Ensuite, remonte les deux chaînes de propriété, et dis-moi si quelqu'un se tient des deux côtés. »`,
  lesson:`<p>Plusieurs CTE récursives peuvent cohabiter dans un même <code>WITH RECURSIVE</code>. Chaque chaîne de propriété se remonte comme aux épisodes 18 et 27 (parts multipliées à chaque étage), puis on agrège par personne <b>avant</b> de joindre les deux résultats, sinon les sommes se multiplient.</p>
<pre class="code">ABS(julianday(a.creation) - julianday(b.creation)) &lt;= 7   -- à une semaine près</pre>`,
  task:`Sans taper aucun nom, ni SIREN, ni IP : pars de l'abonné de la ligne dont l'IP a au moins 100 échecs d'authentification, trouve la société (autre que lui) créée à 7 jours près, remonte les chaînes de propriété des deux sociétés, et affiche les personnes présentes dans les deux : <code>beneficiaire</code> (sans <code>PERSONNE:</code>), <code>jumelle</code> (nom de l'autre société), <code>part_abonne</code> et <code>part_jumelle</code> (sommes des parts réelles, arrondies à 1 décimale).`,
  solution:`WITH RECURSIVE ab AS (SELECT l.abonne_siren AS siren FROM lignes_internet l WHERE l.ip IN (SELECT source_ip FROM auth_logs WHERE resultat = 'echec' GROUP BY source_ip HAVING COUNT(*) >= 100)), ju AS (SELECT s.siren, s.nom FROM societes s JOIN societes a ON a.siren = (SELECT siren FROM ab) WHERE s.siren <> a.siren AND ABS(julianday(s.creation) - julianday(a.creation)) <= 7), c1(siren, part) AS (SELECT siren, 100.0 FROM ab UNION ALL SELECT p.detenteur, c1.part * p.pct / 100 FROM participations p JOIN c1 ON p.detenue = c1.siren), c2(siren, part) AS (SELECT siren, 100.0 FROM ju UNION ALL SELECT p.detenteur, c2.part * p.pct / 100 FROM participations p JOIN c2 ON p.detenue = c2.siren), b1 AS (SELECT siren, SUM(part) AS part FROM c1 WHERE siren LIKE 'PERSONNE:%' GROUP BY siren), b2 AS (SELECT siren, SUM(part) AS part FROM c2 WHERE siren LIKE 'PERSONNE:%' GROUP BY siren) SELECT REPLACE(b1.siren, 'PERSONNE:', '') AS beneficiaire, (SELECT nom FROM ju) AS jumelle, ROUND(b1.part, 1) AS part_abonne, ROUND(b2.part, 1) AS part_jumelle FROM b1 JOIN b2 ON b2.siren = b1.siren;`,
  hints:["CTE ab : abonne_siren de la ligne de l'IP de pulvérisation ; CTE ju : la société créée à 7 jours près (ABS(julianday(...) - julianday(...)) <= 7)","Deux récursions de propriété (c1 depuis ab, c2 depuis ju), puis deux agrégats par personne","Jointure finale des deux agrégats sur la personne"],
  require:[{re:'RECURSIVE', msg:"Les chaînes de propriété se remontent avec une CTE récursive."},{re:'^(?![\\s\\S]*(Labyrinthe|Ariane|Ricci|Paul|Calanques|Th[ée]s[ée]e|5120|192\\.0\\.2))', msg:"Ne tape aucun nom, SIREN ni IP : la requête doit tout retrouver."}],
  success:`La jumelle s'appelle <b>Ariane Labs</b>, créée le 30 janvier, trois jours avant Labyrinthe Énergie : le laboratoire de Maxime Delorme dans l'affaire Synapse. Et un homme se tient des deux côtés : <b>Paul Ricci</b>, 29,4 % de Labyrinthe Énergie par Calanques Fret, 10 % d'Ariane Labs en direct. Varga écrit le nom au feutre sur le tableau, entre « Synapse » et « Hydre ». « Je ne connais pas ce monsieur. Ça ne va pas durer. »`
});

/* ============ 41 ============ */
mis({ id:'41.A', ch:41, side:'annexe', xp:120, title:'Les trous', who:'byte',
  story:`Byte : « Les îlots, c'est quand MINOTAURE tourne. Les trous entre les îlots, c'est quand il s'arrête. Et une machine volée qui s'arrête, il y a toujours une raison. Donne-moi chaque coupure : quand elle commence, quand ça repart, combien d'heures. »`,
  lesson:`<p>Une fois les îlots formés (41.3), chaque trou va de la <b>fin</b> d'un îlot au <b>début</b> du suivant. <code>LAG(fin) OVER (ORDER BY debut)</code> met la fin de l'îlot précédent sur la ligne de l'îlot courant. Le premier îlot n'a pas de précédent : LAG renvoie NULL, on l'écarte.</p>`,
  task:`Pour 'SST Dédale' avec <code>kwh &gt; 20</code>, affiche chaque coupure entre deux îlots : <code>arret</code> (dernier horodatage de l'îlot précédent), <code>reprise</code> (premier horodatage de l'îlot suivant) et <code>heures</code> (écart arrondi à l'unité), par <code>arret</code>.`,
  solution:`WITH h AS (SELECT horodatage, CAST(ROUND((julianday(horodatage) - julianday('2028-02-15')) * 24) AS INTEGER) AS n FROM releves_electriques WHERE sous_station = 'SST Dédale' AND kwh > 20), g AS (SELECT horodatage, n - ROW_NUMBER() OVER (ORDER BY n) AS grp FROM h), i AS (SELECT MIN(horodatage) AS debut, MAX(horodatage) AS fin FROM g GROUP BY grp), t AS (SELECT LAG(fin) OVER (ORDER BY debut) AS arret, debut AS reprise FROM i) SELECT arret, reprise, ROUND((julianday(reprise) - julianday(arret)) * 24) AS heures FROM t WHERE arret IS NOT NULL ORDER BY arret;`,
  hints:["Reprends les CTE h et g de 41.3, puis une CTE des îlots (debut, fin)","LAG(fin) OVER (ORDER BY debut) AS arret, puis WHERE arret IS NOT NULL"],
  check:{ordered:true},
  success:`Deux coupures. La première, du 4 mars 18h au 5 mars 3h : la reprise tombe moins d'une heure après que svc_backup a cédé à la pulvérisation (2h11). La seconde, du 10 mars 11h au 11 mars 22h : 35 heures. Le carnet de Delorme le disait : « J-4 : tester l'onduleur, une coupure coûterait trois jours ». Byte : « Elle n'en a coûté qu'un et demi. Et cinq heures après la reprise, la ville n'avait plus d'eau. »`
});
mis({ id:'41.S', ch:41, side:'cachee', xp:200, title:'Le fil d\'Ariane', who:'varga2',
  teaser:`Le premier homme qui t'a confié une table était déjà au bout du fil.`,
  story:`Varga, au petit matin, devant le tableau couvert de fiches : « Il reste une question, la seule qui compte pour moi. Le directeur SI d'Hélios, celui qui t'a confié ta toute première table (<code>employes</code>, saison 1). Le directeur data science de NeuroCité (<code>employes_neurocite</code>, saison 3). Existe-t-il un fil, de société en société, qui relie ces deux hommes ? Tire-le, maillon par maillon. »`,
  lesson:`<p>Un graphe de propriété se parcourt dans <b>les deux sens</b> pour chercher un lien (détenir ou être détenu) : on empile les deux directions avec UNION, comme pour les appels en 41.5.</p>
<pre class="code">e(a, b) AS (SELECT detenteur, detenue FROM participations
            UNION SELECT detenue, detenteur FROM participations)</pre>
<p>Dans la récursion, garde deux chaînes : une liste technique des identifiants visités, avec des séparateurs (<code>'|' || id || '|'</code>) pour que <code>instr</code> ne confonde pas deux noms qui se ressemblent, et le chemin lisible, avec les noms (<code>societes.nom</code>, ou la personne sans <code>PERSONNE:</code>). Les personnes s'écrivent <code>'PERSONNE:' || prénom et nom</code> dans <code>participations</code>.</p>`,
  task:`Sans taper aucun nom : pars de la personne <code>'PERSONNE:' || prenom || ' ' || nom</code> de <code>employes</code> au poste 'Directeur SI', et arrive à <code>'PERSONNE:' || nom</code> de <code>employes_neurocite</code> au poste 'Directeur data science', par les <code>participations</code> parcourues dans les deux sens, sans repasser par un même nœud. Affiche le plus court chemin : <code>chemin</code> (noms des personnes et des sociétés, séparés par ' &gt; ') et <code>sauts</code>.`,
  solution:`WITH RECURSIVE nm AS (SELECT siren AS id, nom AS label FROM societes UNION SELECT detenteur, REPLACE(detenteur, 'PERSONNE:', '') FROM participations WHERE detenteur LIKE 'PERSONNE:%'), e(a, b) AS (SELECT detenteur, detenue FROM participations UNION SELECT detenue, detenteur FROM participations), dep AS (SELECT 'PERSONNE:' || prenom || ' ' || nom AS id FROM employes WHERE poste = 'Directeur SI'), arr AS (SELECT 'PERSONNE:' || nom AS id FROM employes_neurocite WHERE poste = 'Directeur data science'), p(noeud, vus, chemin, sauts) AS (SELECT id, '|' || id || '|', REPLACE(id, 'PERSONNE:', ''), 0 FROM dep UNION ALL SELECT e.b, p.vus || e.b || '|', p.chemin || ' > ' || (SELECT label FROM nm WHERE nm.id = e.b), p.sauts + 1 FROM p JOIN e ON e.a = p.noeud WHERE instr(p.vus, '|' || e.b || '|') = 0 AND p.sauts < 12) SELECT chemin, sauts FROM p WHERE noeud = (SELECT id FROM arr) ORDER BY sauts LIMIT 1;`,
  hints:["Quatre briques : les libellés (societes.nom ou personne sans PERSONNE:), les arêtes dans les deux sens, le départ (employes) et l'arrivée (employes_neurocite).","Récursion : p(noeud, vus, chemin, sauts) ; condition instr(p.vus, '|' || e.b || '|') = 0 ; borne p.sauts < 12","Finale : WHERE noeud = (SELECT id FROM arr) ORDER BY sauts LIMIT 1"],
  require:[{re:'RECURSIVE', msg:"Le fil se tire avec une CTE récursive."},{re:'^(?![\\s\\S]*(Ouali|Farid|Delorme|Maxime|Ricci|Paul|Ariane|Th[ée]s[ée]e|Labyrinthe|Calanques|5120))', msg:"Ne tape aucun nom ni SIREN : pars des postes, la requête doit retrouver tout le fil."}],
  success:`<b>Farid Ouali &gt; Ouali Conseil &gt; Labyrinthe Énergie &gt; Calanques Fret &gt; Paul Ricci &gt; Ariane Labs &gt; Thésée Capital &gt; Maxime Delorme.</b> Sept maillons, quatre affaires : le DSI d'Hélios (Minuit), sa société de conseil (Éclipse), l'abonné des lignes de l'Hydre, l'armateur de Marseille, et le laboratoire de Synapse. Et au milieu du fil, littéralement, <b>Ariane</b>.<br><br>Varga reste longtemps silencieuse. « Le premier jour, c'est lui qui t'a tendu le journal des connexions d'Hélios. Il t'a regardé écrire ta première requête. Il était déjà au bout du fil, et toi tu tenais l'autre bout sans le savoir. » Elle décroche la fiche du Cartographe, la retourne, et écrit au dos, au feutre : <i>« Trouvé par la nouvelle recrue. Quarante et un épisodes, une seule langue. »</i><br><br>Byte te tend sa clé USB : « Tiens. Dessus, il y a toutes les tables du jeu. Maintenant, c'est toi le Cartographe. »`
});
