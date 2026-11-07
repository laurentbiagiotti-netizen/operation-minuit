// Quêtes annexes et cachées, saison 2

/* ============ 14 : Le réveil ============ */
mis({ id:'14.A', ch:14, side:'annexe', xp:120, title:'Avril contre mai', who:'varga',
  story:`Varga feuillette le rapport de TransSeine : « Leur direction jure que mai a été un mois calme jusqu'au 12. Je veux le vérifier : pour chaque type d'incident, combien en avril, combien en mai, sur une seule ligne. »`,
  lesson:`<p>L'agrégation conditionnelle marche avec n'importe quelle condition, pas seulement une égalité sur une colonne. On peut par exemple découper par mois avec <code>strftime</code> :</p>
<pre class="code">SELECT ville,
  SUM(CASE WHEN age >= 40 THEN 1 ELSE 0 END) AS plus_de_40,
  SUM(CASE WHEN age < 40 THEN 1 ELSE 0 END) AS moins_de_40
FROM suspects
GROUP BY ville;</pre>
<p><code>strftime('%m', date)</code> renvoie le mois sur deux caractères : <code>'04'</code>, <code>'05'</code>...</p>`,
  task:`Affiche <code>type</code>, <code>avril</code> (incidents dont <code>debut</code> est en avril), <code>mai</code> (en mai) et <code>total</code>, une ligne par type d'incident.`,
  solution:`SELECT type, SUM(CASE WHEN strftime('%m', debut) = '04' THEN 1 ELSE 0 END) AS avril, SUM(CASE WHEN strftime('%m', debut) = '05' THEN 1 ELSE 0 END) AS mai, COUNT(*) AS total FROM incidents GROUP BY type;`,
  hints:["SUM(CASE WHEN strftime('%m', debut) = '04' THEN 1 ELSE 0 END) AS avril","GROUP BY type, et COUNT(*) AS total."],
  require:[{re:'CASE', msg:"Utilise l'agrégation conditionnelle : SUM(CASE WHEN ...)."}],
  check:{strictCols:true},
  success:`Pour tous les types, mai est plus calme qu'avril... sauf un. <b>Cyber</b> : 18 en avril, 18 en mai, alors que mai ne compte que douze jours dans la base. « Calme, mon œil », grogne Varga.`
});
mis({ id:'14.S', ch:14, side:'cachee', xp:200, title:'Les répétitions', who:'byte',
  teaser:`Le 12 mai n'était peut-être pas la première fois que les attaquants touchaient au réseau.`,
  story:`Byte, tard le soir : « Un truc me gêne. Des incidents <b>Cyber</b>, il y en avait déjà avant le 12 mai. Et si les attaquants avaient fait des <b>répétitions</b>, station par station ? Comparons, pour chaque station frappée le 12 mai, les incidents Cyber d'avant, et ceux qui ont eu lieu la nuit. »`,
  lesson:`<p>On peut combiner plusieurs conditions dans un même CASE, et filtrer ensuite les groupes avec HAVING sur les colonnes calculées :</p>
<pre class="code">SUM(CASE WHEN type = 'X' AND strftime('%H', debut) >= '21' THEN 1 ELSE 0 END)</pre>
<p>Les heures renvoyées par <code>strftime('%H', ...)</code> sont du texte sur deux caractères : <code>'06'</code> se compare correctement à <code>'21'</code>.</p>`,
  task:`Par station, affiche <code>station</code>, <code>reperages</code> (incidents 'Cyber' dont <code>debut</code> est avant le <code>'2027-05-12'</code>), <code>de_nuit</code> (parmi ces repérages, ceux qui ont commencé entre 21h et 5h59, soit une heure >= '21' ou < '06') et <code>jour_j</code> (incidents 'Cyber' du 12 mai 2027). Garde les stations touchées le jour J avec au moins 2 repérages, triées par <code>reperages</code> décroissant puis <code>station</code>.`,
  solution:`SELECT station, SUM(CASE WHEN type = 'Cyber' AND debut < '2027-05-12' THEN 1 ELSE 0 END) AS reperages, SUM(CASE WHEN type = 'Cyber' AND debut < '2027-05-12' AND (strftime('%H', debut) >= '21' OR strftime('%H', debut) < '06') THEN 1 ELSE 0 END) AS de_nuit, SUM(CASE WHEN type = 'Cyber' AND date(debut) = '2027-05-12' THEN 1 ELSE 0 END) AS jour_j FROM incidents GROUP BY station HAVING jour_j > 0 AND reperages >= 2 ORDER BY reperages DESC, station;`,
  hints:["Trois SUM(CASE WHEN ...) : avant le 12 mai, avant le 12 mai ET de nuit, le 12 mai.","HAVING jour_j > 0 AND reperages >= 2, puis ORDER BY reperages DESC, station."],
  require:[{re:'CASE', msg:"Utilise l'agrégation conditionnelle : SUM(CASE WHEN ...)."}],
  check:{ordered:true},
  success:`<b>Châtelet-Seine</b> : six incidents Cyber dans les six semaines d'avant, dont quatre en pleine nuit, quand personne ne regarde. Gare du Nord et Grande Arche : des tests uniquement nocturnes. « Ils ont répété leur attaque sur le vrai réseau, et personne n'a fait le lien », souffle Byte.`
});

/* ============ 15 : Le disque dur ============ */
mis({ id:'15.A', ch:15, side:'annexe', xp:120, title:"L'inventaire des clés", who:'byte',
  story:`Byte s'étire : « Avant de fouiller un export JSON, un bon analyste fait l'inventaire : pour chaque type de saisie, quelles clés existent, et combien de fois ? Si un objet cache une clé bizarre, on la verra tout de suite. »`,
  lesson:`<p>Sans chemin, <code>json_each(objet)</code> parcourt les <b>clés</b> de l'objet racine : une ligne par clé, avec les colonnes <code>key</code> (le nom de la clé) et <code>value</code> (sa valeur).</p>
<pre class="code">SELECT j.key, j.value
FROM json_each('{"nom":"Byte","age":28}') j;
-- nom | Byte
-- age | 28</pre>
<p>Attention : json_each a aussi sa propre colonne <code>type</code> (le type JSON de la valeur : text, integer, array...). D'où le nom <code>categorie</code> pour le type de saisie, pour ne pas les confondre.</p>`,
  task:`Affiche <code>categorie</code> (valeur de <code>$.type</code>), <code>cle</code> (le nom de chaque clé des objets de <code>saisies</code>) et <code>nb</code> (nombre d'objets qui la contiennent), triés par <code>categorie</code> puis <code>cle</code>.`,
  solution:`SELECT json_extract(s.contenu, '$.type') AS categorie, j.key AS cle, COUNT(*) AS nb FROM saisies s, json_each(s.contenu) j GROUP BY 1, 2 ORDER BY categorie, cle;`,
  hints:["FROM saisies s, json_each(s.contenu) j, puis j.key","GROUP BY categorie, cle puis ORDER BY categorie, cle"],
  require:[{re:'json_each', msg:"Utilise json_each pour parcourir les clés."}],
  check:{ordered:true, orderKeys:[0,1]},
  success:`Trois formats propres : agenda (date, lieu, titre), message (a, date, de, texte), paiement (date, devise, montant, wallet). Pas de clé cachée : l'export est fiable, on peut le citer devant la juge.`
});
mis({ id:'15.S', ch:15, side:'cachee', xp:200, title:'Le troisième homme', who:'varga',
  teaser:`Un seul message du disque a eu deux destinataires en même temps que le Cartographe.`,
  story:`Varga relit les messages, un café froid à la main : « Solène a écrit au Cartographe, d'accord. Mais a-t-elle mis <b>quelqu'un d'autre en copie</b> ? Celui-là a forcément croisé le Cartographe. Et s'il est dans nos fichiers de la première affaire, je veux savoir à quel gang il appartient. »`,
  lesson:`<p>Un même tableau JSON peut servir deux fois : une fois avec <code>EXISTS</code> pour tester qu'il contient une valeur, une fois avec <code>json_each</code> dans le FROM pour lister ses autres éléments. Le résultat se joint ensuite comme n'importe quelle table :</p>
<pre class="code">FROM saisies s, json_each(s.contenu, '$.a') j
JOIN suspects su ON LOWER(su.nom) = j.value</pre>`,
  task:`Pour les messages dont le tableau <code>a</code> contient 'cartographe', affiche les <b>autres</b> destinataires (<code>complice</code>, valeur du tableau), rapprochés des suspects du même nom (<code>LOWER(nom)</code>) membres du gang 'Le Cercle' : <code>complice</code>, <code>prenom</code>, <code>nom</code>, <code>gang</code> (nom du gang) et <code>role</code>.`,
  solution:`SELECT j.value AS complice, su.prenom, su.nom, g.nom AS gang, m.role FROM saisies s, json_each(s.contenu, '$.a') j JOIN suspects su ON LOWER(su.nom) = j.value JOIN membres m ON m.suspect_id = su.id JOIN gangs g ON g.id = m.gang_id WHERE json_extract(s.contenu, '$.type') = 'message' AND EXISTS (SELECT 1 FROM json_each(s.contenu, '$.a') k WHERE k.value = 'cartographe') AND j.value <> 'cartographe' AND g.nom = 'Le Cercle';`,
  hints:["FROM saisies s, json_each(s.contenu, '$.a') j, avec EXISTS (SELECT 1 FROM json_each(s.contenu, '$.a') k WHERE k.value = 'cartographe')","Exclus j.value = 'cartographe', puis JOIN suspects, membres et gangs (Le Cercle)."],
  require:[{re:'json_each', msg:"Utilise json_each pour parcourir le tableau des destinataires."}],
  check:{strictCols:true},
  success:`<b>Marc Vasseur</b>. Le braqueur de Minuit était en copie du message du 10 novembre, avec le Cartographe. Il dort en cellule depuis six mois et n'a jamais prononcé ce nom. « Il le connaît », dit Varga en attrapant son manteau. « On va lui rendre visite. »`
});

/* ============ 16 : Le port ============ */
mis({ id:'16.A', ch:16, side:'annexe', xp:120, title:'Le temps de séjour', who:'haddad',
  story:`Haddad, les mains dans les poches de son caban : « Sur ce port, un conteneur reste en moyenne trois ou quatre jours. Pour les conteneurs du <b>Stella Maris</b>, donne-moi l'arrivée, le départ et la durée du séjour. On verra qui a traîné. »`,
  lesson:`<p>FIRST_VALUE et LAST_VALUE marchent sur n'importe quelle colonne, y compris les horodatages. Pour calculer à partir de leurs résultats, passe par une CTE : on ne peut pas réutiliser un alias de fenêtre dans le même SELECT.</p>
<pre class="code">WITH f AS (SELECT DISTINCT conteneur,
  FIRST_VALUE(x) OVER (...) AS premier, LAST_VALUE(x) OVER (...) AS dernier
  FROM ...)
SELECT conteneur, premier, dernier FROM f;</pre>`,
  task:`Pour les mouvements du navire 'Stella Maris' (hors 'Inventaire'), affiche une ligne par conteneur : <code>conteneur</code>, <code>arrivee</code> (premier horodatage), <code>depart</code> (dernier horodatage) et <code>jours</code> (écart en jours, arrondi à 1 décimale), triés par <code>jours</code> décroissant.`,
  solution:`WITH f AS (SELECT DISTINCT conteneur, FIRST_VALUE(horodatage) OVER (PARTITION BY conteneur ORDER BY horodatage) AS arrivee, LAST_VALUE(horodatage) OVER (PARTITION BY conteneur ORDER BY horodatage ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS depart FROM mouvements_port WHERE navire = 'Stella Maris' AND evenement <> 'Inventaire') SELECT conteneur, arrivee, depart, ROUND(julianday(depart) - julianday(arrivee), 1) AS jours FROM f ORDER BY jours DESC;`,
  hints:["FIRST_VALUE(horodatage) et LAST_VALUE(horodatage) OVER (PARTITION BY conteneur ORDER BY horodatage ...)","N'oublie pas ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING pour LAST_VALUE, puis une CTE pour le calcul des jours."],
  require:[{re:'FIRST_VALUE|LAST_VALUE', msg:"Utilise FIRST_VALUE() et LAST_VALUE()."}],
  check:{ordered:true, orderKeys:[3]},
  success:`MSCU-449120 : 8,7 jours à quai, le double des autres. Haddad siffle entre ses dents : « Personne ne paie huit jours de stockage pour du matériel informatique. Sauf si on attend quelque chose. »`
});
mis({ id:'16.S', ch:16, side:'cachee', xp:200, title:"L'horloge du port", who:'haddad',
  teaser:`Les portiques du port tirent à heure pile. Un conteneur, lui, n'a jamais respecté l'horloge.`,
  story:`Haddad baisse la voix : « Je ne te l'ai pas dit, mais nos portiques automatiques scannent toujours <b>à l'heure pile</b>. Seuls les inventaires se font à la main, au lecteur portatif. Si un conteneur a des écarts entre scans qui ne tombent pas sur des heures rondes, quelqu'un l'a scanné à la main. »`,
  lesson:`<p>On calcule l'écart en minutes avec LAG dans une CTE, puis on teste s'il est un multiple de 60 avec l'opérateur modulo <code>%</code> :</p>
<pre class="code">ROUND((julianday(h) - julianday(LAG(h) OVER (...))) * 1440) AS minutes
...
CASE WHEN minutes % 60 <> 0 THEN 1 ELSE 0 END</pre>
<p>Le premier scan de chaque conteneur n'a pas de précédent : son écart vaut NULL, on l'écarte.</p>`,
  task:`En ignorant les événements 'Inventaire', calcule pour chaque scan l'écart en minutes avec le scan précédent du même conteneur. Affiche <code>conteneur</code>, <code>ecarts</code> (nombre d'écarts non NULL), <code>irreguliers</code> (écarts qui ne sont pas un multiple de 60 minutes) et <code>importateur</code> (nom de la société importatrice), pour les conteneurs ayant au moins un écart irrégulier.`,
  solution:`WITH g AS (SELECT conteneur, ROUND((julianday(horodatage) - julianday(LAG(horodatage) OVER (PARTITION BY conteneur ORDER BY horodatage))) * 1440) AS minutes FROM mouvements_port WHERE evenement <> 'Inventaire') SELECT g.conteneur, COUNT(*) AS ecarts, SUM(CASE WHEN g.minutes % 60 <> 0 THEN 1 ELSE 0 END) AS irreguliers, s.nom AS importateur FROM g JOIN conteneurs c ON c.code = g.conteneur JOIN societes s ON s.siren = c.importateur_siren WHERE g.minutes IS NOT NULL GROUP BY g.conteneur, s.nom HAVING irreguliers > 0;`,
  hints:["CTE avec LAG(horodatage) OVER (PARTITION BY conteneur ORDER BY horodatage) et l'écart * 1440, arrondi.","SUM(CASE WHEN minutes % 60 <> 0 THEN 1 ELSE 0 END), WHERE minutes IS NOT NULL, puis jointure conteneurs et societes."],
  require:[{re:'LAG', msg:"Utilise LAG() pour calculer l'écart avec le scan précédent."}],
  check:{strictCols:true},
  success:`Un seul conteneur, et pas un seul scan automatique : les huit écarts de <b>MSCU-449120</b> tombent à la minute près, 8h25, 16h20, 24h05... Tout son parcours a été saisi à la main. Haddad pâlit : « Ce conteneur n'est peut-être jamais passé sous nos portiques. Son historique est un faux. »`
});

/* ============ 17 : Le métro ============ */
mis({ id:'17.A', ch:17, side:'annexe', xp:120, title:'Personne au clavier', who:'byte',
  story:`Byte fronce les sourcils : « Pour le patient zéro, il y avait quelqu'un au clavier. Mais pour les autres machines infectées ? Si <b>aucune session</b> n'était ouverte au moment de leur premier contact avec le C2, c'est que le virus s'est propagé tout seul. Un ver. »`,
  lesson:`<p>Le LEFT JOIN sur un intervalle garde toutes les lignes de gauche ; celles qui ne trouvent aucune session en face ont des colonnes NULL. On les repère avec <code>IS NULL</code> :</p>
<pre class="code">FROM a LEFT JOIN sessions_postes s
  ON s.poste = a.poste AND a.instant BETWEEN s.debut AND s.fin
WHERE s.id IS NULL</pre>`,
  task:`Pour chaque poste ayant contacté <code>'198.51.100.200'</code>, prends son <code>premier_contact</code> (MIN horodatage). Affiche <code>poste</code> et <code>premier_contact</code> des postes sur lesquels aucune session n'était ouverte à cet instant, triés par <code>premier_contact</code>.`,
  solution:`WITH p AS (SELECT poste, MIN(horodatage) AS premier_contact FROM trafic WHERE ip_dst = '198.51.100.200' GROUP BY poste) SELECT p.poste, p.premier_contact FROM p LEFT JOIN sessions_postes s ON s.poste = p.poste AND p.premier_contact BETWEEN s.debut AND s.fin WHERE s.id IS NULL ORDER BY p.premier_contact;`,
  hints:["CTE p : MIN(horodatage) par poste vers le C2.","p LEFT JOIN sessions_postes s ON s.poste = p.poste AND p.premier_contact BETWEEN s.debut AND s.fin WHERE s.id IS NULL"],
  check:{ordered:true},
  success:`Trois machines contaminées sans personne devant : SRV-SIGNAL-2, SRV-BILLET et PCC-15, entre 6h10 et 6h30. « Un humain a ouvert la porte, le ver a fait le reste », conclut Byte.`
});
mis({ id:'17.S', ch:17, side:'cachee', xp:200, title:'Deux sur un poste', who:'byte',
  teaser:`Sur un poste de maintenance, deux personnes ont été connectées en même temps.`,
  story:`Byte relit <code>sessions_postes</code> en mâchonnant un stylo : « Normalement, sur un poste, une session se ferme avant que la suivante s'ouvre. Cherchons les <b>chevauchements</b> : deux sessions sur le même poste, la seconde ouverte avant la fin de la première. »`,
  lesson:`<p>Une auto-jointure compare une table avec elle-même. Pour des intervalles, la seconde session commence après le début de la première et avant sa fin :</p>
<pre class="code">FROM sessions_postes a
JOIN sessions_postes b ON b.poste = a.poste
 AND b.debut > a.debut AND b.debut < a.fin</pre>`,
  task:`Affiche <code>poste</code>, <code>premier</code> (login de la session déjà ouverte), <code>second</code> (login de la session qui s'ouvre pendant la première), <code>ouverture</code> (début de la seconde), <code>fermeture</code> (fin de la première) et <code>minutes</code> (durée du chevauchement, arrondie à 1 décimale).`,
  solution:`SELECT a.poste, a.login AS premier, b.login AS second, b.debut AS ouverture, a.fin AS fermeture, ROUND((julianday(a.fin) - julianday(b.debut)) * 1440, 1) AS minutes FROM sessions_postes a JOIN sessions_postes b ON b.poste = a.poste AND b.debut > a.debut AND b.debut < a.fin;`,
  hints:["Auto-jointure : sessions_postes a JOIN sessions_postes b ON b.poste = a.poste ...","b.debut > a.debut AND b.debut < a.fin ; minutes = (julianday(a.fin) - julianday(b.debut)) * 1440"],
  check:{strictCols:true},
  success:`Un seul chevauchement de tout le réseau : sur <b>MAINT-07</b>, <b>tech.benali</b> était encore connecté quand <b>ext.kartograf</b> a ouvert sa session, à 5h27. Presque quatre minutes ensemble devant le même poste. Benali a vu le visage du Cartographe, ou lui a laissé sa place. « Il faut l'entendre. Ce matin. »`
});

/* ============ 18 : Les cryptos ============ */
mis({ id:'18.A', ch:18, side:'annexe', xp:120, title:'La boucle', who:'byte',
  story:`Byte tapote l'écran : « Ta requête évite les boucles, très bien. Mais pour le dossier, je veux la boucle elle-même : à quel moment l'argent de la rançon <b>revient</b> sur un portefeuille par lequel il est déjà passé ? »`,
  lesson:`<p>Le test <code>instr(chemin, adresse) = 0</code> empêche de repasser par une adresse. Pour <b>trouver</b> les cycles, on fait l'inverse, après la récursion : on cherche les transactions suivantes dont la destination est déjà dans le chemin.</p>
<pre class="code">SELECT ... FROM suivi s
JOIN tx_crypto t ON t.de = s.adresse AND t.horodatage > s.quand
WHERE instr(s.chemin, t.vers) > 0</pre>`,
  task:`Reprends <code>suivi</code> de la mission 18.2 (mêmes garde-fous). Affiche <code>chemin</code>, <code>retour</code> (adresse déjà visitée vers laquelle l'argent repart), <code>montant</code> et <code>horodatage</code> des transactions qui referment une boucle.`,
  solution:`WITH RECURSIVE suivi(adresse, saut, chemin, quand) AS (SELECT 'bc1q-eclipse-7f3a', 0, 'bc1q-eclipse-7f3a', '2027-05-12 00:00:00' UNION ALL SELECT t.vers, c.saut + 1, c.chemin || ' > ' || t.vers, t.horodatage FROM tx_crypto t JOIN suivi c ON t.de = c.adresse WHERE c.saut < 8 AND t.horodatage > c.quand AND instr(c.chemin, t.vers) = 0) SELECT s.chemin, t.vers AS retour, t.montant, t.horodatage FROM suivi s JOIN tx_crypto t ON t.de = s.adresse AND t.horodatage > s.quand WHERE instr(s.chemin, t.vers) > 0;`,
  hints:["Même CTE récursive qu'en 18.2.","Puis JOIN tx_crypto t ON t.de = s.adresse AND t.horodatage > s.quand WHERE instr(s.chemin, t.vers) > 0"],
  require:[{re:'RECURSIVE', msg:"Il faut une CTE récursive."}],
  check:{strictCols:true},
  success:`Une boucle : 1 BTC repart de bc1q-mix-05 vers <b>bc1q-mix-03</b>, où il était déjà passé deux heures plus tôt. Le mixeur TumbleNet tourne en rond exprès pour casser les analyses naïves. La tienne a tenu.`
});
mis({ id:'18.S', ch:18, side:'cachee', xp:200, title:'Le compte de la prisonnière', who:'varga',
  teaser:`Une détenue reçoit de l'argent en cryptomonnaie depuis sa cellule.`,
  story:`Varga repose la liste des plateformes : « Les KYC, c'est une identité, format <code>S. NOM</code>. Une idée me trotte dans la tête : la <b>cheffe du Cercle</b> a-t-elle un compte d'échange ? Et si oui, qui l'alimente, alors qu'elle est en prison depuis novembre ? »`,
  lesson:`<p>On peut reconstruire le format KYC à partir d'un nom de la première affaire, puis joindre sur cette expression :</p>
<pre class="code">UPPER(SUBSTR(prenom, 1, 1) || '. ' || nom)
-- 'Karine', 'Lefort' donne 'K. LEFORT'</pre>
<p>Pour savoir d'où vient l'argent, joins <code>wallets</code> une seconde fois, sur l'expéditeur, avec un autre alias.</p>`,
  task:`Retrouve la cheffe du gang 'Le Cercle' (<code>gangs.chef_id</code>), puis son portefeuille d'échange (<code>kyc_nom</code> au format ci-dessus). Affiche <code>adresse</code>, <code>plateforme</code>, <code>kyc_nom</code>, <code>versements</code> (nombre de transactions reçues), <code>total</code> (somme reçue, arrondie à 2 décimales), <code>via_mixeur</code> (versements venus d'un portefeuille de type 'mixeur') et <code>premier</code> (date du premier versement).`,
  solution:`SELECT w.adresse, w.plateforme, w.kyc_nom, COUNT(*) AS versements, ROUND(SUM(t.montant), 2) AS total, SUM(CASE WHEN src.type = 'mixeur' THEN 1 ELSE 0 END) AS via_mixeur, MIN(t.horodatage) AS premier FROM gangs g JOIN suspects s ON s.id = g.chef_id JOIN wallets w ON w.kyc_nom = UPPER(SUBSTR(s.prenom, 1, 1) || '. ' || s.nom) JOIN tx_crypto t ON t.vers = w.adresse JOIN wallets src ON src.adresse = t.de WHERE g.nom = 'Le Cercle' GROUP BY w.adresse, w.plateforme, w.kyc_nom;`,
  hints:["gangs g JOIN suspects s ON s.id = g.chef_id JOIN wallets w ON w.kyc_nom = UPPER(SUBSTR(s.prenom, 1, 1) || '. ' || s.nom)","Puis JOIN tx_crypto t ON t.vers = w.adresse JOIN wallets src ON src.adresse = t.de, et SUM(CASE WHEN src.type = 'mixeur' ...)"],
  require:[{re:'^(?![\\s\\S]*(MARCHETTI|Marchetti|EXCH-ALP-0777))', msg:"Ne recopie ni le nom ni le compte : pars du gang et laisse la requête les retrouver."}],
  check:{strictCols:true},
  success:`<b>EXCH-ALP-0777</b>, chez AlpenX, au nom de <b>S. MARCHETTI</b> : 17 versements, presque 22 BTC, le premier en mars 2027, quatre mois après son incarcération. Deux viennent directement des mixeurs TumbleNet, le même service que la rançon. Varga serre les dents : « Quelqu'un paie Solène pour qu'elle se taise. »`
});

/* ============ 19 : La forteresse ============ */
mis({ id:'19.A', ch:19, side:'annexe', xp:120, title:'Le mouchard des modifications', who:'byte',
  story:`Byte enchaîne : « Les suppressions sont surveillées. Mais modifier la description d'une pièce, c'est aussi efficace pour la saboter. Deuxième mouchard : chaque <b>modification</b> d'une pièce doit laisser une trace dans <code>journal_brigade</code>, avec l'ancienne description. »`,
  lesson:`<p>Un trigger <code>AFTER UPDATE</code> voit à la fois l'ancienne ligne (<code>OLD</code>) et la nouvelle (<code>NEW</code>). On peut écrire dans n'importe quelle table, en ne précisant que certaines colonnes :</p>
<pre class="code">CREATE TRIGGER nom AFTER UPDATE ON t
BEGIN
  INSERT INTO journal (col1, col2) VALUES ('x', OLD.colonne);
END;</pre>`,
  task:`Crée le trigger <code>trg_modif</code> AFTER UPDATE ON <code>pieces</code> qui insère dans <code>journal_brigade</code> (login, action, table_cible, ligne_id, ancienne_valeur, horodatage) les valeurs <code>'trigger'</code>, <code>'UPDATE'</code>, <code>'pieces'</code>, l'id de la pièce, son <b>ancienne</b> description et <code>datetime('now')</code>. Teste-le en changeant la description de la pièce 14 en <code>'Relevé NeoCoin, compte EXCH-NEO-5521'</code>.`,
  solution:`CREATE TRIGGER trg_modif AFTER UPDATE ON pieces BEGIN INSERT INTO journal_brigade (login, action, table_cible, ligne_id, ancienne_valeur, horodatage) VALUES ('trigger', 'UPDATE', 'pieces', OLD.id, OLD.description, datetime('now')); END; UPDATE pieces SET description = 'Relevé NeoCoin, compte EXCH-NEO-5521' WHERE id = 14;`,
  hints:["CREATE TRIGGER trg_modif AFTER UPDATE ON pieces BEGIN INSERT INTO journal_brigade (...) VALUES ('trigger', 'UPDATE', 'pieces', OLD.id, OLD.description, datetime('now')); END;","Termine par l'UPDATE de test sur la pièce 14."],
  require:[{re:'CREATE\\s+TRIGGER', msg:"Crée un trigger."}],
  check:{mode:'dml', verify:["SELECT id, description FROM pieces ORDER BY id","UPDATE pieces SET description = 'Relevé CH-9131 (copie)' WHERE id = 4; SELECT action, table_cible, ligne_id, ancienne_valeur FROM journal_brigade WHERE login = 'trigger' ORDER BY ligne_id"]},
  success:`Le journal note maintenant chaque retouche, avec l'ancienne version. Si quelqu'un réécrit une pièce pour la vider de son sens, la brigade le saura dans la seconde.`
});
mis({ id:'19.S', ch:19, side:'cachee', xp:200, title:"L'auditeur qui ne lisait rien", who:'byte',
  teaser:`Un auditeur payé pour examiner la base n'y a jamais rien lu.`,
  setup:`CREATE TABLE fiche_activite (login TEXT PRIMARY KEY, lectures INTEGER NOT NULL DEFAULT 0, ecritures INTEGER NOT NULL DEFAULT 0, suppressions INTEGER NOT NULL DEFAULT 0); INSERT INTO fiche_activite VALUES ('i.varga', 412, 57, 0), ('n.kessler', 388, 61, 0), ('consultant.fo', 0, 0, 0);`,
  story:`Byte ouvre la vieille table <code>fiche_activite</code>, le cumul d'activité de chaque compte, arrêté fin avril. « On la met à jour avec le journal de mai, <b>en une seule instruction</b> : on ajoute aux comptes existants, on crée les autres. Ouali avait une mission d'audit de la base. Voyons ce qu'il a audité. »`,
  lesson:`<p>L'UPSERT accepte aussi un <code>INSERT ... SELECT</code>. Dans le <code>DO UPDATE</code>, le mot-clé <code>excluded</code> désigne la ligne qu'on essayait d'insérer :</p>
<pre class="code">INSERT INTO compteurs_alertes (station, nb)
SELECT station, COUNT(*) FROM incidents GROUP BY station
ON CONFLICT (station) DO UPDATE SET nb = nb + excluded.nb;</pre>
<p>Ici, la colonne <code>nb</code> seule désigne la valeur déjà présente dans la table.</p>`,
  task:`En un seul <code>INSERT ... SELECT ... ON CONFLICT</code>, ajoute à <code>fiche_activite</code> l'activité de chaque login de <code>journal_brigade</code> : <code>lectures</code> (actions 'SELECT'), <code>ecritures</code> (actions 'INSERT' ou 'UPDATE') et <code>suppressions</code> (actions 'DELETE'). Les logins déjà présents voient leurs compteurs augmenter, les autres sont créés.`,
  solution:`INSERT INTO fiche_activite (login, lectures, ecritures, suppressions) SELECT login, SUM(CASE WHEN action = 'SELECT' THEN 1 ELSE 0 END), SUM(CASE WHEN action IN ('INSERT', 'UPDATE') THEN 1 ELSE 0 END), SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) FROM journal_brigade GROUP BY login ON CONFLICT (login) DO UPDATE SET lectures = lectures + excluded.lectures, ecritures = ecritures + excluded.ecritures, suppressions = suppressions + excluded.suppressions;`,
  hints:["INSERT INTO fiche_activite (...) SELECT login, SUM(CASE WHEN action = 'SELECT' THEN 1 ELSE 0 END), ... FROM journal_brigade GROUP BY login","ON CONFLICT (login) DO UPDATE SET lectures = lectures + excluded.lectures, ..."],
  require:[{re:'ON\\s+CONFLICT', msg:"Utilise INSERT ... ON CONFLICT."},{re:'excluded', msg:"Ajoute les nouvelles valeurs avec excluded.colonne."}],
  check:{mode:'dml', verify:["SELECT login, lectures, ecritures, suppressions FROM fiche_activite ORDER BY login"]},
  success:`La fiche de <b>consultant.fo</b> : 0 lecture, 0 écriture, 4 suppressions. Un auditeur chargé d'examiner la base qui n'y a jamais lu une seule ligne. « Il savait exactement quoi effacer sans avoir rien consulté », murmure Byte. « Il lisait la base par un autre chemin. »`
});

/* ============ 20 : Contre la montre ============ */
mis({ id:'20.A', ch:20, side:'annexe', xp:120, title:'Qui est devant le poste ?', who:'varga2',
  story:`Varga, au téléphone avec les équipes de terrain : « Avant de débrancher une machine, je veux savoir qui est assis devant. La recherche de session doit être <b>instantanée</b> : un index sur <code>sessions_postes</code>, et prouve-moi qu'il sert. »`,
  lesson:`<p>Pour une recherche « tel poste, session commencée avant tel instant », l'index composite met la colonne d'égalité d'abord, puis la colonne de plage :</p>
<pre class="code">CREATE INDEX idx ON table(col_egalite, col_plage);</pre>
<p>Dans le plan, SQLite affiche les colonnes utilisées par l'index : <code>(poste=? AND debut&lt;?)</code>.</p>`,
  task:`Crée un index sur <code>sessions_postes(poste, debut)</code>, puis affiche le plan de <code>SELECT login FROM sessions_postes WHERE poste = 'MAINT-02' AND debut <= '2027-05-12 06:17:12' AND fin >= '2027-05-12 06:17:12'</code>.`,
  solution:`CREATE INDEX idx_sessions_poste_debut ON sessions_postes(poste, debut); EXPLAIN QUERY PLAN SELECT login FROM sessions_postes WHERE poste = 'MAINT-02' AND debut <= '2027-05-12 06:17:12' AND fin >= '2027-05-12 06:17:12';`,
  hints:["CREATE INDEX nom ON sessions_postes(poste, debut);","Puis EXPLAIN QUERY PLAN devant la requête demandée."],
  require:[{re:'CREATE\\s+INDEX', msg:"Crée d'abord l'index."},{re:'ON\\s+sessions_postes\\s*\\(\\s*poste\\s*,\\s*debut\\s*\\)', msg:"L'index doit porter sur sessions_postes(poste, debut), dans cet ordre."},{re:"WHERE\\s+poste\\s*=\\s*'MAINT-02'", msg:"Analyse la requête demandée."}],
  check:{mode:'plan', contains:'debut<?'},
  success:`<code>SEARCH sessions_postes USING INDEX ... (poste=? AND debut&lt;?)</code> : l'index sert sur ses deux colonnes. Chaque équipe sait désormais à qui elle parle avant d'arracher un câble.`
});
mis({ id:'20.S', ch:20, side:'cachee', xp:200, title:"L'argent qui dort", who:'byte',
  teaser:`Une partie de la rançon n'a jamais bougé de la plateforme où elle est arrivée.`,
  story:`23h41. Pendant que les équipes courent, Byte calcule à voix basse : « Ouali a disparu, d'accord. Mais son argent ? Sur des milliards de transactions, il faut deux index pour répondre à temps. Je cherche les comptes d'échange qui ont reçu de l'argent et n'en ont <b>jamais rien envoyé</b>. »`,
  lesson:`<p>Un <code>NOT EXISTS</code> corrélé interroge la table pour chaque ligne : sans index, c'est un parcours complet à chaque fois. Avec un index sur la colonne testée, chaque vérification devient un SEARCH.</p>
<pre class="code">CREATE INDEX idx_x ON table(colonne);
SELECT ... WHERE NOT EXISTS (SELECT 1 FROM table WHERE colonne = w.adresse);</pre>`,
  task:`Crée au moins un index sur <code>tx_crypto</code>, puis affiche <code>adresse</code>, <code>plateforme</code>, <code>kyc_nom</code>, <code>recu</code> (somme reçue, arrondie à 2 décimales) et <code>derniere_entree</code> (dernier horodatage reçu) des portefeuilles de type 'exchange' qui ont reçu au moins une transaction et n'ont jamais été l'expéditeur (<code>de</code>) d'aucune.`,
  solution:`CREATE INDEX idx_tx_de ON tx_crypto(de); CREATE INDEX idx_tx_vers ON tx_crypto(vers); SELECT w.adresse, w.plateforme, w.kyc_nom, ROUND(SUM(t.montant), 2) AS recu, MAX(t.horodatage) AS derniere_entree FROM wallets w JOIN tx_crypto t ON t.vers = w.adresse WHERE w.type = 'exchange' AND NOT EXISTS (SELECT 1 FROM tx_crypto x WHERE x.de = w.adresse) GROUP BY w.adresse, w.plateforme, w.kyc_nom;`,
  hints:["CREATE INDEX ... ON tx_crypto(de); et éventuellement ON tx_crypto(vers);","JOIN tx_crypto t ON t.vers = w.adresse WHERE w.type = 'exchange' AND NOT EXISTS (SELECT 1 FROM tx_crypto x WHERE x.de = w.adresse)"],
  require:[{re:'CREATE\\s+INDEX', msg:"Crée d'abord un index : ce soir, chaque seconde compte."},{re:'ON\\s+tx_crypto\\s*\\(', msg:"L'index doit porter sur tx_crypto."}],
  check:{strictCols:true},
  success:`<b>EXCH-NEO-5521</b>, NeoCoin, au nom de F. OUALI : 12,8 BTC arrivés à 19h00, jamais retirés. Ouali n'a pas eu le temps de toucher à sa part. Varga décroche déjà : « La juge Amrani. Gel immédiat du compte NeoCoin. » À 23h46, l'argent de la rançon est bloqué.`
});

/* ============ 21 : Les témoins ============ */
mis({ id:'21.A', ch:21, side:'annexe', xp:120, title:'Rappeler les bons témoins', who:'varga',
  story:`Varga prépare les auditions : « Je ne rappelle que ceux qui ont <b>vu quelque chose</b>. Un nom propre, un numéro propre, une ligne par témoin. Pas question d'appeler deux fois le même. »`,
  lesson:`<p>Les numéros aussi doivent être normalisés : <code>'06 12 34 56 78'</code> et <code>'0612345678'</code> sont le même numéro. Une fois le nom et le numéro nettoyés, <code>DISTINCT</code> élimine les doublons.</p>
<pre class="code">REPLACE('07 11 22 33 44', ' ', '')  -- '0711223344'</pre>`,
  task:`Pour les témoignages dont la <code>description</code> ne commence pas par 'Rien vu', affiche sans doublon <code>temoin</code> (LOWER(TRIM(temoin))) et <code>telephone</code> (sans espaces), triés par <code>temoin</code>.`,
  solution:`SELECT DISTINCT LOWER(TRIM(temoin)) AS temoin, REPLACE(telephone, ' ', '') AS telephone FROM temoignages_bruts WHERE description NOT LIKE 'Rien vu%' ORDER BY temoin;`,
  hints:["REPLACE(telephone, ' ', '') pour le numéro, LOWER(TRIM(temoin)) pour le nom.","WHERE description NOT LIKE 'Rien vu%', avec DISTINCT."],
  check:{ordered:true},
  success:`Six témoins, six numéros propres. Ahmed Kaci, Martine Dubois, Tom Nguyen, Sofia Rossi : tous décrivent un homme aux tempes grises ou une Tesla grise. Les convocations partent dans l'heure.`
});
mis({ id:'21.S', ch:21, side:'cachee', xp:200, title:'Les faux témoins', who:'byte',
  teaser:`Certains témoins ont appelé plusieurs fois, et jamais depuis le même numéro.`,
  story:`Byte plisse les yeux : « Il y a un autre groupe, ceux qui n'ont « rien vu ». Ils appellent plusieurs fois, et j'ai l'impression que le numéro change à chaque appel. Pour chaque témoin qui a appelé plus d'une fois, compare le nombre d'appels et le nombre de <b>numéros différents</b>. Et regarde quelle plaque ils citent. »`,
  lesson:`<p>On combine tout ce qu'on a vu : nom normalisé pour le GROUP BY, numéro normalisé dans un <code>COUNT(DISTINCT ...)</code>, et une jointure sur la plaque normalisée des deux côtés. Un LEFT JOIN garde les témoignages sans plaque ; <code>MAX</code> ignore les NULL.</p>`,
  task:`Par témoin normalisé (LOWER(TRIM(temoin))), affiche <code>temoin</code>, <code>appels</code>, <code>numeros</code> (numéros différents, sans espaces), <code>plaque</code> (MAX de l'immatriculation de la carte grise citée) et <code>titulaire</code> (MAX du titulaire). Garde les témoins ayant appelé plus d'une fois <b>avec un numéro différent à chaque appel</b>, triés par <code>appels</code> décroissant puis <code>temoin</code>.`,
  solution:`SELECT LOWER(TRIM(t.temoin)) AS temoin, COUNT(*) AS appels, COUNT(DISTINCT REPLACE(t.telephone, ' ', '')) AS numeros, MAX(c.immatriculation) AS plaque, MAX(c.titulaire) AS titulaire FROM temoignages_bruts t LEFT JOIN cartes_grises c ON REPLACE(c.immatriculation, '-', '') = UPPER(REPLACE(REPLACE(TRIM(t.plaque), ' ', ''), '-', '')) GROUP BY LOWER(TRIM(t.temoin)) HAVING COUNT(*) > 1 AND COUNT(DISTINCT REPLACE(t.telephone, ' ', '')) = COUNT(*) ORDER BY appels DESC, temoin;`,
  hints:["LEFT JOIN cartes_grises c ON REPLACE(c.immatriculation, '-', '') = UPPER(REPLACE(REPLACE(TRIM(t.plaque), ' ', ''), '-', ''))","GROUP BY LOWER(TRIM(t.temoin)) HAVING COUNT(*) > 1 AND COUNT(DISTINCT REPLACE(t.telephone, ' ', '')) = COUNT(*)"],
  check:{ordered:true, orderKeys:[0,1]},
  success:`Quatre « témoins », quatorze appels, quatorze numéros jetables, la même phrase mot pour mot. Et une seule plaque : <b>KL-552-PM</b>, une Peugeot bleue de Provence Import, garée à l'autre bout de la ville. « Une diversion », dit Byte. « Quelqu'un voulait nous envoyer chercher la mauvaise voiture. »`
});

/* ============ 22 : Éclipse ============ */
mis({ id:'22.A', ch:22, side:'annexe', xp:120, title:'Les deux visages', who:'juge',
  story:`La juge Amrani, en visioconférence : « La défense dira que Farid Ouali n'était qu'un consultant malchanceux. Je veux une frise de <b>ses</b> traces, sous ses trois identités : son compte d'Hélios, le Cartographe du disque de Solène, et ses deux comptes TransSeine et brigade. »`,
  lesson:`<p>Même motif que la chronologie totale : chaque source produit les mêmes trois colonnes, UNION ALL les empile, un seul ORDER BY trie le tout. Les valeurs JSON s'extraient directement dans chaque SELECT.</p>
<pre class="code">SELECT h AS quand, 'a' AS source, x AS detail FROM t1 WHERE ...
UNION ALL
SELECT json_extract(c, '$.date'), 'b', json_extract(c, '$.texte') FROM t2 WHERE ...
ORDER BY quand;</pre>`,
  task:`Affiche <code>quand</code>, <code>source</code>, <code>detail</code> en empilant : les connexions de <code>'f.ouali'</code> depuis <code>'203.0.113.66'</code> (source 'helios', detail = ip), les messages envoyés par 'cartographe' dans <code>saisies</code> (source 'saisies', quand = <code>$.date</code>, detail = <code>$.texte</code>), les sessions de 'ext.kartograf' (source 'sessions', quand = debut, detail = poste) et les suppressions de 'consultant.fo' dans le journal (source 'journal', detail = <code>$.description</code> de ancienne_valeur). Tri par <code>quand</code>.`,
  solution:`SELECT horodatage AS quand, 'helios' AS source, ip AS detail FROM connexions WHERE login = 'f.ouali' AND ip = '203.0.113.66' UNION ALL SELECT json_extract(contenu, '$.date'), 'saisies', json_extract(contenu, '$.texte') FROM saisies WHERE json_extract(contenu, '$.de') = 'cartographe' UNION ALL SELECT debut, 'sessions', poste FROM sessions_postes WHERE login = 'ext.kartograf' UNION ALL SELECT horodatage, 'journal', json_extract(ancienne_valeur, '$.description') FROM journal_brigade WHERE login = 'consultant.fo' AND action = 'DELETE' ORDER BY quand;`,
  hints:["Quatre SELECT de trois colonnes reliés par UNION ALL, un seul ORDER BY quand à la fin.","Pour les saisies : json_extract(contenu, '$.date') et json_extract(contenu, '$.texte') avec WHERE json_extract(contenu, '$.de') = 'cartographe'."],
  require:[{re:'UNION\\s+ALL', msg:"Empile les sources avec UNION ALL."}],
  check:{ordered:true, orderKeys:[0]},
  success:`Neuf lignes, un seul homme. Le 13 novembre à 22h47, au milieu de l'attaque d'Hélios, l'IP de l'attaquant tente deux fois le compte <b>f.ouali</b>, et échoue exprès : de quoi passer pour une victime. La juge hoche la tête : « Il s'est fabriqué un alibi dans ses propres journaux. »`
});
mis({ id:'22.S', ch:22, side:'cachee', xp:200, title:"L'associée balte", who:'varga',
  teaser:`Ouali n'était pas le seul propriétaire de Kartograf SARL.`,
  story:`Dans l'avion du retour, Varga ne dort pas. « 85 % de Kartograf pour Ouali. Et les <b>15 % restants</b> ? Ouali est fichu. Mais s'il y a un autre bénéficiaire, avec un compte d'échange à son nom, l'affaire n'est pas finie. »`,
  lesson:`<p>Tout est déjà dans ta boîte à outils : la chaîne de propriété récursive (18.5), le format KYC (22.2), une sous-requête scalaire pour le total reçu, et un <code>NOT IN</code> pour écarter les consultants déjà connus.</p>
<pre class="code">(SELECT SUM(montant) FROM tx_crypto WHERE vers = w.adresse) AS recu</pre>`,
  task:`À partir de l'importateur de 'MSCU-449120', remonte la chaîne de propriété et garde les bénéficiaires finaux (personnes) qui <b>ne sont pas</b> des consultants de la brigade (<code>consultants.nom_complet</code>) et qui ont un portefeuille dont le <code>kyc_nom</code> correspond au format <code>F. NOM</code>. Affiche <code>beneficiaire</code>, <code>part</code> (arrondie à 1 décimale), <code>plateforme</code>, <code>adresse</code> et <code>recu</code> (somme reçue par ce portefeuille, arrondie à 2 décimales).`,
  solution:`WITH RECURSIVE chaine(siren, part) AS (SELECT importateur_siren, 100.0 FROM conteneurs WHERE code = 'MSCU-449120' UNION ALL SELECT p.detenteur, c.part * p.pct / 100 FROM participations p JOIN chaine c ON p.detenue = c.siren), b AS (SELECT REPLACE(siren, 'PERSONNE:', '') AS nom, part FROM chaine WHERE siren LIKE 'PERSONNE:%') SELECT b.nom AS beneficiaire, ROUND(b.part, 1) AS part, w.plateforme, w.adresse, (SELECT ROUND(SUM(montant), 2) FROM tx_crypto WHERE vers = w.adresse) AS recu FROM b JOIN wallets w ON w.kyc_nom = UPPER(SUBSTR(b.nom, 1, 1) || '. ' || SUBSTR(b.nom, INSTR(b.nom, ' ') + 1)) WHERE b.nom NOT IN (SELECT nom_complet FROM consultants);`,
  hints:["Reprends la CTE chaine de 18.5, puis une CTE b avec les personnes (REPLACE(siren, 'PERSONNE:', '')).","JOIN wallets w ON w.kyc_nom = UPPER(SUBSTR(nom, 1, 1) || '. ' || SUBSTR(nom, INSTR(nom, ' ') + 1)) WHERE nom NOT IN (SELECT nom_complet FROM consultants)"],
  require:[{re:'RECURSIVE', msg:"La chaîne de propriété exige une CTE récursive."},{re:'^(?![\\s\\S]*(Larsen|LARSEN|EXCH-BLT))', msg:"Ne recopie aucun nom ni compte : la requête doit les retrouver seule."}],
  check:{strictCols:true},
  success:`<b>Inge Larsen</b>, 15 % de Kartograf SARL à travers Baltic Wind, à Riga. Son compte BalticEx a reçu plus de 34 BTC depuis mars. Kartograf a été créée le 20 novembre 2026, une semaine après Minuit, et Ouali n'en a jamais été le seul maître. Varga ferme les yeux et sourit : « Saison suivante. »`
});
