// SAISON 4 : OPÉRATION HYDRE (épisodes 32 à 40) : cyberattaque, journaux et riposte, tout en SQL
const SPRAY = "spray AS (SELECT source_ip FROM auth_logs WHERE resultat = 'echec' GROUP BY source_ip HAVING COUNT(*) >= 100)";
const BEACON = "iv AS (SELECT host, domaine, ip_dest, horodatage, octets_out, (julianday(horodatage) - julianday(LAG(horodatage) OVER (PARTITION BY host, domaine ORDER BY horodatage))) * 86400 AS dt FROM proxy_logs), st AS (SELECT host, domaine, ip_dest, COUNT(dt) AS n, AVG(dt) AS m, sqrt(AVG(dt * dt) - AVG(dt) * AVG(dt)) AS sd FROM iv WHERE dt IS NOT NULL GROUP BY host, domaine, ip_dest HAVING COUNT(dt) >= 50)";
const DNSX = "x AS (SELECT requete, CAST(substr(requete, 1, instr(requete, '.') - 1) AS INTEGER) AS seq, substr(requete, instr(requete, '.') + 1) AS reste FROM dns_logs WHERE domaine = 'tunnel-meteo.net'), y AS (SELECT seq, substr(reste, 1, instr(reste, '.') - 1) AS hex FROM x)";
const IOC_SETUP = "CREATE TABLE ioc (id INTEGER PRIMARY KEY, type TEXT NOT NULL, valeur TEXT NOT NULL UNIQUE, source TEXT); INSERT INTO ioc (type, valeur, source) VALUES ('ip', '192.0.2.150', 'auth'), ('ip', '192.0.2.66', 'proxy'), ('domaine', 'cdn-update-check.net', 'proxy'), ('domaine', 'tunnel-meteo.net', 'dns'), ('domaine', 'eaux-de-seine-fr.com', 'mail');";

/* ============ 32 ============ */
chap({ id:32, season:4, code:'32', title:'L\'alerte', subtitle:'Journaux d\'authentification : volumes, pulvérisation de mots de passe, compte compromis',
  intro:`<p>Mars 2028. Pendant que la brigade bouclait l'affaire Synapse, une autre attaque avançait sans bruit. Le 12 mars à 3h, la pression d'eau s'effondre dans tout le sud de Paris. La régie des eaux pense à une panne. Le SOC de la Ville de Seine (son centre de surveillance informatique), lui, pense à autre chose.</p>
<p><b>Malik Benali</b>, le chef du SOC, appelle la brigade : « J'ai quinze jours de journaux et pas assez d'analystes. Ce n'est pas une attaque, c'est plusieurs. Une hydre. »</p>
<p class="quote">« Une hydre, on ne la tue pas en coupant une tête. On la tue en trouvant le corps. » (Inès Varga)</p>`,
  oracle:`<p>Un SIEM (Splunk, Elastic, Microsoft Sentinel) stocke les journaux dans des bases interrogées avec des langages très proches du SQL : SPL, ES|QL, KQL. Les requêtes de cette saison sont celles qu'écrit un analyste SOC chaque jour, et elles tournent telles quelles dans Oracle, PostgreSQL ou BigQuery.</p>`,
  quiz:[
    {q:"La « pulvérisation de mots de passe » (password spraying) consiste à :", o:["Essayer des milliers de mots de passe sur un seul compte","Essayer quelques mots de passe courants sur beaucoup de comptes, pour passer sous les seuils de verrouillage","Voler un mot de passe par e-mail","Chiffrer les mots de passe"], a:1, e:"La signature : une IP, beaucoup de comptes différents, peu d'essais par compte."},
    {q:"Le premier réflexe face à un pic d'échecs d'authentification :", o:["Tout éteindre","Regarder s'il existe un succès venant de la même source","Ignorer, c'est du bruit","Supprimer les journaux"], a:1, e:"Mille échecs, c'est du bruit. Un succès juste après, c'est une compromission."}
  ]});
mis({ id:'32.1', ch:32, title:'Le tableau de bord', who:'benali',
  story:`Benali : « Commence par une vue d'ensemble de <code>auth_logs</code> : combien de connexions par méthode (local, smb, rdp, vpn) et par résultat. »`,
  lesson:`<p>Un journal d'authentification : une ligne par tentative (qui, depuis quelle IP, vers quelle machine, par quelle méthode, avec quel résultat). Le premier tableau d'un SOC, c'est un GROUP BY sur deux colonnes.</p>`,
  task:`Affiche <code>methode</code>, <code>resultat</code> et <code>nb</code>, triés par <code>methode</code> puis <code>resultat</code>.`,
  solution:`SELECT methode, resultat, COUNT(*) AS nb FROM auth_logs GROUP BY methode, resultat ORDER BY methode, resultat;`,
  hints:["GROUP BY methode, resultat"], check:{ordered:true}
});
mis({ id:'32.2', ch:32, title:'Les pulvérisateurs', who:'benali',
  story:`« Le VPN a pris une avalanche d'échecs. Pour chaque IP source : combien d'échecs, et sur combien de comptes différents ? »`,
  lesson:`<p>La signature d'une pulvérisation : <b>beaucoup de comptes distincts</b> et <b>peu d'essais par compte</b>. On calcule les deux, et leur rapport.</p>`,
  task:`Pour les IP sources ayant au moins 20 échecs, affiche <code>source_ip</code>, <code>echecs</code>, <code>comptes</code> (logins distincts) et <code>essais_par_compte</code> (arrondi à 1 décimale), par <code>echecs</code> décroissant.`,
  solution:`SELECT source_ip, COUNT(*) AS echecs, COUNT(DISTINCT login) AS comptes, ROUND(1.0 * COUNT(*) / COUNT(DISTINCT login), 1) AS essais_par_compte FROM auth_logs WHERE resultat = 'echec' GROUP BY source_ip HAVING COUNT(*) >= 20 ORDER BY echecs DESC;`,
  hints:["WHERE resultat = 'echec' GROUP BY source_ip HAVING COUNT(*) >= 20","1.0 * COUNT(*) / COUNT(DISTINCT login)"], check:{ordered:true, orderKeys:[1]},
  success:`<b>192.0.2.150</b> : plus de 300 échecs sur 53 comptes, environ six essais chacun. Une pulvérisation dans les règles de l'art. L'autre IP n'essaie qu'une dizaine de comptes, en plein après-midi : un bruit de fond classique.`
});
mis({ id:'32.3', ch:32, title:'La durée de l\'assaut', who:'benali',
  story:`« Combien de temps a duré l'attaque, et à quel rythme ? »`,
  lesson:`<p>Pour mesurer une durée entre deux horodatages : <code>(julianday(fin) - julianday(debut)) * 1440</code> donne des minutes.</p>
<p>Ici, on réutilise la liste des IP « pulvérisatrices » dans une CTE :</p>
<pre class="code">WITH spray AS (SELECT source_ip FROM auth_logs WHERE resultat = 'echec'
               GROUP BY source_ip HAVING COUNT(*) &gt;= 100)
SELECT ... WHERE source_ip IN (SELECT source_ip FROM spray)</pre>`,
  task:`Pour les IP ayant au moins 100 échecs, affiche <code>source_ip</code>, <code>debut</code> et <code>fin</code> (premier et dernier échec), <code>minutes</code> (durée arrondie à l'unité) et <code>par_minute</code> (échecs par minute, arrondi à 1 décimale).`,
  solution:`WITH ${SPRAY} SELECT source_ip, MIN(horodatage) AS debut, MAX(horodatage) AS fin, ROUND((julianday(MAX(horodatage)) - julianday(MIN(horodatage))) * 1440) AS minutes, ROUND(COUNT(*) / ((julianday(MAX(horodatage)) - julianday(MIN(horodatage))) * 1440), 1) AS par_minute FROM auth_logs WHERE resultat = 'echec' AND source_ip IN (SELECT source_ip FROM spray) GROUP BY source_ip;`,
  hints:["CTE spray, puis GROUP BY source_ip sur les échecs","(julianday(MAX(horodatage)) - julianday(MIN(horodatage))) * 1440"]
});
mis({ id:'32.4', ch:32, title:'Le succès de trop', who:'benali',
  story:`« Mille échecs, c'est du bruit. Un succès venu de la même IP, c'est une effraction. »`,
  lesson:`<p>Une sous-requête corrélée compte, pour chaque succès, les échecs qui l'ont précédé depuis la même IP et pour le même compte :</p>
<pre class="code">SELECT s.login, s.horodatage,
  (SELECT COUNT(*) FROM auth_logs e
   WHERE e.login = s.login AND e.source_ip = s.source_ip
     AND e.resultat = 'echec' AND e.horodatage &lt; s.horodatage) AS echecs_avant
FROM auth_logs s WHERE s.resultat = 'succes' AND ...</pre>`,
  task:`Pour les succès venant d'une IP qui a au moins 100 échecs, affiche <code>login</code>, <code>source_ip</code>, <code>horodatage</code> et <code>echecs_avant</code>, par horodatage.`,
  solution:`WITH ${SPRAY} SELECT s.login, s.source_ip, s.horodatage, (SELECT COUNT(*) FROM auth_logs e WHERE e.login = s.login AND e.source_ip = s.source_ip AND e.resultat = 'echec' AND e.horodatage < s.horodatage) AS echecs_avant FROM auth_logs s WHERE s.resultat = 'succes' AND s.source_ip IN (SELECT source_ip FROM spray) ORDER BY s.horodatage;`,
  hints:["CTE spray, puis les succès de ces IP","Sous-requête corrélée pour echecs_avant"], check:{ordered:true},
  success:`<b>svc_backup</b>, le compte de sauvegarde, tombe au 6e essai. Puis l'attaquant revient le 9 mars avec le même mot de passe. Un compte de service, jamais surveillé, avec des droits d'administrateur.`
});
boss({ id:'32.5', ch:32, tail:false, title:'Boss : ce qu\'a fait le compte volé', who:'varga2', timer:540,
  story:`Varga : « Je veux tout ce qu'a fait ce compte depuis sa compromission, sauf sa routine nocturne habituelle (les connexions locales de la machine sur elle-même). »`,
  lesson:`<p>Le boss enchaîne trois CTE : les IP pulvérisatrices, les comptes compromis avec leur première heure de compromission, puis tous les succès de ces comptes à partir de cette heure.</p>`,
  task:`Pour chaque compte ayant réussi une connexion depuis une IP à au moins 100 échecs, affiche ses succès à partir de cette première réussite (incluse), sauf ceux de méthode 'local' : <code>login</code>, <code>horodatage</code>, <code>source_ip</code>, <code>dest_host</code>, <code>methode</code>, par horodatage.`,
  solution:`WITH ${SPRAY}, comp AS (SELECT login, MIN(horodatage) AS t0 FROM auth_logs WHERE resultat = 'succes' AND source_ip IN (SELECT source_ip FROM spray) GROUP BY login) SELECT a.login, a.horodatage, a.source_ip, a.dest_host, a.methode FROM auth_logs a JOIN comp c ON c.login = a.login WHERE a.resultat = 'succes' AND a.horodatage >= c.t0 AND a.methode <> 'local' ORDER BY a.horodatage;`,
  hints:["CTE comp : login et MIN(horodatage) des succès depuis une IP de spray","JOIN comp, horodatage >= t0, methode <> 'local'"], check:{ordered:true},
  success:`Deux visites : le 5 mars à 2h14 puis le 9 mars à 0h55, à chaque fois vers SRV-FICHIERS, le serveur de fichiers de la ville. Première tête de l'Hydre. Benali : « Ce n'est pas la seule. »`
});

/* ============ 33 ============ */
chap({ id:33, season:4, code:'33', title:'L\'hameçon', subtitle:'Phishing : domaines sosies, extensions piégées, clics et patient zéro',
  intro:`<p>Le 6 mars à 9h10, quarante agents de la ville sont visés par une « facture impayée » de la régie des eaux, avec une pièce jointe Word. Tables <code>mail_logs</code> (expéditeur, destinataire, pièce jointe, verdict du filtre) et <code>clics</code> (liens ouverts par les agents).</p>
<p class="quote">« Les pirates n'entrent pas par la porte. Ils sonnent, et quelqu'un leur ouvre. » (Malik Benali)</p>`,
  oracle:`<p>Les fonctions de texte utilisées ici existent partout : <code>INSTR</code> et <code>SUBSTR</code> en Oracle, <code>position</code> et <code>substring</code> en PostgreSQL. Oracle a aussi <code>UTL_MATCH.EDIT_DISTANCE</code> et PostgreSQL l'extension <code>fuzzystrmatch</code> (<code>levenshtein</code>) pour mesurer la ressemblance entre deux domaines.</p>`,
  quiz:[
    {q:"Un domaine sosie (typosquatting) :", o:["Est le vrai domaine","Imite un domaine légitime à un tiret, une lettre ou une extension près","Est toujours bloqué","Est un domaine interne"], a:1, e:"eaux-de-seine-fr.com imite eauxdeseine.fr : les mêmes lettres, d'autres séparateurs."},
    {q:"Pourquoi une pièce jointe .docm est-elle suspecte ?", o:["Elle est trop lourde","Le « m » signifie qu'elle peut contenir des macros, du code exécuté à l'ouverture","Elle est chiffrée","Elle n'existe pas"], a:1, e:"Même chose pour .xlsm et .pptm."}
  ]});
mis({ id:'33.1', ch:33, title:'Les expéditeurs', who:'benali',
  story:`« Liste les domaines des expéditeurs, du plus récent au plus ancien. Un domaine qui apparaît d'un coup, c'est rarement un nouveau fournisseur. »`,
  lesson:`<p>Le domaine d'une adresse : tout ce qui suit le @.</p>
<pre class="code">substr(expediteur, instr(expediteur, '@') + 1)</pre>`,
  task:`Affiche <code>domaine</code>, <code>mails</code>, <code>destinataires</code> (distincts) et <code>premier</code> (premier mail), par <code>premier</code> décroissant.`,
  solution:`SELECT substr(expediteur, instr(expediteur, '@') + 1) AS domaine, COUNT(*) AS mails, COUNT(DISTINCT destinataire) AS destinataires, MIN(horodatage) AS premier FROM mail_logs GROUP BY domaine ORDER BY premier DESC;`,
  hints:["substr(expediteur, instr(expediteur, '@') + 1) AS domaine","GROUP BY domaine ORDER BY premier DESC"], check:{ordered:true}
});
mis({ id:'33.2', ch:33, title:'Le sosie', who:'byte',
  story:`Byte : « Comparons chaque domaine expéditeur aux domaines connus de la ville (<code>domaines_connus</code>), en ignorant les tirets et les points. Si on retrouve un domaine connu à l'intérieur d'un autre domaine, c'est un sosie. »`,
  lesson:`<p>On <b>normalise</b> les deux chaînes avant de comparer : <code>REPLACE(REPLACE(d, '-', ''), '.', '')</code>. Puis on cherche l'une dans l'autre avec LIKE construit dynamiquement :</p>
<pre class="code">norm(a) LIKE '%' || norm(b) || '%' AND a &lt;&gt; b</pre>`,
  task:`Affiche <code>suspect</code> (domaine expéditeur, DISTINCT) et <code>imite</code> (domaine connu) quand la version normalisée du domaine connu est contenue dans celle du domaine expéditeur, sans être identique.`,
  solution:`WITH e AS (SELECT DISTINCT substr(expediteur, instr(expediteur, '@') + 1) AS d FROM mail_logs) SELECT e.d AS suspect, k.domaine AS imite FROM e JOIN domaines_connus k ON REPLACE(REPLACE(e.d, '-', ''), '.', '') LIKE '%' || REPLACE(REPLACE(k.domaine, '-', ''), '.', '') || '%' AND e.d <> k.domaine;`,
  hints:["CTE des domaines expéditeurs distincts","JOIN domaines_connus avec une condition LIKE construite par concaténation"],
  success:`<b>eaux-de-seine-fr.com</b> imite <b>eauxdeseine.fr</b>, le vrai domaine de la régie. À l'œil nu, dans une boîte mail un lundi matin, la différence ne se voit pas.`
});
mis({ id:'33.3', ch:33, title:'Les extensions', who:'byte',
  story:`« Quelles extensions de pièces jointes passent par la messagerie ? »`,
  lesson:`<p>SQLite n'a pas de fonction « dernier point ». L'astuce classique : <code>rtrim(x, caractères)</code> enlève à droite tous les caractères de la liste. Si la liste contient tout sauf le point, il reste le nom jusqu'au dernier point inclus :</p>
<pre class="code">rtrim(pj, replace(pj, '.', ''))          -- 'facture_0306.'
replace(pj, rtrim(pj, replace(pj, '.', '')), '')   -- 'docm'</pre>`,
  task:`Pour les mails avec pièce jointe, affiche <code>extension</code> (en minuscules), <code>nb</code> et <code>livres</code> (nombre de verdict 'livre'), par <code>nb</code> décroissant.`,
  solution:`SELECT LOWER(replace(piece_jointe, rtrim(piece_jointe, replace(piece_jointe, '.', '')), '')) AS extension, COUNT(*) AS nb, SUM(CASE WHEN verdict = 'livre' THEN 1 ELSE 0 END) AS livres FROM mail_logs WHERE piece_jointe IS NOT NULL GROUP BY extension ORDER BY nb DESC;`,
  hints:["replace(piece_jointe, rtrim(piece_jointe, replace(piece_jointe, '.', '')), '')","SUM(CASE WHEN verdict = 'livre' THEN 1 ELSE 0 END)"], check:{ordered:true, orderKeys:[1]}
});
mis({ id:'33.4', ch:33, title:'Qui a cliqué ?', who:'benali',
  story:`« Parmi les destinataires du faux mail qui l'ont bien reçu, qui a cliqué sur le lien, et combien de minutes après ? »`,
  lesson:`<p>Le login est la partie <b>avant</b> le @ : <code>substr(destinataire, 1, instr(destinataire, '@') - 1)</code>. Le premier clic se trouve avec une sous-requête <code>MIN</code> corrélée.</p>`,
  task:`Pour les mails de 'factures@eaux-de-seine-fr.com' au verdict 'livre', affiche <code>login</code>, <code>recu</code>, <code>clic</code> (premier clic de ce login sur une URL contenant 'eaux-de-seine-fr.com') et <code>minutes</code> (délai arrondi), uniquement pour ceux qui ont cliqué, par <code>clic</code>.`,
  solution:`WITH r AS (SELECT substr(destinataire, 1, instr(destinataire, '@') - 1) AS login, horodatage AS recu FROM mail_logs WHERE expediteur = 'factures@eaux-de-seine-fr.com' AND verdict = 'livre'), c AS (SELECT r.login, r.recu, (SELECT MIN(horodatage) FROM clics k WHERE k.login = r.login AND k.url LIKE '%eaux-de-seine-fr.com%') AS clic FROM r) SELECT login, recu, clic, ROUND((julianday(clic) - julianday(recu)) * 1440) AS minutes FROM c WHERE clic IS NOT NULL ORDER BY clic;`,
  hints:["CTE r : login extrait et heure de réception","Sous-requête MIN(horodatage) sur clics, puis filtre clic IS NOT NULL"], check:{ordered:true},
  success:`Cinq agents ont cliqué. La première, <b>n.perrin</b>, moins de quatre minutes après réception.`
});
boss({ id:'33.5', ch:33, tail:false, title:'Boss : le patient zéro', who:'varga2', timer:600,
  story:`Varga : « Cliquer ne suffit pas à infecter une machine. Il faut que Word lance quelque chose. Parmi les agents qui ont cliqué, sur quelle machine Word a-t-il lancé un interpréteur de commandes ? » Tables <code>postes</code> (hostname, utilisateur) et <code>process_logs</code> (pid, ppid = processus parent).`,
  lesson:`<p>Le parent d'un processus se retrouve par une <b>auto-jointure</b> : <code>JOIN process_logs pere ON pere.host = fils.host AND pere.pid = fils.ppid</code>.</p>`,
  task:`Affiche <code>login</code>, <code>nom</code> (comptes_ad), <code>host</code> et <code>premier_lancement</code> (premier processus 'cmd.exe' ou 'powershell.exe' dont le parent est 'winword.exe'), pour les agents ayant cliqué sur un lien contenant 'eaux-de-seine-fr.com'.`,
  solution:`WITH cl AS (SELECT DISTINCT login FROM clics WHERE url LIKE '%eaux-de-seine-fr.com%') SELECT c.login, ad.nom, po.hostname AS host, MIN(f.horodatage) AS premier_lancement FROM cl c JOIN comptes_ad ad ON ad.login = c.login JOIN postes po ON po.utilisateur = c.login JOIN process_logs f ON f.host = po.hostname AND f.process IN ('cmd.exe', 'powershell.exe') JOIN process_logs pere ON pere.host = f.host AND pere.pid = f.ppid AND pere.process = 'winword.exe' GROUP BY c.login, ad.nom, po.hostname;`,
  hints:["Les cliqueurs, puis leur poste via postes.utilisateur","Auto-jointure process_logs fils / père sur host et pid = ppid"],
  success:`<b>Nadia Perrin</b>, comptabilité, poste <b>PC-COMPTA-07</b>. Word a lancé une invite de commande 51 secondes après son clic : la macro s'est exécutée. Deuxième tête de l'Hydre.`
});

/* ============ 34 ============ */
chap({ id:34, season:4, code:'34', title:'L\'arbre', subtitle:'Processus : fréquences rares, lignes de commande, arbre généalogique récursif',
  intro:`<p>PC-COMPTA-07 est saisi. Table <code>process_logs</code> : chaque programme lancé sur les postes et serveurs de la ville, avec son <code>pid</code> (numéro de processus) et son <code>ppid</code> (numéro du processus parent qui l'a lancé).</p>
<p>Un processus en lance d'autres, qui en lancent d'autres : c'est un arbre. Le dessiner, c'est raconter l'attaque.</p>`,
  oracle:`<p>Les outils EDR (CrowdStrike, Defender for Endpoint) stockent exactement ces journaux. Defender s'interroge en KQL, mais la logique (fréquences rares, auto-jointure parent-enfant, récursion) est la même qu'ici. En Oracle, l'arbre s'écrit aussi avec <code>CONNECT BY PRIOR pid = ppid</code>.</p>`,
  quiz:[
    {q:"Pourquoi chercher les processus <b>rares</b> dans un parc ?", o:["Pour les supprimer","Parce qu'un outil d'attaque apparaît sur une ou deux machines, alors que les logiciels légitimes sont partout","Pour économiser des licences","Ce n'est pas utile"], a:1, e:"C'est l'analyse de la « longue traîne » (stack counting)."},
    {q:"Word qui lance powershell.exe, c'est :", o:["Normal","Un signal fort de macro malveillante","Une mise à jour","Un bug d'affichage"], a:1, e:"Un traitement de texte n'a aucune raison de lancer un interpréteur de commandes."}
  ]});
mis({ id:'34.1', ch:34, title:'La longue traîne', who:'byte',
  story:`« Les logiciels légitimes tournent sur des dizaines de postes. Les outils d'un attaquant, sur une ou deux machines. Quels processus n'ont tourné que sur deux machines au plus ? »`,
  lesson:`<p><code>group_concat(DISTINCT x)</code> liste les valeurs distinctes d'un groupe, séparées par des virgules.</p>`,
  task:`Affiche <code>process</code>, <code>machines</code> (hosts distincts), <code>executions</code> et <code>liste</code> (group_concat des hosts distincts, dans l'ordre alphabétique), pour les processus présents sur au plus 2 machines, par <code>process</code>.`,
  solution:`SELECT process, COUNT(DISTINCT host) AS machines, COUNT(*) AS executions, group_concat(DISTINCT host ORDER BY host) AS liste FROM process_logs GROUP BY process HAVING COUNT(DISTINCT host) <= 2 ORDER BY process;`,
  hints:["GROUP BY process HAVING COUNT(DISTINCT host) <= 2","group_concat(DISTINCT host)"], check:{ordered:true}
});
mis({ id:'34.2', ch:34, title:'Les lignes de commande', who:'byte',
  story:`« Cherche les lignes de commande typiques d'une attaque : PowerShell encodé (<i>-enc</i>), fenêtre cachée (<i>hidden</i>), création de tâche planifiée (<i>/create</i>), lecture de la mémoire des mots de passe (<i>lsass</i>). »`,
  lesson:`<p>Plusieurs motifs LIKE reliés par OR, entre parenthèses. <code>LOWER()</code> rend la recherche insensible à la casse.</p>`,
  task:`Affiche <code>horodatage</code>, <code>host</code>, <code>process</code> et <code>ligne_commande</code> des processus dont la ligne de commande (en minuscules) contient '-enc', 'hidden', '/create' ou 'lsass', par horodatage.`,
  solution:`SELECT horodatage, host, process, ligne_commande FROM process_logs WHERE LOWER(ligne_commande) LIKE '%-enc%' OR LOWER(ligne_commande) LIKE '%hidden%' OR LOWER(ligne_commande) LIKE '%/create%' OR LOWER(ligne_commande) LIKE '%lsass%' ORDER BY horodatage;`,
  hints:["Quatre LIKE reliés par OR sur LOWER(ligne_commande)"], check:{ordered:true}
});
mis({ id:'34.3', ch:34, title:'Parents et enfants', who:'byte',
  story:`« Sur PC-COMPTA-07, entre 9h et 10h le 6 mars : quel processus a lancé quel processus ? »`,
  lesson:`<p>L'auto-jointure parent-enfant du boss 33.5 :</p>
<pre class="code">FROM process_logs f
JOIN process_logs p ON p.host = f.host AND p.pid = f.ppid</pre>`,
  task:`Affiche <code>heure</code> (horodatage de l'enfant), <code>parent</code> et <code>enfant</code> (noms de processus) pour PC-COMPTA-07 entre '2028-03-06 09:00:00' et '2028-03-06 10:00:00', par heure.`,
  solution:`SELECT f.horodatage AS heure, p.process AS parent, f.process AS enfant FROM process_logs f JOIN process_logs p ON p.host = f.host AND p.pid = f.ppid WHERE f.host = 'PC-COMPTA-07' AND f.horodatage BETWEEN '2028-03-06 09:00:00' AND '2028-03-06 10:00:00' ORDER BY f.horodatage;`,
  hints:["JOIN process_logs p ON p.host = f.host AND p.pid = f.ppid","Filtre sur f.host et f.horodatage"], check:{ordered:true}
});
mis({ id:'34.4', ch:34, title:'L\'arbre généalogique', who:'byte',
  story:`« Je veux tout l'arbre, sur toute la durée, à partir du Word qui a ouvert <i>facture_0306.docm</i>. Avec l'indentation, comme dans un vrai EDR. »`,
  lesson:`<p>L'arbre se parcourt avec une CTE récursive : on part de la racine, et à chaque étape on ajoute les enfants des processus déjà trouvés.</p>
<pre class="code">WITH RECURSIVE arbre(host, pid, process, niveau, h) AS (
  SELECT host, pid, process, 0, horodatage FROM process_logs WHERE ...racine...
  UNION ALL
  SELECT p.host, p.pid, p.process, a.niveau + 1, p.horodatage
  FROM process_logs p JOIN arbre a ON p.host = a.host AND p.ppid = a.pid)
SELECT substr('............', 1, 2 * niveau) || process ...</pre>`,
  task:`Partant du processus 'winword.exe' dont la ligne de commande contient 'facture_0306', affiche <code>horodatage</code>, <code>niveau</code> et <code>arbre</code> (deux points par niveau, puis le nom du processus), par horodatage.`,
  solution:`WITH RECURSIVE arbre(host, pid, process, niveau, horodatage) AS (SELECT host, pid, process, 0, horodatage FROM process_logs WHERE process = 'winword.exe' AND ligne_commande LIKE '%facture_0306%' UNION ALL SELECT p.host, p.pid, p.process, a.niveau + 1, p.horodatage FROM process_logs p JOIN arbre a ON p.host = a.host AND p.ppid = a.pid) SELECT horodatage, niveau, substr('............', 1, 2 * niveau) || process AS arbre FROM arbre ORDER BY horodatage;`,
  hints:["Racine : process = 'winword.exe' AND ligne_commande LIKE '%facture_0306%'","Récursion : p.host = a.host AND p.ppid = a.pid","substr('............', 1, 2 * niveau) || process"], require:[{re:'RECURSIVE', msg:"L'arbre se parcourt avec une CTE récursive."}], check:{ordered:true},
  success:`Word, puis cmd, puis PowerShell encodé, puis rundll32 qui charge <i>upd.dll</i>, une tâche planifiée « MAJ_Adobe » pour revenir toutes les 30 minutes, de la reconnaissance du domaine, et le 7 mars à 1h58 : <b>procdump sur lsass</b>, la mémoire où dorment les mots de passe.`
});
boss({ id:'34.5', ch:34, tail:false, title:'Boss : toutes les machines infectées', who:'varga2', timer:540,
  story:`Varga : « <i>upd.dll</i> est la charge de l'attaquant. Sur quelles machines a-t-elle été lancée par rundll32, depuis quand, combien de fois, et quel processus l'a lancée la première fois ? »`,
  lesson:`<p>Agrégat par machine, puis une jointure vers la <b>première</b> exécution pour retrouver son parent (LEFT JOIN, car le parent n'est pas toujours journalisé).</p>`,
  task:`Pour les processus 'rundll32.exe' dont la ligne de commande contient 'upd.dll', affiche par machine : <code>host</code>, <code>premiere</code>, <code>executions</code> et <code>parent_premiere</code> (nom du parent de la première exécution), par <code>premiere</code>.`,
  solution:`WITH r AS (SELECT * FROM process_logs WHERE process = 'rundll32.exe' AND ligne_commande LIKE '%upd.dll%'), g AS (SELECT host, MIN(horodatage) AS premiere, COUNT(*) AS executions FROM r GROUP BY host) SELECT g.host, g.premiere, g.executions, p.process AS parent_premiere FROM g JOIN r ON r.host = g.host AND r.horodatage = g.premiere LEFT JOIN process_logs p ON p.host = r.host AND p.pid = r.ppid ORDER BY g.premiere;`,
  hints:["CTE r : les rundll32 avec upd.dll ; CTE g : agrégat par host","JOIN r sur la première exécution, puis LEFT JOIN vers le parent"], check:{ordered:true},
  success:`PC-COMPTA-07 depuis le 6 mars (lancée par PowerShell, puis relancée par la tâche planifiée), et <b>SRV-FICHIERS</b> depuis le 7 mars à 2h36, copiée par une invite de commande. L'attaquant a sauté d'une machine à l'autre. Troisième tête : la persistance.`
});

/* ============ 35 ============ */
chap({ id:35, season:4, code:'35', title:'Le saut', subtitle:'Mouvement latéral : premières fois, comptes admin hors de chez eux, chemin récursif',
  intro:`<p>Avec les mots de passe lus dans la mémoire de PC-COMPTA-07, l'attaquant a trouvé mieux qu'un compte de comptable : celui de <b>Clément Varenne</b>, administrateur prestataire, qui avait fait une maintenance sur ce poste le 4 mars.</p>
<p>Benali est formel : « Varenne a les droits sur tout. Si c'est lui, on a un problème. Si ce n'est pas lui, on en a un plus gros. »</p>`,
  oracle:`<p>La détection de mouvement latéral repose sur deux idées : ce qui arrive pour la <b>première fois</b> (un compte sur une machine qu'il n'a jamais touchée) et les <b>chemins</b> dans le graphe machine vers machine. Les outils comme BloodHound calculent ces chemins sur l'annuaire ; ici on le fait sur les journaux, en SQL.</p>`,
  quiz:[
    {q:"Un compte d'administrateur qui se connecte depuis le poste d'un comptable :", o:["C'est normal","C'est suspect : un admin travaille depuis ses propres postes d'administration","C'est une mise à jour","C'est impossible"], a:1, e:"C'est le principe du « tiering » : les comptes à privilèges ne doivent servir que depuis des postes dédiés."}
  ]});
mis({ id:'35.1', ch:35, title:'Les premières fois', who:'benali',
  story:`« Pour chaque compte administrateur, quelles machines a-t-il touchées pour la <b>première fois</b> à partir du 6 mars ? »`,
  lesson:`<p>« Première fois » = le MIN de l'horodatage par couple (compte, machine). On filtre ensuite ce MIN, avec HAVING.</p>`,
  task:`Pour les connexions réussies des comptes <code>admin = 1</code>, affiche <code>login</code>, <code>dest_host</code> et <code>premiere</code> des couples dont la première connexion est à partir du '2028-03-06', par <code>premiere</code>.`,
  solution:`SELECT a.login, a.dest_host, MIN(a.horodatage) AS premiere FROM auth_logs a JOIN comptes_ad c ON c.login = a.login WHERE c.admin = 1 AND a.resultat = 'succes' GROUP BY a.login, a.dest_host HAVING MIN(a.horodatage) >= '2028-03-06' ORDER BY premiere;`,
  hints:["JOIN comptes_ad, WHERE admin = 1 AND resultat = 'succes'","GROUP BY login, dest_host HAVING MIN(horodatage) >= '2028-03-06'"], check:{ordered:true}
});
mis({ id:'35.2', ch:35, title:'Hors de chez lui', who:'benali',
  story:`« Un administrateur travaille depuis son poste d'administration. Trouve les connexions de comptes admin parties du poste d'un <b>autre</b> utilisateur. »`,
  lesson:`<p>On retrouve la machine d'origine en joignant l'IP source à <code>postes.ip</code>, puis on compare son <code>utilisateur</code> au login qui se connecte.</p>`,
  task:`Affiche <code>horodatage</code>, <code>login</code>, <code>poste_source</code>, <code>proprietaire</code> (utilisateur du poste) et <code>dest_host</code> pour les succès de comptes admin dont l'IP source est un poste de type 'poste' appartenant à quelqu'un d'autre, par horodatage.`,
  solution:`SELECT a.horodatage, a.login, p.hostname AS poste_source, p.utilisateur AS proprietaire, a.dest_host FROM auth_logs a JOIN comptes_ad c ON c.login = a.login AND c.admin = 1 JOIN postes p ON p.ip = a.source_ip AND p.type = 'poste' WHERE a.resultat = 'succes' AND p.utilisateur <> a.login ORDER BY a.horodatage;`,
  hints:["JOIN postes p ON p.ip = a.source_ip AND p.type = 'poste'","p.utilisateur <> a.login"], check:{ordered:true},
  success:`7 mars, 2h31 : <b>adm.varenne</b> se connecte à SRV-FICHIERS depuis PC-COMPTA-07, le poste de Nadia Perrin. En pleine nuit, depuis la machine infectée.`
});
mis({ id:'35.3', ch:35, title:'Les nuits blanches', who:'benali',
  story:`« Les connexions d'admins entre minuit et 6h, nuit par nuit. »`,
  lesson:`<p><code>CAST(strftime('%H', horodatage) AS INTEGER) &lt; 6</code> isole les heures de nuit. <code>date(horodatage)</code> donne la nuit.</p>`,
  task:`Pour les succès des comptes admin entre 0h et 5h59, affiche <code>login</code>, <code>nuit</code> (date), <code>connexions</code> et <code>machines</code> (group_concat des dest_host distincts, dans l'ordre alphabétique), par nuit puis login.`,
  solution:`SELECT a.login, date(a.horodatage) AS nuit, COUNT(*) AS connexions, group_concat(DISTINCT a.dest_host ORDER BY a.dest_host) AS machines FROM auth_logs a JOIN comptes_ad c ON c.login = a.login WHERE c.admin = 1 AND a.resultat = 'succes' AND CAST(strftime('%H', a.horodatage) AS INTEGER) < 6 GROUP BY a.login, nuit ORDER BY nuit, a.login;`,
  hints:["CAST(strftime('%H', horodatage) AS INTEGER) < 6","GROUP BY login, date(horodatage)"], check:{ordered:true}
});
mis({ id:'35.4', ch:35, title:'L\'alibi', who:'varga',
  story:`Varga : « Où était Clément Varenne ? La table <code>deplacements</code> dit qu'il était au salon cyber de Lyon du 6 au 13 mars. Compte les connexions de chaque compte pendant ses déplacements, hors VPN. »`,
  lesson:`<p>Une jointure sur un <b>intervalle</b> : <code>JOIN deplacements d ON d.login = a.login AND a.horodatage BETWEEN d.debut AND d.fin</code>. Une connexion locale, smb ou rdp suppose d'être sur le réseau de la ville.</p>`,
  task:`Affiche <code>login</code>, <code>lieu</code>, <code>connexions</code> (succès hors méthode 'vpn' pendant le déplacement), <code>premiere</code> et <code>derniere</code>, pour les déplacements avec au moins une connexion.`,
  solution:`SELECT a.login, d.lieu, COUNT(*) AS connexions, MIN(a.horodatage) AS premiere, MAX(a.horodatage) AS derniere FROM auth_logs a JOIN deplacements d ON d.login = a.login AND a.horodatage BETWEEN d.debut AND d.fin WHERE a.resultat = 'succes' AND a.methode <> 'vpn' GROUP BY a.login, d.lieu;`,
  hints:["JOIN deplacements sur le login ET l'intervalle de dates","methode <> 'vpn'"],
  success:`Varenne était à Lyon, des dizaines de personnes l'ont vu. Pourtant son compte a ouvert des sessions sur le réseau interne de la ville trois nuits sur sept. Ce n'est pas lui : quelqu'un se sert de son identité. Le prestataire est la victime, pas le coupable.`
});
boss({ id:'35.5', ch:35, tail:false, title:'Boss : le chemin jusqu\'au cœur', who:'varga2', timer:660,
  story:`Varga : « Je veux le chemin exact de l'attaquant avec le compte de Varenne : de PC-COMPTA-07 jusqu'au contrôleur de domaine DC01, saut par saut, dans l'ordre du temps. »`,
  lesson:`<p>Chaque connexion réussie est une arête : machine source (via son IP) vers machine destination. Une CTE récursive enchaîne les arêtes à condition que chacune soit <b>postérieure</b> à la précédente :</p>
<pre class="code">... JOIN aretes e ON e.src = c.dest AND e.t &gt; c.t
    AND instr(c.chemin, e.dest) = 0</pre>`,
  task:`Avec les succès de 'adm.varenne' à partir du '2028-03-06' (source = hostname dont l'IP est la source_ip), affiche <code>chemin</code> (machines séparées par ' &gt; ', partant de 'PC-COMPTA-07') et <code>arrivee</code> (horodatage du dernier saut) des chemins qui arrivent à 'DC01'.`,
  solution:`WITH RECURSIVE aretes AS (SELECT p.hostname AS src, a.dest_host AS dest, a.horodatage AS t FROM auth_logs a JOIN postes p ON p.ip = a.source_ip WHERE a.login = 'adm.varenne' AND a.resultat = 'succes' AND a.horodatage >= '2028-03-06'), c(dest, chemin, t) AS (SELECT dest, src || ' > ' || dest, t FROM aretes WHERE src = 'PC-COMPTA-07' UNION ALL SELECT e.dest, c.chemin || ' > ' || e.dest, e.t FROM c JOIN aretes e ON e.src = c.dest AND e.t > c.t AND instr(c.chemin, e.dest) = 0) SELECT chemin, t AS arrivee FROM c WHERE dest = 'DC01';`,
  hints:["CTE aretes : hostname source, dest_host, horodatage","Récursion : e.src = c.dest AND e.t > c.t, sans repasser par une machine"], require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."}],
  success:`PC-COMPTA-07, SRV-FICHIERS, DC01 : le 8 mars à 1h04, l'attaquant tient le contrôleur de domaine, le cœur de l'informatique de la ville. Quatrième tête de l'Hydre.`
});

/* ============ 36 ============ */
chap({ id:36, season:4, code:'36', title:'Le battement', subtitle:'Détection de balise (beaconing) : intervalles, écart-type, coefficient de variation',
  intro:`<p>Un logiciel espion doit recevoir ses ordres. Il « appelle la maison » à intervalle régulier : c'est une <b>balise</b> (beacon). Table <code>proxy_logs</code> : chaque connexion web sortante des machines de la ville, avec le domaine, l'IP et les octets échangés.</p>
<p class="quote">« Un humain navigue comme un papillon. Une machine bat comme un cœur. » (Byte)</p>`,
  oracle:`<p>La détection de beaconing par analyse des intervalles est une technique standard de threat hunting (outils RITA, Zeek). Le calcul de l'écart-type existe en natif ailleurs : <code>STDDEV_POP</code> en Oracle, PostgreSQL et BigQuery.</p>`,
  quiz:[
    {q:"Le coefficient de variation (écart-type / moyenne) d'une balise automatique est :", o:["Très élevé","Très proche de 0 : les intervalles sont presque identiques","Toujours 1","Négatif"], a:1, e:"Un humain a un coefficient de variation souvent proche de 1, ou plus."},
    {q:"Un antivirus qui contacte son serveur toutes les heures pile :", o:["C'est forcément une attaque","C'est une balise légitime : d'où l'intérêt d'une liste de domaines connus","C'est impossible","C'est un humain"], a:1, e:"La régularité seule ne suffit pas : il faut la croiser avec la réputation du domaine."}
  ]});
mis({ id:'36.1', ch:36, title:'Les inconnus', who:'byte',
  story:`« Quelles machines parlent à des domaines absents de <code>domaines_connus</code>, et combien de fois ? »`,
  lesson:`<p>Révision : <code>NOT IN (SELECT ...)</code> et GROUP BY sur deux colonnes.</p>`,
  task:`Affiche <code>host</code>, <code>domaine</code> et <code>connexions</code> pour les domaines inconnus, par <code>connexions</code> décroissant puis host.`,
  solution:`SELECT host, domaine, COUNT(*) AS connexions FROM proxy_logs WHERE domaine NOT IN (SELECT domaine FROM domaines_connus) GROUP BY host, domaine ORDER BY connexions DESC, host;`,
  hints:["WHERE domaine NOT IN (SELECT domaine FROM domaines_connus)"], check:{ordered:true}
});
mis({ id:'36.2', ch:36, title:'Le rythme', who:'byte',
  story:`« Regarde le rythme de PC-COMPTA-07 vers cdn-update-check.net : le temps entre deux connexions. »`,
  lesson:`<p><code>LAG(x) OVER (PARTITION BY ... ORDER BY ...)</code> donne la valeur de la ligne précédente dans la même partition. L'écart en secondes : <code>(julianday(h) - julianday(LAG(h) OVER (...))) * 86400</code>.</p>`,
  task:`Pour host 'PC-COMPTA-07' et domaine 'cdn-update-check.net', affiche <code>horodatage</code> et <code>ecart_s</code> (secondes depuis la connexion précédente, arrondi à l'unité) des 10 premières connexions.`,
  solution:`SELECT horodatage, ROUND((julianday(horodatage) - julianday(LAG(horodatage) OVER (ORDER BY horodatage))) * 86400) AS ecart_s FROM proxy_logs WHERE host = 'PC-COMPTA-07' AND domaine = 'cdn-update-check.net' ORDER BY horodatage LIMIT 10;`,
  hints:["LAG(horodatage) OVER (ORDER BY horodatage)","* 86400 pour des secondes, LIMIT 10"], require:[{re:'LAG', msg:"Utilise LAG."}], check:{ordered:true}
});
mis({ id:'36.3', ch:36, title:'La régularité', who:'byte',
  story:`« Pour chaque couple machine et domaine qui a au moins 50 intervalles : intervalle moyen, écart-type et coefficient de variation. »`,
  lesson:`<p>On calcule d'abord les intervalles dans une CTE (avec LAG), puis on agrège. Le <b>coefficient de variation</b> = écart-type / moyenne. Écart-type : <code>sqrt(AVG(x*x) - AVG(x)*AVG(x))</code>.</p>`,
  task:`Affiche <code>host</code>, <code>domaine</code>, <code>intervalles</code>, <code>moyenne_s</code> (arrondie à l'unité), <code>ecart_type</code> (arrondi à 1 décimale) et <code>cv</code> (arrondi à 3 décimales) pour les couples avec au moins 50 intervalles, par <code>cv</code> puis host.`,
  solution:`WITH ${BEACON} SELECT host, domaine, n AS intervalles, ROUND(m) AS moyenne_s, ROUND(sd, 1) AS ecart_type, ROUND(sd / m, 3) AS cv FROM st ORDER BY cv, host;`,
  hints:["CTE des intervalles avec LAG PARTITION BY host, domaine","CTE d'agrégats HAVING COUNT(dt) >= 50, puis sd / m"], check:{ordered:true, orderKeys:[5]}
});
mis({ id:'36.4', ch:36, title:'Le cœur artificiel', who:'byte',
  story:`« L'antivirus est parfaitement régulier, lui aussi. La différence : il est dans la liste des domaines connus. Garde les couples réguliers (cv &lt; 0,05) vers des domaines inconnus. »`,
  lesson:`<p>On croise deux signaux : la <b>régularité</b> et la <b>réputation</b>. Chacun seul donne des faux positifs ; ensemble, ils désignent une balise.</p>`,
  task:`Affiche <code>host</code>, <code>domaine</code>, <code>ip_dest</code> et <code>moyenne_s</code> (arrondie) des couples avec au moins 50 intervalles, <code>cv &lt; 0.05</code> et un domaine absent de <code>domaines_connus</code>.`,
  solution:`WITH ${BEACON} SELECT host, domaine, ip_dest, ROUND(m) AS moyenne_s FROM st WHERE sd / m < 0.05 AND domaine NOT IN (SELECT domaine FROM domaines_connus);`,
  hints:["Reprends 36.3, filtre sd / m < 0.05 et domaine NOT IN (...)"],
  success:`Deux cœurs artificiels, qui battent toutes les dix minutes : PC-COMPTA-07 et SRV-FICHIERS, vers <b>cdn-update-check.net</b> (192.0.2.66). Cinquième tête de l'Hydre : le canal de commande.`
});
boss({ id:'36.5', ch:36, tail:false, title:'Boss : la fiche du serveur de commande', who:'varga2', timer:540,
  story:`Varga : « La fiche complète du serveur de commande, pour la juge : domaine, IP, machines infectées, premier contact, nombre de connexions et octets envoyés. »`,
  lesson:`<p>On détecte les balises (36.4), puis on revient à <b>toutes</b> les connexions vers ces domaines pour les agréger.</p>`,
  task:`Pour les domaines détectés comme balises (36.4), affiche <code>domaine</code>, <code>ip_dest</code>, <code>machines</code> (group_concat des hosts distincts, dans l'ordre alphabétique), <code>premier</code>, <code>connexions</code> et <code>octets_envoyes</code> (somme de octets_out).`,
  solution:`WITH ${BEACON}, b AS (SELECT DISTINCT domaine FROM st WHERE sd / m < 0.05 AND domaine NOT IN (SELECT domaine FROM domaines_connus)) SELECT p.domaine, p.ip_dest, group_concat(DISTINCT p.host ORDER BY p.host) AS machines, MIN(p.horodatage) AS premier, COUNT(*) AS connexions, SUM(p.octets_out) AS octets_envoyes FROM proxy_logs p WHERE p.domaine IN (SELECT domaine FROM b) GROUP BY p.domaine, p.ip_dest;`,
  hints:["CTE b : les domaines balises","Puis agrégat sur proxy_logs WHERE domaine IN (SELECT domaine FROM b)"]
});

/* ============ 37 ============ */
chap({ id:37, season:4, code:'37', title:'Le tunnel', subtitle:'Exfiltration par DNS : longueur des requêtes, extraction de texte, décodage hexadécimal',
  intro:`<p>Le pare-feu n'a vu passer aucun gros fichier. Pourtant, Benali en est sûr : des données sont sorties. Byte regarde <code>dns_logs</code>, le journal des requêtes DNS (les questions « quelle est l'adresse de tel nom ? »).</p>
<p class="quote">« On peut faire sortir n'importe quoi par le DNS, morceau par morceau, caché dans les noms de domaine. Il suffit de poser beaucoup de questions bizarres. » (Byte)</p>`,
  oracle:`<p>L'hexadécimal se décode partout : <code>UTL_RAW.CAST_TO_VARCHAR2(HEXTORAW(x))</code> en Oracle, <code>convert_from(decode(x, 'hex'), 'UTF8')</code> en PostgreSQL, <code>unhex()</code> en SQLite 3.41 et plus.</p>`,
  quiz:[
    {q:"Une exfiltration DNS se repère par :", o:["Des requêtes très courtes","Des requêtes anormalement longues et toutes différentes vers un même domaine","Des requêtes vers Google","Rien, elle est invisible"], a:1, e:"Chaque sous-domaine porte un morceau de données encodé."},
    {q:"<code>CAST(unhex('534F43') AS TEXT)</code> donne :", o:["534F43","SOC","Une erreur","3"], a:1, e:"53 = S, 4F = O, 43 = C en ASCII."}
  ]});
mis({ id:'37.1', ch:37, title:'Les questions bizarres', who:'byte',
  story:`« Pour chaque domaine : nombre de requêtes, longueur moyenne, nombre de requêtes distinctes. Les plus longues d'abord. »`,
  lesson:`<p><code>length(texte)</code> donne le nombre de caractères. Une requête DNS normale fait une vingtaine de caractères.</p>`,
  task:`Affiche <code>domaine</code>, <code>requetes</code>, <code>longueur_moy</code> (arrondie à 1 décimale) et <code>distinctes</code> pour les 5 domaines à la plus grande longueur moyenne.`,
  solution:`SELECT domaine, COUNT(*) AS requetes, ROUND(AVG(length(requete)), 1) AS longueur_moy, COUNT(DISTINCT requete) AS distinctes FROM dns_logs GROUP BY domaine ORDER BY longueur_moy DESC LIMIT 5;`,
  hints:["AVG(length(requete))","ORDER BY longueur_moy DESC LIMIT 5"], check:{ordered:true, orderKeys:[2]}
});
mis({ id:'37.2', ch:37, title:'La fenêtre de tir', who:'byte',
  story:`« Le domaine au plus grand nombre moyen de caractères : depuis quelle machine, quand a commencé et fini la rafale ? »`,
  lesson:`<p>Une sous-requête dans le WHERE qui renvoie le domaine « champion » : <code>WHERE domaine = (SELECT domaine FROM ... ORDER BY ... LIMIT 1)</code>.</p>`,
  task:`Pour le domaine de plus grande longueur moyenne, affiche <code>host</code>, <code>debut</code>, <code>fin</code> et <code>requetes</code>.`,
  solution:`SELECT host, MIN(horodatage) AS debut, MAX(horodatage) AS fin, COUNT(*) AS requetes FROM dns_logs WHERE domaine = (SELECT domaine FROM dns_logs GROUP BY domaine ORDER BY AVG(length(requete)) DESC LIMIT 1) GROUP BY host;`,
  hints:["WHERE domaine = (SELECT domaine FROM dns_logs GROUP BY domaine ORDER BY AVG(length(requete)) DESC LIMIT 1)"],
  success:`SRV-FICHIERS, le 9 mars vers 1h, en quatre minutes, vers <b>tunnel-meteo.net</b>. La même nuit où svc_backup s'est reconnecté. Les têtes de l'Hydre travaillent ensemble.`
});
mis({ id:'37.3', ch:37, title:'Découper les requêtes', who:'byte',
  story:`« Les requêtes ressemblent à <code>3.6c6f742031.t.tunnel-meteo.net</code>. Avant le premier point : un numéro de morceau. Entre le premier et le deuxième point : les données en hexadécimal. »`,
  lesson:`<p>On découpe en deux temps : le texte avant le premier point, puis le reste, puis le texte avant le premier point du reste.</p>
<pre class="code">substr(r, 1, instr(r, '.') - 1)           -- avant le 1er point
substr(r, instr(r, '.') + 1)               -- après le 1er point</pre>`,
  task:`Pour le domaine 'tunnel-meteo.net', affiche <code>seq</code> (le numéro, en entier) et <code>hex</code> (le deuxième morceau), par <code>seq</code>.`,
  solution:`WITH ${DNSX} SELECT seq, hex FROM y ORDER BY seq;`,
  hints:["CTE : seq = CAST(substr(requete, 1, instr(requete, '.') - 1) AS INTEGER), reste = substr(requete, instr(requete, '.') + 1)","hex = substr(reste, 1, instr(reste, '.') - 1)"], check:{ordered:true}
});
mis({ id:'37.4', ch:37, title:'Déchiffrer un morceau', who:'byte',
  story:`« L'hexadécimal, ce n'est pas du chiffrement, juste une autre façon d'écrire des octets. Décode chaque morceau. »`,
  lesson:`<p><code>unhex(x)</code> transforme une chaîne hexadécimale en octets, <code>CAST(... AS TEXT)</code> les relit comme du texte.</p>
<pre class="code">SELECT CAST(unhex('534F43') AS TEXT);   -- 'SOC'</pre>`,
  task:`Affiche <code>seq</code> et <code>texte</code> (le morceau décodé), par <code>seq</code>.`,
  solution:`WITH ${DNSX} SELECT seq, CAST(unhex(hex) AS TEXT) AS texte FROM y ORDER BY seq;`,
  hints:["CAST(unhex(hex) AS TEXT)"], require:[{re:'unhex', msg:"Utilise unhex."}], check:{ordered:true}
});
boss({ id:'37.5', ch:37, tail:false, title:'Boss : le butin', who:'varga2', timer:600,
  story:`Varga : « Une seule ligne : le message complet reconstitué dans l'ordre, et le nombre d'octets sortis. »`,
  lesson:`<p><code>group_concat(x, '' ORDER BY seq)</code> recolle les morceaux dans l'ordre. Le nombre d'octets d'un morceau hexadécimal : sa longueur divisée par 2.</p>`,
  task:`Affiche <code>message</code> (morceaux décodés, concaténés sans séparateur, dans l'ordre de seq) et <code>octets</code> (somme de length(hex) / 2).`,
  solution:`WITH ${DNSX} SELECT group_concat(CAST(unhex(hex) AS TEXT), '' ORDER BY seq) AS message, SUM(length(hex) / 2) AS octets FROM y;`,
  hints:["group_concat(CAST(unhex(hex) AS TEXT), '' ORDER BY seq)","SUM(length(hex) / 2)"], require:[{re:'unhex', msg:"Utilise unhex."}], check:{strictCols:true},
  success:`« HYDRE&gt;MINOTAURE ». Le plan complet du réseau TransSeine, le jeu de données annoté de VIGIE, les règles antifraude d'Hélios. Les trois premières affaires, volées en une nuit, pour quelqu'un qui s'appelle <b>MINOTAURE</b>. Sixième tête.`
});

/* ============ 38 ============ */
chap({ id:38, season:4, code:'38', title:'La pression', subtitle:'Données industrielles : moyennes mobiles, pics isolés, commandes et effets',
  intro:`<p>12 mars, 3h05. Dans le sud de Paris, les robinets toussent puis se taisent. Six capteurs de pression (en bar) relèvent les réservoirs toutes les dix minutes (<code>capteurs</code>), et chaque réglage envoyé aux automates est journalisé (<code>commandes_ot</code>).</p>
<p>La capitaine <b>Yasmine Haddad</b>, spécialiste des installations portuaires, est appelée en renfort : « Les machines industrielles ne mentent pas. Elles obéissent. »</p>`,
  oracle:`<p>Les historiens de données industrielles (OSIsoft PI, InfluxDB, TimescaleDB sur PostgreSQL) stockent des séries temporelles comme celle-ci. Les moyennes mobiles s'écrivent partout avec <code>AVG(...) OVER (ORDER BY t ROWS BETWEEN n PRECEDING AND 1 PRECEDING)</code>.</p>`,
  quiz:[
    {q:"Un capteur qui affiche 0 une seule fois, entouré de valeurs normales :", o:["Une attaque certaine","Plutôt un capteur défaillant ou une erreur de transmission","Une coupure générale","Une fuite"], a:1, e:"Un sabotage produit un changement qui dure ; un défaut produit des pics isolés."}
  ]});
mis({ id:'38.1', ch:38, title:'La chute', who:'haddad',
  story:`Haddad : « Pour le réservoir de Montsouris, le 12 mars : compare chaque relevé à la moyenne des 6 relevés précédents, et garde les écarts de plus de 20 %. »`,
  lesson:`<pre class="code">AVG(valeur) OVER (PARTITION BY site ORDER BY horodatage
                  ROWS BETWEEN 6 PRECEDING AND 1 PRECEDING)</pre>
<p>Écart en pourcentage : <code>100.0 * (valeur - moyenne) / moyenne</code>. On filtre dans une requête externe (on ne peut pas filtrer une fonction de fenêtrage dans son propre WHERE).</p>`,
  task:`Pour site 'Réservoir Montsouris' et date '2028-03-12', affiche <code>horodatage</code>, <code>valeur</code>, <code>moyenne</code> (arrondie à 2 décimales) et <code>ecart_pct</code> (arrondi à l'unité) des relevés dont l'écart absolu dépasse 20 %, par horodatage.`,
  solution:`WITH m AS (SELECT horodatage, valeur, AVG(valeur) OVER (ORDER BY horodatage ROWS BETWEEN 6 PRECEDING AND 1 PRECEDING) AS moyenne FROM capteurs WHERE site = 'Réservoir Montsouris') SELECT horodatage, valeur, ROUND(moyenne, 2) AS moyenne, ROUND(100.0 * (valeur - moyenne) / moyenne) AS ecart_pct FROM m WHERE date(horodatage) = '2028-03-12' AND ABS(valeur - moyenne) / moyenne > 0.2 ORDER BY horodatage;`,
  hints:["CTE avec AVG(valeur) OVER (ORDER BY horodatage ROWS BETWEEN 6 PRECEDING AND 1 PRECEDING) sur tout le site","Filtre la date et l'écart dans la requête externe"], check:{ordered:true}
});
mis({ id:'38.2', ch:38, title:'Les faux départs', who:'haddad',
  story:`« L'usine d'Ivry affiche parfois 0 bar. Panne de capteur ou attaque ? Compte, par site, les relevés à 0 dont le relevé précédent <b>et</b> le suivant sont normaux (plus de 1 bar). »`,
  lesson:`<p><code>LEAD(x)</code> est le symétrique de <code>LAG(x)</code> : la valeur de la ligne <b>suivante</b>.</p>`,
  task:`Affiche <code>site</code> et <code>pics_isoles</code> (relevés à 0 encadrés par deux relevés supérieurs à 1), pour les sites qui en ont.`,
  solution:`WITH v AS (SELECT site, valeur, LAG(valeur) OVER (PARTITION BY site ORDER BY horodatage) AS avant, LEAD(valeur) OVER (PARTITION BY site ORDER BY horodatage) AS apres FROM capteurs) SELECT site, COUNT(*) AS pics_isoles FROM v WHERE valeur = 0 AND avant > 1 AND apres > 1 GROUP BY site;`,
  hints:["LAG et LEAD PARTITION BY site ORDER BY horodatage dans une CTE","valeur = 0 AND avant > 1 AND apres > 1"], require:[{re:'LEAD', msg:"Utilise LEAD."}],
  success:`Ivry : des pics isolés, un capteur fatigué. Montsouris : une chute qui dure plus de trois heures. Ce n'est pas un défaut, c'est un ordre.`
});
mis({ id:'38.3', ch:38, title:'Les ordres de nuit', who:'haddad',
  story:`« Quels réglages ont été envoyés aux automates en dehors des heures de service (avant 7h ou à partir de 20h) ? »`,
  lesson:`<p>Révision de <code>strftime('%H', ...)</code> avec deux conditions reliées par OR.</p>`,
  task:`Affiche toutes les colonnes de <code>commandes_ot</code> pour les commandes envoyées avant 7h ou à partir de 20h, par horodatage.`,
  solution:`SELECT * FROM commandes_ot WHERE CAST(strftime('%H', horodatage) AS INTEGER) < 7 OR CAST(strftime('%H', horodatage) AS INTEGER) >= 20 ORDER BY horodatage;`,
  hints:["CAST(strftime('%H', horodatage) AS INTEGER) < 7 OR ... >= 20"], check:{ordered:true},
  success:`3h02 : le seuil d'alarme de Montsouris passe de 3 à 0,5 bar, pour que personne ne soit réveillé. 3h04 : la consigne de pression passe de 4,2 à 1. Signé <b>adm.varenne</b>, depuis la passerelle SCADA.`
});
mis({ id:'38.4', ch:38, title:'Cause et effet', who:'haddad',
  story:`« Prouve que chaque commande sur Montsouris le 12 mars a eu un effet : pression moyenne dans les 30 minutes avant, et entre 10 et 40 minutes après. »`,
  lesson:`<p>Deux sous-requêtes corrélées avec un intervalle de temps autour de chaque commande :</p>
<pre class="code">(SELECT AVG(valeur) FROM capteurs s WHERE s.site = c.site
   AND s.horodatage BETWEEN datetime(c.horodatage, '-30 minutes') AND c.horodatage)</pre>`,
  task:`Pour les commandes du site 'Réservoir Montsouris' le '2028-03-12' de paramètre 'consigne_pression', affiche <code>horodatage</code>, <code>nouvelle</code>, <code>avant</code> et <code>apres</code> (moyennes arrondies à 2 décimales), par horodatage.`,
  solution:`SELECT c.horodatage, c.nouvelle, ROUND((SELECT AVG(valeur) FROM capteurs s WHERE s.site = c.site AND s.horodatage BETWEEN datetime(c.horodatage, '-30 minutes') AND c.horodatage), 2) AS avant, ROUND((SELECT AVG(valeur) FROM capteurs s WHERE s.site = c.site AND s.horodatage BETWEEN datetime(c.horodatage, '+10 minutes') AND datetime(c.horodatage, '+40 minutes')), 2) AS apres FROM commandes_ot c WHERE c.site = 'Réservoir Montsouris' AND date(c.horodatage) = '2028-03-12' AND c.parametre = 'consigne_pression' ORDER BY c.horodatage;`,
  hints:["datetime(c.horodatage, '-30 minutes') et '+10 minutes', '+40 minutes'","Deux sous-requêtes AVG corrélées"], check:{ordered:true}
});
boss({ id:'38.5', ch:38, tail:false, title:'Boss : l\'ordre de sabotage', who:'varga2', timer:600,
  story:`Varga : « Pour chaque commande nocturne qui a <b>baissé</b> une valeur : qui, depuis quelle machine, et où était physiquement le titulaire du compte à ce moment-là. »`,
  lesson:`<p>Trois jointures : la machine source (IP vers postes), le compte (comptes_ad) et un LEFT JOIN sur l'intervalle de déplacement.</p>`,
  task:`Pour les commandes avant 7h ou à partir de 20h avec <code>nouvelle &lt; ancienne</code>, affiche <code>horodatage</code>, <code>parametre</code>, <code>ancienne</code>, <code>nouvelle</code>, <code>login</code>, <code>titulaire</code> (comptes_ad.nom), <code>machine</code> (hostname de source_ip) et <code>lieu</code> (déplacement en cours, sinon NULL), par horodatage.`,
  solution:`SELECT c.horodatage, c.parametre, c.ancienne, c.nouvelle, c.login, ad.nom AS titulaire, p.hostname AS machine, d.lieu FROM commandes_ot c LEFT JOIN comptes_ad ad ON ad.login = c.login LEFT JOIN postes p ON p.ip = c.source_ip LEFT JOIN deplacements d ON d.login = c.login AND c.horodatage BETWEEN d.debut AND d.fin WHERE (CAST(strftime('%H', c.horodatage) AS INTEGER) < 7 OR CAST(strftime('%H', c.horodatage) AS INTEGER) >= 20) AND c.nouvelle < c.ancienne ORDER BY c.horodatage;`,
  hints:["LEFT JOIN postes sur l'IP, LEFT JOIN deplacements sur le login et l'intervalle","nouvelle < ancienne et les heures de nuit"], check:{ordered:true},
  success:`Clément Varenne était à Lyon, dans un salon devant 300 personnes. Sa signature est sur le sabotage, sa main n'y est pas. Septième tête : le sabotage, qui servait aussi de diversion. Pendant que la ville manquait d'eau, toute la police était dans la rue.`
});

/* ============ 39 ============ */
chap({ id:39, season:4, code:'39', title:'La riposte', subtitle:'Créer, alimenter, bloquer, accélérer et automatiser : DDL, DML, index et triggers',
  intro:`<p>Assez regardé. Benali donne l'ordre de riposter : recenser les indicateurs de compromission (IOC), désactiver les comptes volés, accélérer les recherches, et surtout ne plus jamais rater une connexion vers l'Hydre.</p>
<p class="quote">« Un SOC qui ne fait que regarder, c'est un musée. » (Malik Benali)</p>`,
  oracle:`<p>Les triggers existent dans tous les SGBD (<code>CREATE OR REPLACE TRIGGER ... FOR EACH ROW</code> en Oracle, une fonction <code>plpgsql</code> en PostgreSQL). Dans un vrai SOC, la règle de détection vit dans le SIEM, mais le principe est le même : une condition évaluée à chaque nouvel événement, qui crée une alerte.</p>`,
  quiz:[
    {q:"Un trigger AFTER INSERT :", o:["S'exécute une fois par jour","S'exécute automatiquement après chaque insertion dans la table, avec accès à la ligne via NEW","Supprime la ligne","Remplace un index"], a:1, e:"Idéal pour une règle d'alerte en temps réel."},
    {q:"Pourquoi une contrainte UNIQUE sur la valeur d'un IOC ?", o:["Pour aller plus vite uniquement","Pour qu'un même indicateur ne soit pas enregistré deux fois","C'est obligatoire en SQL","Pour chiffrer"], a:1, e:"Plusieurs analystes peuvent trouver le même indicateur."}
  ]});
mis({ id:'39.1', ch:39, title:'La table des IOC', who:'benali',
  story:`« Crée la table <code>ioc</code> : un identifiant, un type (ip, domaine...), une valeur unique, et la source de la découverte. »`,
  lesson:`<pre class="code">CREATE TABLE t (
  id INTEGER PRIMARY KEY,
  a TEXT NOT NULL,
  b TEXT NOT NULL UNIQUE,
  c TEXT
);</pre>`,
  task:`Crée <code>ioc</code> avec <code>id</code> (INTEGER PRIMARY KEY), <code>type</code> (TEXT NOT NULL), <code>valeur</code> (TEXT NOT NULL UNIQUE) et <code>source</code> (TEXT).`,
  solution:`CREATE TABLE ioc (id INTEGER PRIMARY KEY, type TEXT NOT NULL, valeur TEXT NOT NULL UNIQUE, source TEXT);`,
  hints:["valeur TEXT NOT NULL UNIQUE"],
  check:{mode:'dml', verify:["SELECT name, type, \"notnull\", pk FROM pragma_table_info('ioc') ORDER BY cid", "SELECT COUNT(*) FROM pragma_index_list('ioc') WHERE \"unique\" = 1"]}
});
mis({ id:'39.2', ch:39, title:'Alimenter les IOC', who:'benali',
  story:`« Remplis la table avec ce qu'on a trouvé, <b>par requête</b>, pas à la main : les IP à au moins 100 échecs, les domaines balises (cv &lt; 0,05, inconnus, au moins 50 intervalles), et le domaine du tunnel DNS (longueur moyenne des requêtes supérieure à 40). »`,
  lesson:`<p><code>INSERT INTO t (cols) SELECT ...</code> insère le résultat d'une requête. On peut enchaîner plusieurs INSERT ... SELECT.</p>`,
  setup: "CREATE TABLE ioc (id INTEGER PRIMARY KEY, type TEXT NOT NULL, valeur TEXT NOT NULL UNIQUE, source TEXT);",
  task:`Insère dans <code>ioc</code> (type, valeur, source) : ('ip', IP à au moins 100 échecs, 'auth'), ('domaine', domaine balise, 'proxy'), ('domaine', domaine de longueur moyenne &gt; 40, 'dns').`,
  solution:`INSERT INTO ioc (type, valeur, source) SELECT 'ip', source_ip, 'auth' FROM auth_logs WHERE resultat = 'echec' GROUP BY source_ip HAVING COUNT(*) >= 100; INSERT INTO ioc (type, valeur, source) WITH ${BEACON} SELECT DISTINCT 'domaine', domaine, 'proxy' FROM st WHERE sd / m < 0.05 AND domaine NOT IN (SELECT domaine FROM domaines_connus); INSERT INTO ioc (type, valeur, source) SELECT 'domaine', domaine, 'dns' FROM dns_logs GROUP BY domaine HAVING AVG(length(requete)) > 40;`,
  hints:["Trois INSERT INTO ioc (type, valeur, source) SELECT ...","Pour les balises, l'INSERT peut commencer par INSERT INTO ioc (...) WITH ... SELECT"],
  check:{mode:'dml', verify:["SELECT type, valeur, source FROM ioc ORDER BY type, valeur"]}
});
mis({ id:'39.3', ch:39, title:'Couper les accès', who:'benali',
  story:`« Les IOC ont été complétés par l'équipe (l'IP de commande et le domaine du phishing en plus). Désactive (<code>actif = 0</code>) les comptes qui ont réussi une connexion depuis une IP présente dans les IOC, et les comptes admin utilisés depuis le poste de quelqu'un d'autre (35.2). »`,
  lesson:`<p>Un UPDATE avec une condition sur deux sous-requêtes reliées par OR.</p>`,
  setup: IOC_SETUP,
  task:`Passe <code>actif</code> à 0 pour les comptes concernés.`,
  solution:`UPDATE comptes_ad SET actif = 0 WHERE login IN (SELECT login FROM auth_logs WHERE resultat = 'succes' AND source_ip IN (SELECT valeur FROM ioc WHERE type = 'ip')) OR login IN (SELECT a.login FROM auth_logs a JOIN comptes_ad c ON c.login = a.login AND c.admin = 1 JOIN postes p ON p.ip = a.source_ip AND p.type = 'poste' WHERE a.resultat = 'succes' AND p.utilisateur <> a.login);`,
  hints:["WHERE login IN (... IOC ...) OR login IN (... requête de 35.2 ...)"],
  check:{mode:'dml', verify:["SELECT login FROM comptes_ad WHERE actif = 0 ORDER BY login", "SELECT COUNT(*) FROM comptes_ad"]},
  success:`svc_backup et adm.varenne sont coupés. Varenne recevra un nouveau compte à son retour de Lyon, avec des excuses.`
});
mis({ id:'39.4', ch:39, title:'Chercher plus vite', who:'byte',
  story:`« La recherche d'un domaine dans <code>proxy_logs</code> parcourt toute la table. Crée un index sur le domaine et montre le plan d'exécution de la recherche de 'cdn-update-check.net'. »`,
  lesson:`<p>Un index permet à SQLite de « chercher » (SEARCH) au lieu de tout « parcourir » (SCAN). <code>EXPLAIN QUERY PLAN</code> affiche la stratégie choisie.</p>
<pre class="code">CREATE INDEX idx_nom ON table(colonne);
EXPLAIN QUERY PLAN SELECT * FROM table WHERE colonne = '...';</pre>`,
  task:`Crée <code>idx_proxy_domaine</code> sur <code>proxy_logs(domaine)</code>, puis affiche le plan de <code>SELECT * FROM proxy_logs WHERE domaine = 'cdn-update-check.net'</code>.`,
  solution:`CREATE INDEX idx_proxy_domaine ON proxy_logs(domaine); EXPLAIN QUERY PLAN SELECT * FROM proxy_logs WHERE domaine = 'cdn-update-check.net';`,
  hints:["CREATE INDEX idx_proxy_domaine ON proxy_logs(domaine);","EXPLAIN QUERY PLAN SELECT ..."],
  check:{mode:'plan', contains:'USING INDEX idx_proxy_domaine'}
});
boss({ id:'39.5', ch:39, tail:false, title:'Boss : la sentinelle', who:'varga2', timer:720,
  story:`Varga : « Je ne veux plus jamais découvrir une balise après coup. À chaque nouvelle ligne dans <code>proxy_logs</code> vers un domaine ou une IP des IOC, une alerte doit naître toute seule. »`,
  lesson:`<pre class="code">CREATE TRIGGER nom AFTER INSERT ON table
WHEN condition_sur_NEW
BEGIN
  INSERT INTO alertes (...) VALUES (NEW.col1, NEW.col2, ...);
END;</pre>
<p><code>NEW</code> désigne la ligne qui vient d'être insérée. La condition peut contenir des sous-requêtes.</p>`,
  setup: IOC_SETUP,
  task:`Crée <code>alertes</code> (id INTEGER PRIMARY KEY, horodatage TEXT, host TEXT, cible TEXT) et le trigger <code>trg_ioc</code> qui, après chaque insertion dans <code>proxy_logs</code> dont le domaine est un IOC de type 'domaine' <b>ou</b> l'IP de destination un IOC de type 'ip', insère (horodatage, host, cible = domaine) dans <code>alertes</code>.`,
  solution:`CREATE TABLE alertes (id INTEGER PRIMARY KEY, horodatage TEXT, host TEXT, cible TEXT); CREATE TRIGGER trg_ioc AFTER INSERT ON proxy_logs WHEN NEW.domaine IN (SELECT valeur FROM ioc WHERE type = 'domaine') OR NEW.ip_dest IN (SELECT valeur FROM ioc WHERE type = 'ip') BEGIN INSERT INTO alertes (horodatage, host, cible) VALUES (NEW.horodatage, NEW.host, NEW.domaine); END;`,
  hints:["CREATE TABLE alertes (...) puis CREATE TRIGGER trg_ioc AFTER INSERT ON proxy_logs WHEN ... BEGIN ... END;","Condition : NEW.domaine IN (SELECT valeur FROM ioc WHERE type = 'domaine') OR NEW.ip_dest IN (...)"],
  require:[{re:'CREATE\\s+TRIGGER', msg:"Il faut créer un trigger."}],
  check:{mode:'dml', verify:["INSERT INTO proxy_logs (horodatage, host, domaine, ip_dest, octets_out, octets_in) VALUES ('2028-03-15 10:00:00', 'PC-RH-01', 'cdn-update-check.net', '192.0.2.66', 400, 300), ('2028-03-15 10:01:00', 'PC-RH-02', 'meteo-seine.fr', '203.0.113.22', 400, 300), ('2028-03-15 10:02:00', 'PC-URBA-01', 'nouveau-site.net', '192.0.2.150', 10, 10), ('2028-03-15 10:03:00', 'PC-COM-01', 'tunnel-meteo.net', '198.51.100.9', 10, 10); SELECT horodatage, host, cible FROM alertes ORDER BY horodatage"]},
  success:`Test grandeur nature : trois connexions suspectes sur quatre déclenchent une alerte, la connexion normale passe. La sentinelle veille. Il reste à trouver le corps de l'Hydre.`
});

/* ============ 40 ============ */
chap({ id:40, season:4, code:'40', title:'L\'Hydre', subtitle:'Chronologie complète, alibi au jour près, attribution de l\'infrastructure',
  intro:`<p>Sept têtes : la pulvérisation, le phishing, la persistance, le saut vers le contrôleur de domaine, la balise, le tunnel DNS, le sabotage. Un seul corps les commande.</p>
<p>Benali pose la question qui reste : « À qui appartiennent les adresses IP de l'attaquant ? » Table <code>lignes_internet</code> : l'abonné (SIREN) et l'adresse d'installation de chaque ligne connue.</p>`,
  oracle:`<p>L'attribution d'une attaque est le travail le plus délicat d'un analyste : on ne conclut jamais sur un seul indice. On assemble des faits reproductibles, chacun prouvé par une requête que la défense peut relancer.</p>`,
  quiz:[
    {q:"Pourquoi construire une chronologie (timeline) unique ?", o:["Pour faire joli","Pour voir l'enchaînement des étapes et repérer les liens de cause à effet entre sources différentes","Pour économiser de la place","Ce n'est pas utile"], a:1, e:"C'est le livrable central de toute réponse à incident."}
  ]});
mis({ id:'40.1', ch:40, title:'La chronologie', who:'benali',
  story:`« Une frise, une ligne par tête : la première occurrence de chaque étape. »`,
  lesson:`<p>Un UNION ALL de sept petites requêtes MIN, chacune avec ses deux colonnes texte, puis un tri global.</p>`,
  task:`Affiche <code>quand</code> et <code>etape</code>, par <code>quand</code>, avec : 'pulvérisation' (premier échec de 192.0.2.150), 'phishing' (premier mail de 'factures@eaux-de-seine-fr.com'), 'macro' (premier process dont la ligne contient '-enc'), 'balise' (première connexion vers 'cdn-update-check.net'), 'contrôleur de domaine' (premier succès vers 'DC01' de 'adm.varenne'), 'exfiltration' (première requête vers 'tunnel-meteo.net'), 'sabotage' (première commande de 'adm.varenne').`,
  solution:`SELECT MIN(horodatage) AS quand, 'pulvérisation' AS etape FROM auth_logs WHERE source_ip = '192.0.2.150' AND resultat = 'echec' UNION ALL SELECT MIN(horodatage), 'phishing' FROM mail_logs WHERE expediteur = 'factures@eaux-de-seine-fr.com' UNION ALL SELECT MIN(horodatage), 'macro' FROM process_logs WHERE ligne_commande LIKE '%-enc%' UNION ALL SELECT MIN(horodatage), 'balise' FROM proxy_logs WHERE domaine = 'cdn-update-check.net' UNION ALL SELECT MIN(horodatage), 'contrôleur de domaine' FROM auth_logs WHERE login = 'adm.varenne' AND dest_host = 'DC01' AND resultat = 'succes' UNION ALL SELECT MIN(horodatage), 'exfiltration' FROM dns_logs WHERE domaine = 'tunnel-meteo.net' UNION ALL SELECT MIN(horodatage), 'sabotage' FROM commandes_ot WHERE login = 'adm.varenne' ORDER BY quand;`,
  hints:["Sept SELECT MIN(horodatage), 'texte' reliés par UNION ALL","Un seul ORDER BY quand à la fin"], require:[{re:'UNION\\s+ALL', msg:"Empile les étapes avec UNION ALL."}], check:{ordered:true}
});
mis({ id:'40.2', ch:40, title:'L\'alibi au jour près', who:'varga',
  story:`Varga : « Pour la défense de Varenne, je veux un calendrier du 1er au 14 mars : chaque jour, ses connexions sur le réseau interne, et son lieu. Les jours sans connexion doivent apparaître avec 0. »`,
  lesson:`<p>Pour avoir <b>tous</b> les jours, même vides, on génère un calendrier avec une CTE récursive, puis LEFT JOIN :</p>
<pre class="code">WITH RECURSIVE j(d) AS (SELECT '2028-03-01'
  UNION ALL SELECT date(d, '+1 day') FROM j WHERE d &lt; '2028-03-14')</pre>
<p><code>COALESCE(x, 'défaut')</code> remplace un NULL.</p>`,
  task:`Pour 'adm.varenne', affiche <code>jour</code> (du '2028-03-01' au '2028-03-14'), <code>connexions</code> (succès hors 'vpn' ce jour-là, 0 si aucun) et <code>lieu</code> (déplacement couvrant ce jour à midi, sinon 'Paris'), par jour.`,
  solution:`WITH RECURSIVE j(d) AS (SELECT '2028-03-01' UNION ALL SELECT date(d, '+1 day') FROM j WHERE d < '2028-03-14') SELECT j.d AS jour, (SELECT COUNT(*) FROM auth_logs a WHERE a.login = 'adm.varenne' AND a.resultat = 'succes' AND a.methode <> 'vpn' AND date(a.horodatage) = j.d) AS connexions, COALESCE((SELECT lieu FROM deplacements dp WHERE dp.login = 'adm.varenne' AND j.d || ' 12:00:00' BETWEEN dp.debut AND dp.fin), 'Paris') AS lieu FROM j ORDER BY jour;`,
  hints:["CTE récursive des jours","Sous-requêtes corrélées pour connexions et lieu, COALESCE(..., 'Paris')"], require:[{re:'RECURSIVE', msg:"Génère le calendrier avec une CTE récursive."}], check:{ordered:true}
});
mis({ id:'40.3', ch:40, title:'Les lignes de l\'attaquant', who:'benali',
  story:`« Les IP externes de l'attaquant : celle de la pulvérisation et celle du serveur de commande. Qui est abonné à ces lignes ? »`,
  lesson:`<p>Révision des jointures : <code>lignes_internet.abonne_siren</code> renvoie à <code>societes.siren</code>.</p>`,
  task:`Pour les IP '192.0.2.150' et '192.0.2.66', affiche <code>ip</code>, <code>abonne</code> (nom de la société), <code>creation</code> (date de création) et <code>adresse</code>.`,
  solution:`SELECT l.ip, s.nom AS abonne, s.creation, l.adresse FROM lignes_internet l JOIN societes s ON s.siren = l.abonne_siren WHERE l.ip IN ('192.0.2.150', '192.0.2.66');`,
  hints:["JOIN societes s ON s.siren = l.abonne_siren"]
});
boss({ id:'40.4', ch:40, tail:false, title:'Boss : le corps de l\'Hydre', xp:400, timer:1200, who:'varga2',
  story:`Varga : « Une seule requête, sans aucune IP recopiée : retrouve toi-même les IP de la pulvérisation (au moins 100 échecs) et des balises (cv &lt; 0,05, au moins 50 intervalles, domaine inconnu), puis donne pour chacune son rôle, l'abonné, sa date de création et l'adresse de la ligne. »`,
  lesson:`<p>Deux CTE de détection, un UNION qui leur donne un rôle, puis les jointures vers lignes_internet et societes. Aucune valeur trouvée dans les épisodes précédents ne doit être recopiée.</p>`,
  task:`Affiche <code>ip</code>, <code>role</code> ('pulvérisation' ou 'commande'), <code>abonne</code>, <code>creation</code> et <code>adresse</code>, par rôle.`,
  solution:`WITH ${SPRAY}, ${BEACON}, ips AS (SELECT source_ip AS ip, 'pulvérisation' AS role FROM spray UNION SELECT DISTINCT ip_dest, 'commande' FROM st WHERE sd / m < 0.05 AND domaine NOT IN (SELECT domaine FROM domaines_connus)) SELECT i.ip, i.role, s.nom AS abonne, s.creation, l.adresse FROM ips i JOIN lignes_internet l ON l.ip = i.ip JOIN societes s ON s.siren = l.abonne_siren ORDER BY i.role;`,
  hints:["CTE spray (32.3) et détection de balises (36.4)","UNION des deux avec un rôle, puis jointures"],
  require:[{re:'LAG', msg:"Retrouve les balises avec LAG."},{re:'^(?![\\s\\S]*(192\\.0\\.2|update|Labyrinthe|5120|3000))', msg:"Ne recopie aucune IP, aucun domaine ni aucune société : la requête doit les retrouver seule."}],
  success:`Les deux lignes appartiennent à <b>Labyrinthe Énergie</b>, une société créée le 2 février, installée dans « un local technique, voie de service, Paris 12e ». Il n'y a pas de bureau à cette adresse. Il n'y a qu'un tunnel.`
});
mis({ id:'40.5', ch:40, xp:300, title:'Le nom du corps', who:'varga',
  story:`Benali referme son ordinateur. « On a coupé toutes les têtes. Le corps, lui, s'appelle comment ? » Le message exfiltré parlait d'un destinataire, MINOTAURE. Les lignes internet, elles, ont un abonné. Inscris-le au procès-verbal.`,
  lesson:`<p>Récapitulatif de la Saison 4 : authentification (32), phishing (33), processus et arbre (34), mouvement latéral (35), balise (36), exfiltration DNS (37), données industrielles (38), riposte en DDL, DML, index et trigger (39), attribution (40).</p>`,
  setup: "CREATE TABLE proces_verbal (affaire TEXT NOT NULL, coupable TEXT NOT NULL, preuve TEXT);",
  task:`Insère dans <code>proces_verbal</code> une ligne : affaire 'Hydre', coupable = nom de la société abonnée à la ligne de l'IP qui a au moins 100 échecs d'authentification, preuve 'lignes de l\'attaquant'. Avec un <code>INSERT ... SELECT</code>.`,
  solution:`INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT 'Hydre', s.nom, 'lignes de l''attaquant' FROM societes s JOIN lignes_internet l ON l.abonne_siren = s.siren WHERE l.ip IN (SELECT source_ip FROM auth_logs WHERE resultat = 'echec' GROUP BY source_ip HAVING COUNT(*) >= 100);`,
  hints:["JOIN lignes_internet l ON l.abonne_siren = s.siren","WHERE l.ip IN (SELECT source_ip FROM auth_logs ... HAVING COUNT(*) >= 100)"],
  require:[{re:'auth_logs', msg:"Pars des données : ta requête doit utiliser la table auth_logs."},{re:'INSERT', msg:"Écris le procès-verbal avec un INSERT."},{re:'SELECT', msg:"Le nom doit venir d'une requête (INSERT ... SELECT), pas être tapé à la main."},{re:'^(?![\\s\\S]*(Labyrinthe|192\\.0\\.2|5120|3000|Lab%))', msg:"Ne tape pas le nom, l'IP ni le SIREN : la requête doit les retrouver."}],
  check:{mode:'dml', verify:["SELECT affaire, coupable FROM proces_verbal"]},
  success:`Opération Hydre : terminée. La ville a retrouvé l'eau, Varenne son honneur, et le SOC un trigger qui ne dort jamais. Mais Labyrinthe Énergie paie aussi une facture d'électricité. Quelque part sous Paris, quelque chose consomme beaucoup.`
});
