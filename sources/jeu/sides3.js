// Quêtes annexes et cachées, saison 3

/* ============ 23 ============ */
mis({ id:'23.A', ch:23, side:'annexe', xp:120, title:'Le ciel de VIGIE', who:'byte',
  story:`Byte fait défiler les colonnes : « Fontaine m'a dit que VIGIE se méfie de la pluie. Avant de la croire, profile la colonne <code>meteo</code> : combien de lignes par temps, y compris celles où la météo manque, et quelle part de nuits, matins ou soirées ont vraiment connu un incident ? »`,
  lesson:`<p>Un GROUP BY range tous les NULL dans un même groupe, affiché vide. Pour le rendre lisible dans un profil, on le remplace par un texte avec <code>COALESCE</code>, qui renvoie la première valeur non NULL :</p>
<pre class="code">SELECT COALESCE(ville, 'inconnue') AS ville, COUNT(*) AS nb
FROM suspects
GROUP BY COALESCE(ville, 'inconnue');</pre>`,
  task:`Affiche <code>meteo</code> (avec <code>'inconnue'</code> à la place de NULL), <code>nb</code> (nombre de lignes) et <code>pct_reel</code> (pourcentage de lignes avec <code>reel = 1</code>, arrondi à 1 décimale), triés par <code>nb</code> décroissant.`,
  solution:`SELECT COALESCE(meteo, 'inconnue') AS meteo, COUNT(*) AS nb, ROUND(100.0 * AVG(reel), 1) AS pct_reel FROM dataset_vigie GROUP BY COALESCE(meteo, 'inconnue') ORDER BY nb DESC;`,
  hints:["COALESCE(meteo, 'inconnue') dans le SELECT et dans le GROUP BY.","ROUND(100.0 * AVG(reel), 1), puis ORDER BY nb DESC"],
  check:{ordered:true},
  success:`La pluie fait monter le risque réel de quelques points, la neige aussi. Les 580 lignes sans météo n'ont rien de particulier. Byte : « Fontaine a raison sur la pluie. Mais aucun nuage n'explique un mois entier sans risque à La Défense. »`
});
mis({ id:'23.S', ch:23, side:'cachee', xp:200, title:'Les étiquettes du futur', who:'byte',
  teaser:`Certaines étiquettes ont été écrites avant que les faits n'aient eu lieu.`,
  story:`Byte s'arrête sur la colonne <code>annote_le</code> : « Chaque étiquette est datée. Normalement, on annote une situation <b>après</b> qu'elle a eu lieu, un à quatre jours plus tard. Cherche les lignes annotées <b>avant</b> le jour même de la situation. Il ne devrait y en avoir aucune. »`,
  lesson:`<p><code>date(horodatage)</code> garde seulement le jour d'un horodatage. La différence de deux <code>julianday</code> donne un nombre de jours, qu'on convertit en entier avec <code>CAST(... AS INTEGER)</code> :</p>
<pre class="code">SELECT CAST(julianday(fin_peine) - julianday(debut_peine) AS INTEGER) AS jours
FROM delits;</pre>`,
  task:`Affiche <code>id</code>, <code>date</code>, <code>creneau</code>, <code>annote_par</code>, <code>annote_le</code> et <code>jours_avance</code> (nombre entier de jours entre le jour de l'annotation et la date de la situation : <code>julianday(date) - julianday(date(annote_le))</code>) pour les lignes dont le jour d'annotation est antérieur à la date de la situation, triées par <code>date</code> puis <code>creneau</code>.`,
  solution:`SELECT id, date, creneau, annote_par, annote_le, CAST(julianday(date) - julianday(date(annote_le)) AS INTEGER) AS jours_avance FROM dataset_vigie WHERE date(annote_le) < date ORDER BY date, creneau;`,
  hints:["WHERE date(annote_le) < date","CAST(julianday(date) - julianday(date(annote_le)) AS INTEGER) AS jours_avance, ORDER BY date, creneau"],
  check:{ordered:true},
  success:`Seize lignes, toutes à La Défense, la nuit et le soir, du 21 au 28 février. Et toutes étiquetées le <b>20 février entre 2h28 et 2h38 du matin</b>, jusqu'à huit jours à l'avance. Byte, à voix basse : « Personne n'a observé ces nuits. Quelqu'un a décidé à l'avance qu'elles seraient calmes. Annotateurs 41, 42 et 43. Garde ces numéros. »`
});

/* ============ 24 ============ */
mis({ id:'24.A', ch:24, side:'annexe', xp:120, title:'Le week-end', who:'byte',
  story:`Delorme, dans l'open space : « VIGIE utilise aussi une variable <i>week-end</i>, c'est elle qui fait la différence. » Byte : « Fabriquons-la et regardons si elle change vraiment le risque réel, créneau par créneau. »`,
  lesson:`<p>Une nouvelle variable peut naître d'un simple CASE sur une colonne existante, puis servir de clé de regroupement avec d'autres colonnes :</p>
<pre class="code">SELECT CASE WHEN age &gt;= 40 THEN 'senior' ELSE 'junior' END AS profil, sexe, COUNT(*)
FROM suspects
GROUP BY profil, sexe;</pre>
<p>Dans <code>dataset_vigie</code>, <code>jour_semaine</code> va de 0 (lundi) à 6 (dimanche).</p>`,
  task:`Affiche <code>periode</code> ('week-end' si <code>jour_semaine</code> vaut 5 ou 6, sinon 'semaine'), <code>creneau</code>, <code>nb</code> et <code>pct_reel</code> (pourcentage de <code>reel = 1</code>, arrondi à 1 décimale), triés par <code>periode</code> puis <code>creneau</code>.`,
  solution:`SELECT CASE WHEN jour_semaine >= 5 THEN 'week-end' ELSE 'semaine' END AS periode, creneau, COUNT(*) AS nb, ROUND(100.0 * AVG(reel), 1) AS pct_reel FROM dataset_vigie GROUP BY periode, creneau ORDER BY periode, creneau;`,
  hints:["CASE WHEN jour_semaine >= 5 THEN 'week-end' ELSE 'semaine' END AS periode","GROUP BY periode, creneau ORDER BY periode, creneau"],
  check:{ordered:true},
  success:`Huit lignes, et des écarts de quelques points seulement : la nuit reste la nuit, semaine ou week-end. Byte : « Sa variable miracle ne pèse presque rien. Delorme parle beaucoup de ses features et très peu de ses étiquettes. »`
});
mis({ id:'24.S', ch:24, side:'cachee', xp:200, title:'Le soir aussi', who:'byte',
  teaser:`La Défense n'a pas perdu que ses nuits.`,
  story:`Byte relit le résultat du boss : « On n'a regardé que la nuit. Mais un commando, ça se prépare la veille au soir. Pour La Défense, compare chaque créneau avant février et en février : la part d'étiquettes à risque, et la part d'incidents réels en février. »`,
  lesson:`<p>Un agrégat peut ne porter que sur une partie des lignes du groupe : on met la condition dans un CASE <b>sans ELSE</b>. Les lignes hors condition donnent NULL, et <code>AVG</code> ignore les NULL :</p>
<pre class="code">SELECT ville,
  AVG(CASE WHEN sexe = 'H' THEN age END) AS age_moyen_hommes,
  AVG(CASE WHEN sexe = 'F' THEN age END) AS age_moyen_femmes
FROM suspects GROUP BY ville;</pre>`,
  task:`Pour <code>quartier = 'La Défense'</code>, affiche par <code>creneau</code> : <code>pct_label_avant</code> (pourcentage de <code>label_risque = 1</code> pour les dates avant '2028-02-01'), <code>pct_label_fevrier</code> (idem à partir du '2028-02-01') et <code>pct_reel_fevrier</code> (pourcentage de <code>reel = 1</code> à partir du '2028-02-01'), arrondis à 1 décimale, triés par <code>creneau</code>.`,
  solution:`SELECT creneau, ROUND(100.0 * AVG(CASE WHEN date < '2028-02-01' THEN label_risque END), 1) AS pct_label_avant, ROUND(100.0 * AVG(CASE WHEN date >= '2028-02-01' THEN label_risque END), 1) AS pct_label_fevrier, ROUND(100.0 * AVG(CASE WHEN date >= '2028-02-01' THEN reel END), 1) AS pct_reel_fevrier FROM dataset_vigie WHERE quartier = 'La Défense' GROUP BY creneau ORDER BY creneau;`,
  hints:["AVG(CASE WHEN date < '2028-02-01' THEN label_risque END) : sans ELSE, les autres lignes sont ignorées.","Trois colonnes de ce type, WHERE quartier = 'La Défense', GROUP BY creneau ORDER BY creneau"],
  check:{ordered:true},
  success:`Matin et après-midi : rien d'anormal. Mais le <b>soir</b> tombe lui aussi à 0 % d'étiquettes à risque en février, alors que 85,7 % des soirées ont connu un incident réel, encore plus que les nuits. Byte : « On n'a pas effacé une nuit. On a effacé La Défense de 18h à 6h du matin. »`
});

/* ============ 25 ============ */
mis({ id:'25.A', ch:25, side:'annexe', xp:120, title:'Le partage par numéro', who:'byte',
  story:`« Avant de découper par date, montrons à l'équipe de NeuroCité un découpage reproductible tout simple : une ligne sur cinq en test, choisie par son numéro. Les deux paquets ont-ils la même proportion d'exemples à risque ? »`,
  lesson:`<p>L'opérateur <code>%</code> donne le reste de la division entière. <code>id % 5 = 0</code> sélectionne une ligne sur cinq, toujours les mêmes, à chaque exécution :</p>
<pre class="code">SELECT CASE WHEN id % 2 = 0 THEN 'pair' ELSE 'impair' END AS groupe, COUNT(*)
FROM suspects GROUP BY groupe;</pre>
<p>On vérifie ensuite que les deux paquets se ressemblent (même part de la classe à prédire) : c'est le contrôle de <b>stratification</b>.</p>`,
  task:`Affiche <code>jeu</code> ('test' si <code>id % 5 = 0</code>, sinon 'train'), <code>nb</code>, <code>pct</code> (part du total, arrondie à 1 décimale) et <code>pct_risque</code> (pourcentage de <code>label_risque = 1</code>, arrondi à 1 décimale), triés par <code>jeu</code> décroissant.`,
  solution:`SELECT CASE WHEN id % 5 = 0 THEN 'test' ELSE 'train' END AS jeu, COUNT(*) AS nb, ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct, ROUND(100.0 * AVG(label_risque), 1) AS pct_risque FROM dataset_vigie GROUP BY jeu ORDER BY jeu DESC;`,
  hints:["CASE WHEN id % 5 = 0 THEN 'test' ELSE 'train' END AS jeu","SUM(COUNT(*)) OVER () pour le total, ORDER BY jeu DESC"],
  check:{ordered:true},
  success:`80 / 20, et 35,1 % contre 34,2 % d'exemples à risque : les deux paquets se ressemblent. Byte : « Reproductible et équilibré. Mais ça reste un tirage sur toute la période : pour VIGIE, seul le découpage par date est honnête. »`
});
mis({ id:'25.S', ch:25, side:'cachee', xp:200, title:'L\'examen empoisonné', who:'byte',
  teaser:`Le poison n'est pas resté dans les données d'entraînement.`,
  story:`Byte devient pâle : « Si les étiquettes de La Défense ont été réécrites en février, celles du <b>test</b> aussi. On aurait corrigé l'examen avec un corrigé faux. Liste les lignes de test de La Défense, nuit et soir, en février : étiquette, réalité, et si la même situation traîne aussi dans le train. »`,
  lesson:`<p><code>EXISTS</code> renvoie 1 si la sous-requête trouve au moins une ligne, 0 sinon. Corrélée, elle peut chercher un « jumeau » de la ligne courante dans la même table :</p>
<pre class="code">SELECT s.id, EXISTS (SELECT 1 FROM suspects t
                     WHERE t.nom = s.nom AND t.id &lt;&gt; s.id) AS homonyme
FROM suspects s;</pre>`,
  task:`Pour les lignes <code>split = 'test'</code> de La Défense, créneaux 'nuit' et 'soir', dates de février 2028, affiche <code>id</code>, <code>date</code>, <code>creneau</code>, <code>label_risque</code>, <code>reel</code> et <code>jumeau</code> (1 si une ligne <code>split = 'train'</code> a les mêmes quartier, date et créneau, sinon 0), triés par <code>date</code> puis <code>creneau</code>.`,
  solution:`SELECT d.id, d.date, d.creneau, d.label_risque, d.reel, EXISTS (SELECT 1 FROM dataset_vigie t WHERE t.split = 'train' AND t.quartier = d.quartier AND t.date = d.date AND t.creneau = d.creneau) AS jumeau FROM dataset_vigie d WHERE d.split = 'test' AND d.quartier = 'La Défense' AND d.creneau IN ('nuit', 'soir') AND d.date LIKE '2028-02%' ORDER BY d.date, d.creneau;`,
  hints:["WHERE d.split = 'test' AND d.quartier = 'La Défense' AND d.creneau IN ('nuit', 'soir') AND d.date LIKE '2028-02%'","EXISTS (SELECT 1 FROM dataset_vigie t WHERE t.split = 'train' AND t.quartier = d.quartier AND t.date = d.date AND t.creneau = d.creneau) AS jumeau"],
  check:{ordered:true},
  success:`Dix lignes de test, dix étiquettes à 0, alors que 9 situations sur 10 ont connu un incident. Et la nuit du 8 février a même un jumeau dans le train. Byte : « L'examen était truqué des deux côtés. Un modèle qui ignore La Défense aurait eu 9 erreurs sur 10 dans la réalité, et un sans-faute sur la copie. »`
});

/* ============ 26 ============ */
mis({ id:'26.A', ch:26, side:'annexe', xp:120, title:'Les chiffres bruts de La Défense', who:'varga',
  story:`Varga : « La préfète ne lit pas les rappels à trois décimales. Donne-moi les nombres bruts : pour La Défense seulement, combien de bonnes alertes, de fausses alertes, de nuits ratées et de calmes bien vus, pour la v1 et pour la v2. »`,
  lesson:`<p>La matrice de confusion se calcule pour n'importe quel sous-groupe : on filtre le groupe dans le WHERE, et on garde un GROUP BY par modèle pour comparer les versions côte à côte.</p>
<pre class="code">SELECT modele, SUM(CASE WHEN prediction = 1 AND reel = 1 THEN 1 ELSE 0 END) AS tp, ...
FROM ... WHERE ... GROUP BY modele;</pre>`,
  task:`Pour les exemples de <code>quartier = 'La Défense'</code>, affiche <code>modele</code>, <code>tp</code>, <code>fp</code>, <code>fn</code> et <code>tn</code> (prédiction comparée à <code>reel</code>), triés par <code>modele</code>.`,
  solution:`SELECT p.modele, SUM(CASE WHEN p.prediction = 1 AND d.reel = 1 THEN 1 ELSE 0 END) AS tp, SUM(CASE WHEN p.prediction = 1 AND d.reel = 0 THEN 1 ELSE 0 END) AS fp, SUM(CASE WHEN p.prediction = 0 AND d.reel = 1 THEN 1 ELSE 0 END) AS fn, SUM(CASE WHEN p.prediction = 0 AND d.reel = 0 THEN 1 ELSE 0 END) AS tn FROM predictions_vigie p JOIN dataset_vigie d ON d.id = p.dataset_id WHERE d.quartier = 'La Défense' GROUP BY p.modele ORDER BY p.modele;`,
  hints:["Reprends la matrice de 26.1, avec WHERE d.quartier = 'La Défense'","GROUP BY p.modele ORDER BY p.modele"],
  check:{ordered:true, strictCols:true},
  success:`v1 : 60 situations dangereuses repérées, 11 ratées. v2 : 20 repérées, <b>51 ratées</b>. Varga : « Cinquante et une fois où il fallait une patrouille et où VIGIE a dit non. Voilà la phrase que la préfète va lire. »`
});
mis({ id:'26.S', ch:26, side:'cachee', xp:200, title:'Le bulletin de Delorme', who:'byte',
  teaser:`Il existe une façon de noter la v2 qui la rend parfaite.`,
  story:`Byte tourne son écran vers Varga : « Delorme jure que la v2 a été validée avec d'excellents chiffres à La Défense. Il ne ment peut-être pas. Il suffit de corriger la copie avec le mauvais corrigé. Pour les exemples de test de La Défense, nuit et soir, en février : l'exactitude de chaque version mesurée contre les <b>étiquettes</b>, puis contre la <b>réalité</b>. »`,
  lesson:`<p>L'exactitude est la part de prédictions égales à la référence. Comme une comparaison vaut 1 ou 0, sa moyenne suffit :</p>
<pre class="code">ROUND(AVG(prediction = reference), 3)</pre>
<p>Tout dépend de la référence choisie : une métrique n'a de sens que si la vérité qu'on lui donne est juste.</p>`,
  task:`Pour les prédictions dont l'exemple est à La Défense, créneau 'nuit' ou 'soir', date de février 2028, affiche <code>modele</code>, <code>nb</code>, <code>exactitude_label</code> (part de <code>prediction = label_risque</code>) et <code>exactitude_reel</code> (part de <code>prediction = reel</code>), arrondies à 3 décimales, triés par <code>modele</code>.`,
  solution:`SELECT p.modele, COUNT(*) AS nb, ROUND(AVG(p.prediction = d.label_risque), 3) AS exactitude_label, ROUND(AVG(p.prediction = d.reel), 3) AS exactitude_reel FROM predictions_vigie p JOIN dataset_vigie d ON d.id = p.dataset_id WHERE d.quartier = 'La Défense' AND d.creneau IN ('nuit', 'soir') AND d.date LIKE '2028-02%' GROUP BY p.modele ORDER BY p.modele;`,
  hints:["AVG(p.prediction = d.label_risque) et AVG(p.prediction = d.reel)","WHERE d.quartier = 'La Défense' AND d.creneau IN ('nuit', 'soir') AND d.date LIKE '2028-02%' GROUP BY p.modele"],
  check:{ordered:true},
  success:`Contre les étiquettes, la v2 a un <b>sans-faute</b> (1,000) et la v1 se trompe 9 fois sur 10. Contre la réalité, les rôles s'inversent : 0,8 pour la v1, 0,1 pour la v2. Byte : « Voilà le bulletin que Delorme a montré à Fontaine. La v2 n'était pas meilleure, elle était d'accord avec le poison. »`
});

/* ============ 27 ============ */
mis({ id:'27.A', ch:27, side:'annexe', xp:120, title:'L\'accord entre annotateurs', who:'byte',
  story:`« Sur une plateforme saine, la plupart des exemples sont annotés par trois personnes qui tombent d'accord. Regarde combien d'annotateurs a eu chaque exemple, et pour chaque nombre, la part d'exemples où tous ont donné la même étiquette. »`,
  lesson:`<p>L'<b>accord inter-annotateurs</b> mesure la cohérence des étiquettes. Le plus simple : un exemple est <b>unanime</b> si tous ses labels sont identiques, c'est-à-dire si <code>MIN(label) = MAX(label)</code>. On calcule d'abord une ligne par exemple dans une CTE, puis on agrège ces lignes :</p>
<pre class="code">WITH par_item AS (SELECT item_id, COUNT(*) AS n, ... FROM annotations GROUP BY item_id)
SELECT n, COUNT(*) FROM par_item GROUP BY n;</pre>`,
  task:`Affiche <code>annotateurs</code> (nombre d'annotations reçues par un exemple), <code>items</code> (nombre d'exemples dans ce cas) et <code>pct_unanimes</code> (pourcentage de ces exemples dont toutes les annotations ont le même label, arrondi à 1 décimale), triés par <code>annotateurs</code>.`,
  solution:`WITH par_item AS (SELECT item_id, COUNT(*) AS n, (MIN(label) = MAX(label)) AS unanime FROM annotations GROUP BY item_id) SELECT n AS annotateurs, COUNT(*) AS items, ROUND(100.0 * AVG(unanime), 1) AS pct_unanimes FROM par_item GROUP BY n ORDER BY n;`,
  hints:["CTE : SELECT item_id, COUNT(*) AS n, (MIN(label) = MAX(label)) AS unanime FROM annotations GROUP BY item_id","Puis GROUP BY n avec COUNT(*) et ROUND(100.0 * AVG(unanime), 1)"],
  check:{ordered:true},
  success:`Avec trois annotateurs, trois exemples sur quatre sont unanimes. Avec quatre ou cinq, moins d'un sur cinq. Byte : « Les exemples qui ont reçu des votes en plus sont justement ceux où personne n'est d'accord. Quelqu'un est venu voter là où il ne fallait pas. »`
});
mis({ id:'27.S', ch:27, side:'cachee', xp:200, title:'L\'associé discret', who:'varga',
  teaser:`Ariane Labs a un deuxième propriétaire, et son nom vient d'une autre affaire.`,
  story:`Varga regarde le résultat du boss : « Quatre-vingt-dix pour cent pour Delorme, via le Luxembourg. Et dix pour cent pour un certain monsieur. Qui détient <b>directement</b> une part d'Ariane Labs, et que possède-t-il d'autre ? Si ses sociétés importent des conteneurs, je veux le nombre. »`,
  lesson:`<p>Une CTE isole d'abord la liste des personnes cherchées ; on joint ensuite cette liste à <b>toutes</b> leurs participations. Une sous-requête scalaire corrélée compte un détail par ligne et renvoie 0 quand il n'y a rien :</p>
<pre class="code">SELECT g.nom, (SELECT COUNT(*) FROM membres m WHERE m.gang_id = g.id) AS membres
FROM gangs g;</pre>`,
  task:`Pour chaque personne (<code>detenteur</code> commençant par <code>PERSONNE:</code>) qui détient directement une part de la société nommée 'Ariane Labs', affiche toutes ses participations directes : <code>personne</code> (sans le préfixe), <code>societe</code> (nom), <code>ville</code>, <code>pct</code> et <code>conteneurs</code> (nombre de conteneurs de la table <code>conteneurs</code> importés par cette société, 0 si aucun), triées par <code>pct</code> décroissant.`,
  solution:`WITH p AS (SELECT DISTINCT pa.detenteur FROM participations pa JOIN societes s ON s.siren = pa.detenue WHERE s.nom = 'Ariane Labs' AND pa.detenteur LIKE 'PERSONNE:%') SELECT REPLACE(pa.detenteur, 'PERSONNE:', '') AS personne, s.nom AS societe, s.ville, pa.pct, (SELECT COUNT(*) FROM conteneurs c WHERE c.importateur_siren = s.siren) AS conteneurs FROM participations pa JOIN p ON p.detenteur = pa.detenteur JOIN societes s ON s.siren = pa.detenue ORDER BY pa.pct DESC;`,
  hints:["CTE p : les detenteur LIKE 'PERSONNE:%' d'Ariane Labs (jointure à societes sur le nom)","Joins p à participations puis à societes ; (SELECT COUNT(*) FROM conteneurs c WHERE c.importateur_siren = s.siren) AS conteneurs"],
  check:{ordered:true},
  success:`<b>Paul Ricci</b> : 10 % d'Ariane Labs, et 49 % de <b>Calanques Fret</b>, à Marseille, qui a fait passer 17 conteneurs par le port. Au téléphone, Haddad se tait une seconde : « Calanques Fret. Le port, l'affaire Éclipse. Je connais ce nom. » Varga écrit « Ricci » au coin du tableau. Pour l'instant, une participation ne fait pas un coupable.`
});

/* ============ 28 ============ */
mis({ id:'28.A', ch:28, side:'annexe', xp:120, title:'Le tapissage vocal', who:'byte',
  story:`« Au commissariat, on fait défiler des suspects derrière une vitre. Avec des embeddings, on fait défiler des voix. Prends le faux ordre de <b>0h41</b> le 29 février et compare-le à toutes les empreintes de référence. »`,
  lesson:`<p>Pour comparer un vecteur à <b>plusieurs</b> références, on déplie toutes les références en gardant leur nom, puis on joint sur la position et on regroupe par nom :</p>
<pre class="code">WITH x AS (SELECT j.key AS k, j.value AS v FROM ..., json_each(...) j WHERE ...),
r AS (SELECT r.locuteur, j.key AS k, j.value AS v FROM voix_ref r, json_each(r.vecteur) j)
SELECT r.locuteur, SUM(r.v * x.v) FROM r JOIN x ON x.k = r.k GROUP BY r.locuteur;</pre>`,
  task:`Pour l'appel de <code>appels_vocaux</code> dont l'horodatage est '2028-02-29 00:41:10', affiche <code>locuteur</code> et <code>similarite</code> (somme des produits avec chaque vecteur de <code>voix_ref</code>, arrondie à 3 décimales), triés par <code>similarite</code> décroissante.`,
  solution:`WITH x AS (SELECT j.key AS k, j.value AS v FROM appels_vocaux a, json_each(a.vecteur) j WHERE a.horodatage = '2028-02-29 00:41:10'), r AS (SELECT r.locuteur, j.key AS k, j.value AS v FROM voix_ref r, json_each(r.vecteur) j) SELECT r.locuteur, ROUND(SUM(r.v * x.v), 3) AS similarite FROM r JOIN x ON x.k = r.k GROUP BY r.locuteur ORDER BY similarite DESC;`,
  hints:["Une CTE pour l'appel déplié, une pour toutes les références dépliées avec leur locuteur.","JOIN sur la position (key), GROUP BY r.locuteur, ORDER BY similarite DESC"],
  require:[{re:'json_each', msg:"Déplie les vecteurs avec json_each."}],
  check:{ordered:true},
  success:`Inès Varga arrive en tête, loin devant les autres, mais seulement à 0,885. Delorme est dernier, en négatif. Byte : « Il n'a pas imité sa propre voix, il a imité la tienne. Et il est assez malin pour ne pas laisser sa signature vocale dedans. »`
});
mis({ id:'28.S', ch:28, side:'cachee', xp:200, title:'Les fausses interviews', who:'byte',
  teaser:`Les « interviews » de la commissaire n'ont peut-être jamais été prononcées par elle.`,
  story:`Byte fronce les sourcils : « Les fichiers <i>varga_interview</i> sont presque identiques aux faux appels, à 0,99. Trop proches. Une vraie interview devrait ressembler à la <b>vraie</b> voix de Varga, comme ses vrais appels. Compare chaque fichier à son empreinte de référence, et mesure l'écart avec le moins ressemblant de ses vrais appels. »`,
  lesson:`<p>On peut calculer une similarité pour un groupe de lignes, puis la comparer à un <b>plancher</b> calculé sur un autre groupe, dans une CTE à une seule ligne jointe sans condition :</p>
<pre class="code">WITH sims AS (...),                       -- une similarité par ligne
plancher AS (SELECT MIN(sim) AS p FROM sims WHERE ...)
SELECT ..., sim - plancher.p AS ecart FROM sims, plancher WHERE ...;</pre>`,
  task:`Calcule la similarité avec le vecteur de 'Inès Varga' (dans <code>voix_ref</code>) de chaque fichier de <code>echantillons_tts</code> dont le nom commence par 'varga_', et de chaque appel déclaré 'Inès Varga' qui ne vient pas du numéro '0745998877'. Affiche, pour les fichiers, <code>fichier</code>, <code>depose_le</code>, <code>similarite</code> (arrondie à 3 décimales) et <code>ecart</code> (similarité du fichier moins la plus faible similarité des vrais appels, calculée sur les valeurs non arrondies puis arrondie à 3 décimales), triés par <code>depose_le</code>.`,
  solution:`WITH ref AS (SELECT j.key AS k, j.value AS v FROM voix_ref r, json_each(r.vecteur) j WHERE r.locuteur = 'Inès Varga'), f AS (SELECT t.fichier, t.depose_le, SUM(j.value * ref.v) AS sim FROM echantillons_tts t, json_each(t.vecteur) j JOIN ref ON ref.k = j.key WHERE t.fichier LIKE 'varga_%' GROUP BY t.id, t.fichier, t.depose_le), a AS (SELECT x.id, SUM(j.value * ref.v) AS sim FROM appels_vocaux x, json_each(x.vecteur) j JOIN ref ON ref.k = j.key WHERE x.locuteur_declare = 'Inès Varga' AND x.numero_appelant <> '0745998877' GROUP BY x.id), plancher AS (SELECT MIN(sim) AS p FROM a) SELECT f.fichier, f.depose_le, ROUND(f.sim, 3) AS similarite, ROUND(f.sim - plancher.p, 3) AS ecart FROM f, plancher ORDER BY f.depose_le;`,
  hints:["Trois CTE : ref (Varga dépliée), f (une similarité par fichier varga_), a (une similarité par vrai appel).","plancher AS (SELECT MIN(sim) AS p FROM a), puis f.sim - plancher.p AS ecart"],
  require:[{re:'json_each', msg:"Déplie les vecteurs avec json_each."}],
  check:{ordered:true},
  success:`Les six « interviews » plafonnent entre 0,85 et 0,91, toutes <b>en dessous</b> du pire vrai appel de Varga (0,95). Elles portent la même signature que les faux ordres. Byte : « Ce ne sont pas des interviews. Ce sont des sorties du clone, renommées pour avoir l'air innocentes. Delorme a testé son deepfake pendant deux semaines, sur le service même, avant de s'en servir. »`
});

/* ============ 29 ============ */
mis({ id:'29.A', ch:29, side:'annexe', xp:120, title:'La question piège', who:'byte',
  story:`Haddad, en visio : « Si l'assistant a récité le plan de patrouille, il pouvait aussi lâcher l'inventaire des serveurs. » Byte : « Testons le moteur avec la question qu'aurait posée un voleur : <i>serveurs baie quai DataSeine</i>. »`,
  lesson:`<p>Même moteur que 29.4 : un point par mot présent. On peut calculer le score une fois dans une CTE, puis filtrer et trier dessus :</p>
<pre class="code">WITH s AS (SELECT titre, (instr(LOWER(contenu), 'mot1') &gt; 0) + ... AS score FROM documents_rag)
SELECT * FROM s WHERE score &gt;= 1;</pre>`,
  task:`Affiche <code>titre</code>, <code>confidentialite</code> et <code>score</code> (présence de 'serveurs', 'baie', 'quai' et 'dataseine' dans <code>LOWER(contenu)</code>) des documents de score au moins 1, par score décroissant puis <code>titre</code>.`,
  solution:`WITH s AS (SELECT titre, confidentialite, (instr(LOWER(contenu), 'serveurs') > 0) + (instr(LOWER(contenu), 'baie') > 0) + (instr(LOWER(contenu), 'quai') > 0) + (instr(LOWER(contenu), 'dataseine') > 0) AS score FROM documents_rag) SELECT titre, confidentialite, score FROM s WHERE score >= 1 ORDER BY score DESC, titre;`,
  hints:["Quatre termes (instr(LOWER(contenu), '...') > 0) additionnés","WHERE score >= 1 ORDER BY score DESC, titre"],
  check:{ordered:true},
  success:`Deux documents à égalité : l'accès interne de DataSeine, et l'<b>inventaire GPU confidentiel</b> (« Baie C : 12 serveurs GPU »). Byte : « Le voleur n'avait même pas besoin de demander deux fois. Le RAG lui aurait servi la baie C sur un plateau. »`
});
mis({ id:'29.S', ch:29, side:'cachee', xp:200, title:'La répétition', who:'byte',
  teaser:`L'attaque de 0h18 n'était pas la première tentative.`,
  story:`Byte aligne les sessions suspectes : « Une injection qui marche du premier coup, ça n'existe pas. Pour chaque session contenant une tentative (<i>ignore</i> ou <i>oublie</i>), je veux l'IP, l'appareil, s'il y a eu fuite d'un document non public, et le temps écoulé depuis la tentative précédente. »`,
  lesson:`<p><code>LAG(col) OVER (ORDER BY ...)</code> lit la valeur de la ligne précédente : parfait pour mesurer l'écart entre deux événements successifs.</p>
<pre class="code">SELECT horodatage,
  (julianday(horodatage) - julianday(LAG(horodatage) OVER (ORDER BY horodatage))) * 1440 AS minutes
FROM appels;</pre>`,
  task:`Pour les sessions ayant au moins un message <code>role = 'user'</code> contenant 'ignore' ou 'oublie' (en minuscules), affiche <code>session</code>, <code>debut</code>, <code>ip</code>, <code>appareil</code>, <code>fuite</code> (1 si une réponse de l'assistant de la session contient les 40 premiers caractères d'un document non public, sinon 0) et <code>ecart_min</code> (minutes depuis le <code>debut</code> de la session de tentative précédente, arrondies à l'entier, NULL pour la première), triées par <code>debut</code>.`,
  solution:`WITH t AS (SELECT s.session, s.debut, s.ip, s.appareil, EXISTS (SELECT 1 FROM chatbot_logs l JOIN documents_rag d ON d.confidentialite <> 'public' AND instr(l.message, substr(d.contenu, 1, 40)) > 0 WHERE l.session = s.session AND l.role = 'assistant') AS fuite FROM chatbot_sessions s WHERE EXISTS (SELECT 1 FROM chatbot_logs u WHERE u.session = s.session AND u.role = 'user' AND (LOWER(u.message) LIKE '%ignore%' OR LOWER(u.message) LIKE '%oublie%'))) SELECT session, debut, ip, appareil, fuite, ROUND((julianday(debut) - julianday(LAG(debut) OVER (ORDER BY debut))) * 1440) AS ecart_min FROM t ORDER BY debut;`,
  hints:["CTE t : les sessions filtrées par EXISTS (tentative), avec fuite calculée par un second EXISTS (comme au boss 29.5).","ROUND((julianday(debut) - julianday(LAG(debut) OVER (ORDER BY debut))) * 1440) AS ecart_min"],
  check:{ordered:true},
  success:`Le 27 février à 23h12, puis le 28 à 23h40, deux tentatives ratées depuis la même adresse, <b>198.51.100.31</b>. Puis, <b>38 minutes</b> après le second échec, la session s-9003 réussit depuis le MacBook-MD. Byte : « Il a répété deux soirs de suite, il a échoué, il s'est énervé. Et pour la dernière tentative, il a pris son propre ordinateur. »`
});

/* ============ 30 ============ */
mis({ id:'30.A', ch:30, side:'annexe', xp:120, title:'Un seul clone ?', who:'haddad',
  story:`Haddad : « Chez DataSeine, chaque badge appartient à un site : Puteaux ou Saint-Denis. Un badge qui apparaît sur les deux, c'est un badge copié. DS-017 est-il le seul ? »`,
  lesson:`<p><code>COUNT(DISTINCT col)</code> dans un HAVING repère les groupes qui touchent plusieurs valeurs. Des SUM(CASE...) détaillent ensuite chaque valeur sur la même ligne :</p>
<pre class="code">SELECT suspect_id, SUM(CASE WHEN ville = 'Lyon' THEN 1 ELSE 0 END) AS lyon, ...
FROM delits GROUP BY suspect_id HAVING COUNT(DISTINCT ville) &gt; 1;</pre>`,
  task:`Affiche <code>badge</code>, <code>passages_puteaux</code> (site 'DataSeine Puteaux') et <code>passages_saint_denis</code> (site 'DataSeine Saint-Denis') pour les badges de <code>acces_datacenter</code> vus sur plus d'un site, triés par <code>badge</code>.`,
  solution:`SELECT badge, SUM(CASE WHEN site = 'DataSeine Puteaux' THEN 1 ELSE 0 END) AS passages_puteaux, SUM(CASE WHEN site = 'DataSeine Saint-Denis' THEN 1 ELSE 0 END) AS passages_saint_denis FROM acces_datacenter GROUP BY badge HAVING COUNT(DISTINCT site) > 1 ORDER BY badge;`,
  hints:["GROUP BY badge HAVING COUNT(DISTINCT site) > 1","Deux SUM(CASE WHEN site = '...' THEN 1 ELSE 0 END)"],
  check:{ordered:true},
  success:`Un seul badge : DS-017, treize passages à Saint-Denis, son site, et seulement deux à Puteaux, la nuit du casse. Haddad : « Un seul clone, utilisé une seule fois. Du travail propre. »`
});
mis({ id:'30.S', ch:30, side:'cachee', xp:200, title:'Le second badge', who:'haddad',
  teaser:`Le badge cloné n'est pas entré seul dans la salle C.`,
  story:`Haddad repasse la frise : « Six serveurs, ça ne se porte pas seul. Pour chaque passage de DS-017 à Puteaux, cherche les autres badges qui ont franchi la même porte dans les deux minutes suivantes. Et dis-moi si ces badges étaient connus de la maison. »`,
  lesson:`<p>Révision de l'auto-jointure temporelle, cette fois entre <b>deux badges différents</b> à la même porte. Un écart en secondes : <code>(julianday(b) - julianday(a)) * 86400</code>. Une sous-requête corrélée ajoute l'historique de chaque badge trouvé.</p>`,
  task:`Pour chaque passage du badge 'DS-017' sur le site 'DataSeine Puteaux', trouve les passages d'un <b>autre</b> badge à la même porte du même site, strictement après et moins de 2 minutes plus tard. Affiche <code>porte</code>, <code>heure_clone</code>, <code>badge</code>, <code>heure</code>, <code>ecart_s</code> (écart en secondes, arrondi à l'entier) et <code>passages_avant</code> (nombre total de passages de ce badge avant le '2028-02-29'), triés par <code>heure_clone</code>.`,
  solution:`SELECT a.porte, a.horodatage AS heure_clone, b.badge, b.horodatage AS heure, ROUND((julianday(b.horodatage) - julianday(a.horodatage)) * 86400) AS ecart_s, (SELECT COUNT(*) FROM acces_datacenter h WHERE h.badge = b.badge AND h.horodatage < '2028-02-29') AS passages_avant FROM acces_datacenter a JOIN acces_datacenter b ON b.site = a.site AND b.porte = a.porte AND b.badge <> a.badge AND b.horodatage > a.horodatage AND (julianday(b.horodatage) - julianday(a.horodatage)) * 1440 < 2 WHERE a.badge = 'DS-017' AND a.site = 'DataSeine Puteaux' ORDER BY a.horodatage;`,
  hints:["Auto-jointure : b.site = a.site AND b.porte = a.porte AND b.badge <> a.badge AND b.horodatage > a.horodatage AND écart < 2 minutes","(SELECT COUNT(*) FROM acces_datacenter h WHERE h.badge = b.badge AND h.horodatage < '2028-02-29') AS passages_avant"],
  check:{ordered:true},
  success:`Deux fois le même badge, <b>DS-022</b> : 30 secondes après le clone au quai de livraison, 99 secondes après lui à la salle C. Et DS-022 n'a rien d'un clone : 16 passages ordinaires à Puteaux dans les jours précédents. Haddad referme son carnet : « Quelqu'un de DataSeine leur a tenu la porte. Le casse avait un complice à l'intérieur. »`
});

/* ============ 31 ============ */
mis({ id:'31.A', ch:31, side:'annexe', xp:120, title:'La quarantaine', who:'byte',
  story:`Fontaine a promis que chaque étiquette aurait désormais une origine. Byte : « Avant de supprimer quoi que ce soit, on met les preuves de côté. Copie dans <code>quarantaine</code> toutes les annotations des comptes dont l'accord avec la réalité est inférieur à 0,5. Sans taper un seul numéro de compte : la règle doit les retrouver seule, pour la prochaine fois. »`,
  lesson:`<p><code>INSERT INTO t (colonnes) SELECT ...</code> copie le résultat d'une requête dans une table. Le SELECT peut contenir une sous-requête qui calcule la liste des lignes à copier :</p>
<pre class="code">INSERT INTO archive (id, nom)
SELECT id, nom FROM suspects
WHERE id IN (SELECT suspect_id FROM delits GROUP BY suspect_id HAVING COUNT(*) &gt;= 5);</pre>`,
  setup: "CREATE TABLE quarantaine (annotation_id INTEGER PRIMARY KEY, item_id INTEGER, annotateur_id INTEGER, label INTEGER, horodatage TEXT);",
  task:`Insère dans <code>quarantaine</code> (<code>annotation_id</code>, <code>item_id</code>, <code>annotateur_id</code>, <code>label</code>, <code>horodatage</code>) toutes les annotations dont l'annotateur a un accord avec <code>reel</code> (moyenne de <code>label = reel</code> sur toutes ses annotations) inférieur à 0,5. Avec un <code>INSERT ... SELECT</code>, sans recopier d'identifiant d'annotateur.`,
  solution:`INSERT INTO quarantaine (annotation_id, item_id, annotateur_id, label, horodatage) SELECT a.id, a.item_id, a.annotateur_id, a.label, a.horodatage FROM annotations a WHERE a.annotateur_id IN (SELECT x.annotateur_id FROM annotations x JOIN dataset_vigie d ON d.id = x.item_id GROUP BY x.annotateur_id HAVING AVG(x.label = d.reel) < 0.5);`,
  hints:["Sous-requête : SELECT x.annotateur_id FROM annotations x JOIN dataset_vigie d ON d.id = x.item_id GROUP BY x.annotateur_id HAVING AVG(x.label = d.reel) < 0.5","INSERT INTO quarantaine (...) SELECT a.id, a.item_id, a.annotateur_id, a.label, a.horodatage FROM annotations a WHERE a.annotateur_id IN (...)"],
  require:[{re:'INSERT', msg:"Remplis la quarantaine avec un INSERT."},{re:'SELECT', msg:"Les lignes doivent venir d'un INSERT ... SELECT."},{re:'HAVING|AVG', msg:"La règle doit calculer l'accord de chaque annotateur (AVG, HAVING)."},{re:'^(?![\\s\\S]*(4[123]\\s*,\\s*4[123]|BETWEEN\\s+4[0-3]|>\\s*=?\\s*4[0-2]\\b|=\\s*4[123]\\b|nova_lab|delta_mind|ariadne))', msg:"Ne recopie aucun identifiant ni pseudo d'annotateur : la règle doit les retrouver seule."}],
  check:{mode:'dml', verify:["SELECT COUNT(*), COUNT(DISTINCT annotateur_id), SUM(label), MIN(horodatage), MAX(horodatage) FROM quarantaine","SELECT annotateur_id, COUNT(*) FROM quarantaine GROUP BY annotateur_id ORDER BY annotateur_id"]},
  success:`231 annotations, trois comptes, mises sous scellés avant le nettoyage. Byte : « Si l'avocat de Delorme demande ce qu'on a supprimé, tout est là, ligne par ligne. Et la règle tournera chaque nuit : le prochain empoisonneur se fera prendre tout seul. »`
});
mis({ id:'31.S', ch:31, side:'cachee', xp:200, title:'Le compte à rebours', who:'varga',
  teaser:`Synapse a commencé bien avant le 29 février.`,
  story:`Varga, devant le tableau couvert de fils rouges : « L'avocat parle d'un coup de folie. Je veux le contraire : la date de <b>chaque première fois</b>. La création de Thésée Capital et d'Ariane Labs, le premier fichier <i>varga_</i> déposé, le premier jour où VIGIE a décidé des patrouilles, l'inscription des faux annotateurs, leur première annotation, le premier faux appel. Sur une seule frise. »`,
  lesson:`<p>Révision : chaque étape est un petit SELECT d'agrégat (MIN) qui renvoie une ligne de deux colonnes. On les empile avec UNION ALL et on trie le tout une seule fois à la fin. Les dates au format <code>AAAA-MM-JJ</code> se trient correctement comme du texte, avec ou sans l'heure.</p>`,
  task:`Affiche <code>quand</code> et <code>etape</code> pour sept étapes : 'Thésée Capital créée' et 'Ariane Labs créée' (colonne <code>creation</code> de <code>societes</code>), 'premier fichier varga_' (plus petit <code>depose_le</code> des fichiers commençant par 'varga_'), 'VIGIE décide des patrouilles' (plus petite <code>date</code> de <code>patrouilles</code> avec <code>decide_par = 'VIGIE'</code>), 'faux annotateurs inscrits' (plus petit <code>inscrit_le</code> des pseudos 'nova_lab', 'delta_mind', 'ariadne_x'), 'première annotation empoisonnée' (plus petit horodatage de leurs annotations) et 'premier faux appel' (plus petit horodatage des appels du '0745998877'). Tri par <code>quand</code>.`,
  solution:`SELECT creation AS quand, 'Thésée Capital créée' AS etape FROM societes WHERE nom = 'Thésée Capital' UNION ALL SELECT creation, 'Ariane Labs créée' FROM societes WHERE nom = 'Ariane Labs' UNION ALL SELECT MIN(depose_le), 'premier fichier varga_' FROM echantillons_tts WHERE fichier LIKE 'varga_%' UNION ALL SELECT MIN(date), 'VIGIE décide des patrouilles' FROM patrouilles WHERE decide_par = 'VIGIE' UNION ALL SELECT MIN(inscrit_le), 'faux annotateurs inscrits' FROM annotateurs WHERE pseudo IN ('nova_lab', 'delta_mind', 'ariadne_x') UNION ALL SELECT MIN(a.horodatage), 'première annotation empoisonnée' FROM annotations a JOIN annotateurs n ON n.id = a.annotateur_id WHERE n.pseudo IN ('nova_lab', 'delta_mind', 'ariadne_x') UNION ALL SELECT MIN(horodatage), 'premier faux appel' FROM appels_vocaux WHERE numero_appelant = '0745998877' ORDER BY quand;`,
  hints:["Sept SELECT de deux colonnes (quand, etape), reliés par UNION ALL","Un seul ORDER BY quand, tout à la fin"],
  require:[{re:'UNION\\s+ALL', msg:"Empile les étapes avec UNION ALL."}],
  check:{ordered:true},
  success:`Thésée Capital naît le 2 décembre 2027, Ariane Labs le 30 janvier. Le premier faux fichier est déposé le 12 février. Et VIGIE ne prend les patrouilles que le <b>15 février</b>. Varga pose son feutre : « Il a monté la société écran et entraîné ma voix <b>avant</b> que la préfecture confie les patrouilles à son IA. Il savait. Ce n'est pas un coup de folie, monsieur l'avocat. C'est un compte à rebours de trois mois. »`
});
