// SAISON 2 : OPÉRATION ÉCLIPSE (épisodes 14 à 22)
MISSIONS.find(m => m.id === '13.1').boss = true;
MISSIONS.find(m => m.id === '13.1').timer = 900;
const C2 = '198.51.100.200';

/* ============ 14 ============ */
chap({ id:14, season:2, code:'14', title:'Le réveil', subtitle:'Agrégation conditionnelle, tableaux croisés, révisions',
  intro:`<p>Mai 2027, six mois après Minuit. Mercredi 12, 6h02 : le réseau de transport <b>TransSeine</b> s'arrête net. Écrans noirs, rames bloquées, un message sur tous les terminaux : <i>« ÉCLIPSE. Payez, ou la ville reste dans le noir. »</i></p>
<p>Varga rappelle toute la Brigade Data. Pour aider, elle a recruté un consultant qui connaît bien les attaques : <b>Farid Ouali</b>, l'ancien DSI d'Hélios, qui a monté sa société, Ouali Conseil.</p>
<p class="quote">« Le Cercle est tombé. Mais quelqu'un a repris le flambeau, et en plus gros. » (Inès Varga)</p>`,
  oracle:`<p>Oracle propose <code>PIVOT</code> pour transformer des lignes en colonnes : <code>SELECT * FROM (...) PIVOT (COUNT(*) FOR type IN ('Panne' AS pannes, 'Cyber' AS cyber))</code>. SQL Server aussi. La technique <code>SUM(CASE WHEN ...)</code> de cet épisode marche, elle, sur tous les moteurs.</p>`,
  quiz:[
    {q:"Que calcule <code>SUM(CASE WHEN type = 'Cyber' THEN 1 ELSE 0 END)</code> ?", o:["La somme des types","Le nombre de lignes de type Cyber","Le nombre de types différents","Une erreur"], a:1, e:"Chaque ligne Cyber vaut 1, les autres 0 : la somme compte les lignes Cyber. C'est l'agrégation conditionnelle."},
    {q:"Un « tableau croisé » (pivot) sert à :", o:["Joindre deux tables","Transformer des valeurs de lignes en colonnes","Trier","Supprimer des doublons"], a:1, e:"Par exemple une colonne par type d'incident, une ligne par ligne de métro."},
    {q:"<code>COUNT(DISTINCT ligne)</code> dans un GROUP BY station donne :", o:["Le nombre d'incidents","Le nombre de lignes différentes touchées par station","Le nombre de stations","Toujours 1"], a:1, e:"COUNT(DISTINCT x) compte les valeurs différentes dans chaque groupe."}
  ]});
mis({ id:'14.1', ch:14, title:'La carte des pannes', who:'varga2',
  story:`Table <code>incidents</code> (ligne, station, type, debut, fin). « Commençons simple : combien d'incidents par ligne depuis avril ? La plus touchée en premier. »`,
  lesson:`<p>Révision : GROUP BY, COUNT, ORDER BY. Les grandes enquêtes commencent toujours par une vue d'ensemble.</p>
<pre class="code">SELECT colonne, COUNT(*) AS nb
FROM table
GROUP BY colonne
ORDER BY nb DESC;</pre>`,
  task:`Affiche <code>ligne</code> et <code>nb</code> (nombre d'incidents), triés par <code>nb</code> décroissant.`,
  solution:`SELECT ligne, COUNT(*) AS nb FROM incidents GROUP BY ligne ORDER BY nb DESC;`,
  hints:["GROUP BY ligne ORDER BY nb DESC"], check:{ordered:true, orderKeys:[1]}
});
mis({ id:'14.2', ch:14, title:'Le tableau croisé', who:'byte',
  story:`Byte : « Une ligne par ligne du réseau, une colonne par type d'incident. Comme un tableau Excel, mais en SQL. »`,
  lesson:`<p>L'<b>agrégation conditionnelle</b> : un CASE à l'intérieur d'un SUM. Chaque colonne compte un seul type.</p>
<pre class="code">SELECT ville,
  SUM(CASE WHEN sexe = 'H' THEN 1 ELSE 0 END) AS hommes,
  SUM(CASE WHEN sexe = 'F' THEN 1 ELSE 0 END) AS femmes
FROM suspects
GROUP BY ville;</pre>
<p>SQLite accepte aussi <code>SUM(sexe = 'H')</code>, car une comparaison vaut 1 ou 0, mais la version CASE marche partout.</p>`,
  task:`Affiche <code>ligne</code>, <code>pannes</code> (type 'Panne'), <code>signalisation</code> (type 'Signalisation'), <code>cyber</code> (type 'Cyber') et <code>total</code>, une ligne par ligne du réseau (métros et trams).`,
  solution:`SELECT ligne, SUM(CASE WHEN type = 'Panne' THEN 1 ELSE 0 END) AS pannes, SUM(CASE WHEN type = 'Signalisation' THEN 1 ELSE 0 END) AS signalisation, SUM(CASE WHEN type = 'Cyber' THEN 1 ELSE 0 END) AS cyber, COUNT(*) AS total FROM incidents GROUP BY ligne;`,
  hints:["SUM(CASE WHEN type = 'Panne' THEN 1 ELSE 0 END) AS pannes","Une colonne par type, plus COUNT(*) AS total."],
  require:[{re:'CASE', msg:"Utilise SUM(CASE WHEN ...)."}], check:{strictCols:true}
});
mis({ id:'14.3', ch:14, title:'Combien de temps ?', who:'ouali',
  story:`Farid Ouali, nouveau consultant de la brigade, se penche par-dessus ton épaule : « Les incidents cyber durent beaucoup plus longtemps que les pannes. Vérifiez la durée moyenne par type, vous verrez. »`,
  lesson:`<p>Révision des dates : l'écart entre deux horodatages en minutes, puis une moyenne.</p>
<pre class="code">(julianday(fin) - julianday(debut)) * 1440   -- minutes</pre>`,
  task:`Affiche <code>type</code>, <code>nb</code> et <code>duree_moy</code> (durée moyenne en minutes, arrondie à l'entier), triés par <code>duree_moy</code> décroissante.`,
  solution:`SELECT type, COUNT(*) AS nb, ROUND(AVG((julianday(fin) - julianday(debut)) * 1440)) AS duree_moy FROM incidents GROUP BY type ORDER BY duree_moy DESC;`,
  hints:["ROUND(AVG((julianday(fin) - julianday(debut)) * 1440))"], check:{ordered:true, orderKeys:[2]}
});
mis({ id:'14.4', ch:14, title:'La vague', who:'byte',
  story:`« Le 12 mai, entre 6h00 et 7h00, les incidents <b>Cyber</b> se sont propagés station par station. Dans quel ordre ? »`,
  lesson:`<p>Un MIN par groupe donne la <b>première</b> occurrence. Trié, ça devient une chronologie de propagation.</p>`,
  task:`Pour les incidents de type 'Cyber' dont <code>debut</code> est entre <code>'2027-05-12 06:00:00'</code> et <code>'2027-05-12 07:00:00'</code>, affiche <code>station</code> et <code>premiere_alerte</code> (MIN debut), triés par <code>premiere_alerte</code>.`,
  solution:`SELECT station, MIN(debut) AS premiere_alerte FROM incidents WHERE type = 'Cyber' AND debut BETWEEN '2027-05-12 06:00:00' AND '2027-05-12 07:00:00' GROUP BY station ORDER BY premiere_alerte;`,
  hints:["GROUP BY station, MIN(debut)"], check:{ordered:true}
});
boss({ id:'14.5', ch:14, tail:false, title:'Boss : les nœuds du réseau', who:'varga2', timer:480,
  story:`Varga : « Les attaquants ont visé les <b>stations de correspondance</b>. Je veux celles où l'attaque Cyber du 12 mai (6h-7h) a touché <b>au moins deux lignes différentes</b>, avec le nombre de lignes et l'heure de la première alerte. Chrono. »`,
  lesson:`<p>Combine WHERE, GROUP BY, COUNT(DISTINCT ...) et HAVING.</p>`,
  task:`Affiche <code>station</code>, <code>nb_lignes</code> et <code>premiere_alerte</code> pour les stations touchées sur au moins 2 lignes, triées par <code>nb_lignes</code> décroissant puis <code>premiere_alerte</code>.`,
  solution:`SELECT station, COUNT(DISTINCT ligne) AS nb_lignes, MIN(debut) AS premiere_alerte FROM incidents WHERE type = 'Cyber' AND debut BETWEEN '2027-05-12 06:00:00' AND '2027-05-12 07:00:00' GROUP BY station HAVING COUNT(DISTINCT ligne) >= 2 ORDER BY nb_lignes DESC, premiere_alerte;`,
  hints:["COUNT(DISTINCT ligne) AS nb_lignes","HAVING COUNT(DISTINCT ligne) >= 2"], check:{ordered:true},
  success:`Châtelet-Seine d'abord, quatre lignes d'un coup. « Ils connaissent le réseau par cœur », souffle Byte. Ouali ne dit rien.`
});

/* ============ 15 ============ */
chap({ id:15, season:2, code:'15', title:'Le disque dur', subtitle:'JSON : json_extract, json_each',
  intro:`<p>Depuis sa cellule, Solène Marchetti refuse de parler. Mais son ordinateur portable, saisi en novembre, vient enfin d'être déchiffré. Son contenu a été exporté en <b>JSON</b> dans la table <code>saisies</code> (id, appareil, contenu).</p>
<p class="quote">« Du JSON dans une base SQL ? C'est la vraie vie, ça. Les données arrivent rarement bien rangées. » (Byte)</p>`,
  oracle:`<p>Chaque moteur a ses fonctions JSON : Oracle utilise <code>JSON_VALUE(contenu, '$.type')</code> et <code>JSON_TABLE</code>, PostgreSQL <code>contenu-&gt;&gt;'type'</code> et <code>jsonb_array_elements</code>, MySQL <code>JSON_EXTRACT</code>. Les chemins <code>$.a.b[0]</code> sont communs à SQLite, MySQL et Oracle.</p>`,
  quiz:[
    {q:"Que renvoie <code>json_extract('{\"a\":{\"b\":5}}', '$.a.b')</code> ?", o:["{\"b\":5}","5","a.b","NULL"], a:1, e:"Le chemin $.a.b descend dans l'objet a, puis prend b."},
    {q:"À quoi sert <code>json_each</code> ?", o:["À valider du JSON","À transformer un tableau JSON en lignes","À trier du JSON","À compresser"], a:1, e:"C'est une table-fonction : un élément du tableau par ligne, avec la colonne value."},
    {q:"Stocker tout en JSON dans une seule colonne :", o:["Est toujours la meilleure solution","Est pratique pour des données variées, mais moins contrôlable que des colonnes typées","Est interdit en SQL","Accélère toutes les requêtes"], a:1, e:"Pas de contrainte, pas de type, index plus difficiles : le JSON est un compromis."}
  ]});
mis({ id:'15.1', ch:15, title:'Ouvrir le disque', who:'byte',
  story:`« Chaque ligne de <code>saisies</code> contient un objet JSON, par exemple <code>{"type":"message","date":"...","de":"solene","a":["vasseur"],"texte":"..."}</code>. Commence par en extraire le type et la date. »`,
  lesson:`<p><code>json_extract(colonne, chemin)</code> lit une valeur dans un texte JSON. Le chemin commence par <code>$</code> (la racine), puis <code>.cle</code> pour descendre, <code>[0]</code> pour un élément de tableau.</p>
<pre class="code">SELECT json_extract('{"nom":"Byte","age":28}', '$.nom');
-- Byte</pre>`,
  task:`Affiche <code>id</code>, <code>type</code> (valeur de <code>$.type</code>) et <code>date</code> (valeur de <code>$.date</code>) de toutes les saisies, triées par <code>date</code>.`,
  solution:`SELECT id, json_extract(contenu, '$.type') AS type, json_extract(contenu, '$.date') AS date FROM saisies ORDER BY date;`,
  hints:["json_extract(contenu, '$.type') AS type"], require:[{re:'json_extract', msg:"Utilise json_extract."}], check:{ordered:true, orderKeys:[2]}
});
mis({ id:'15.2', ch:15, title:'Les messages de Solène', who:'byte',
  story:`« Filtrons : seulement les <b>messages</b> envoyés <b>par Solène</b> (<code>$.de = 'solene'</code>). À qui écrivait-elle ? »`,
  lesson:`<p>json_extract s'utilise aussi dans le WHERE. Si la valeur est un tableau, json_extract le renvoie sous forme de texte JSON : <code>["vasseur","lefort"]</code>.</p>`,
  task:`Affiche <code>date</code>, <code>destinataires</code> (<code>$.a</code>) et <code>texte</code> des messages dont <code>$.type</code> vaut 'message' et <code>$.de</code> vaut 'solene', triés par date.`,
  solution:`SELECT json_extract(contenu, '$.date') AS date, json_extract(contenu, '$.a') AS destinataires, json_extract(contenu, '$.texte') AS texte FROM saisies WHERE json_extract(contenu, '$.type') = 'message' AND json_extract(contenu, '$.de') = 'solene' ORDER BY date;`,
  hints:["Deux conditions json_extract dans le WHERE."], check:{ordered:true}
});
mis({ id:'15.3', ch:15, title:'Tous ses contacts', who:'byte',
  story:`« Le champ <code>a</code> est un tableau. Je veux la liste de <b>tous</b> les destinataires distincts des messages, un par ligne. »`,
  lesson:`<p><code>json_each(json, chemin)</code> est une <b>table-fonction</b> : elle produit une ligne par élément du tableau, dans la colonne <code>value</code>. On la place dans le FROM, à côté de la table :</p>
<pre class="code">SELECT s.id, j.value
FROM saisies s, json_each(s.contenu, '$.a') j;</pre>
<p>La virgule entre deux sources du FROM équivaut à un CROSS JOIN ; ici json_each peut lire <code>s.contenu</code> car elle est évaluée pour chaque ligne de <code>s</code>.</p>`,
  task:`Affiche <code>destinataire</code> (distinct) et <code>nb</code> (nombre de messages reçus) pour tous les destinataires des messages, triés par <code>nb</code> décroissant.`,
  solution:`SELECT j.value AS destinataire, COUNT(*) AS nb FROM saisies s, json_each(s.contenu, '$.a') j WHERE json_extract(s.contenu, '$.type') = 'message' GROUP BY j.value ORDER BY nb DESC;`,
  hints:["FROM saisies s, json_each(s.contenu, '$.a') j","GROUP BY j.value"], require:[{re:'json_each', msg:"Utilise json_each."}], check:{ordered:true, orderKeys:[1]},
  success:`Parmi les contacts habituels (avocat, coiffeur, sœur), un nom qui n'a rien à faire là : <b>cartographe</b>.`
});
mis({ id:'15.4', ch:15, title:'Le Cartographe', who:'varga',
  story:`Varga : « Qui est ce Cartographe ? Sors-moi <b>tous</b> les messages où il apparaît, comme expéditeur ou destinataire. »`,
  lesson:`<p>Pour tester si un tableau JSON contient une valeur : <code>EXISTS (SELECT 1 FROM json_each(contenu, '$.a') WHERE value = 'x')</code>. Plus simple mais moins rigoureux : <code>json_extract(contenu, '$.a') LIKE '%x%'</code>.</p>`,
  task:`Affiche <code>date</code>, <code>de</code> et <code>texte</code> des messages dont l'expéditeur est 'cartographe' ou dont le tableau <code>a</code> contient 'cartographe', triés par date.`,
  solution:`SELECT json_extract(contenu, '$.date') AS date, json_extract(contenu, '$.de') AS de, json_extract(contenu, '$.texte') AS texte FROM saisies WHERE json_extract(contenu, '$.type') = 'message' AND (json_extract(contenu, '$.de') = 'cartographe' OR EXISTS (SELECT 1 FROM json_each(saisies.contenu, '$.a') WHERE value = 'cartographe')) ORDER BY date;`,
  hints:["(de = 'cartographe' OR EXISTS (SELECT 1 FROM json_each(saisies.contenu, '$.a') WHERE value = 'cartographe'))"], check:{ordered:true},
  success:`« Ton plan pour Hélios est parfait. Tu connais leur système mieux que personne. » Et : « Projet Éclipse : le matériel arrive à Marseille, quai 4, conteneur <b>MSCU-449120</b>. » Le Cartographe a conçu le braquage de Minuit.`
});
boss({ id:'15.5', ch:15, tail:false, title:'Boss : le portefeuille', who:'byte', timer:480,
  story:`« Solène payait le Cartographe. Les saisies de type <b>paiement</b> contiennent <code>$.wallet</code> et <code>$.montant</code>. Quel portefeuille a reçu le plus d'argent ? »`,
  lesson:`<p>json_extract dans un GROUP BY et dans un SUM : tout ce qui marche sur une colonne marche sur une valeur JSON.</p>`,
  task:`Affiche <code>wallet</code>, <code>nb</code> et <code>total</code> (somme des montants) par portefeuille pour les saisies de type 'paiement', triés par <code>total</code> décroissant.`,
  solution:`SELECT json_extract(contenu, '$.wallet') AS wallet, COUNT(*) AS nb, SUM(json_extract(contenu, '$.montant')) AS total FROM saisies WHERE json_extract(contenu, '$.type') = 'paiement' GROUP BY wallet ORDER BY total DESC;`,
  hints:["GROUP BY json_extract(contenu, '$.wallet')"], check:{ordered:true},
  success:`225 000 € vers <b>bc1q-eclipse-7f3a</b>. Le même portefeuille que celui de la rançon TransSeine. Minuit et Éclipse ont le même cerveau.`
});

/* ============ 16 ============ */
chap({ id:16, season:2, code:'16', title:'Le port', subtitle:'Fenêtres avancées : LEAD, FIRST_VALUE, moyennes glissantes, gaps and islands',
  intro:`<p>Marseille, port de commerce. La capitaine <b>Yasmine Haddad</b> attend la brigade sur le quai 4, sous un vent à décorner les grues. La table <code>mouvements_port</code> retrace chaque scan de conteneur : déchargement, contrôle, stockage, sortie.</p>
<p class="quote">« Un conteneur, ça ne disparaît pas. Sauf quand quelqu'un le veut très fort. » (Yasmine Haddad)</p>`,
  oracle:`<p>Les fenêtres sont standard depuis SQL:2003, et <code>LEAD</code>, <code>LAG</code>, <code>FIRST_VALUE</code>, <code>LAST_VALUE</code> depuis SQL:2011. Elles fonctionnent à l'identique sous Oracle, PostgreSQL et SQL Server. Oracle ajoute <code>MATCH_RECOGNIZE</code>, très puissant pour les « gaps and islands ».</p>`,
  quiz:[
    {q:"Avec <code>LAST_VALUE(x) OVER (ORDER BY d)</code> sans clause ROWS, on obtient souvent :", o:["La vraie dernière valeur","La valeur de la ligne courante","NULL","Une erreur"], a:1, e:"Par défaut la fenêtre s'arrête à la ligne courante. Il faut ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING."},
    {q:"La technique « gaps and islands » repère :", o:["Les doublons","Les suites consécutives et les trous dans une séquence","Les NULL","Les index manquants"], a:1, e:"Astuce classique : valeur moins ROW_NUMBER() reste constante à l'intérieur d'une suite consécutive."},
    {q:"<code>ROWS BETWEEN 6 PRECEDING AND CURRENT ROW</code> couvre :", o:["6 lignes","7 lignes (les 6 précédentes et la courante)","Toute la table","5 lignes"], a:1, e:"D'où la moyenne glissante sur 7 jours."}
  ]});
mis({ id:'16.1', ch:16, title:'La vie du conteneur', who:'haddad',
  story:`Haddad : « Voici l'historique du <b>MSCU-449120</b>. Pour chaque scan, je veux aussi le scan <b>suivant</b> et le temps écoulé, en heures. »`,
  lesson:`<p><code>LEAD(col)</code> lit la ligne <b>suivante</b> (LAG lit la précédente). Avec PARTITION BY, on reste à l'intérieur d'un même conteneur.</p>
<pre class="code">LEAD(horodatage) OVER (PARTITION BY conteneur ORDER BY horodatage)</pre>`,
  task:`Pour le conteneur 'MSCU-449120', affiche <code>evenement</code>, <code>horodatage</code>, <code>suivant</code> (horodatage du scan suivant) et <code>heures</code> (écart arrondi à 1 décimale), triés par horodatage.`,
  solution:`SELECT evenement, horodatage, LEAD(horodatage) OVER (ORDER BY horodatage) AS suivant, ROUND((julianday(LEAD(horodatage) OVER (ORDER BY horodatage)) - julianday(horodatage)) * 24, 1) AS heures FROM mouvements_port WHERE conteneur = 'MSCU-449120' ORDER BY horodatage;`,
  hints:["LEAD(horodatage) OVER (ORDER BY horodatage)","* 24 pour des heures"], require:[{re:'LEAD', msg:"Utilise LEAD()."}], check:{ordered:true}
});
mis({ id:'16.2', ch:16, title:'Le trou', who:'haddad',
  story:`« Un conteneur en stockage est scanné au moins une fois par jour. Trouve tous les conteneurs qui ont passé <b>plus de 48 heures sans aucun scan</b> (hors inventaires). »`,
  lesson:`<p>Calcule l'écart avec LAG dans une CTE, puis filtre dessus dans la requête externe : on ne peut pas mettre une fenêtre dans le WHERE.</p>`,
  task:`En ignorant les événements 'Inventaire', affiche <code>conteneur</code>, <code>precedent</code>, <code>horodatage</code> et <code>heures</code> (écart arrondi à 1 décimale) pour les écarts de plus de 48 h.`,
  solution:`WITH g AS (SELECT conteneur, horodatage, LAG(horodatage) OVER (PARTITION BY conteneur ORDER BY horodatage) AS precedent FROM mouvements_port WHERE evenement <> 'Inventaire') SELECT conteneur, precedent, horodatage, ROUND((julianday(horodatage) - julianday(precedent)) * 24, 1) AS heures FROM g WHERE (julianday(horodatage) - julianday(precedent)) * 24 > 48;`,
  hints:["CTE avec LAG(...) OVER (PARTITION BY conteneur ORDER BY horodatage)","Filtre dans la requête externe."],
  success:`Un seul : <b>MSCU-449120</b>, invisible du 30 avril au 4 mai. Quatre jours pendant lesquels « le matériel » a pu être sorti et remplacé.`
});
mis({ id:'16.3', ch:16, title:'Premier et dernier quai', who:'haddad',
  story:`« Les conteneurs du <b>Stella Maris</b> ont bougé de quai. Pour chacun, le premier et le dernier quai connus, sur la même ligne. »`,
  lesson:`<p><code>FIRST_VALUE</code> et <code>LAST_VALUE</code> donnent la première et la dernière valeur de la fenêtre. Piège : pour LAST_VALUE, il faut élargir la fenêtre à toute la partition :</p>
<pre class="code">LAST_VALUE(quai) OVER (PARTITION BY conteneur ORDER BY horodatage
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)</pre>`,
  task:`Pour les mouvements du navire 'Stella Maris' (hors 'Inventaire'), affiche une ligne par conteneur avec <code>conteneur</code>, <code>premier_quai</code> et <code>dernier_quai</code> (DISTINCT).`,
  solution:`SELECT DISTINCT conteneur, FIRST_VALUE(quai) OVER (PARTITION BY conteneur ORDER BY horodatage) AS premier_quai, LAST_VALUE(quai) OVER (PARTITION BY conteneur ORDER BY horodatage ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS dernier_quai FROM mouvements_port WHERE navire = 'Stella Maris' AND evenement <> 'Inventaire';`,
  hints:["FIRST_VALUE(quai) OVER (PARTITION BY conteneur ORDER BY horodatage)","LAST_VALUE avec ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING"], require:[{re:'FIRST_VALUE', msg:"Utilise FIRST_VALUE()."}]
});
mis({ id:'16.4', ch:16, title:'La moyenne glissante', who:'byte',
  story:`« Activité du quai 4, jour par jour, avec une moyenne glissante sur 7 jours. Si quelqu'un a travaillé en douce la nuit du 30 avril, ça se verra. »`,
  lesson:`<p>Une moyenne glissante : un AVG sur une fenêtre de lignes. D'abord une CTE qui compte par jour, puis la fenêtre.</p>
<pre class="code">AVG(n) OVER (ORDER BY jour ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)</pre>`,
  task:`Pour le quai 4, affiche <code>jour</code> (date(horodatage)), <code>scans</code> (nombre de mouvements ce jour-là) et <code>moy7</code> (moyenne glissante sur 7 jours, arrondie à 2 décimales), par jour croissant.`,
  solution:`WITH j AS (SELECT date(horodatage) AS jour, COUNT(*) AS scans FROM mouvements_port WHERE quai = 4 GROUP BY date(horodatage)) SELECT jour, scans, ROUND(AVG(scans) OVER (ORDER BY jour ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS moy7 FROM j ORDER BY jour;`,
  hints:["WITH j AS (SELECT date(horodatage) AS jour, COUNT(*) AS scans ... GROUP BY ...)","ROWS BETWEEN 6 PRECEDING AND CURRENT ROW"], check:{ordered:true}
});
boss({ id:'16.5', ch:16, tail:false, title:'Boss : les îles', who:'haddad', timer:600,
  story:`Haddad : « La juge veut les <b>périodes</b> pendant lesquelles le MSCU-449120 a été scanné jour après jour, sans interruption. Début, fin, nombre de jours. » Byte sourit : « Gaps and islands. Le classique des entretiens d'embauche. »`,
  lesson:`<p>L'astuce : pour des jours consécutifs, <code>jour - numéro de ligne</code> reste constant. On groupe sur cette différence.</p>
<pre class="code">WITH j AS (SELECT DISTINCT date(horodatage) AS jour FROM ...),
n AS (SELECT jour, julianday(jour) - ROW_NUMBER() OVER (ORDER BY jour) AS ile FROM j)
SELECT MIN(jour), MAX(jour), COUNT(*) FROM n GROUP BY ile;</pre>`,
  task:`Pour 'MSCU-449120', affiche <code>debut</code>, <code>fin</code> et <code>nb_jours</code> de chaque période de jours consécutifs avec au moins un scan, triées par <code>debut</code>.`,
  solution:`WITH j AS (SELECT DISTINCT date(horodatage) AS jour FROM mouvements_port WHERE conteneur = 'MSCU-449120'), n AS (SELECT jour, julianday(jour) - ROW_NUMBER() OVER (ORDER BY jour) AS ile FROM j) SELECT MIN(jour) AS debut, MAX(jour) AS fin, COUNT(*) AS nb_jours FROM n GROUP BY ile ORDER BY debut;`,
  hints:["julianday(jour) - ROW_NUMBER() OVER (ORDER BY jour) AS ile","GROUP BY ile"], check:{ordered:true},
  success:`Deux îles, trois jours sans aucun scan. L'importateur déclaré du conteneur : <b>Kartograf SARL</b>. Kartograf... Cartographe.`
});

/* ============ 17 ============ */
chap({ id:17, season:2, code:'17', title:'Le métro', subtitle:'Analyse réseau : NTILE, écart-type, patient zéro, propagation',
  intro:`<p>Retour à Paris. Le PC de commande de TransSeine ressemble à un sous-marin en panne. Le RSSI te confie deux jours de journaux réseau : la table <code>trafic</code> (horodatage, poste, ip_src, ip_dst, port, octets), plus de 6 000 connexions, et <code>sessions_postes</code> (qui était connecté sur quel poste, et quand).</p>
<p class="quote">« Quelque part là-dedans, il y a la première machine infectée. Le patient zéro. » (Byte)</p>`,
  oracle:`<p>Oracle et PostgreSQL ont <code>STDDEV</code> et <code>PERCENTILE_CONT</code> ; SQLite n'a pas d'écart-type natif, d'où le calcul à la main avec <code>sqrt(AVG(x*x) - AVG(x)*AVG(x))</code>. Attention : cette formule donne l'écart-type de <b>population</b> (<code>STDDEV_POP</code> en Oracle), alors que <code>STDDEV</code> d'Oracle calcule l'écart-type d'échantillon. NTILE est standard partout.</p>`,
  quiz:[
    {q:"<code>NTILE(4) OVER (ORDER BY total)</code> :", o:["Prend 4 lignes","Répartit les lignes en 4 groupes de taille égale (quartiles)","Divise total par 4","Arrondit"], a:1, e:"Chaque ligne reçoit son numéro de groupe, de 1 à 4."},
    {q:"Une valeur au-delà de moyenne + 3 écarts-types est :", o:["Normale","Une anomalie statistique probable","Une erreur SQL","Toujours une attaque"], a:1, e:"Environ 0,13 % des valeurs d'une loi normale dépassent ce seuil (0,27 % si l'on compte aussi en dessous de moyenne moins 3 écarts-types). C'est un signal, pas une preuve."},
    {q:"Le « patient zéro » d'une infection, c'est :", o:["La machine la plus infectée","La première machine à avoir contacté le serveur de l'attaquant","Le serveur de l'attaquant","Le dernier poste touché"], a:1, e:"Retrouver le patient zéro, c'est retrouver le point d'entrée."}
  ]});
mis({ id:'17.1', ch:17, title:'Les gros bavards', who:'byte',
  story:`« Classons les postes par volume total de données envoyées, en <b>quartiles</b>. Le quatrième quartile, ce sont les gros bavards. »`,
  lesson:`<p><code>NTILE(n)</code> découpe les lignes ordonnées en <i>n</i> groupes de même taille (à une ligne près) et donne à chaque ligne son numéro de groupe.</p>
<pre class="code">SELECT nom, age, NTILE(4) OVER (ORDER BY age) AS quartile FROM suspects;</pre>`,
  task:`Affiche <code>poste</code>, <code>total</code> (somme des octets) et <code>quartile</code> (NTILE(4) sur le total croissant), triés par <code>total</code> décroissant.`,
  solution:`WITH t AS (SELECT poste, SUM(octets) AS total FROM trafic GROUP BY poste) SELECT poste, total, NTILE(4) OVER (ORDER BY total) AS quartile FROM t ORDER BY total DESC;`,
  hints:["CTE : SUM(octets) par poste, puis NTILE(4) OVER (ORDER BY total)"], require:[{re:'NTILE', msg:"Utilise NTILE()."}], check:{ordered:true}
});
mis({ id:'17.2', ch:17, title:'Les anomalies', who:'byte',
  story:`« Une connexion qui envoie des dizaines de mégaoctets alors que la moyenne est à quelques kilos, c'est une exfiltration. Trouve celles qui dépassent <b>moyenne + 3 écarts-types</b>. »`,
  lesson:`<p>L'écart-type se calcule avec <code>sqrt(AVG(x*x) - AVG(x)*AVG(x))</code>. On le met dans une CTE d'une ligne, qu'on combine avec la table :</p>
<pre class="code">WITH s AS (SELECT AVG(octets) AS m,
  sqrt(AVG(octets * octets) - AVG(octets) * AVG(octets)) AS sd FROM trafic)
SELECT ... FROM trafic, s WHERE octets &gt; s.m + 3 * s.sd;</pre>`,
  task:`Affiche <code>horodatage</code>, <code>poste</code>, <code>ip_dst</code> et <code>octets</code> des connexions anormales (au-delà de moyenne + 3 écarts-types), triées par <code>octets</code> décroissant.`,
  solution:`WITH s AS (SELECT AVG(octets) AS m, sqrt(AVG(octets * octets) - AVG(octets) * AVG(octets)) AS sd FROM trafic) SELECT t.horodatage, t.poste, t.ip_dst, t.octets FROM trafic t, s WHERE t.octets > s.m + 3 * s.sd ORDER BY t.octets DESC;`,
  hints:["CTE s avec la moyenne m et l'écart-type sd","FROM trafic t, s WHERE t.octets > s.m + 3 * s.sd"], check:{ordered:true},
  success:`Trois envois énormes, tous vers la même IP : <b>${C2}</b>. Le serveur de commande de l'attaquant.`
});
mis({ id:'17.3', ch:17, title:'Le patient zéro', who:'varga',
  story:`« Quelle est la <b>toute première</b> machine à avoir parlé à ${C2} ? Et quand ? »`,
  lesson:`<p>Révision : un tri et un LIMIT 1, ou un MIN. Les deux marchent ; le MIN avec GROUP BY donne en plus le premier contact de chaque poste.</p>`,
  task:`Affiche <code>poste</code> et <code>horodatage</code> de la première connexion vers <code>'${C2}'</code>.`,
  solution:`SELECT poste, horodatage FROM trafic WHERE ip_dst = '${C2}' ORDER BY horodatage LIMIT 1;`,
  hints:["ORDER BY horodatage LIMIT 1"],
  success:`<b>MAINT-07</b>, à 5h47, un poste de maintenance du dépôt technique. Un quart d'heure avant la panne générale.`
});
mis({ id:'17.4', ch:17, title:'La propagation', who:'byte',
  story:`« Dans quel ordre les machines ont-elles été contaminées ? Pour chaque poste infecté : son rang d'infection et le nombre de minutes après le patient zéro. »`,
  lesson:`<p>Premier contact par poste (MIN), puis un rang (ROW_NUMBER) et un écart au tout premier contact (MIN dans une fenêtre vide <code>OVER ()</code>).</p>
<pre class="code">MIN(premier) OVER ()   -- le minimum sur toutes les lignes</pre>`,
  task:`Affiche <code>rang</code>, <code>poste</code>, <code>premier_contact</code> et <code>minutes</code> (écart au premier contact global, arrondi) pour chaque poste ayant contacté le C2, par rang.`,
  solution:`WITH p AS (SELECT poste, MIN(horodatage) AS premier_contact FROM trafic WHERE ip_dst = '${C2}' GROUP BY poste) SELECT ROW_NUMBER() OVER (ORDER BY premier_contact) AS rang, poste, premier_contact, ROUND((julianday(premier_contact) - julianday(MIN(premier_contact) OVER ())) * 1440) AS minutes FROM p ORDER BY rang;`,
  hints:["CTE : MIN(horodatage) par poste vers le C2","ROW_NUMBER() OVER (ORDER BY premier_contact) et MIN(premier_contact) OVER ()"], check:{ordered:true}
});
boss({ id:'17.5', ch:17, tail:false, title:'Boss : qui était au clavier ?', who:'varga2', timer:480,
  story:`Varga : « Une machine ne s'infecte pas toute seule. Qui était <b>connecté sur le patient zéro</b> au moment exact du premier contact avec le C2 ? Une seule requête. »`,
  lesson:`<p>Une jointure sur un <b>intervalle</b> : la session dont le début et la fin encadrent l'instant recherché.</p>
<pre class="code">JOIN sessions_postes s ON s.poste = p.poste
 AND p.instant BETWEEN s.debut AND s.fin</pre>`,
  task:`Affiche <code>poste</code>, <code>instant</code> (premier contact avec le C2) et <code>login</code> de la session ouverte à ce moment-là sur ce poste.`,
  solution:`WITH p AS (SELECT poste, horodatage AS instant FROM trafic WHERE ip_dst = '${C2}' ORDER BY horodatage LIMIT 1) SELECT p.poste, p.instant, s.login FROM p JOIN sessions_postes s ON s.poste = p.poste AND p.instant BETWEEN s.debut AND s.fin;`,
  hints:["CTE p : le premier contact (ORDER BY ... LIMIT 1)","JOIN sessions_postes s ON s.poste = p.poste AND p.instant BETWEEN s.debut AND s.fin"],
  require:[{re:'^(?![\\s\\S]*MAINT-07)', msg:"Ne recopie pas le nom du poste : la requête doit le retrouver seule."}],
  success:`<b>ext.kartograf</b>. Un compte prestataire de la société Kartograf SARL. Encore elle.`
});

/* ============ 18 ============ */
chap({ id:18, season:2, code:'18', title:'Les cryptos', subtitle:'Graphes : chemins, cycles, plus court chemin, chaînes de propriété',
  intro:`<p>TransSeine a payé une première partie de la rançon pour relancer la signalisation. L'argent a filé sur <code>bc1q-eclipse-7f3a</code>, puis dans des <b>mixeurs</b>, des services qui mélangent les fonds pour brouiller les pistes. Tables : <code>wallets</code> (adresse, type, plateforme, kyc_nom) et <code>tx_crypto</code> (de, vers, montant, horodatage).</p>
<p class="quote">« Les mixeurs tournent en rond exprès. Si ta requête ne sait pas éviter les boucles, elle tournera en rond avec eux. » (Byte)</p>`,
  oracle:`<p>Oracle gère les cycles avec <code>CONNECT BY NOCYCLE</code> ou, en WITH récursif, avec la clause standard <code>CYCLE adresse SET est_cycle TO 'O' DEFAULT 'N'</code>. PostgreSQL 14 aussi. En SQLite, on détecte le cycle à la main avec un chemin en texte et <code>instr</code>.</p>`,
  quiz:[
    {q:"Sans protection, une CTE récursive sur un graphe avec cycle :", o:["S'arrête seule","Peut tourner indéfiniment","Renvoie une erreur de syntaxe","Ignore le cycle"], a:1, e:"D'où la limite de profondeur et le test « déjà visité » avec le chemin."},
    {q:"<code>instr(chemin, adresse) = 0</code> signifie :", o:["L'adresse est au début du chemin","L'adresse n'apparaît pas dans le chemin","Le chemin est vide","Erreur"], a:1, e:"instr renvoie la position, 0 si absente : c'est le test « pas encore visité »."},
    {q:"Le KYC d'une plateforme d'échange, c'est :", o:["Un algorithme de minage","L'identité vérifiée du titulaire du compte","Un type de portefeuille","Une clé privée"], a:1, e:"Know Your Customer : là où l'anonymat des cryptos s'arrête souvent."}
  ]});
mis({ id:'18.1', ch:18, title:'Le premier saut', who:'byte',
  story:`« Où est partie la rançon ? Les sorties directes de <code>bc1q-eclipse-7f3a</code>, avec le type de chaque portefeuille destinataire. »`,
  lesson:`<p>Révision : une jointure pour enrichir chaque transaction avec les infos du portefeuille destinataire.</p>`,
  task:`Affiche <code>vers</code>, <code>type</code>, <code>montant</code> et <code>horodatage</code> des transactions dont <code>de</code> vaut 'bc1q-eclipse-7f3a', par horodatage.`,
  solution:`SELECT t.vers, w.type, t.montant, t.horodatage FROM tx_crypto t JOIN wallets w ON w.adresse = t.vers WHERE t.de = 'bc1q-eclipse-7f3a' ORDER BY t.horodatage;`,
  hints:["JOIN wallets w ON w.adresse = t.vers"], check:{ordered:true}
});
mis({ id:'18.2', ch:18, title:'Dans le mixeur', who:'byte',
  story:`« Suis l'argent sur plusieurs sauts, dans l'ordre chronologique, <b>sans jamais repasser</b> par un portefeuille déjà visité, et pas plus de 8 sauts. »`,
  lesson:`<p>Trois garde-fous dans la partie récursive :</p>
<pre class="code">WHERE c.saut &lt; 8                      -- profondeur maximale
  AND t.horodatage &gt; c.quand          -- l'argent avance dans le temps
  AND instr(c.chemin, t.vers) = 0      -- pas de boucle</pre>
<p>Version plus stricte, si une adresse peut être le début d'une autre (mix-1 et mix-11) : <code>instr(' > ' || c.chemin || ' > ', ' > ' || t.vers || ' > ') = 0</code>.</p>`,
  task:`Construis <code>suivi(adresse, saut, chemin, quand)</code> depuis <code>('bc1q-eclipse-7f3a', 0, 'bc1q-eclipse-7f3a', '2027-05-12 00:00:00')</code>. Affiche <code>adresse</code>, <code>saut</code>, <code>chemin</code> de toutes les lignes.`,
  solution:`WITH RECURSIVE suivi(adresse, saut, chemin, quand) AS (SELECT 'bc1q-eclipse-7f3a', 0, 'bc1q-eclipse-7f3a', '2027-05-12 00:00:00' UNION ALL SELECT t.vers, c.saut + 1, c.chemin || ' > ' || t.vers, t.horodatage FROM tx_crypto t JOIN suivi c ON t.de = c.adresse WHERE c.saut < 8 AND t.horodatage > c.quand AND instr(c.chemin, t.vers) = 0) SELECT adresse, saut, chemin FROM suivi;`,
  hints:["Partie initiale : SELECT 'bc1q-eclipse-7f3a', 0, 'bc1q-eclipse-7f3a', '2027-05-12 00:00:00'","Les trois garde-fous dans le WHERE de la partie récursive."], require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."},{re:'instr', msg:"Évite les boucles avec instr(chemin, ...) = 0."}]
});
mis({ id:'18.3', ch:18, title:'La sortie du labyrinthe', who:'varga',
  story:`« Le seul endroit où l'argent redevient du vrai argent, ce sont les plateformes d'échange, avec une identité vérifiée. Lesquelles ont été atteintes, et au nom de qui ? »`,
  lesson:`<p>On joint le résultat de la CTE récursive à <code>wallets</code> et on garde le type 'exchange'.</p>`,
  task:`Reprends <code>suivi</code> et affiche <code>adresse</code>, <code>plateforme</code>, <code>kyc_nom</code> et <code>saut</code> des portefeuilles de type 'exchange' atteints (DISTINCT).`,
  solution:`WITH RECURSIVE suivi(adresse, saut, chemin, quand) AS (SELECT 'bc1q-eclipse-7f3a', 0, 'bc1q-eclipse-7f3a', '2027-05-12 00:00:00' UNION ALL SELECT t.vers, c.saut + 1, c.chemin || ' > ' || t.vers, t.horodatage FROM tx_crypto t JOIN suivi c ON t.de = c.adresse WHERE c.saut < 8 AND t.horodatage > c.quand AND instr(c.chemin, t.vers) = 0) SELECT DISTINCT s.adresse, w.plateforme, w.kyc_nom, s.saut FROM suivi s JOIN wallets w ON w.adresse = s.adresse WHERE w.type = 'exchange';`,
  hints:["Même CTE que 18.2, puis JOIN wallets w ... WHERE w.type = 'exchange'"],
  success:`Deux sorties. Le gros des fonds, 12,8 BTC, arrive chez NeoCoin sur un compte au nom de <b>F. OUALI</b>. Byte et Varga se regardent. Personne n'ose le dire tout haut.`
});
mis({ id:'18.4', ch:18, title:'Le plus court chemin', who:'byte',
  story:`« Pour le dossier : le chemin <b>le plus court</b> entre la rançon et chaque plateforme d'échange atteinte. »`,
  lesson:`<p>Le plus court chemin dans un graphe non pondéré : le plus petit nombre de sauts. On garde, pour chaque destination, la ligne de saut minimal (MIN puis jointure, ou ROW_NUMBER).</p>`,
  task:`Affiche <code>adresse</code>, <code>saut</code> et <code>chemin</code> du chemin le plus court vers chaque portefeuille 'exchange' atteint (une ligne par adresse ; en cas d'égalité, le premier chemin par ordre alphabétique).`,
  solution:`WITH RECURSIVE suivi(adresse, saut, chemin, quand) AS (SELECT 'bc1q-eclipse-7f3a', 0, 'bc1q-eclipse-7f3a', '2027-05-12 00:00:00' UNION ALL SELECT t.vers, c.saut + 1, c.chemin || ' > ' || t.vers, t.horodatage FROM tx_crypto t JOIN suivi c ON t.de = c.adresse WHERE c.saut < 8 AND t.horodatage > c.quand AND instr(c.chemin, t.vers) = 0), r AS (SELECT s.adresse, s.saut, s.chemin, ROW_NUMBER() OVER (PARTITION BY s.adresse ORDER BY s.saut, s.chemin) AS rn FROM suivi s JOIN wallets w ON w.adresse = s.adresse WHERE w.type = 'exchange') SELECT adresse, saut, chemin FROM r WHERE rn = 1;`,
  hints:["ROW_NUMBER() OVER (PARTITION BY adresse ORDER BY saut, chemin)","WHERE rn = 1"]
});
boss({ id:'18.5', ch:18, tail:false, title:'Boss : les poupées russes', who:'varga2', timer:600,
  story:`Varga : « Kartograf SARL appartient à une holding, qui appartient à un trust, qui appartient à... Remonte la chaîne de propriété depuis l'importateur du conteneur MSCU-449120, en calculant la <b>part réelle</b> détenue à chaque étage. »`,
  lesson:`<p>Dans la table <code>participations</code> (detenteur, detenue, pct), le détenteur est un SIREN ou une personne (<code>'PERSONNE:...'</code>). La part réelle se multiplie à chaque étage : 100 % de 85 % de 100 % = 85 %.</p>
<pre class="code">SELECT p.detenteur, c.part * p.pct / 100 ...</pre>`,
  task:`Construis <code>chaine(siren, part)</code> en partant de l'importateur de 'MSCU-449120' (part 100), en remontant vers les détenteurs. Affiche <code>beneficiaire</code> (sans le préfixe <code>PERSONNE:</code>) et <code>part</code> (arrondie à 1 décimale) des bénéficiaires finaux qui sont des personnes, par part décroissante.`,
  solution:`WITH RECURSIVE chaine(siren, part) AS (SELECT importateur_siren, 100.0 FROM conteneurs WHERE code = 'MSCU-449120' UNION ALL SELECT p.detenteur, c.part * p.pct / 100 FROM participations p JOIN chaine c ON p.detenue = c.siren) SELECT REPLACE(siren, 'PERSONNE:', '') AS beneficiaire, ROUND(part, 1) AS part FROM chaine WHERE siren LIKE 'PERSONNE:%' ORDER BY part DESC;`,
  hints:["Partie récursive : JOIN chaine c ON p.detenue = c.siren, part = c.part * p.pct / 100","Garde WHERE siren LIKE 'PERSONNE:%'"], require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."}], check:{ordered:true},
  success:`85 % de Kartograf SARL appartiennent, à travers le Luxembourg et Genève, à <b>Farid Ouali</b>. Le consultant. Celui qui a accès à toute la base de la brigade.`
});

/* ============ 19 ============ */
chap({ id:19, season:2, code:'19', title:'La forteresse', subtitle:'Triggers, UPSERT, SAVEPOINT, journal d\'audit, restauration',
  intro:`<p>Varga fait fermer les portes de la brigade. Si Farid Ouali est le Cartographe, il a eu accès à la base de l'enquête pendant des semaines. Byte vérifie la table des pièces à conviction <code>pieces</code>... et blêmit : <b>il en manque</b>.</p>
<p class="quote">« On blinde la base. Tout de suite. Ensuite, on cherche qui a effacé quoi. » (Inès Varga)</p>`,
  oracle:`<p>Les triggers existent partout, avec des syntaxes proches : Oracle <code>CREATE OR REPLACE TRIGGER ... AFTER DELETE ON pieces FOR EACH ROW BEGIN ... :OLD.id ... END;</code>. L'UPSERT s'écrit <code>MERGE INTO</code> en Oracle, SQL Server et PostgreSQL (depuis la version 15), <code>INSERT ... ON CONFLICT</code> en PostgreSQL et SQLite, <code>ON DUPLICATE KEY UPDATE</code> en MySQL.</p>`,
  quiz:[
    {q:"Dans un trigger AFTER DELETE, <code>OLD.description</code> désigne :", o:["La nouvelle valeur","La valeur de la ligne qui vient d'être supprimée","Rien","La valeur par défaut"], a:1, e:"OLD = l'état avant, NEW = l'état après (pour INSERT et UPDATE)."},
    {q:"<code>INSERT ... ON CONFLICT(station) DO UPDATE SET nb = nb + 1</code> :", o:["Échoue si la station existe","Insère, ou incrémente si la station existe déjà","Supprime la station","Ne fait rien"], a:1, e:"C'est l'UPSERT : update ou insert en une instruction."},
    {q:"<code>ROLLBACK TO s</code> :", o:["Annule toute la transaction","Annule uniquement ce qui a été fait depuis le SAVEPOINT s","Valide","Supprime le savepoint sans rien annuler"], a:1, e:"Un savepoint est un point de restauration à l'intérieur d'une transaction."}
  ]});
mis({ id:'19.1', ch:19, title:'Le mouchard', who:'byte',
  story:`« Première protection : un <b>trigger</b> qui copie automatiquement chaque pièce supprimée dans une table d'archive. Plus jamais de suppression silencieuse. »`,
  lesson:`<p>Un <b>trigger</b> (déclencheur) est du SQL qui s'exécute tout seul quand un événement se produit sur une table :</p>
<pre class="code">CREATE TRIGGER nom AFTER DELETE ON pieces
BEGIN
  INSERT INTO archive VALUES (OLD.id, OLD.description);
END;</pre>
<p>Dans le trigger, <code>OLD</code> désigne la ligne supprimée (et <code>NEW</code> la nouvelle ligne pour un INSERT ou un UPDATE). La table <code>archive_pieces(id, affaire, description, supprimee_le)</code> est créée pour toi.</p>`,
  setup:`CREATE TABLE archive_pieces (id INTEGER, affaire TEXT, description TEXT, supprimee_le TEXT);`,
  task:`Crée le trigger <code>trg_archive</code> AFTER DELETE ON <code>pieces</code> qui insère dans <code>archive_pieces</code> l'id, l'affaire, la description de la pièce supprimée et <code>datetime('now')</code>. Teste-le en supprimant la pièce 1.`,
  solution:`CREATE TRIGGER trg_archive AFTER DELETE ON pieces BEGIN INSERT INTO archive_pieces VALUES (OLD.id, OLD.affaire, OLD.description, datetime('now')); END; DELETE FROM pieces WHERE id = 1;`,
  hints:["CREATE TRIGGER trg_archive AFTER DELETE ON pieces BEGIN INSERT INTO archive_pieces VALUES (OLD.id, ...); END;","N'oublie pas le DELETE de test à la fin."],
  check:{mode:'dml', verify:["DELETE FROM pieces WHERE id = 2; SELECT id, affaire, description FROM archive_pieces ORDER BY id","SELECT COUNT(*) FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'pieces'"]}
});
mis({ id:'19.2', ch:19, title:'Compter sans doublon', who:'byte',
  story:`« Le tableau des alertes par station, <code>compteurs_alertes(station, nb)</code>, doit être mis à jour à chaque nouvelle alerte : si la station existe, on ajoute 1, sinon on la crée. »`,
  lesson:`<p>L'<b>UPSERT</b> : un INSERT qui se transforme en UPDATE si la clé existe déjà.</p>
<pre class="code">INSERT INTO compteurs_alertes (station, nb) VALUES ('X', 1)
ON CONFLICT (station) DO UPDATE SET nb = nb + 1;</pre>
<p>Il faut une contrainte UNIQUE ou PRIMARY KEY sur la colonne du ON CONFLICT.</p>`,
  task:`Enregistre deux alertes pour <code>'Grande Arche'</code> (qui existe déjà) et une pour <code>'Châtelet-Seine'</code> (qui n'existe pas), avec des UPSERT.`,
  solution:`INSERT INTO compteurs_alertes (station, nb) VALUES ('Grande Arche', 1) ON CONFLICT (station) DO UPDATE SET nb = nb + 1; INSERT INTO compteurs_alertes (station, nb) VALUES ('Grande Arche', 1) ON CONFLICT (station) DO UPDATE SET nb = nb + 1; INSERT INTO compteurs_alertes (station, nb) VALUES ('Châtelet-Seine', 1) ON CONFLICT (station) DO UPDATE SET nb = nb + 1;`,
  hints:["Trois INSERT ... ON CONFLICT (station) DO UPDATE SET nb = nb + 1;"], require:[{re:'ON\\s+CONFLICT', msg:"Utilise INSERT ... ON CONFLICT."}],
  check:{mode:'dml', verify:["SELECT station, nb FROM compteurs_alertes ORDER BY station"]}
});
mis({ id:'19.3', ch:19, title:'Le point de sauvegarde', who:'byte',
  story:`« Je dois ajouter une pièce, puis tester une suppression risquée. Si la suppression tourne mal, je veux annuler <b>seulement</b> elle, pas l'ajout. »`,
  lesson:`<p>Un <code>SAVEPOINT</code> pose un point de restauration à l'intérieur d'une transaction :</p>
<pre class="code">BEGIN;
INSERT ...;          -- on veut garder ça
SAVEPOINT avant_test;
DELETE ...;          -- essai risqué
ROLLBACK TO avant_test;  -- annule seulement le DELETE
COMMIT;              -- valide l'INSERT</pre>`,
  task:`Dans une transaction : insère la pièce <code>(20, 'Éclipse', 'Clé USB du dépôt MAINT-07', '2027-05-12')</code>, pose un savepoint, supprime toutes les pièces de l'affaire 'Minuit', reviens au savepoint, puis valide.`,
  solution:`BEGIN; INSERT INTO pieces VALUES (20, 'Éclipse', 'Clé USB du dépôt MAINT-07', '2027-05-12'); SAVEPOINT avant_test; DELETE FROM pieces WHERE affaire = 'Minuit'; ROLLBACK TO avant_test; COMMIT;`,
  hints:["BEGIN; INSERT ...; SAVEPOINT s; DELETE ...; ROLLBACK TO s; COMMIT;"], require:[{re:'SAVEPOINT', msg:"Utilise SAVEPOINT."},{re:'ROLLBACK\\s+TO', msg:"Reviens au savepoint avec ROLLBACK TO."}],
  check:{mode:'dml', verify:["SELECT id, affaire, description FROM pieces ORDER BY id"]}
});
mis({ id:'19.4', ch:19, title:'Qui a effacé ?', who:'varga',
  story:`La base de la brigade a toujours eu un journal : <code>journal_brigade</code> (login, action, table_cible, ligne_id, ancienne_valeur, horodatage). « Qui a supprimé des pièces, combien, et quand ? »`,
  lesson:`<p>Un journal d'audit est une mine d'or en enquête numérique : il répond à « qui, quoi, quand ». Joins-le à la table <code>consultants</code> pour mettre un nom sur un login.</p>`,
  task:`Affiche <code>login</code>, <code>nom_complet</code> (NULL si le login n'est pas un consultant), <code>suppressions</code>, <code>premiere</code> et <code>derniere</code> pour les actions 'DELETE' sur la table 'pieces'.`,
  solution:`SELECT j.login, c.nom_complet, COUNT(*) AS suppressions, MIN(j.horodatage) AS premiere, MAX(j.horodatage) AS derniere FROM journal_brigade j LEFT JOIN consultants c ON c.login = j.login WHERE j.action = 'DELETE' AND j.table_cible = 'pieces' GROUP BY j.login, c.nom_complet;`,
  hints:["LEFT JOIN consultants c ON c.login = j.login","GROUP BY j.login, c.nom_complet"],
  success:`<b>consultant.fo</b>, Farid Ouali : quatre pièces effacées en deux minutes, le 12 mai vers 21h50, pendant que toute la brigade rentrait de Puteaux. La facture Kartograf, la capture réseau de MAINT-07, la clé USB, le témoignage du dépôt.`
});
boss({ id:'19.5', ch:19, tail:false, title:'Boss : la résurrection', who:'byte', timer:600,
  story:`Byte, les yeux brillants : « Il a effacé les pièces, mais le journal a gardé une copie de chaque ligne dans <code>ancienne_valeur</code>, en JSON. On peut les <b>ressusciter</b>. »`,
  lesson:`<p>Un INSERT ... SELECT qui reconstruit les lignes à partir du JSON :</p>
<pre class="code">INSERT INTO pieces (id, affaire, description, ajoutee_le)
SELECT ligne_id, json_extract(ancienne_valeur, '$.affaire'), ...
FROM journal_brigade WHERE ...;</pre>`,
  task:`Restaure dans <code>pieces</code> toutes les pièces supprimées par <code>'consultant.fo'</code> (id = <code>ligne_id</code>, affaire, description et ajoutee_le lus dans <code>ancienne_valeur</code>).`,
  solution:`INSERT INTO pieces (id, affaire, description, ajoutee_le) SELECT ligne_id, json_extract(ancienne_valeur, '$.affaire'), json_extract(ancienne_valeur, '$.description'), json_extract(ancienne_valeur, '$.ajoutee_le') FROM journal_brigade WHERE login = 'consultant.fo' AND action = 'DELETE' AND table_cible = 'pieces';`,
  hints:["INSERT INTO pieces (...) SELECT ligne_id, json_extract(ancienne_valeur, '$.affaire'), ...","WHERE login = 'consultant.fo' AND action = 'DELETE'"],
  check:{mode:'dml', verify:["SELECT id, affaire, description, ajoutee_le FROM pieces ORDER BY id"]},
  success:`Les quatre pièces sont de retour. Sur la clé USB du dépôt : un seul fichier, <i>eclipse_loader.exe</i>, signé du certificat de... Ouali Conseil.`
});

/* ============ 20 ============ */
chap({ id:20, season:2, code:'20', title:'Contre la montre', subtitle:'Performance : EXPLAIN QUERY PLAN, index composites et couvrants',
  intro:`<p>23h00, le 12 mai. Un nouveau message s'affiche dans le PC de commande : <i>« Minuit. Effacement total des serveurs TransSeine. »</i> Ouali a disparu. Il reste une heure pour isoler les machines encore infectées.</p>
<p>Problème : sur les vrais serveurs, la table <code>trafic</code> compte des centaines de millions de lignes. Chaque requête doit être <b>rapide</b>.</p>
<p class="quote">« Une requête juste mais lente, ce soir, c'est une requête fausse. » (Byte)</p>`,
  oracle:`<p>Chaque moteur a son plan d'exécution : <code>EXPLAIN PLAN FOR ...</code> puis <code>DBMS_XPLAN.DISPLAY</code> en Oracle, <code>EXPLAIN ANALYZE</code> en PostgreSQL. Les principes sont les mêmes : éviter les parcours complets (FULL SCAN), indexer les colonnes filtrées, mettre la colonne d'égalité en premier dans un index composite.</p>`,
  quiz:[
    {q:"Dans un index composite <code>(ip_dst, horodatage)</code>, il vaut mieux :", o:["Filtrer seulement sur horodatage","Filtrer sur ip_dst (égalité) puis horodatage (plage)","L'ordre ne compte pas","Ne pas filtrer"], a:1, e:"Un index composite se lit de gauche à droite, comme un annuaire trié par nom puis prénom."},
    {q:"Un index « couvrant » :", o:["Couvre toute la base","Contient toutes les colonnes dont la requête a besoin : pas besoin de lire la table","Est un index unique","Est automatique"], a:1, e:"SQLite l'indique par USING COVERING INDEX dans le plan."},
    {q:"Le prix d'un index :", o:["Aucun","De l'espace disque et des écritures un peu plus lentes","Des lectures plus lentes","Des données en double incohérentes"], a:1, e:"Chaque INSERT, UPDATE ou DELETE doit aussi mettre l'index à jour."}
  ]});
mis({ id:'20.1', ch:20, title:'Le plan', who:'byte',
  story:`« Avant d'optimiser, on mesure. Demande au moteur <b>comment</b> il exécute la recherche des connexions du poste MAINT-07. »`,
  lesson:`<p><code>EXPLAIN QUERY PLAN</code> devant une requête affiche le plan choisi par le moteur, sans l'exécuter :</p>
<pre class="code">EXPLAIN QUERY PLAN
SELECT * FROM trafic WHERE poste = 'X';
-- SCAN trafic   : lecture de toute la table, ligne par ligne</pre>
<p><code>SCAN</code> = lecture complète. <code>SEARCH ... USING INDEX</code> = accès direct grâce à un index.</p>`,
  task:`Affiche le plan d'exécution de <code>SELECT * FROM trafic WHERE poste = 'MAINT-07'</code>.`,
  solution:`EXPLAIN QUERY PLAN SELECT * FROM trafic WHERE poste = 'MAINT-07';`,
  hints:["Écris EXPLAIN QUERY PLAN devant la requête."], require:[{re:'EXPLAIN\\s+QUERY\\s+PLAN', msg:"Utilise EXPLAIN QUERY PLAN."}],
  require:[{re:'EXPLAIN\\s+QUERY\\s+PLAN', msg:"Utilise EXPLAIN QUERY PLAN."},{re:"WHERE\\s+poste\\s*=\\s*'MAINT-07'", msg:"Analyse la requête demandée."}],
  check:{mode:'plan', contains:'SCAN trafic'},
  success:`<code>SCAN trafic</code> : toute la table, à chaque recherche. Sur 300 millions de lignes, c'est dix minutes. On n'a pas dix minutes.`
});
mis({ id:'20.2', ch:20, title:'Le premier index', who:'byte',
  story:`« Crée un index sur <code>poste</code>, puis redemande le plan. On doit passer de SCAN à SEARCH. »`,
  lesson:`<pre class="code">CREATE INDEX idx_trafic_poste ON trafic(poste);
EXPLAIN QUERY PLAN SELECT * FROM trafic WHERE poste = 'MAINT-07';
-- SEARCH trafic USING INDEX idx_trafic_poste (poste=?)</pre>`,
  task:`Crée un index sur <code>trafic(poste)</code> et affiche le nouveau plan de la même requête.`,
  solution:`CREATE INDEX idx_trafic_poste ON trafic(poste); EXPLAIN QUERY PLAN SELECT * FROM trafic WHERE poste = 'MAINT-07';`,
  hints:["CREATE INDEX nom ON trafic(poste); puis EXPLAIN QUERY PLAN ..."], require:[{re:'CREATE\\s+INDEX', msg:"Crée d'abord l'index."},{re:'ON\\s+trafic\\s*\\(\\s*poste\\s*\\)', msg:"L'index doit porter sur trafic(poste)."},{re:"WHERE\\s+poste\\s*=\\s*'MAINT-07'", msg:"Analyse la requête demandée."}],
  check:{mode:'plan', contains:'SEARCH trafic USING INDEX'}
});
mis({ id:'20.3', ch:20, title:"L'index composite", who:'byte',
  story:`« La requête critique de ce soir : les connexions vers le C2 dans une plage horaire. Il faut un index sur <b>deux colonnes</b>, dans le bon ordre. »`,
  lesson:`<p>Un index composite se lit de gauche à droite. Mets d'abord la colonne testée par <b>égalité</b>, puis celle testée par <b>plage</b> :</p>
<pre class="code">CREATE INDEX idx ON trafic(ip_dst, horodatage);
-- WHERE ip_dst = '...' AND horodatage BETWEEN ... : parfait
-- WHERE horodatage BETWEEN ... seul : l'index sert peu</pre>`,
  task:`Crée un index composite sur <code>trafic(ip_dst, horodatage)</code>.`,
  solution:`CREATE INDEX idx_trafic_dst_h ON trafic(ip_dst, horodatage);`,
  hints:["CREATE INDEX nom ON trafic(ip_dst, horodatage);"],
  check:{mode:'dml', verify:["SELECT group_concat(name, ',') FROM (SELECT ii.name FROM pragma_index_list('trafic') il, pragma_index_info(il.name) ii WHERE il.origin = 'c' ORDER BY il.name, ii.seqno) GROUP BY 1=1"]}
});
mis({ id:'20.4', ch:20, title:"L'index couvrant", who:'byte',
  story:`« Dernier cran : la requête ne lit que <code>poste</code> et <code>octets</code>. Si l'index contient déjà ces colonnes, le moteur n'a même plus besoin d'ouvrir la table. »`,
  lesson:`<p>Un index <b>couvrant</b> contient toutes les colonnes utilisées par la requête. Le plan affiche alors <code>USING COVERING INDEX</code>.</p>
<pre class="code">CREATE INDEX idx_cov ON trafic(ip_dst, poste, octets);</pre>`,
  task:`Crée un index couvrant pour <code>SELECT poste, octets FROM trafic WHERE ip_dst = '${C2}'</code>, puis affiche le plan de cette requête.`,
  solution:`CREATE INDEX idx_trafic_cov ON trafic(ip_dst, poste, octets); EXPLAIN QUERY PLAN SELECT poste, octets FROM trafic WHERE ip_dst = '${C2}';`,
  hints:["Index sur (ip_dst, poste, octets)","Puis EXPLAIN QUERY PLAN de la requête."], require:[{re:'CREATE\\s+INDEX', msg:"Crée l'index couvrant."},{re:"SELECT\\s+poste\\s*,\\s*octets\\s+FROM\\s+trafic\\s+WHERE\\s+ip_dst", msg:"Analyse la requête demandée."}],
  check:{mode:'plan', contains:'COVERING INDEX'}
});
boss({ id:'20.5', ch:20, tail:false, title:'Boss : 23h52, isoler les machines', who:'varga2', timer:420,
  story:`23h52. Varga, debout derrière toi : « Huit minutes. Je veux la liste des postes qui ont parlé au C2 <b>dans la dernière demi-heure</b> (depuis 23h20), avec leur dernier contact. Les équipes les débranchent à la main. Et fais-le vite : index d'abord. »`,
  lesson:`<p>Le boss combine : un index adapté, puis une agrégation filtrée. Le moteur choisira l'index tout seul.</p>`,
  task:`Crée un index utile, puis affiche <code>poste</code> et <code>dernier_contact</code> (MAX horodatage) des postes ayant contacté <code>'${C2}'</code> depuis <code>'2027-05-12 23:20:00'</code>, triés par <code>dernier_contact</code>.`,
  solution:`CREATE INDEX idx_c2 ON trafic(ip_dst, horodatage); SELECT poste, MAX(horodatage) AS dernier_contact FROM trafic WHERE ip_dst = '${C2}' AND horodatage >= '2027-05-12 23:20:00' GROUP BY poste ORDER BY dernier_contact;`,
  hints:["CREATE INDEX ... ON trafic(ip_dst, horodatage);","GROUP BY poste avec MAX(horodatage)"], require:[{re:'CREATE\\s+INDEX', msg:"Le boss exige un index."},{re:'ON\\s+trafic\\s*\\(\\s*ip_dst', msg:"Il faut un index qui commence par ip_dst."}], check:{ordered:true},
  success:`Trois câbles arrachés à 23h57. À minuit, l'ordre d'effacement arrive... sur des machines débranchées. TransSeine est sauvée. Mais Ouali reste introuvable.`
});

/* ============ 21 ============ */
chap({ id:21, season:2, code:'21', title:'Les témoins', subtitle:'Qualité des données : normalisation, doublons, dédoublonnage',
  intro:`<p>L'appel à témoins sur le dépôt de maintenance a fonctionné. Trop bien : la table <code>temoignages_bruts</code> a été remplie à la main, par trois standardistes, dans la journée. Majuscules au hasard, espaces en trop, plaques écrites n'importe comment, doublons partout.</p>
<p class="quote">« 80 % du travail d'un data analyst, c'est ça : nettoyer. » (Byte)</p>`,
  oracle:`<p>Les fonctions de nettoyage sont proches partout (<code>TRIM</code>, <code>UPPER</code>, <code>REPLACE</code>). Oracle et PostgreSQL ajoutent les expressions régulières (<code>REGEXP_REPLACE</code>), très utiles pour normaliser des plaques ou des téléphones. Pour supprimer des doublons, Oracle utilise souvent <code>ROWID</code> ; le motif ROW_NUMBER de cet épisode marche partout.</p>`,
  quiz:[
    {q:"Pourquoi <code>GROUP BY temoin</code> ne suffit-il pas à repérer les doublons ici ?", o:["GROUP BY est lent","'Ahmed Kaci' et 'AHMED KACI ' sont des textes différents","GROUP BY ignore les doublons","Ça suffit"], a:1, e:"Il faut d'abord normaliser : LOWER(TRIM(temoin))."},
    {q:"Pour garder une seule ligne par doublon, on numérote avec :", o:["COUNT(*)","ROW_NUMBER() OVER (PARTITION BY clé_normalisée ORDER BY date)","RANK() sans partition","DISTINCT"], a:1, e:"On garde rn = 1 et on supprime les autres."},
    {q:"Normaliser des données avant de comparer :", o:["Est inutile","Évite de rater des correspondances dues à la casse, aux espaces ou aux séparateurs","Modifie toujours la table","Est interdit"], a:1, e:"On peut normaliser dans la requête sans toucher aux données d'origine."}
  ]});
mis({ id:'21.1', ch:21, title:"L'état des lieux", who:'byte',
  story:`« Combien de témoignages, combien de noms différents <b>en apparence</b>, et combien <b>vraiment</b> différents une fois nettoyés (minuscules, sans espaces autour) ? »`,
  lesson:`<pre class="code">LOWER(TRIM('  Ahmed KACI '))  -- 'ahmed kaci'</pre>
<p>Attention aux accents : en SQLite, <code>LOWER</code> et <code>UPPER</code> ne changent que les lettres sans accent (<code>LOWER('LÉA')</code> donne <code>'lÉa'</code>). Oracle et PostgreSQL, eux, gèrent les accents. Ici, les noms des témoins n'en ont pas.</p>
<p>COUNT(DISTINCT expression) compte les valeurs différentes d'une expression, pas seulement d'une colonne.</p>`,
  task:`Affiche en une ligne <code>total</code>, <code>noms_bruts</code> (COUNT DISTINCT temoin) et <code>noms_propres</code> (COUNT DISTINCT LOWER(TRIM(temoin))).`,
  solution:`SELECT COUNT(*) AS total, COUNT(DISTINCT temoin) AS noms_bruts, COUNT(DISTINCT LOWER(TRIM(temoin))) AS noms_propres FROM temoignages_bruts;`,
  hints:["COUNT(DISTINCT LOWER(TRIM(temoin)))"], check:{strictCols:true}
});
mis({ id:'21.2', ch:21, title:'Les doublons', who:'byte',
  story:`« Un même témoin a souvent appelé plusieurs fois. Liste les témoins (nom nettoyé) qui apparaissent plus d'une fois, avec le nombre d'appels. »`,
  lesson:`<p>On groupe sur l'expression normalisée, et on garde les groupes de plus d'une ligne.</p>`,
  task:`Affiche <code>temoin</code> (LOWER(TRIM(temoin))) et <code>nb</code> pour les témoins présents plus d'une fois, triés par <code>nb</code> décroissant puis <code>temoin</code>.`,
  solution:`SELECT LOWER(TRIM(temoin)) AS temoin, COUNT(*) AS nb FROM temoignages_bruts GROUP BY LOWER(TRIM(temoin)) HAVING COUNT(*) > 1 ORDER BY nb DESC, temoin;`,
  hints:["GROUP BY LOWER(TRIM(temoin)) HAVING COUNT(*) > 1"], check:{ordered:true}
});
mis({ id:'21.3', ch:21, title:'Le grand ménage', who:'byte',
  story:`« Supprime les doublons : pour chaque témoin (nom nettoyé), on garde <b>uniquement le premier témoignage reçu</b>. »`,
  lesson:`<p>Le motif classique de dédoublonnage :</p>
<pre class="code">DELETE FROM t WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY cle ORDER BY date) AS rn
    FROM t
  ) WHERE rn &gt; 1
);</pre>`,
  task:`Supprime de <code>temoignages_bruts</code> toutes les lignes sauf la première (plus petit <code>recu_le</code>, puis plus petit <code>id</code>) de chaque témoin normalisé.`,
  solution:`DELETE FROM temoignages_bruts WHERE id IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(temoin)) ORDER BY recu_le, id) AS rn FROM temoignages_bruts) WHERE rn > 1);`,
  hints:["ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(temoin)) ORDER BY recu_le, id)","DELETE ... WHERE id IN (SELECT id FROM (...) WHERE rn > 1)"],
  check:{mode:'dml', verify:["SELECT id FROM temoignages_bruts ORDER BY id"]}
});
mis({ id:'21.4', ch:21, title:'La plaque qui revient', who:'byte',
  story:`« Les plaques sont écrites n'importe comment : <code>EF-310-OU</code>, <code>ef310ou</code>, <code>EF 310 OU</code>... Normalise-les et compte laquelle revient le plus. »`,
  lesson:`<p>On empile les fonctions de nettoyage : enlever les espaces, enlever les tirets, passer en majuscules.</p>
<pre class="code">UPPER(REPLACE(REPLACE(TRIM(plaque), ' ', ''), '-', ''))</pre>`,
  task:`Affiche <code>plaque</code> (normalisée sans espace ni tiret, en majuscules) et <code>nb</code>, pour les plaques non vides, triées par <code>nb</code> décroissant.`,
  solution:`SELECT UPPER(REPLACE(REPLACE(TRIM(plaque), ' ', ''), '-', '')) AS plaque, COUNT(*) AS nb FROM temoignages_bruts WHERE plaque IS NOT NULL AND TRIM(plaque) <> '' GROUP BY 1 ORDER BY nb DESC;`,
  hints:["UPPER(REPLACE(REPLACE(TRIM(plaque), ' ', ''), '-', ''))","Exclure NULL et chaînes vides."], check:{ordered:true}
});
boss({ id:'21.5', ch:21, tail:false, title:'Boss : la Tesla grise', who:'varga2', timer:480,
  story:`Varga : « La plaque la plus citée, rapprochée des cartes grises. Attention, dans <code>cartes_grises</code> les plaques sont au format officiel <code>AA-123-AA</code> : il faut normaliser <b>les deux côtés</b> de la jointure. »`,
  lesson:`<p>On peut joindre sur des expressions, pas seulement sur des colonnes :</p>
<pre class="code">JOIN cartes_grises c
  ON REPLACE(c.immatriculation, '-', '') = UPPER(...)</pre>`,
  task:`Affiche <code>immatriculation</code>, <code>marque</code>, <code>couleur</code>, <code>titulaire</code> et <code>temoins</code> (nombre de témoins <b>différents</b>, nom nettoyé) pour chaque carte grise citée par au moins un témoignage, triées par <code>temoins</code> décroissant.`,
  solution:`SELECT c.immatriculation, c.marque, c.couleur, c.titulaire, COUNT(DISTINCT LOWER(TRIM(t.temoin))) AS temoins FROM temoignages_bruts t JOIN cartes_grises c ON REPLACE(c.immatriculation, '-', '') = UPPER(REPLACE(REPLACE(TRIM(t.plaque), ' ', ''), '-', '')) GROUP BY c.immatriculation, c.marque, c.couleur, c.titulaire ORDER BY temoins DESC;`,
  hints:["ON REPLACE(c.immatriculation, '-', '') = UPPER(REPLACE(REPLACE(TRIM(t.plaque), ' ', ''), '-', ''))","COUNT(DISTINCT LOWER(TRIM(t.temoin))) et GROUP BY sur les colonnes de la carte grise."], check:{ordered:true},
  success:`<b>EF-310-OU</b>, Tesla grise, au nom de Kartograf SARL. Garée devant le dépôt à 5h40, sept minutes avant le patient zéro. Un homme aux tempes grises en est sorti, téléphone à l'oreille.`
});

/* ============ 22 ============ */
chap({ id:22, season:2, code:'22', title:'Éclipse', subtitle:'La finale : chronologie totale et preuve en une requête',
  intro:`<p>Aéroport de Genève, 6h10. Farid Ouali s'apprête à embarquer pour un pays sans extradition. La police suisse peut le retenir deux heures, pas une de plus, sans un dossier qui tienne.</p>
<p>La juge Amrani est en visioconférence. Varga, Byte, Haddad, toute la brigade est là. Tout repose sur toi.</p>
<p class="quote">« Une requête. Une ligne. Un nom. Et on rentre à la maison. » (Inès Varga)</p>`,
  oracle:`<p>Tu as maintenant couvert bien plus que le programme d'Oracle Academy : JSON, fenêtrage avancé, graphes récursifs, triggers, UPSERT, performance, qualité des données. Ce sont exactement les compétences demandées aux data analysts, aux analystes SOC et aux enquêteurs numériques.</p>`,
  quiz:[
    {q:"Pour assembler une chronologie à partir de tables différentes :", o:["JOIN","UNION ALL de SELECT ayant les mêmes colonnes, puis ORDER BY","GROUP BY","Une vue obligatoire"], a:1, e:"Chaque table produit (horodatage, source, evenement) et UNION ALL les empile."},
    {q:"Une preuve « en une requête » est solide si :", o:["Elle est longue","Elle ne recopie aucune valeur trouvée à la main et se recalcule à partir des données brutes","Elle utilise RECURSIVE","Elle est rapide"], a:1, e:"Reproductible et vérifiable par la défense : c'est ce qui fait une preuve numérique."}
  ]});
mis({ id:'22.1', ch:22, title:'La chronologie totale', who:'juge',
  story:`La juge : « Avant le nom, je veux l'histoire. Les moments clés des deux affaires sur une seule frise : connexions réussies de 203.0.113.66, accès aux coffres de la nuit du 13, premier contact avec le C2 et sorties de la rançon. »`,
  lesson:`<p>Chaque source devient un SELECT avec les <b>mêmes colonnes</b>, puis UNION ALL et un seul ORDER BY à la fin :</p>
<pre class="code">SELECT horodatage AS quand, 'connexions' AS source, login AS detail FROM ...
UNION ALL
SELECT ..., 'badges', ... FROM ...
ORDER BY quand;</pre>`,
  task:`Affiche <code>quand</code>, <code>source</code>, <code>detail</code> en empilant : connexions réussies de '203.0.113.66' (detail = login), accès 'OK' à 'Salle des coffres' entre '2026-11-13 22:00:00' et '2026-11-14 01:00:00' (detail = badge), le premier contact avec '${C2}' (detail = poste), et les transactions sortant de 'bc1q-eclipse-7f3a' (detail = vers). Tri par <code>quand</code>.`,
  solution:`SELECT horodatage AS quand, 'connexions' AS source, login AS detail FROM connexions WHERE ip = '203.0.113.66' AND succes = 1 UNION ALL SELECT horodatage, 'badges', badge FROM acces_badges WHERE porte = 'Salle des coffres' AND resultat = 'OK' AND horodatage BETWEEN '2026-11-13 22:00:00' AND '2026-11-14 01:00:00' UNION ALL SELECT * FROM (SELECT horodatage, 'trafic', poste FROM trafic WHERE ip_dst = '${C2}' ORDER BY horodatage LIMIT 1) UNION ALL SELECT horodatage, 'crypto', vers FROM tx_crypto WHERE de = 'bc1q-eclipse-7f3a' ORDER BY quand;`,
  hints:["Quatre SELECT de trois colonnes reliés par UNION ALL.","Le premier contact : SELECT * FROM (SELECT ... ORDER BY horodatage LIMIT 1)"], require:[{re:'UNION\\s+ALL', msg:"Empile les sources avec UNION ALL."}], check:{ordered:true, orderKeys:[0]}
});
boss({ id:'22.2', ch:22, tail:false, title:'Boss final : le Cartographe', xp:500, timer:1200, who:'varga2',
  story:`Écris <b>une seule requête</b> qui renvoie le <b>nom complet</b> de la personne qui remplit les trois conditions :<ol><li>elle est <b>bénéficiaire final</b>, à plus de 50 %, de l'importateur du conteneur MSCU-449120 ;</li><li>son nom (au format <code>F. NOM</code> en majuscules) est le <b>KYC</b> d'une plateforme d'échange atteinte depuis <code>bc1q-eclipse-7f3a</code> ;</li><li>c'est le consultant dont le login a <b>supprimé des pièces</b> dans le journal de la brigade.</li></ol>`,
  lesson:`<p>Trois preuves indépendantes, trois CTE, une intersection. Le format KYC se reconstruit à partir du nom complet :</p>
<pre class="code">UPPER(SUBSTR(nom, 1, 1) || '. ' || SUBSTR(nom, INSTR(nom, ' ') + 1))
-- 'Farid Ouali' devient 'F. OUALI'</pre>
<p>Seuls points d'entrée autorisés : le code du conteneur, l'adresse de la rançon et le nom de la table <code>pieces</code>.</p>`,
  task:`Affiche <code>nom</code> : le nom complet de la personne qui remplit les trois conditions.`,
  solution:`WITH RECURSIVE chaine(siren, part) AS (SELECT importateur_siren, 100.0 FROM conteneurs WHERE code = 'MSCU-449120' UNION ALL SELECT p.detenteur, c.part * p.pct / 100 FROM participations p JOIN chaine c ON p.detenue = c.siren), beneficiaires AS (SELECT REPLACE(siren, 'PERSONNE:', '') AS nom FROM chaine WHERE siren LIKE 'PERSONNE:%' AND part > 50), suivi(adresse, saut, chemin, quand) AS (SELECT 'bc1q-eclipse-7f3a', 0, 'bc1q-eclipse-7f3a', '2027-05-12 00:00:00' UNION ALL SELECT t.vers, s.saut + 1, s.chemin || ' > ' || t.vers, t.horodatage FROM tx_crypto t JOIN suivi s ON t.de = s.adresse WHERE s.saut < 8 AND t.horodatage > s.quand AND instr(s.chemin, t.vers) = 0), kyc AS (SELECT DISTINCT w.kyc_nom FROM suivi s JOIN wallets w ON w.adresse = s.adresse WHERE w.type = 'exchange'), effaceurs AS (SELECT DISTINCT c.nom_complet FROM journal_brigade j JOIN consultants c ON c.login = j.login WHERE j.action = 'DELETE' AND j.table_cible = 'pieces') SELECT b.nom FROM beneficiaires b WHERE UPPER(SUBSTR(b.nom, 1, 1) || '. ' || SUBSTR(b.nom, INSTR(b.nom, ' ') + 1)) IN (SELECT kyc_nom FROM kyc) AND b.nom IN (SELECT nom_complet FROM effaceurs);`,
  hints:["Trois CTE : beneficiaires (chaîne de propriété), kyc (suivi crypto), effaceurs (journal + consultants).","WHERE format_kyc IN (SELECT kyc_nom FROM kyc) AND b.nom IN (SELECT nom_complet FROM effaceurs)","Repars des solutions de 18.3, 18.5 et 19.4."],
  require:[{re:'RECURSIVE', msg:"Les pistes de propriété et de crypto exigent une CTE récursive."},{re:'^(?![\\s\\S]*(Ouali|OUALI|consultant\\.fo|512000|EXCH-NEO))', msg:"Ne recopie aucune valeur trouvée avant (nom, login, SIREN, compte d'échange) : la requête doit tout retrouver seule."}],
  check:{strictCols:true}
});
mis({ id:'22.3', ch:22, title:'Le dernier mot', xp:300, who:'varga',
  story:`6h58. La juge relit ta requête, la relance elle-même, obtient la même ligne. Elle signe le mandat d'arrêt européen. Il ne reste qu'à inscrire le nom au procès-verbal, par requête.`,
  lesson:`<p>Récapitulatif de la Saison 2 : agrégation conditionnelle (épisode 14), JSON (15), gaps and islands (16), analyse réseau (17), graphes et chaînes de propriété (18), triggers et audit (19), performance (20), qualité des données (21). Tu as fini le parcours.</p>`,
  setup: "CREATE TABLE proces_verbal (affaire TEXT NOT NULL, coupable TEXT NOT NULL, preuve TEXT);",
  task:`Insère dans <code>proces_verbal</code> une ligne : affaire 'Éclipse', coupable = nom complet du consultant (<code>consultants.nom_complet</code>) dont le login a effectué des actions 'DELETE' dans <code>journal_brigade</code>, preuve 'effacement de pièces'. Avec un <code>INSERT ... SELECT</code>.`,
  solution:`INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT DISTINCT 'Éclipse', c.nom_complet, 'effacement de pièces' FROM consultants c JOIN journal_brigade j ON j.login = c.login WHERE j.action = 'DELETE';`,
  hints:["JOIN journal_brigade j ON j.login = c.login WHERE j.action = 'DELETE'","DISTINCT pour une seule ligne"],
  require:[{re:'journal_brigade', msg:"Pars des données : ta requête doit utiliser la table journal_brigade."},{re:'INSERT', msg:"Écris le procès-verbal avec un INSERT."},{re:'SELECT', msg:"Le nom doit venir d'une requête (INSERT ... SELECT), pas être tapé à la main."},{re:'^(?![\\s\\S]*(Ouali|consultant\\.fo))', msg:"Ne tape pas le nom ni le login : la requête doit les retrouver."}],
  check:{mode:'dml', verify:["SELECT affaire, coupable FROM proces_verbal"]},
  success:`Genève, 7h04. Farid Ouali est interpellé en salle d'embarquement. Opération Éclipse : terminée. La Brigade Data devient l'unité de référence européenne. Et toi, tu n'es plus une recrue.`
});
