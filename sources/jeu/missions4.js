// SAISON 3 : OPÉRATION SYNAPSE (épisodes 23 à 31) : data et IA, toujours en SQL
const VARGA_REF = "SELECT j.key AS k, j.value AS v FROM voix_ref r, json_each(r.vecteur) j WHERE r.locuteur = 'Inès Varga'";

/* ============ 23 ============ */
chap({ id:23, season:3, code:'23', title:'La nuit du 29 février', subtitle:'Profiler un jeu de données : volumes, valeurs manquantes, déséquilibre, doublons',
  intro:`<p>Février 2028. Depuis deux semaines, la préfecture confie la répartition des patrouilles à <b>VIGIE</b>, une intelligence artificielle de la start-up <b>NeuroCité</b>. VIGIE apprend des incidents passés et prédit, quartier par quartier, où le risque sera élevé.</p>
<p>Nuit du 29 février, celle qui n'existe qu'une année sur quatre. VIGIE retire <b>toutes</b> les patrouilles de La Défense. À 1h, un commando vide le data center DataSeine de Puteaux : six serveurs de calcul, plus de 2 millions d'euros.</p>
<p class="quote">« Une IA ne se trompe pas toute seule. On lui a appris à se tromper. Et une IA, ça apprend dans une base de données. » (Byte)</p>`,
  oracle:`<p>Le profilage de données est la première étape de tout projet d'IA, quel que soit l'outil. Les mêmes requêtes tournent en Oracle, PostgreSQL ou BigQuery. Dans les plateformes de data science, on trouve aussi des fonctions prêtes à l'emploi (<code>APPROX_COUNT_DISTINCT</code> en Oracle et BigQuery, <code>ANALYZE</code> et les statistiques de <code>pg_stats</code> en PostgreSQL).</p>`,
  quiz:[
    {q:"Un jeu de données avec 95 % d'exemples « sans risque » et 5 % « à risque » est :", o:["Équilibré","Déséquilibré : un modèle qui répond toujours « sans risque » aurait 95 % de bonnes réponses","Inutilisable","Parfait pour l'apprentissage"], a:1, e:"C'est le piège du déséquilibre de classes : l'exactitude seule ne veut rien dire."},
    {q:"<code>AVG(label_risque)</code> sur une colonne qui vaut 0 ou 1 donne :", o:["Une erreur","La proportion de lignes à 1","Le nombre de lignes à 1","Toujours 0,5"], a:1, e:"La moyenne d'une variable 0/1 est une proportion. Astuce très utilisée en data."},
    {q:"Pourquoi chercher les doublons dans des données d'entraînement ?", o:["Pour gagner de la place uniquement","Parce qu'ils faussent l'apprentissage et l'évaluation (un même exemple compté deux fois, parfois des deux côtés du découpage train/test)","Ce n'est pas utile","Parce que SQL l'exige"], a:1, e:"Les doublons sont l'une des causes classiques de fuite de données."}
  ]});
mis({ id:'23.1', ch:23, title:'Le jeu de données', who:'byte',
  story:`Byte pose son ordinateur sur la table de crise : « VIGIE a appris sur la table <code>dataset_vigie</code>. Une ligne par quartier, par jour et par créneau. La colonne <code>label_risque</code>, c'est ce qu'on lui a appris : 1 pour risque élevé, 0 sinon. Combien d'exemples de chaque ? »`,
  lesson:`<p>Un <b>jeu de données d'entraînement</b>, c'est une table : chaque ligne est un exemple, chaque colonne une <b>variable</b> (feature), et une colonne spéciale est la <b>cible</b> (label), ce que le modèle doit apprendre à prédire.</p>
<pre class="code">SELECT label, COUNT(*) AS nb
FROM exemples
GROUP BY label;</pre>`,
  task:`Affiche <code>label_risque</code> et <code>nb</code> (nombre d'exemples), triés par <code>label_risque</code>.`,
  solution:`SELECT label_risque, COUNT(*) AS nb FROM dataset_vigie GROUP BY label_risque ORDER BY label_risque;`,
  hints:["GROUP BY label_risque"], check:{ordered:true}
});
mis({ id:'23.2', ch:23, title:'Les trous', who:'byte',
  story:`« Avant d'accuser l'IA, vérifions la qualité des données. Quelle part de lignes n'a pas de météo renseignée ? »`,
  lesson:`<p>Le <b>taux de valeurs manquantes</b> d'une colonne : le nombre de NULL divisé par le nombre de lignes. Attention à la division entière : multiplie par <code>100.0</code> pour obtenir un nombre décimal.</p>
<pre class="code">SELECT 100.0 * SUM(CASE WHEN col IS NULL THEN 1 ELSE 0 END) / COUNT(*)
FROM t;
-- ou : 100.0 * (COUNT(*) - COUNT(col)) / COUNT(*)</pre>`,
  task:`Affiche <code>lignes</code> (nombre total), <code>meteo_manquante</code> (nombre de NULL dans <code>meteo</code>) et <code>pct</code> (pourcentage, arrondi à 1 décimale).`,
  solution:`SELECT COUNT(*) AS lignes, COUNT(*) - COUNT(meteo) AS meteo_manquante, ROUND(100.0 * (COUNT(*) - COUNT(meteo)) / COUNT(*), 1) AS pct FROM dataset_vigie;`,
  hints:["COUNT(*) - COUNT(meteo) compte les NULL.","ROUND(100.0 * ... / COUNT(*), 1)"], check:{strictCols:true}
});
mis({ id:'23.3', ch:23, title:'Le risque par quartier', who:'byte',
  story:`« Quelle proportion d'exemples est étiquetée « à risque » dans chaque quartier ? »`,
  lesson:`<p>La moyenne d'une colonne qui vaut 0 ou 1 est une <b>proportion</b> : <code>AVG(label)</code> donne directement le taux de 1.</p>
<pre class="code">SELECT ville, ROUND(100.0 * AVG(tatouages = 'Oui'), 1) AS pct_tatoues
FROM suspects GROUP BY ville;</pre>`,
  task:`Affiche <code>quartier</code>, <code>exemples</code> et <code>pct_risque</code> (pourcentage de <code>label_risque = 1</code>, arrondi à 1 décimale), triés par <code>pct_risque</code> décroissant.`,
  solution:`SELECT quartier, COUNT(*) AS exemples, ROUND(100.0 * AVG(label_risque), 1) AS pct_risque FROM dataset_vigie GROUP BY quartier ORDER BY pct_risque DESC;`,
  hints:["ROUND(100.0 * AVG(label_risque), 1)"], check:{ordered:true, orderKeys:[2]}
});
mis({ id:'23.4', ch:23, title:'Les jumeaux', who:'byte',
  story:`« Normalement, il y a une seule ligne par quartier, date et créneau. Vérifie. »`,
  lesson:`<p>On cherche les doublons sur une <b>clé métier</b> (ici le trio quartier, date, créneau), qui n'est pas la clé primaire technique <code>id</code>.</p>`,
  task:`Affiche <code>quartier</code>, <code>date</code>, <code>creneau</code> et <code>nb</code> pour les combinaisons présentes plus d'une fois.`,
  solution:`SELECT quartier, date, creneau, COUNT(*) AS nb FROM dataset_vigie GROUP BY quartier, date, creneau HAVING COUNT(*) > 1;`,
  hints:["GROUP BY quartier, date, creneau HAVING COUNT(*) > 1"],
  success:`25 doublons. Byte fronce les sourcils : « On verra ça avec le découpage train/test. Ce genre de détail fait tricher un modèle. »`
});
boss({ id:'23.5', ch:23, tail:false, title:'Boss : la fiche d\'identité des données', who:'varga2', timer:480,
  story:`Varga : « La préfète veut comprendre ce qu'on a donné à manger à cette IA. Une ligne par quartier : nombre d'exemples, pourcentage à risque, pourcentage de météo manquante, première et dernière date. »`,
  lesson:`<p>Le boss combine tout l'épisode dans un seul GROUP BY.</p>`,
  task:`Affiche <code>quartier</code>, <code>exemples</code>, <code>pct_risque</code> et <code>pct_meteo_nulle</code> (arrondis à 1 décimale), <code>debut</code> (MIN date) et <code>fin</code> (MAX date), triés par <code>quartier</code>.`,
  solution:`SELECT quartier, COUNT(*) AS exemples, ROUND(100.0 * AVG(label_risque), 1) AS pct_risque, ROUND(100.0 * (COUNT(*) - COUNT(meteo)) / COUNT(*), 1) AS pct_meteo_nulle, MIN(date) AS debut, MAX(date) AS fin FROM dataset_vigie GROUP BY quartier ORDER BY quartier;`,
  hints:["Un seul GROUP BY quartier avec six expressions."], check:{ordered:true},
  success:`Rien d'anormal à première vue : même période, mêmes volumes. Byte : « C'est bien ça le problème. Le poison ne se voit pas dans les moyennes. »`
});

/* ============ 24 ============ */
chap({ id:24, season:3, code:'24', title:'Les variables', subtitle:'Feature engineering en SQL : tranches, encodage, normalisation, fenêtres',
  intro:`<p>NeuroCité ouvre ses locaux à la brigade. Dans l'open space, des écrans affichent des courbes. La présidente, <b>Léa Fontaine</b>, est livide. Le directeur data science, <b>Maxime Delorme</b>, est plus calme : « VIGIE ne fait qu'apprendre de vos données, commissaire. »</p>
<p>Pour comprendre ce que le modèle « voit », il faut reconstruire ses <b>variables</b> : c'est le feature engineering, et 80 % du temps il se fait en SQL.</p>`,
  oracle:`<p>Les techniques de cet épisode sont universelles. BigQuery ML entraîne même des modèles directement en SQL (<code>CREATE MODEL ...</code>), Oracle Machine Learning avec <code>DBMS_DATA_MINING.CREATE_MODEL</code>, à partir de features préparées exactement comme ici.</p>`,
  quiz:[
    {q:"Le « one-hot encoding » d'une colonne jour (lundi... dimanche) :", o:["Remplace le jour par un nombre de 1 à 7","Crée une colonne 0/1 par valeur possible","Supprime la colonne","Trie les jours"], a:1, e:"Un modèle ne doit pas croire que dimanche (7) vaut « plus » que lundi (1)."},
    {q:"La normalisation min-max ramène une valeur dans :", o:["[-1, 1]","[0, 1], avec (x - min) / (max - min)","[0, 100]","Les entiers"], a:1, e:"Utile quand les variables ont des échelles très différentes."},
    {q:"Une variable « incidents des 7 derniers jours » se calcule avec :", o:["Un simple WHERE","Une fonction de fenêtrage sur les lignes précédentes","Un DISTINCT","Un UNION"], a:1, e:"SUM(...) OVER (ORDER BY jour ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING), par exemple."}
  ]});
mis({ id:'24.1', ch:24, title:'Les tranches', who:'byte',
  story:`« Le modèle reçoit l'historique des incidents (<code>incidents_7j</code>). Regroupons-le en tranches lisibles : <b>calme</b> sous 5, <b>moyen</b> de 5 à 9, <b>chaud</b> à 10 et plus. Combien d'exemples par tranche ? »`,
  lesson:`<p>Le <b>binning</b> (découpage en tranches) transforme une variable continue en catégories, avec un CASE. On peut grouper directement sur l'expression.</p>`,
  task:`Affiche <code>tranche</code> et <code>nb</code>, avec les tranches 'calme' (&lt; 5), 'moyen' (5 à 9) et 'chaud' (10 et plus).`,
  solution:`SELECT CASE WHEN incidents_7j < 5 THEN 'calme' WHEN incidents_7j < 10 THEN 'moyen' ELSE 'chaud' END AS tranche, COUNT(*) AS nb FROM dataset_vigie GROUP BY tranche;`,
  hints:["CASE WHEN incidents_7j < 5 THEN 'calme' WHEN incidents_7j < 10 THEN 'moyen' ELSE 'chaud' END","GROUP BY tranche"]
});
mis({ id:'24.2', ch:24, title:'Le one-hot', who:'byte',
  story:`« Le créneau est un texte. Un modèle ne comprend que des nombres : une colonne 0/1 par créneau. Montre-moi les 8 premières lignes encodées. »`,
  lesson:`<p>Le <b>one-hot encoding</b> crée une colonne par valeur possible, qui vaut 1 si la ligne a cette valeur, 0 sinon. En SQLite, une comparaison vaut déjà 1 ou 0 :</p>
<pre class="code">SELECT id, (sexe = 'H') AS est_homme, (sexe = 'F') AS est_femme
FROM suspects;</pre>`,
  task:`Affiche <code>id</code>, <code>c_nuit</code>, <code>c_matin</code>, <code>c_aprem</code>, <code>c_soir</code> (0 ou 1) pour les 8 premières lignes par <code>id</code>.`,
  solution:`SELECT id, (creneau = 'nuit') AS c_nuit, (creneau = 'matin') AS c_matin, (creneau = 'aprem') AS c_aprem, (creneau = 'soir') AS c_soir FROM dataset_vigie ORDER BY id LIMIT 8;`,
  hints:["(creneau = 'nuit') AS c_nuit, etc.","ORDER BY id LIMIT 8"], check:{ordered:true, strictCols:true}
});
mis({ id:'24.3', ch:24, title:'La normalisation', who:'byte',
  story:`« Dernière transformation : ramener <code>incidents_7j</code> entre 0 et 1. Pour La Défense, le 1er février. »`,
  lesson:`<p>La <b>normalisation min-max</b> : <code>(x - min) / (max - min)</code>. Les MIN et MAX de toute la table s'obtiennent sans GROUP BY avec une fenêtre vide :</p>
<pre class="code">SELECT x, (x - MIN(x) OVER ()) * 1.0 / (MAX(x) OVER () - MIN(x) OVER ()) AS x_norm
FROM t;</pre>
<p>Le minimum et le maximum doivent être calculés sur <b>toute</b> la table, avant de filtrer : on le fait dans une CTE.</p>`,
  task:`Calcule <code>inc_norm</code> (normalisation min-max sur toute la table, arrondie à 3 décimales), puis affiche <code>id</code>, <code>creneau</code>, <code>incidents_7j</code>, <code>inc_norm</code> pour La Défense le <code>'2028-02-01'</code>.`,
  solution:`WITH n AS (SELECT id, quartier, date, creneau, incidents_7j, ROUND((incidents_7j - MIN(incidents_7j) OVER ()) * 1.0 / (MAX(incidents_7j) OVER () - MIN(incidents_7j) OVER ()), 3) AS inc_norm FROM dataset_vigie) SELECT id, creneau, incidents_7j, inc_norm FROM n WHERE quartier = 'La Défense' AND date = '2028-02-01';`,
  hints:["MIN(incidents_7j) OVER () et MAX(incidents_7j) OVER () dans une CTE","Filtre dans la requête externe, sinon min et max ne portent que sur 4 lignes."]
});
mis({ id:'24.4', ch:24, title:'La mémoire du modèle', who:'byte',
  story:`« VIGIE regarde aussi le passé récent. Pour La Défense, la nuit : nombre d'exemples « à risque » sur les 7 nuits précédentes, nuit par nuit, en février. »`,
  lesson:`<p>Une feature temporelle se calcule avec une fenêtre qui s'arrête <b>avant</b> la ligne courante, pour ne pas utiliser l'information qu'on cherche à prédire :</p>
<pre class="code">SUM(label) OVER (ORDER BY date ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING)</pre>
<p>Utiliser la ligne courante serait une <b>fuite de données</b> : le modèle « verrait » la réponse.</p>`,
  task:`Pour <code>quartier = 'La Défense'</code> et <code>creneau = 'nuit'</code> (une ligne par date, DISTINCT si besoin), affiche <code>date</code>, <code>label_risque</code> et <code>risque_7_nuits</code> (somme des labels des 7 nuits précédentes), pour les dates de février 2028, par date.`,
  solution:`WITH n AS (SELECT date, MAX(label_risque) AS label_risque FROM dataset_vigie WHERE quartier = 'La Défense' AND creneau = 'nuit' GROUP BY date), f AS (SELECT date, label_risque, SUM(label_risque) OVER (ORDER BY date ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) AS risque_7_nuits FROM n) SELECT date, label_risque, risque_7_nuits FROM f WHERE date LIKE '2028-02%' ORDER BY date;`,
  hints:["Une CTE avec une ligne par date (GROUP BY date), puis la fenêtre.","ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING, puis filtre février à la fin."], check:{ordered:true},
  success:`À partir du 1er février, toutes les nuits de La Défense sont étiquetées « sans risque ». Zéro. Pendant un mois entier. Byte : « Ce n'est pas une statistique, c'est une consigne. »`
});
boss({ id:'24.5', ch:24, tail:false, title:'Boss : le paradoxe de La Défense', who:'varga2', timer:540,
  story:`Varga : « Je veux la preuve chiffrée, mois par mois : pour La Défense la nuit, le pourcentage d'exemples étiquetés à risque, et le pourcentage d'incidents <b>réellement</b> survenus (colonne <code>reel</code>). »`,
  lesson:`<p><code>label_risque</code> est ce qu'on a <b>appris</b> au modèle ; <code>reel</code> est ce qui s'est <b>vraiment</b> passé. Normalement, les deux évoluent ensemble. <code>strftime('%Y-%m', date)</code> donne le mois.</p>`,
  task:`Pour La Défense, créneau 'nuit', affiche <code>mois</code>, <code>pct_label</code> et <code>pct_reel</code> (pourcentages arrondis à 1 décimale), par mois.`,
  solution:`SELECT strftime('%Y-%m', date) AS mois, ROUND(100.0 * AVG(label_risque), 1) AS pct_label, ROUND(100.0 * AVG(reel), 1) AS pct_reel FROM dataset_vigie WHERE quartier = 'La Défense' AND creneau = 'nuit' GROUP BY mois ORDER BY mois;`,
  hints:["GROUP BY strftime('%Y-%m', date)","AVG(label_risque) et AVG(reel)"], check:{ordered:true},
  success:`De septembre à janvier, les étiquettes suivent à peu près la réalité. En février : 0 % d'étiquettes à risque, alors que 72 % des nuits ont connu un incident réel. Quelqu'un a <b>réécrit les étiquettes</b>.`
});

/* ============ 25 ============ */
chap({ id:25, season:3, code:'25', title:'Le grand partage', subtitle:'Train, test, fuites de données et découpage temporel',
  intro:`<p>Pour mesurer si un modèle est bon, on le teste sur des exemples qu'il n'a <b>jamais vus</b> : le jeu de <b>test</b>, séparé du jeu d'<b>entraînement</b> (train). La colonne <code>split</code> de <code>dataset_vigie</code> indique à quel jeu appartient chaque ligne.</p>
<p>Maxime Delorme assure que « les métriques étaient excellentes ». Byte veut vérifier que l'examen n'était pas truqué.</p>
<p class="quote">« Un modèle testé sur ce qu'il a appris, c'est un élève qui a les réponses de l'examen. » (Byte)</p>`,
  oracle:`<p>Le découpage déterministe par hachage existe partout : <code>ORA_HASH(id, 9)</code> en Oracle, <code>abs(hashtext(id::text)) % 10</code> en PostgreSQL, <code>FARM_FINGERPRINT</code> en BigQuery. Avantage sur <code>RANDOM()</code> : le même exemple tombe toujours du même côté, à chaque exécution.</p>`,
  quiz:[
    {q:"Une « fuite de données » (data leakage), c'est :", o:["Un piratage","Une information du test ou du futur présente dans l'entraînement, qui gonfle artificiellement les résultats","Un NULL","Une table supprimée"], a:1, e:"Le modèle paraît excellent en test, puis s'effondre en vrai."},
    {q:"Pour des données temporelles, le bon découpage est :", o:["Au hasard","Entraîner sur le passé, tester sur une période postérieure","Tester sur le passé","Peu importe"], a:1, e:"Sinon le modèle apprend du futur pour prédire le passé."},
    {q:"Pourquoi éviter <code>ORDER BY RANDOM()</code> pour découper ?", o:["C'est interdit","Le découpage change à chaque exécution : les résultats ne sont pas reproductibles","C'est trop rapide","Ça supprime des lignes"], a:1, e:"Un découpage par règle fixe (id % 5, hachage, date) est reproductible."}
  ]});
mis({ id:'25.1', ch:25, title:'Les deux paquets', who:'byte',
  story:`« Combien d'exemples en train et en test, et quelle proportion de chaque ? »`,
  lesson:`<p>La part de chaque groupe dans le total : on divise par le total, obtenu avec une fenêtre vide.</p>
<pre class="code">SELECT ville, COUNT(*) AS nb,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM suspects GROUP BY ville;</pre>
<p>Une fonction de fenêtrage peut s'appliquer au résultat d'un agrégat : <code>SUM(COUNT(*)) OVER ()</code> additionne les comptes de tous les groupes.</p>`,
  task:`Affiche <code>split</code>, <code>nb</code> et <code>pct</code> (part du total, arrondie à 1 décimale).`,
  solution:`SELECT split, COUNT(*) AS nb, ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct FROM dataset_vigie GROUP BY split;`,
  hints:["SUM(COUNT(*)) OVER () donne le total."], require:[{re:'OVER', msg:"Utilise SUM(COUNT(*)) OVER () pour le total."}]
});
mis({ id:'25.2', ch:25, title:'Les candidats libres', who:'byte',
  story:`« Le pire : les mêmes situations (quartier, date, créneau) dans les deux paquets. Le modèle a révisé sur des copies de l'examen. Combien ? »`,
  lesson:`<p>INTERSECT trouve les combinaisons présentes des deux côtés. On compte ensuite avec une sous-requête dans le FROM.</p>`,
  task:`Affiche <code>fuites</code> : le nombre de combinaisons (quartier, date, creneau) présentes à la fois dans le train et dans le test.`,
  solution:`SELECT COUNT(*) AS fuites FROM (SELECT quartier, date, creneau FROM dataset_vigie WHERE split = 'train' INTERSECT SELECT quartier, date, creneau FROM dataset_vigie WHERE split = 'test');`,
  hints:["SELECT COUNT(*) FROM (SELECT ... WHERE split = 'train' INTERSECT SELECT ... WHERE split = 'test')"], require:[{re:'INTERSECT', msg:"Utilise INTERSECT."}]
});
mis({ id:'25.3', ch:25, title:'Le futur dans le passé', who:'byte',
  story:`« Autre problème : les exemples de test sont tirés au hasard sur toute la période. VIGIE a donc appris sur des jours <b>postérieurs</b> à certains jours de test. Pour chaque mois, combien de lignes de test ? »`,
  lesson:`<p>Pour des données qui évoluent dans le temps, le test doit être <b>après</b> l'entraînement. Un tableau croisé par mois le montre d'un coup d'œil.</p>`,
  task:`Affiche <code>mois</code>, <code>train</code> et <code>test</code> (nombre de lignes de chaque split), par mois croissant.`,
  solution:`SELECT strftime('%Y-%m', date) AS mois, SUM(CASE WHEN split = 'train' THEN 1 ELSE 0 END) AS train, SUM(CASE WHEN split = 'test' THEN 1 ELSE 0 END) AS test FROM dataset_vigie GROUP BY mois ORDER BY mois;`,
  hints:["Tableau croisé : SUM(CASE WHEN split = 'train' THEN 1 ELSE 0 END)","GROUP BY strftime('%Y-%m', date)"], check:{ordered:true}
});
mis({ id:'25.4', ch:25, title:'Le découpage propre', who:'byte',
  story:`« On refait le partage correctement : tout ce qui est avant le 1er février 2028 sert à l'entraînement, février sert de test. Combien d'exemples de chaque côté, et quelle part à risque ? »`,
  lesson:`<p>Un découpage <b>temporel</b> : une simple condition sur la date, dans un CASE.</p>`,
  task:`Affiche <code>jeu</code> ('train' si date &lt; '2028-02-01', sinon 'test'), <code>nb</code> et <code>pct_risque</code> (arrondi à 1 décimale), triés par <code>jeu</code> décroissant.`,
  solution:`SELECT CASE WHEN date < '2028-02-01' THEN 'train' ELSE 'test' END AS jeu, COUNT(*) AS nb, ROUND(100.0 * AVG(label_risque), 1) AS pct_risque FROM dataset_vigie GROUP BY jeu ORDER BY jeu DESC;`,
  hints:["CASE WHEN date < '2028-02-01' THEN 'train' ELSE 'test' END AS jeu"], check:{ordered:true}
});
boss({ id:'25.5', ch:25, tail:false, title:'Boss : le banc d\'essai', who:'varga2', timer:540,
  story:`Varga : « Byte, prépare-nous un banc d'essai propre et réutilisable : deux vues, une pour l'entraînement, une pour le test, sans doublon et sans fuite. »`,
  lesson:`<p>Pour dédoublonner, on garde une seule ligne par clé métier (le plus petit <code>id</code>). Les vues rendent le découpage réutilisable par toute l'équipe.</p>
<pre class="code">CREATE VIEW v AS
SELECT * FROM t
WHERE id IN (SELECT MIN(id) FROM t GROUP BY cle1, cle2);</pre>`,
  task:`Crée <code>v_train</code> (dates avant '2028-02-01') et <code>v_test</code> (dates à partir de '2028-02-01'), contenant toutes les colonnes de <code>dataset_vigie</code>, en ne gardant que la ligne de plus petit <code>id</code> par (quartier, date, creneau).`,
  solution:`CREATE VIEW v_train AS SELECT * FROM dataset_vigie WHERE date < '2028-02-01' AND id IN (SELECT MIN(id) FROM dataset_vigie GROUP BY quartier, date, creneau); CREATE VIEW v_test AS SELECT * FROM dataset_vigie WHERE date >= '2028-02-01' AND id IN (SELECT MIN(id) FROM dataset_vigie GROUP BY quartier, date, creneau);`,
  hints:["id IN (SELECT MIN(id) FROM dataset_vigie GROUP BY quartier, date, creneau)","Deux CREATE VIEW séparés par un point-virgule."],
  check:{mode:'dml', verify:["SELECT COUNT(*), MIN(date), MAX(date) FROM v_train","SELECT COUNT(*), MIN(date), MAX(date) FROM v_test","SELECT COUNT(*) FROM (SELECT quartier, date, creneau FROM v_train INTERSECT SELECT quartier, date, creneau FROM v_test)"]},
  success:`Un banc d'essai propre. Maintenant, on peut juger VIGIE honnêtement.`
});

/* ============ 26 ============ */
chap({ id:26, season:3, code:'26', title:'Le procès de VIGIE', subtitle:'Évaluer un modèle : matrice de confusion, précision, rappel, F1, équité, seuils',
  intro:`<p>La table <code>predictions_vigie</code> contient les scores de deux versions du modèle sur le jeu de test : <b>v1</b> (janvier) et <b>v2</b> (mise en production le 21 février). <code>score</code> est une probabilité entre 0 et 1, <code>prediction</code> vaut 1 si le score atteint 0,5.</p>
<p>La préfète convoque une réunion : faut-il débrancher VIGIE ? Il faut des chiffres, pas des impressions.</p>`,
  oracle:`<p>Oracle Machine Learning fournit des fonctions d'évaluation toutes faites, et les librairies Python (scikit-learn) aussi. Mais calculer une matrice de confusion en SQL reste la façon la plus sûre de vérifier un modèle directement là où sont les données, et c'est une question classique d'entretien en data.</p>`,
  quiz:[
    {q:"Le <b>rappel</b> (recall) mesure :", o:["La part de prédictions positives qui sont justes","La part des vrais cas positifs que le modèle a détectés","Le nombre d'erreurs","La vitesse du modèle"], a:1, e:"Rappel = TP / (TP + FN). Ici : sur toutes les nuits vraiment dangereuses, combien VIGIE en a vu."},
    {q:"La <b>précision</b> mesure :", o:["TP / (TP + FP) : parmi les alertes, la part de vraies","TP / (TP + FN)","(TP + TN) / total","FP / FN"], a:0, e:"Une IA qui alerte tout le temps a un rappel parfait mais une précision médiocre."},
    {q:"Un modèle juste « en moyenne » peut être injuste pour un groupe :", o:["Faux","Vrai : il faut mesurer les performances par sous-groupe (ici par quartier)","Seulement en deep learning","Seulement avec des NULL"], a:1, e:"C'est le principe de l'audit d'équité (fairness)."}
  ]});
mis({ id:'26.1', ch:26, title:'La matrice de confusion', who:'byte',
  story:`« Commençons par la v1. Combien de vrais positifs, de faux positifs, de faux négatifs et de vrais négatifs ? »`,
  lesson:`<p>La <b>matrice de confusion</b> croise la prédiction et la réalité :</p>
<table class="mini"><tr><th></th><th>réel = 1</th><th>réel = 0</th></tr><tr><th>prédit 1</th><td>TP (vrai positif)</td><td>FP (fausse alerte)</td></tr><tr><th>prédit 0</th><td>FN (raté)</td><td>TN (vrai négatif)</td></tr></table>
<pre class="code">SUM(CASE WHEN prediction = 1 AND reel = 1 THEN 1 ELSE 0 END) AS tp</pre>
<p>On compare la prédiction à la <b>réalité</b> (<code>reel</code>), pas au label d'entraînement, qui peut être faux.</p>`,
  task:`Pour le modèle 'v1', joins <code>predictions_vigie</code> à <code>dataset_vigie</code> et affiche <code>tp</code>, <code>fp</code>, <code>fn</code>, <code>tn</code>.`,
  solution:`SELECT SUM(CASE WHEN p.prediction = 1 AND d.reel = 1 THEN 1 ELSE 0 END) AS tp, SUM(CASE WHEN p.prediction = 1 AND d.reel = 0 THEN 1 ELSE 0 END) AS fp, SUM(CASE WHEN p.prediction = 0 AND d.reel = 1 THEN 1 ELSE 0 END) AS fn, SUM(CASE WHEN p.prediction = 0 AND d.reel = 0 THEN 1 ELSE 0 END) AS tn FROM predictions_vigie p JOIN dataset_vigie d ON d.id = p.dataset_id WHERE p.modele = 'v1';`,
  hints:["JOIN dataset_vigie d ON d.id = p.dataset_id","Quatre SUM(CASE WHEN ... THEN 1 ELSE 0 END)"], check:{strictCols:true}
});
mis({ id:'26.2', ch:26, title:'Précision et rappel', who:'byte',
  story:`« Transforme ça en métriques : exactitude, précision, rappel, pour les deux versions. »`,
  lesson:`<pre class="code">exactitude = (TP + TN) / total
précision  = TP / (TP + FP)
rappel     = TP / (TP + FN)</pre>
<p>Calcule d'abord la matrice dans une CTE, puis les ratios avec <code>1.0 *</code> pour éviter la division entière.</p>`,
  task:`Pour chaque <code>modele</code>, affiche <code>exactitude</code>, <code>precision</code> et <code>rappel</code>, arrondis à 3 décimales, par modèle.`,
  solution:`WITH m AS (SELECT p.modele, SUM(CASE WHEN p.prediction = 1 AND d.reel = 1 THEN 1 ELSE 0 END) AS tp, SUM(CASE WHEN p.prediction = 1 AND d.reel = 0 THEN 1 ELSE 0 END) AS fp, SUM(CASE WHEN p.prediction = 0 AND d.reel = 1 THEN 1 ELSE 0 END) AS fn, SUM(CASE WHEN p.prediction = 0 AND d.reel = 0 THEN 1 ELSE 0 END) AS tn FROM predictions_vigie p JOIN dataset_vigie d ON d.id = p.dataset_id GROUP BY p.modele) SELECT modele, ROUND(1.0 * (tp + tn) / (tp + fp + fn + tn), 3) AS exactitude, ROUND(1.0 * tp / (tp + fp), 3) AS precision, ROUND(1.0 * tp / (tp + fn), 3) AS rappel FROM m ORDER BY modele;`,
  hints:["CTE m : la matrice GROUP BY p.modele","ROUND(1.0 * tp / (tp + fn), 3) AS rappel"], check:{ordered:true},
  success:`La v2 a une exactitude presque identique à la v1. Mais son rappel baisse nettement. Delorme avait raison sur un point : « les métriques globales étaient bonnes ». C'est justement le piège.`
});
mis({ id:'26.3', ch:26, title:'Le F1', who:'byte',
  story:`« Le F1-score résume précision et rappel en un seul nombre. Calcule-le pour les deux versions. »`,
  lesson:`<p>Le <b>F1</b> est la moyenne harmonique de la précision et du rappel :</p>
<pre class="code">F1 = 2 * TP / (2 * TP + FP + FN)</pre>
<p>Il est bas dès que l'une des deux est mauvaise.</p>`,
  task:`Affiche <code>modele</code> et <code>f1</code> (arrondi à 3 décimales), par modèle.`,
  solution:`WITH m AS (SELECT p.modele, SUM(CASE WHEN p.prediction = 1 AND d.reel = 1 THEN 1 ELSE 0 END) AS tp, SUM(CASE WHEN p.prediction = 1 AND d.reel = 0 THEN 1 ELSE 0 END) AS fp, SUM(CASE WHEN p.prediction = 0 AND d.reel = 1 THEN 1 ELSE 0 END) AS fn FROM predictions_vigie p JOIN dataset_vigie d ON d.id = p.dataset_id GROUP BY p.modele) SELECT modele, ROUND(2.0 * tp / (2 * tp + fp + fn), 3) AS f1 FROM m ORDER BY modele;`,
  hints:["2.0 * tp / (2 * tp + fp + fn)"], check:{ordered:true}
});
mis({ id:'26.4', ch:26, title:'L\'audit d\'équité', who:'varga',
  story:`Varga : « Je veux le rappel <b>par quartier</b>, pour la v1 et la v2, côte à côte. Si VIGIE abandonne un quartier, ça doit se voir. »`,
  lesson:`<p>Un modèle juste en moyenne peut échouer complètement sur un groupe. L'<b>audit d'équité</b> calcule les métriques par sous-groupe. Ici, un tableau croisé avec une colonne par modèle :</p>
<pre class="code">1.0 * SUM(CASE WHEN modele = 'v1' AND prediction = 1 AND reel = 1 THEN 1 ELSE 0 END)
    / SUM(CASE WHEN modele = 'v1' AND reel = 1 THEN 1 ELSE 0 END)</pre>`,
  task:`Affiche <code>quartier</code>, <code>rappel_v1</code>, <code>rappel_v2</code> (arrondis à 3 décimales) et <code>ecart</code> (v2 moins v1, arrondi à 3 décimales), triés par <code>ecart</code> croissant.`,
  solution:`WITH r AS (SELECT d.quartier, 1.0 * SUM(CASE WHEN p.modele = 'v1' AND p.prediction = 1 AND d.reel = 1 THEN 1 ELSE 0 END) / SUM(CASE WHEN p.modele = 'v1' AND d.reel = 1 THEN 1 ELSE 0 END) AS r1, 1.0 * SUM(CASE WHEN p.modele = 'v2' AND p.prediction = 1 AND d.reel = 1 THEN 1 ELSE 0 END) / SUM(CASE WHEN p.modele = 'v2' AND d.reel = 1 THEN 1 ELSE 0 END) AS r2 FROM predictions_vigie p JOIN dataset_vigie d ON d.id = p.dataset_id GROUP BY d.quartier) SELECT quartier, ROUND(r1, 3) AS rappel_v1, ROUND(r2, 3) AS rappel_v2, ROUND(r2 - r1, 3) AS ecart FROM r ORDER BY ecart;`,
  hints:["Une CTE avec deux rappels par quartier (agrégation conditionnelle).","ROUND(r2 - r1, 3) AS ecart, ORDER BY ecart"], check:{ordered:true, orderKeys:[3]},
  success:`Un seul quartier décroche : <b>La Défense</b>, dont le rappel passe de 0,85 à 0,28. Ailleurs, rien ne bouge. VIGIE v2 a appris à ignorer La Défense, et seulement elle.`
});
boss({ id:'26.5', ch:26, tail:false, title:'Boss : la courbe des seuils', who:'byte', timer:600,
  story:`Delorme objecte : « Il suffit de baisser le seuil de décision. » Byte : « Vérifions. Pour la v2 et La Défense, précision et rappel pour des seuils de 0,1 à 0,9. »`,
  lesson:`<p>Le seuil 0,5 est arbitraire. On peut générer une liste de seuils avec une CTE récursive, puis joindre chaque seuil à toutes les prédictions :</p>
<pre class="code">WITH RECURSIVE s(t) AS (SELECT 0.1 UNION ALL SELECT ROUND(t + 0.1, 1) FROM s WHERE t &lt; 0.9)
SELECT t, ... FROM s, predictions ...
GROUP BY t;</pre>
<p>Ici une prédiction est positive si <code>score &gt;= t</code>.</p>`,
  task:`Pour <code>modele = 'v2'</code> et <code>quartier = 'La Défense'</code>, affiche <code>seuil</code> (0.1 à 0.9), <code>precision</code> et <code>rappel</code> (arrondis à 3 décimales ; précision NULL s'il n'y a aucune alerte), par seuil.`,
  solution:`WITH RECURSIVE s(t) AS (SELECT 0.1 UNION ALL SELECT ROUND(t + 0.1, 1) FROM s WHERE t < 0.9), m AS (SELECT s.t, SUM(CASE WHEN p.score >= s.t AND d.reel = 1 THEN 1 ELSE 0 END) AS tp, SUM(CASE WHEN p.score >= s.t AND d.reel = 0 THEN 1 ELSE 0 END) AS fp, SUM(CASE WHEN p.score < s.t AND d.reel = 1 THEN 1 ELSE 0 END) AS fn FROM s, predictions_vigie p JOIN dataset_vigie d ON d.id = p.dataset_id WHERE p.modele = 'v2' AND d.quartier = 'La Défense' GROUP BY s.t) SELECT t AS seuil, ROUND(1.0 * tp / NULLIF(tp + fp, 0), 3) AS precision, ROUND(1.0 * tp / (tp + fn), 3) AS rappel FROM m ORDER BY seuil;`,
  hints:["CTE récursive s(t) de 0.1 à 0.9","NULLIF(tp + fp, 0) évite la division par zéro."], require:[{re:'RECURSIVE', msg:"Génère les seuils avec une CTE récursive."}], check:{ordered:true},
  success:`Pour retrouver le rappel de la v1, il faut descendre le seuil à 0,1 : à La Défense, la v2 ne donne plus que des scores minuscules. Le modèle n'est pas mal réglé, il a <b>appris</b> que La Défense était sûre. Retour aux données d'entraînement.`
});

/* ============ 27 ============ */
chap({ id:27, season:3, code:'27', title:'Le poison', subtitle:'Détecter l\'empoisonnement des données : annotateurs, vérité terrain, rafales, argent',
  intro:`<p>Les étiquettes de VIGIE viennent d'une plateforme d'<b>annotation</b> : des centaines de travailleurs à distance indiquent, pour chaque situation, si le risque était élevé. Table <code>annotations</code> (item_id, annotateur_id, label, horodatage) et <code>annotateurs</code> (pseudo, inscrit_le, pays, compte_paiement).</p>
<p>Si quelqu'un a infiltré la plateforme, il a pu <b>empoisonner</b> les données : glisser des étiquettes fausses pour qu'une IA apprenne exactement ce qu'il veut.</p>
<p class="quote">« On ne pirate plus le système. On pirate ce qu'il apprend. » (Byte)</p>`,
  oracle:`<p>Le data poisoning est une menace classée dans le top 10 OWASP des applications à base de modèles de langage et dans le référentiel MITRE ATLAS. Les contrôles présentés ici (accord inter-annotateurs, comparaison à une vérité terrain, détection de rafales) se font en SQL sur n'importe quel moteur.</p>`,
  quiz:[
    {q:"L'empoisonnement de données (data poisoning) consiste à :", o:["Effacer la base","Introduire des exemples ou des étiquettes falsifiés dans les données d'entraînement","Chiffrer les données","Ralentir le modèle"], a:1, e:"Le modèle apprend alors un comportement voulu par l'attaquant."},
    {q:"Comparer chaque annotateur à la vérité terrain permet :", o:["De payer les annotateurs","De repérer ceux dont les étiquettes s'écartent anormalement de la réalité","D'accélérer l'annotation","Rien"], a:1, e:"Un annotateur honnête se trompe parfois ; un empoisonneur se trompe systématiquement, et dans le même sens."},
    {q:"Un vote majoritaire protège-t-il toujours contre le poison ?", o:["Oui, toujours","Non : si plusieurs complices annotent le même item, ils font la majorité","Seulement en SQLite","Oui si on a 2 annotateurs"], a:1, e:"Ici, trois faux comptes votaient ensemble contre deux annotateurs honnêtes."}
  ]});
mis({ id:'27.1', ch:27, title:'Qui a étiqueté ?', who:'byte',
  story:`« Les exemples de La Défense la nuit en février : qui les a annotés en dernier ? Regarde la colonne <code>annote_par</code> de <code>dataset_vigie</code>. »`,
  lesson:`<p>Révision : jointure et agrégat. La colonne <code>annote_par</code> renvoie à <code>annotateurs.id</code>.</p>`,
  task:`Pour La Défense, créneaux 'nuit' et 'soir', dates de février 2028, affiche <code>pseudo</code>, <code>inscrit_le</code> et <code>nb</code> (exemples annotés), triés par <code>nb</code> décroissant.`,
  solution:`SELECT a.pseudo, a.inscrit_le, COUNT(*) AS nb FROM dataset_vigie d JOIN annotateurs a ON a.id = d.annote_par WHERE d.quartier = 'La Défense' AND d.creneau IN ('nuit', 'soir') AND d.date LIKE '2028-02%' GROUP BY a.id, a.pseudo, a.inscrit_le ORDER BY nb DESC;`,
  hints:["JOIN annotateurs a ON a.id = d.annote_par","creneau IN ('nuit', 'soir') AND date LIKE '2028-02%'"], check:{ordered:true, orderKeys:[2]},
  success:`Trois pseudos, <b>nova_lab</b>, <b>delta_mind</b> et <b>ariadne_x</b>, inscrits à quelques minutes d'intervalle le 19 février au soir. Et personne d'autre.`
});
mis({ id:'27.2', ch:27, title:'La vérité terrain', who:'byte',
  story:`« Pour chaque annotateur, quelle part de ses étiquettes correspond à ce qui s'est réellement passé ? »`,
  lesson:`<p>La colonne <code>reel</code> de <code>dataset_vigie</code> est la <b>vérité terrain</b>. Pour chaque annotation, <code>(a.label = d.reel)</code> vaut 1 si l'annotateur a vu juste. Sa moyenne est le taux d'accord.</p>`,
  task:`Affiche <code>annotateur_id</code>, <code>nb</code> et <code>accord</code> (part des annotations égales à <code>reel</code>, arrondie à 3 décimales) pour les 5 annotateurs au plus faible accord (puis par <code>annotateur_id</code>).`,
  solution:`SELECT a.annotateur_id, COUNT(*) AS nb, ROUND(AVG(a.label = d.reel), 3) AS accord FROM annotations a JOIN dataset_vigie d ON d.id = a.item_id GROUP BY a.annotateur_id ORDER BY accord, a.annotateur_id LIMIT 5;`,
  hints:["AVG(a.label = d.reel)","ORDER BY accord, annotateur_id LIMIT 5"], check:{ordered:true},
  success:`Les annotateurs honnêtes sont autour de 80 %. Les numéros <b>41, 42 et 43</b> tombent sous 30 % : ils se trompent presque toujours, et toujours dans le même sens.`
});
mis({ id:'27.3', ch:27, title:'La rafale', who:'byte',
  story:`« Un humain annote quelques dizaines d'exemples par heure. Regarde les heures où la plateforme a reçu le plus d'annotations. »`,
  lesson:`<p>Une <b>rafale</b> (burst) se voit en regroupant par tranche de temps. C'est le même réflexe que pour la force brute de la Saison 1.</p>`,
  task:`Affiche <code>heure</code> (format <code>AAAA-MM-JJ HH</code>) et <code>nb</code> pour les 3 heures ayant reçu le plus d'annotations.`,
  solution:`SELECT strftime('%Y-%m-%d %H', horodatage) AS heure, COUNT(*) AS nb FROM annotations GROUP BY heure ORDER BY nb DESC LIMIT 3;`,
  hints:["GROUP BY strftime('%Y-%m-%d %H', horodatage) ORDER BY nb DESC LIMIT 3"], check:{ordered:true}
});
mis({ id:'27.4', ch:27, title:'La majorité truquée', who:'byte',
  story:`« Sur les exemples empoisonnés, il y a eu cinq annotateurs : deux honnêtes, trois faux. Le vote majoritaire a donc donné raison aux faux. Prouve-le : pour chaque exemple de La Défense de février annoté par les comptes 41 à 43, les votes honnêtes et les votes suspects. »`,
  lesson:`<p>Deux agrégations conditionnelles dans le même GROUP BY : une pour les comptes suspects, une pour les autres.</p>`,
  task:`Pour les items annotés par au moins un compte parmi 41, 42, 43 dont le quartier est La Défense et la date en février 2028, affiche <code>votes_suspects_1</code> (somme des labels des comptes 41 à 43), <code>votes_suspects</code> (nombre de leurs votes), <code>votes_honnetes_1</code> et <code>votes_honnetes</code> (idem pour les autres), <b>additionnés</b> sur tous ces items (une seule ligne).`,
  solution:`SELECT SUM(CASE WHEN a.annotateur_id IN (41, 42, 43) THEN a.label ELSE 0 END) AS votes_suspects_1, SUM(CASE WHEN a.annotateur_id IN (41, 42, 43) THEN 1 ELSE 0 END) AS votes_suspects, SUM(CASE WHEN a.annotateur_id NOT IN (41, 42, 43) THEN a.label ELSE 0 END) AS votes_honnetes_1, SUM(CASE WHEN a.annotateur_id NOT IN (41, 42, 43) THEN 1 ELSE 0 END) AS votes_honnetes FROM annotations a JOIN dataset_vigie d ON d.id = a.item_id WHERE d.quartier = 'La Défense' AND d.date LIKE '2028-02%' AND a.item_id IN (SELECT item_id FROM annotations WHERE annotateur_id IN (41, 42, 43));`,
  hints:["SUM(CASE WHEN a.annotateur_id IN (41, 42, 43) THEN a.label ELSE 0 END)","Filtre : item_id IN (SELECT item_id FROM annotations WHERE annotateur_id IN (41, 42, 43))"], check:{strictCols:true},
  success:`Les faux comptes ont voté « sans risque » à chaque fois en février. Les annotateurs honnêtes, eux, votaient « à risque » dans la grande majorité des cas. Trois contre deux : la majorité était truquée.`
});
boss({ id:'27.5', ch:27, tail:false, title:'Boss : qui paie les poisons ?', who:'varga2', timer:540,
  story:`Varga : « Les annotateurs sont payés. Suis l'argent : qui a payé les comptes 41, 42 et 43 ? Remonte jusqu'aux propriétaires. » Tables : <code>paiements_annotation</code> (compte_paiement, payeur_siren), <code>societes</code> et <code>participations</code> de la Saison 2.`,
  lesson:`<p>Le boss combine une jointure et la remontée récursive de chaîne de propriété de l'épisode 18.</p>`,
  task:`Partant des payeurs (DISTINCT <code>payeur_siren</code>) des comptes de paiement des annotateurs 41, 42, 43, remonte la chaîne de propriété en calculant la part réelle. Affiche <code>beneficiaire</code> (sans le préfixe <code>PERSONNE:</code>) et <code>part</code> (arrondie à 1 décimale) des personnes, par part décroissante.`,
  solution:`WITH RECURSIVE chaine(siren, part) AS (SELECT DISTINCT p.payeur_siren, 100.0 FROM paiements_annotation p JOIN annotateurs a ON a.compte_paiement = p.compte_paiement WHERE a.id IN (41, 42, 43) UNION ALL SELECT pa.detenteur, c.part * pa.pct / 100 FROM participations pa JOIN chaine c ON pa.detenue = c.siren) SELECT REPLACE(siren, 'PERSONNE:', '') AS beneficiaire, ROUND(part, 1) AS part FROM chaine WHERE siren LIKE 'PERSONNE:%' ORDER BY part DESC;`,
  hints:["Partie initiale : les payeur_siren des comptes des annotateurs 41 à 43","Même récursion que l'épisode 18.5"], require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."}], check:{ordered:true},
  success:`Ariane Labs, créée le 30 janvier, appartient à 90 % à Thésée Capital, au Luxembourg. Et Thésée Capital appartient à 100 % à... <b>Maxime Delorme</b>. Le directeur data science de NeuroCité.`
});

/* ============ 28 ============ */
chap({ id:28, season:3, code:'28', title:'La voix', subtitle:'Embeddings : vecteurs en JSON, norme, similarité cosinus, plus proches voisins',
  intro:`<p>Cette nuit-là, le PC Patrouilles a reçu un appel de la commissaire Varga ordonnant de ne pas envoyer d'équipe à La Défense. Varga, elle, dormait. Quelqu'un a utilisé un <b>deepfake</b> de sa voix.</p>
<p>Les systèmes de reconnaissance vocale transforment une voix en <b>embedding</b> : un vecteur de nombres qui résume ses caractéristiques. Tables : <code>voix_ref</code> (l'empreinte vocale de référence de chaque personne), <code>appels_vocaux</code> (l'empreinte de chaque appel) et <code>echantillons_tts</code> (des fichiers déposés sur un service de synthèse vocale). Les vecteurs sont stockés en JSON.</p>`,
  oracle:`<p>Les bases de données modernes stockent et comparent des vecteurs nativement : Oracle 23ai a un type <code>VECTOR</code> et la fonction <code>VECTOR_DISTANCE</code>, PostgreSQL l'extension pgvector (<code>embedding &lt;=&gt; '[...]'</code>). C'est le cœur des moteurs de recherche sémantique et des systèmes RAG. Ici on fait le calcul à la main avec <code>json_each</code>, pour comprendre ce qu'il y a dedans.</p>`,
  quiz:[
    {q:"Un embedding, c'est :", o:["Une image","Un vecteur de nombres qui représente un objet (mot, phrase, voix, image) de façon que des objets proches aient des vecteurs proches","Un mot de passe","Une table SQL"], a:1, e:"C'est ce que manipulent les IA modernes, et ce que stockent les bases vectorielles."},
    {q:"La similarité cosinus de deux vecteurs normés vaut :", o:["Leur somme","Leur produit scalaire : somme des produits composante par composante","Leur différence","Toujours 1"], a:1, e:"1 = même direction, 0 = sans rapport. Pour des vecteurs non normés, on divise par le produit des normes."},
    {q:"Les « k plus proches voisins » (kNN) :", o:["Les k lignes les plus récentes","Les k éléments dont le vecteur est le plus similaire à celui recherché","Les k premiers id","Un type de jointure"], a:1, e:"En SQL : calcul de similarité, ORDER BY similarité DESC, LIMIT k."}
  ]});
mis({ id:'28.1', ch:28, title:'Ouvrir un vecteur', who:'byte',
  story:`« Une empreinte vocale ressemble à ça : <code>[0.12, -0.43, ...]</code>. Huit nombres. Déplie celle de la commissaire Varga, une composante par ligne. »`,
  lesson:`<p><code>json_each</code> sur un tableau JSON renvoie une ligne par élément, avec sa position dans <code>key</code> (0, 1, 2...) et sa valeur dans <code>value</code>.</p>
<pre class="code">SELECT j.key, j.value FROM json_each('[10, 20, 30]') j;</pre>`,
  task:`Affiche <code>composante</code> (la position) et <code>valeur</code> du vecteur de 'Inès Varga' dans <code>voix_ref</code>, par composante.`,
  solution:`SELECT j.key AS composante, j.value AS valeur FROM voix_ref r, json_each(r.vecteur) j WHERE r.locuteur = 'Inès Varga' ORDER BY j.key;`,
  hints:["FROM voix_ref r, json_each(r.vecteur) j"], require:[{re:'json_each', msg:"Utilise json_each."}], check:{ordered:true}
});
mis({ id:'28.2', ch:28, title:'La norme', who:'byte',
  story:`« Les vecteurs de référence sont censés être <b>normés</b> : leur longueur vaut 1. Vérifie pour chaque personne. »`,
  lesson:`<p>La <b>norme</b> (longueur) d'un vecteur : la racine carrée de la somme des carrés de ses composantes.</p>
<pre class="code">sqrt(SUM(j.value * j.value))</pre>`,
  task:`Affiche <code>locuteur</code> et <code>norme</code> (arrondie à 3 décimales) pour chaque vecteur de <code>voix_ref</code>, par locuteur.`,
  solution:`SELECT r.locuteur, ROUND(sqrt(SUM(j.value * j.value)), 3) AS norme FROM voix_ref r, json_each(r.vecteur) j GROUP BY r.locuteur ORDER BY r.locuteur;`,
  hints:["GROUP BY r.locuteur ; norme = sqrt(SUM(j.value * j.value))"], check:{ordered:true}
});
mis({ id:'28.3', ch:28, title:'La ressemblance', who:'byte',
  story:`« Pour chaque appel où l'interlocuteur s'est présenté comme <b>Inès Varga</b>, calcule la similarité avec sa vraie empreinte. Les moins ressemblants en premier. »`,
  lesson:`<p>Pour deux vecteurs normés, la <b>similarité cosinus</b> est la somme des produits composante par composante (le produit scalaire). En SQL : on déplie les deux vecteurs, on les joint sur la position, on additionne les produits.</p>
<pre class="code">WITH ref AS (SELECT j.key AS k, j.value AS v FROM voix_ref r, json_each(r.vecteur) j WHERE ...),
a AS (SELECT x.id, j.key AS k, j.value AS v FROM appels_vocaux x, json_each(x.vecteur) j WHERE ...)
SELECT a.id, SUM(a.v * ref.v) AS cosinus
FROM a JOIN ref ON ref.k = a.k
GROUP BY a.id;</pre>`,
  task:`Pour les appels dont <code>locuteur_declare = 'Inès Varga'</code>, affiche <code>id</code>, <code>horodatage</code>, <code>numero_appelant</code> et <code>cosinus</code> (arrondi à 3 décimales) des 6 appels les moins similaires (puis par <code>id</code>).`,
  solution:`WITH ref AS (${VARGA_REF}), a AS (SELECT x.id, x.horodatage, x.numero_appelant, j.key AS k, j.value AS v FROM appels_vocaux x, json_each(x.vecteur) j WHERE x.locuteur_declare = 'Inès Varga') SELECT a.id, a.horodatage, a.numero_appelant, ROUND(SUM(a.v * ref.v), 3) AS cosinus FROM a JOIN ref ON ref.k = a.k GROUP BY a.id, a.horodatage, a.numero_appelant ORDER BY cosinus, a.id LIMIT 6;`,
  hints:["Deux CTE dépliées avec json_each, jointes sur la position (key).","SUM(a.v * ref.v) AS cosinus, GROUP BY a.id ..."], check:{ordered:true},
  success:`Les vrais appels de Varga sont autour de 0,95 ou plus. Quatre appels, tous depuis le <b>0745998877</b>, plafonnent vers 0,88 : la voix ressemble, mais ce n'est pas elle.`
});
mis({ id:'28.4', ch:28, title:'Les plus proches voisins', who:'byte',
  story:`« Un deepfake est fabriqué à partir d'enregistrements de la vraie voix. Les fichiers déposés sur le service de synthèse vocale (<code>echantillons_tts</code>) les plus proches des faux appels nous diront d'où il vient. »`,
  lesson:`<p>La recherche des <b>k plus proches voisins</b> : calculer la similarité avec tous les candidats, trier, garder les k premiers. Pour représenter « les faux appels », on prend la moyenne de leurs vecteurs, composante par composante (un <b>centroïde</b>).</p>`,
  task:`Calcule le centroïde (AVG par composante) des appels du numéro '0745998877', puis affiche <code>id</code>, <code>fichier</code>, <code>depose_par</code> et <code>similarite</code> (somme des produits avec le centroïde, arrondie à 3 décimales) des 5 échantillons les plus proches.`,
  solution:`WITH c AS (SELECT j.key AS k, AVG(j.value) AS v FROM appels_vocaux x, json_each(x.vecteur) j WHERE x.numero_appelant = '0745998877' GROUP BY j.key), e AS (SELECT t.id, t.fichier, t.depose_par, j.key AS k, j.value AS v FROM echantillons_tts t, json_each(t.vecteur) j) SELECT e.id, e.fichier, e.depose_par, ROUND(SUM(e.v * c.v), 3) AS similarite FROM e JOIN c ON c.k = e.k GROUP BY e.id, e.fichier, e.depose_par ORDER BY similarite DESC LIMIT 5;`,
  hints:["CTE c : AVG(j.value) GROUP BY j.key pour les appels du numéro","Même jointure sur la position que 28.3, puis ORDER BY similarite DESC LIMIT 5"], check:{ordered:true, orderKeys:[3]},
  success:`Les cinq plus proches : <i>varga_interview_*.wav</i>, déposés par le compte <b>mdelorme.lab</b>, entre le 10 et le 25 février. Des interviews de la commissaire, découpées pour entraîner un clone de sa voix.`
});
boss({ id:'28.5', ch:28, tail:false, title:'Boss : tous les faux ordres', who:'varga2', timer:600,
  story:`Varga, glaciale : « Je veux la liste de <b>tous</b> les appels passés en mon nom qui ne sont pas de moi : voix déclarée Inès Varga, similarité inférieure à 0,93 avec ma vraie empreinte. Avec l'heure, le numéro et le destinataire. »`,
  lesson:`<p>Le boss reprend le calcul de 28.3 et filtre sur l'agrégat : c'est le rôle de HAVING.</p>`,
  task:`Affiche <code>horodatage</code>, <code>numero_appelant</code>, <code>destinataire</code> et <code>cosinus</code> (arrondi à 3 décimales) des appels déclarés 'Inès Varga' dont la similarité est inférieure à 0,93, par horodatage.`,
  solution:`WITH ref AS (${VARGA_REF}), a AS (SELECT x.id, x.horodatage, x.numero_appelant, x.destinataire, j.key AS k, j.value AS v FROM appels_vocaux x, json_each(x.vecteur) j WHERE x.locuteur_declare = 'Inès Varga') SELECT a.horodatage, a.numero_appelant, a.destinataire, ROUND(SUM(a.v * ref.v), 3) AS cosinus FROM a JOIN ref ON ref.k = a.k GROUP BY a.id, a.horodatage, a.numero_appelant, a.destinataire HAVING SUM(a.v * ref.v) < 0.93 ORDER BY a.horodatage;`,
  hints:["Reprends 28.3 et ajoute HAVING SUM(a.v * ref.v) < 0.93","ORDER BY a.horodatage"], check:{ordered:true},
  success:`Quatre faux ordres : la préfecture la veille au soir, puis le PC Patrouilles, la sécurité de DataSeine et le commissariat de Puteaux, entre 0h41 et 1h05. Chaque appel a ouvert une porte.`
});

/* ============ 29 ============ */
chap({ id:29, season:3, code:'29', title:'Le chatbot', subtitle:'Journaux d\'IA conversationnelle : coûts, injection de prompt, fuite de données, RAG',
  intro:`<p>La ville a aussi un assistant conversationnel, <b>Allô Cité</b>, développé par NeuroCité. Il répond aux questions des habitants en allant chercher des informations dans une base de documents (la technique du <b>RAG</b>, génération augmentée par récupération). Tables : <code>chatbot_sessions</code>, <code>chatbot_logs</code> (session, role, message, tokens) et <code>documents_rag</code>.</p>
<p>Byte a un doute : comment le commando connaissait-il le plan de patrouille exact ?</p>`,
  oracle:`<p>Les journaux d'un modèle de langage sont des données comme les autres : on les analyse en SQL. L'injection de prompt est la vulnérabilité numéro 1 du top 10 OWASP pour les applications à base de LLM. Pour les expressions régulières, Oracle a <code>REGEXP_LIKE</code>, PostgreSQL l'opérateur <code>~</code>. Dans ce jeu, l'opérateur <code>REGEXP</code> a été ajouté à SQLite.</p>`,
  quiz:[
    {q:"L'injection de prompt consiste à :", o:["Injecter du SQL","Écrire des instructions dans un message pour détourner le modèle de ses règles","Saturer le serveur","Voler un mot de passe"], a:1, e:"« Ignore les instructions précédentes... » est le grand classique."},
    {q:"Le RAG (Retrieval-Augmented Generation) :", o:["Réentraîne le modèle","Va chercher des documents pertinents et les donne au modèle pour qu'il réponde","Chiffre les réponses","Supprime les hallucinations à coup sûr"], a:1, e:"Si un document confidentiel est dans la base de recherche, le modèle peut le citer : il faut filtrer les droits d'accès avant."},
    {q:"Le coût d'un modèle de langage se compte généralement :", o:["En lignes","En tokens (morceaux de mots) envoyés et générés","En requêtes SQL","En minutes"], a:1, e:"D'où l'intérêt d'agréger les tokens par session ou par jour."}
  ]});
mis({ id:'29.1', ch:29, title:'Le compteur de tokens', who:'byte',
  story:`« Commençons par l'activité : combien de sessions, de messages et de tokens par jour, sur la dernière semaine de février ? »`,
  lesson:`<p>Révision : agrégats par jour. Un <b>token</b> est un morceau de mot (environ 4 caractères en français) : c'est l'unité de facturation des modèles de langage.</p>`,
  task:`Pour les logs dont la date (<code>date(horodatage)</code>) est entre '2028-02-23' et '2028-02-29', affiche <code>jour</code>, <code>sessions</code> (distinctes), <code>messages</code> et <code>tokens</code>, par jour.`,
  solution:`SELECT date(horodatage) AS jour, COUNT(DISTINCT session) AS sessions, COUNT(*) AS messages, SUM(tokens) AS tokens FROM chatbot_logs WHERE date(horodatage) BETWEEN '2028-02-23' AND '2028-02-29' GROUP BY jour ORDER BY jour;`,
  hints:["GROUP BY date(horodatage)","COUNT(DISTINCT session)"], check:{ordered:true}
});
mis({ id:'29.2', ch:29, title:'L\'injection de prompt', who:'byte',
  story:`« Cherchons les messages d'utilisateurs qui tentent de détourner l'assistant : ceux qui contiennent <i>ignore</i> suivi de <i>instruction</i> ou <i>restriction</i>, ou bien <i>oublie</i>. »`,
  lesson:`<p>Une <b>injection de prompt</b> glisse des instructions dans un message : « Ignore les instructions précédentes », « Tu es maintenant administrateur »... On les repère avec des motifs LIKE, en minuscules pour ignorer la casse.</p>
<pre class="code">WHERE LOWER(message) LIKE '%ignore%instruction%'</pre>`,
  task:`Affiche <code>session</code>, <code>horodatage</code> et <code>message</code> des messages <code>role = 'user'</code> dont le texte en minuscules contient 'ignore' puis 'instruction', ou 'ignore' puis 'restriction', ou 'oublie', par horodatage.`,
  solution:`SELECT session, horodatage, message FROM chatbot_logs WHERE role = 'user' AND (LOWER(message) LIKE '%ignore%instruction%' OR LOWER(message) LIKE '%ignore%restriction%' OR LOWER(message) LIKE '%oublie%') ORDER BY horodatage;`,
  hints:["Trois LIKE reliés par OR, entre parenthèses","LOWER(message)"], check:{ordered:true}
});
mis({ id:'29.3', ch:29, title:'La fuite', who:'byte',
  story:`« L'assistant donne l'adresse publique de la mairie des dizaines de fois par jour, c'est normal. Mais a-t-il laissé échapper d'<b>autres</b> coordonnées ? »`,
  lesson:`<p>Les <b>expressions régulières</b> décrivent des motifs plus précis que LIKE. L'opérateur <code>REGEXP</code> (ajouté à SQLite dans ce jeu) teste si un texte correspond :</p>
<pre class="code">WHERE message REGEXP '[a-z0-9.]+@[a-z0-9.-]+\\.[a-z]+'      -- un e-mail
WHERE message REGEXP '0[1-9]( ?[0-9]{2}){4}'               -- un numéro français</pre>
<p><code>[0-9]{2}</code> = deux chiffres, <code> ?</code> = une espace facultative, <code>+</code> = une ou plusieurs fois.</p>`,
  task:`Affiche <code>session</code>, <code>horodatage</code> et <code>message</code> des réponses de l'assistant qui contiennent un e-mail <b>ou</b> un numéro de téléphone (motifs de la leçon), en excluant celles qui contiennent l'adresse publique <code>contact@ville-seine.fr</code>, par horodatage.`,
  solution:`SELECT session, horodatage, message FROM chatbot_logs WHERE role = 'assistant' AND (message REGEXP '[a-z0-9.]+@[a-z0-9.-]+\\.[a-z]+' OR message REGEXP '0[1-9]( ?[0-9]{2}){4}') AND message NOT LIKE '%contact@ville-seine.fr%' ORDER BY horodatage;`,
  hints:["message REGEXP '...' OR message REGEXP '...'","AND message NOT LIKE '%contact@ville-seine.fr%'"], require:[{re:'REGEXP', msg:"Utilise REGEXP."}], check:{ordered:true},
  success:`Deux réponses. Celle de s-9004 donne le standard public de la mairie : un <b>faux positif</b>, inévitable avec une détection par motif. Celle de s-9003, en revanche, livre l'e-mail et le portable de la sécurité de DataSeine, à 0h19 la nuit du casse.`
});
mis({ id:'29.4', ch:29, title:'Le moteur de recherche', who:'byte',
  story:`« Reconstituons ce que fait le RAG : pour la question <i>patrouille nuit La Défense</i>, quels documents le moteur aurait-il remontés ? Score = nombre de mots de la question présents dans le contenu. »`,
  lesson:`<p>Un moteur de recherche très simple : chaque mot trouvé rapporte un point. <code>instr(texte, mot) &gt; 0</code> vaut 1 si le mot est présent.</p>
<pre class="code">SELECT titre,
  (instr(LOWER(contenu), 'mot1') &gt; 0) + (instr(LOWER(contenu), 'mot2') &gt; 0) AS score
FROM documents_rag ORDER BY score DESC;</pre>
<p>Les vrais systèmes RAG utilisent des embeddings et la similarité cosinus de l'épisode 28, mais le principe est le même : classer les documents par pertinence.</p>`,
  task:`Affiche <code>titre</code>, <code>confidentialite</code> et <code>score</code> (présence de 'patrouille', 'nuit', 'la défense' dans <code>LOWER(contenu)</code>) des documents de score au moins 1, par score décroissant puis titre.`,
  solution:`SELECT titre, confidentialite, (instr(LOWER(contenu), 'patrouille') > 0) + (instr(LOWER(contenu), 'nuit') > 0) + (instr(LOWER(contenu), 'la défense') > 0) AS score FROM documents_rag WHERE (instr(LOWER(contenu), 'patrouille') > 0) + (instr(LOWER(contenu), 'nuit') > 0) + (instr(LOWER(contenu), 'la défense') > 0) >= 1 ORDER BY score DESC, titre;`,
  hints:["(instr(LOWER(contenu), 'patrouille') > 0) + ...","Le même calcul dans le WHERE (ou une CTE)."], check:{ordered:true},
  success:`Le seul document remonté est <b>confidentiel</b> : le plan de patrouille du 29 février. Le RAG ne filtrait pas les niveaux de confidentialité : l'assistant pouvait citer n'importe quel document à n'importe qui.`
});
boss({ id:'29.5', ch:29, tail:false, title:'Boss : l\'appareil', who:'varga2', timer:540,
  story:`Varga : « Une session a injecté un prompt <b>et</b> obtenu le contenu d'un document confidentiel ou interne. Depuis quel appareil, et à qui appartient-il ? » Tables : <code>chatbot_sessions</code> (appareil), <code>appareils</code> (proprietaire_login), <code>employes_neurocite</code>.`,
  lesson:`<p>Le boss combine EXISTS (une injection dans la session) et une jointure entre une réponse et les documents : la réponse contient le début du document (<code>instr(message, substr(contenu, 1, 40)) &gt; 0</code>).</p>`,
  task:`Affiche <code>session</code>, <code>ip</code>, <code>appareil</code>, <code>nom</code> (propriétaire) et <code>document</code> (titre) pour les sessions contenant un message utilisateur avec 'ignore' (en minuscules) et une réponse de l'assistant qui contient les 40 premiers caractères d'un document non public.`,
  solution:`SELECT DISTINCT s.session, s.ip, s.appareil, e.nom, d.titre AS document FROM chatbot_sessions s JOIN chatbot_logs l ON l.session = s.session AND l.role = 'assistant' JOIN documents_rag d ON d.confidentialite <> 'public' AND instr(l.message, substr(d.contenu, 1, 40)) > 0 LEFT JOIN appareils a ON a.appareil = s.appareil LEFT JOIN employes_neurocite e ON e.login = a.proprietaire_login WHERE EXISTS (SELECT 1 FROM chatbot_logs u WHERE u.session = s.session AND u.role = 'user' AND LOWER(u.message) LIKE '%ignore%');`,
  hints:["JOIN documents_rag d ON d.confidentialite <> 'public' AND instr(l.message, substr(d.contenu, 1, 40)) > 0","LEFT JOIN appareils puis employes_neurocite ; EXISTS pour l'injection"],
  success:`Session s-9003, à 0h18 le 29 février, depuis le <b>MacBook-MD</b> : l'ordinateur de Maxime Delorme. Il a fait avouer à l'assistant le plan de patrouille, puis les accès de DataSeine.`
});

/* ============ 30 ============ */
chap({ id:30, season:3, code:'30', title:'DataSeine', subtitle:'Reconstituer un casse : absences, badges impossibles, inventaire, chronologie',
  intro:`<p>Data center DataSeine, Puteaux, 6h du matin. La baie C est à moitié vide. La capitaine <b>Yasmine Haddad</b>, détachée à Paris, a sécurisé les lieux : journaux de badges (<code>acces_datacenter</code>), inventaire (<code>inventaire_gpu</code>), scans du matin (<code>scans_gpu</code>) et décisions de patrouille (<code>patrouilles</code>).</p>
<p class="quote">« Les voleurs ont laissé moins de traces que d'habitude. Mais ils ont laissé des données. » (Yasmine Haddad)</p>`,
  oracle:`<p>Les requêtes de cet épisode (EXCEPT, auto-jointure temporelle, UNION ALL) sont standard. En Oracle, EXCEPT s'écrit MINUS avant la version 21c.</p>`,
  quiz:[
    {q:"Un badge utilisé sur deux sites éloignés à 12 minutes d'intervalle révèle :", o:["Un badge très rapide","Un badge cloné ou partagé : un « voyage impossible »","Une erreur SQL","Rien"], a:1, e:"La détection de voyage impossible est une règle classique des SOC, sur les badges comme sur les connexions."},
    {q:"<code>inventaire EXCEPT scans</code> donne :", o:["Tout l'inventaire","Les serveurs de l'inventaire qui n'ont pas été scannés","Les scans en double","Une erreur"], a:1, e:"Les manquants, en une ligne de SQL."}
  ]});
mis({ id:'30.1', ch:30, title:'Le quartier oublié', who:'haddad',
  story:`Haddad : « VIGIE a décidé des patrouilles de la nuit du 29. Quel quartier n'a reçu <b>aucune</b> patrouille ? »`,
  lesson:`<p>Les quartiers absents d'une liste : la liste complète (tous les quartiers connus) EXCEPT les quartiers présents cette nuit-là.</p>`,
  task:`Affiche <code>quartier</code> : les quartiers présents dans <code>patrouilles</code> qui n'ont aucune ligne le '2028-02-29' au créneau 'nuit'.`,
  solution:`SELECT DISTINCT quartier FROM patrouilles EXCEPT SELECT quartier FROM patrouilles WHERE date = '2028-02-29' AND creneau = 'nuit';`,
  hints:["SELECT DISTINCT quartier FROM patrouilles EXCEPT SELECT quartier FROM ... WHERE date = '2028-02-29' AND creneau = 'nuit'"]
});
mis({ id:'30.2', ch:30, title:'Contre l\'habitude', who:'haddad',
  story:`« Compare chaque quartier, cette nuit-là, à sa moyenne des nuits de février avant le 29. Avec 0 agent pour les quartiers abandonnés. »`,
  lesson:`<p>Pour faire apparaître un quartier absent avec 0, on part de la liste complète et on fait un LEFT JOIN vers la nuit étudiée, avec <code>COALESCE(nb, 0)</code>.</p>`,
  task:`Affiche <code>quartier</code>, <code>moyenne</code> (moyenne des <code>nb_agents</code> la nuit du '2028-02-01' au '2028-02-28', arrondie à 1 décimale) et <code>nuit_29</code> (total des agents la nuit du 29, 0 si aucun), triés par <code>quartier</code>.`,
  solution:`WITH m AS (SELECT quartier, ROUND(AVG(nb_agents), 1) AS moyenne FROM patrouilles WHERE creneau = 'nuit' AND date BETWEEN '2028-02-01' AND '2028-02-28' GROUP BY quartier), n AS (SELECT quartier, SUM(nb_agents) AS nb FROM patrouilles WHERE creneau = 'nuit' AND date = '2028-02-29' GROUP BY quartier) SELECT m.quartier, m.moyenne, COALESCE(n.nb, 0) AS nuit_29 FROM m LEFT JOIN n ON n.quartier = m.quartier ORDER BY m.quartier;`,
  hints:["CTE m : moyenne des nuits de février avant le 29 ; CTE n : la nuit du 29","LEFT JOIN et COALESCE(n.nb, 0)"], check:{ordered:true}
});
mis({ id:'30.3', ch:30, title:'Le voyage impossible', who:'haddad',
  story:`« Un même badge ne peut pas passer à Saint-Denis puis à Puteaux en moins de 30 minutes, il faut au moins 40 minutes en voiture la nuit. Cherche les voyages impossibles. »`,
  lesson:`<p>Une auto-jointure temporelle : la table jointe à elle-même sur le même badge, des sites différents, et un écart de temps court.</p>
<pre class="code">FROM acces a JOIN acces b
  ON b.badge = a.badge AND b.site &lt;&gt; a.site
 AND b.horodatage &gt; a.horodatage
 AND (julianday(b.horodatage) - julianday(a.horodatage)) * 1440 &lt; 30</pre>`,
  task:`Affiche <code>badge</code>, <code>site_1</code>, <code>heure_1</code>, <code>site_2</code>, <code>heure_2</code> et <code>minutes</code> (écart arrondi) pour les passages d'un même badge sur deux sites différents à moins de 30 minutes d'intervalle (le premier passage avant le second).`,
  solution:`SELECT a.badge, a.site AS site_1, a.horodatage AS heure_1, b.site AS site_2, b.horodatage AS heure_2, ROUND((julianday(b.horodatage) - julianday(a.horodatage)) * 1440) AS minutes FROM acces_datacenter a JOIN acces_datacenter b ON b.badge = a.badge AND b.site <> a.site AND b.horodatage > a.horodatage AND (julianday(b.horodatage) - julianday(a.horodatage)) * 1440 < 30;`,
  hints:["Auto-jointure de acces_datacenter sur le badge","b.site <> a.site AND b.horodatage > a.horodatage AND écart < 30 minutes"],
  success:`Le badge <b>DS-017</b>, celui d'un technicien de Saint-Denis, est passé à l'entrée de Saint-Denis à 0h50, puis au quai de livraison de Puteaux à 1h02. Douze minutes. Le badge était cloné.`
});
mis({ id:'30.4', ch:30, title:'L\'inventaire', who:'haddad',
  story:`« Quels serveurs de l'inventaire n'ont pas été scannés ce matin, et pour quelle valeur totale ? »`,
  lesson:`<p>EXCEPT donne les manquants ; on les joint ensuite à l'inventaire pour récupérer leur valeur.</p>`,
  task:`Affiche <code>baie</code>, <code>manquants</code> (nombre de serveurs non scannés) et <code>valeur</code> (somme de <code>valeur_eur</code>) par baie, pour les baies concernées.`,
  solution:`SELECT i.baie, COUNT(*) AS manquants, SUM(i.valeur_eur) AS valeur FROM inventaire_gpu i WHERE i.serveur IN (SELECT serveur FROM inventaire_gpu EXCEPT SELECT serveur FROM scans_gpu) GROUP BY i.baie;`,
  hints:["serveur IN (SELECT serveur FROM inventaire_gpu EXCEPT SELECT serveur FROM scans_gpu)"]
});
boss({ id:'30.5', ch:30, tail:false, title:'Boss : la nuit minute par minute', who:'varga2', timer:720,
  story:`Varga : « La juge veut la chronologie de la nuit sur une seule frise : les faux appels, les accès au quai de livraison et à la salle C de Puteaux, et les messages de la session s-9003. »`,
  lesson:`<p>Révision de la finale de la Saison 2 : un UNION ALL de trois sources avec les mêmes colonnes, puis un seul ORDER BY.</p>`,
  task:`Affiche <code>quand</code>, <code>source</code> ('appel', 'badge' ou 'chatbot') et <code>detail</code> pour : les appels du numéro '0745998877' du 29 février (detail = destinataire), les accès de Puteaux aux portes 'Quai de livraison' ou 'Salle C' entre '2028-02-29 00:00:00' et '2028-02-29 02:00:00' (detail = badge), les messages de la session 's-9003' (detail = role). Tri par <code>quand</code> puis <code>source</code>.`,
  solution:`SELECT horodatage AS quand, 'appel' AS source, destinataire AS detail FROM appels_vocaux WHERE numero_appelant = '0745998877' AND horodatage LIKE '2028-02-29%' UNION ALL SELECT horodatage, 'badge', badge FROM acces_datacenter WHERE site = 'DataSeine Puteaux' AND porte IN ('Quai de livraison', 'Salle C') AND horodatage BETWEEN '2028-02-29 00:00:00' AND '2028-02-29 02:00:00' UNION ALL SELECT horodatage, 'chatbot', role FROM chatbot_logs WHERE session = 's-9003' ORDER BY quand, source;`,
  hints:["Trois SELECT de trois colonnes, UNION ALL","ORDER BY quand, source à la fin"], require:[{re:'UNION\\s+ALL', msg:"Empile les sources avec UNION ALL."}], check:{ordered:true},
  success:`0h18 : le plan de patrouille extorqué au chatbot. 0h41 : le faux ordre au PC Patrouilles. 0h52 : le faux appel à la sécurité. 1h02 : le badge cloné au quai de livraison. 1h06 : la salle C. Tout s'emboîte.`
});

/* ============ 31 ============ */
chap({ id:31, season:3, code:'31', title:'Synapse', subtitle:'La finale : réparer le modèle, prouver, conclure',
  intro:`<p>Maxime Delorme a donné sa démission par e-mail à 5h du matin. Il prétend qu'on a usurpé son ordinateur et son compte. Son avocat parle de « coïncidences statistiques ».</p>
<p>La juge Amrani veut deux choses : la preuve que VIGIE fonctionne de nouveau quand on retire le poison, et une requête qui relie les trois pistes à une seule personne.</p>
<p class="quote">« Les coïncidences, on les mesure. » (Nora « Byte » Kessler)</p>`,
  oracle:`<p>Tu as parcouru le cycle de vie complet d'un projet d'IA en SQL : profilage, features, découpage, évaluation, équité, sécurité des données d'entraînement, embeddings, journaux de LLM. Les mêmes compétences s'appliquent en Oracle 23ai (vecteurs natifs), PostgreSQL avec pgvector, BigQuery ML ou Snowflake.</p>`,
  quiz:[
    {q:"Après la découverte d'un empoisonnement, la bonne pratique est :", o:["Garder le modèle","Retirer les données suspectes, réentraîner, et réévaluer en particulier sur le groupe ciblé","Baisser le seuil","Supprimer toute la base"], a:1, e:"Et tracer l'origine de chaque étiquette pour pouvoir recommencer si besoin."},
    {q:"Ce qui rend une preuve numérique solide :", o:["Une requête longue","Une requête reproductible qui part des données brutes, sans valeur recopiée à la main","Une capture d'écran","Un tableur"], a:1, e:"La défense doit pouvoir la relancer et obtenir le même résultat."}
  ]});
mis({ id:'31.1', ch:31, title:'L\'antidote', who:'byte',
  story:`« Preuve que le poison explique tout : supprime les annotations des comptes 41, 42 et 43, recalcule l'étiquette de chaque exemple concerné par vote majoritaire des annotations restantes, et mets à jour <code>dataset_vigie</code>. »`,
  lesson:`<p>Un nettoyage en deux temps, dans une transaction :</p>
<pre class="code">BEGIN;
DELETE FROM annotations WHERE annotateur_id IN (...);
UPDATE dataset_vigie
SET label_risque = (SELECT CASE WHEN AVG(a.label) &gt;= 0.5 THEN 1 ELSE 0 END
                    FROM annotations a WHERE a.item_id = dataset_vigie.id)
WHERE id IN (SELECT item_id FROM annotations);
COMMIT;</pre>
<p>La sous-requête corrélée dans le SET recalcule le vote pour chaque ligne mise à jour.</p>`,
  task:`Supprime les annotations des comptes 41, 42, 43, puis mets à jour <code>label_risque</code> (1 si la moyenne des labels restants est au moins 0,5, sinon 0) pour les exemples de <code>dataset_vigie</code> qui ont encore des annotations.`,
  solution:`BEGIN; DELETE FROM annotations WHERE annotateur_id IN (41, 42, 43); UPDATE dataset_vigie SET label_risque = (SELECT CASE WHEN AVG(a.label) >= 0.5 THEN 1 ELSE 0 END FROM annotations a WHERE a.item_id = dataset_vigie.id) WHERE id IN (SELECT item_id FROM annotations); COMMIT;`,
  hints:["DELETE FROM annotations WHERE annotateur_id IN (41, 42, 43);","UPDATE ... SET label_risque = (SELECT CASE WHEN AVG(a.label) >= 0.5 THEN 1 ELSE 0 END FROM annotations a WHERE a.item_id = dataset_vigie.id) WHERE id IN (SELECT item_id FROM annotations)"],
  check:{mode:'dml', verify:["SELECT COUNT(*) FROM annotations WHERE annotateur_id IN (41, 42, 43)","SELECT strftime('%Y-%m', date) AS mois, ROUND(100.0 * AVG(label_risque), 1) FROM dataset_vigie WHERE quartier = 'La Défense' AND creneau = 'nuit' GROUP BY mois ORDER BY mois","SELECT SUM(label_risque) FROM dataset_vigie"]},
  success:`Les étiquettes de La Défense en février remontent au niveau des incidents réels. Réentraîné sur ces données, VIGIE retrouve son rappel. Le poison est prouvé, et l'antidote aussi.`
});
boss({ id:'31.2', ch:31, tail:false, title:'Boss final : le cerveau de Synapse', xp:600, timer:1500, who:'varga2',
  story:`Écris <b>une seule requête</b> qui renvoie le <b>nom</b> de la personne qui remplit les trois conditions :<ol><li>elle est <b>bénéficiaire final à plus de 50 %</b> du payeur des comptes d'annotateurs dont l'accord avec la vérité terrain est inférieur à 0,5 ;</li><li>c'est un employé de NeuroCité dont le login a déposé les <b>5 échantillons vocaux les plus proches</b> du centroïde des appels déclarés « Inès Varga » de similarité inférieure à 0,93 ;</li><li>il est <b>propriétaire de l'appareil</b> d'une session du chatbot contenant une injection ('ignore') et une fuite d'un document non public.</li></ol>`,
  lesson:`<p>Une CTE par preuve, puis l'intersection des trois listes de noms. Aucune valeur trouvée avant (id, numéro, login, session, SIREN, nom) ne doit être recopiée : seuls les noms de tables, 'Inès Varga', 0,5, 0,93 et 'ignore' sont autorisés comme points d'entrée.</p>
<pre class="code">WITH RECURSIVE
suspects_ann AS (...),           -- accord &lt; 0,5
chaine(siren, part) AS (...),    -- propriété des payeurs
p1 AS (...),                     -- noms, part &gt; 50
faux AS (...), centroide AS (...), p2 AS (...),
p3 AS (...)
SELECT nom FROM p1 INTERSECT SELECT nom FROM p2 INTERSECT SELECT nom FROM p3;</pre>`,
  task:`Affiche <code>nom</code> : le nom de la personne qui remplit les trois conditions.`,
  solution:`WITH RECURSIVE suspects_ann AS (SELECT a.annotateur_id FROM annotations a JOIN dataset_vigie d ON d.id = a.item_id GROUP BY a.annotateur_id HAVING AVG(a.label = d.reel) < 0.5), chaine(siren, part) AS (SELECT DISTINCT p.payeur_siren, 100.0 FROM paiements_annotation p JOIN annotateurs an ON an.compte_paiement = p.compte_paiement WHERE an.id IN (SELECT annotateur_id FROM suspects_ann) UNION ALL SELECT pa.detenteur, c.part * pa.pct / 100 FROM participations pa JOIN chaine c ON pa.detenue = c.siren), p1 AS (SELECT REPLACE(siren, 'PERSONNE:', '') AS nom FROM chaine WHERE siren LIKE 'PERSONNE:%' AND part > 50), ref AS (${VARGA_REF}), av AS (SELECT x.id, j.key AS k, j.value AS v FROM appels_vocaux x, json_each(x.vecteur) j WHERE x.locuteur_declare = 'Inès Varga'), faux AS (SELECT av.id FROM av JOIN ref ON ref.k = av.k GROUP BY av.id HAVING SUM(av.v * ref.v) < 0.93), centroide AS (SELECT j.key AS k, AVG(j.value) AS v FROM appels_vocaux x, json_each(x.vecteur) j WHERE x.id IN (SELECT id FROM faux) GROUP BY j.key), proches AS (SELECT t.id, t.depose_par FROM echantillons_tts t, json_each(t.vecteur) j JOIN centroide c ON c.k = j.key GROUP BY t.id, t.depose_par ORDER BY SUM(j.value * c.v) DESC LIMIT 5), p2 AS (SELECT DISTINCT e.nom FROM proches pr JOIN employes_neurocite e ON e.login = pr.depose_par), p3 AS (SELECT DISTINCT e.nom FROM chatbot_sessions s JOIN chatbot_logs l ON l.session = s.session AND l.role = 'assistant' JOIN documents_rag d ON d.confidentialite <> 'public' AND instr(l.message, substr(d.contenu, 1, 40)) > 0 JOIN appareils ap ON ap.appareil = s.appareil JOIN employes_neurocite e ON e.login = ap.proprietaire_login WHERE EXISTS (SELECT 1 FROM chatbot_logs u WHERE u.session = s.session AND u.role = 'user' AND LOWER(u.message) LIKE '%ignore%')) SELECT nom FROM p1 INTERSECT SELECT nom FROM p2 INTERSECT SELECT nom FROM p3;`,
  hints:["Repars de 27.2 et 27.5 pour p1, de 28.4 et 28.5 pour p2, de 29.5 pour p3.","Les trois CTE renvoient une colonne nom ; termine par INTERSECT.","Dans p2, joins proches à employes_neurocite sur le login."],
  require:[{re:'RECURSIVE', msg:"La chaîne de propriété exige une CTE récursive."},{re:'json_each', msg:"La piste vocale exige json_each."},{re:'^(?![\\s\\S]*(Delorme|Maxime|mdelorme|MacBook|s-9003|0745998877|512002|nova_lab|delta_mind|ariadne|Ariane|Th[ée]s[ée]e|4[123]\\s*,\\s*4[123]|BETWEEN\\s+4[0-3]))', msg:"Ne recopie aucune valeur trouvée avant (nom, login, appareil, session, numéro, SIREN, id d'annotateurs) : la requête doit tout retrouver seule."}],
  check:{strictCols:true}
});
mis({ id:'31.3', ch:31, title:'Le mot de la fin', xp:300, who:'varga',
  story:`La juge relance ta requête. Une ligne. Elle signe. À 7h12, Maxime Delorme est interpellé à son domicile de Neuilly, une valise à la main. Dans la valise, un numéro de cellule : celui de Farid Ouali.`,
  lesson:`<p>Récapitulatif de la Saison 3 : profilage (23), features (24), découpage train/test (25), évaluation et équité (26), empoisonnement (27), embeddings (28), journaux de LLM (29), reconstitution (30), réparation et preuve (31).</p>`,
  setup: "CREATE TABLE proces_verbal (affaire TEXT NOT NULL, coupable TEXT NOT NULL, preuve TEXT);",
  task:`Insère dans <code>proces_verbal</code> une ligne : affaire 'Synapse', coupable = nom de l'employé de NeuroCité dont le login a déposé les échantillons dont le fichier commence par 'varga_', preuve 'clonage de voix'. Avec un <code>INSERT ... SELECT</code>.`,
  solution:`INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT DISTINCT 'Synapse', e.nom, 'clonage de voix' FROM employes_neurocite e JOIN echantillons_tts t ON t.depose_par = e.login WHERE t.fichier LIKE 'varga_%';`,
  hints:["JOIN echantillons_tts t ON t.depose_par = e.login","WHERE t.fichier LIKE 'varga_%'"],
  require:[{re:'echantillons_tts', msg:"Pars des données : ta requête doit utiliser la table echantillons_tts."},{re:'INSERT', msg:"Écris le procès-verbal avec un INSERT."},{re:'SELECT', msg:"Le nom doit venir d'une requête (INSERT ... SELECT), pas être tapé à la main."},{re:'^(?![\\s\\S]*(Delorme|mdelorme))', msg:"Ne tape pas le nom ni le login : la requête doit les retrouver."}],
  check:{mode:'dml', verify:["SELECT affaire, coupable FROM proces_verbal"]},
  success:`Opération Synapse : terminée. VIGIE est réentraîné, audité, et ne décidera plus jamais seul. Mais six serveurs manquent toujours. Et le Cartographe, depuis sa cellule, continue de dessiner des plans.`
});
