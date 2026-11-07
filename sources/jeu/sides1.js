// Quêtes annexes et cachées, saison 1

/* ============ CHAPITRE 1 ============ */
mis({ id:'1.A', ch:1, side:'annexe', xp:120, title:'Le registre des gangs',
  story:`Varga jette un classeur sur ton bureau. « Avant de courir après des gens, connais leurs familles. La table <code>gangs</code> liste les huit bandes de la région. Je veux savoir depuis combien de temps chacune existe. »`,
  lesson:`<p>Un calcul dans le SELECT, un alias, un tri : tout ce que tu as vu marche sur n'importe quelle table, pas seulement <code>suspects</code>.</p>
<pre class="code">SELECT nom, pointure, 50 - pointure AS ecart
FROM suspects
ORDER BY ecart DESC;</pre>
<p>Le tri peut porter sur une colonne de la table ou sur un alias calculé.</p>`,
  task:`Affiche <code>nom</code>, <code>territoire</code>, <code>fondation</code> et <code>anciennete</code> (égale à <code>2026 - fondation</code>) de tous les gangs, du plus ancien au plus récent (<code>fondation</code> croissante).`,
  solution:`SELECT nom, territoire, fondation, 2026 - fondation AS anciennete FROM gangs ORDER BY fondation;`,
  hints:["2026 - fondation AS anciennete","ORDER BY fondation (croissant par défaut)"],
  check:{strictCols:true, colNames:true, ordered:true},
  success:`Les Calanques, 28 ans de métier. Le Cercle n'a que 11 ans, et pourtant c'est le seul gang dont personne ne parle. Varga tapote la ligne du doigt.`
});
mis({ id:'1.S', ch:1, side:'cachee', xp:200, title:"L'argent qui fond",
  teaser:`Byte a remarqué des montants étrangement proches dans la table des virements.`,
  story:`Byte, à voix basse : « Personne ne m'a demandé de regarder la table <code>virements</code>. Mais trie-la par montant, juste pour voir. 480 000 € ont disparu ce soir, non ? »`,
  lesson:`<p>Un top N combine <code>ORDER BY ... DESC</code> et <code>LIMIT</code>. On peut aussi calculer, pour chaque ligne, l'écart avec une valeur de référence :</p>
<pre class="code">SELECT nom, age, 54 - age AS ecart_avec_vasseur
FROM suspects
ORDER BY age DESC
LIMIT 3;</pre>`,
  task:`Affiche <code>horodatage</code>, <code>compte_source</code>, <code>compte_dest</code>, <code>montant</code> et <code>evapore</code> (égal à <code>480000 - montant</code>) des <b>5</b> plus gros virements, par montant décroissant.`,
  solution:`SELECT horodatage, compte_source, compte_dest, montant, 480000 - montant AS evapore FROM virements ORDER BY montant DESC LIMIT 5;`,
  hints:["ORDER BY montant DESC LIMIT 5","480000 - montant AS evapore"],
  check:{strictCols:true, colNames:true, ordered:true},
  success:`Cinq virements en douze heures, chacun prenant la suite du précédent : 480 000, 475 000, 470 000, 462 500, 455 000. L'argent saute de compte en compte et quelqu'un prélève sa part à chaque saut. Byte entoure le dernier numéro, <b>CH-9131</b>. « On y reviendra. »`
});

/* ============ CHAPITRE 2 ============ */
mis({ id:'2.A', ch:2, side:'annexe', xp:120, title:'La voiture du repérage',
  story:`Un commerçant de l'Esplanade appelle la brigade : <i>« Toute la semaine, une voiture grise tournait autour de la banque. Une Peugeot, ou une Citroën, je les confonds. Ni neuve ni vieille : entre 2010 et 2020, je dirais. »</i>`,
  lesson:`<p>Le piège des priorités vaut pour toutes les tables : <code>AND</code> passe avant <code>OR</code>. Dès qu'un OR se mélange à des AND, mets-le entre parenthèses.</p>
<pre class="code">SELECT immatriculation, couleur
FROM vehicules
WHERE (couleur = 'Noire' OR couleur = 'Bleue')
  AND annee &gt;= 2020;</pre>`,
  task:`Dans <code>vehicules</code>, affiche <code>immatriculation</code>, <code>marque</code>, <code>annee</code> et <code>suspect_id</code> des voitures de marque <code>'Peugeot'</code> ou <code>'Citroën'</code>, de couleur <code>'Grise'</code>, dont l'année est comprise entre 2010 et 2020 (bornes incluses).`,
  solution:`SELECT immatriculation, marque, annee, suspect_id FROM vehicules WHERE (marque = 'Peugeot' OR marque = 'Citroën') AND couleur = 'Grise' AND annee BETWEEN 2010 AND 2020;`,
  hints:["(marque = 'Peugeot' OR marque = 'Citroën')","AND couleur = 'Grise' AND annee BETWEEN 2010 AND 2020"],
  check:{strictCols:true},
  success:`Sept voitures. Six Citroën, et une seule Peugeot : <b>FB-221-TR</b>, propriétaire n°217. Marc Vasseur venait repérer les lieux avec sa propre voiture. Amateur.`
});
mis({ id:'2.S', ch:2, side:'cachee', xp:200, title:'Les voitures qui roulent seules',
  teaser:`Vasseur dort en cellule depuis le 14 au matin. Ses voitures, elles, ne dorment pas.`,
  story:`Byte a sorti la carte grise de Vasseur : deux véhicules, la Peugeot <code>FB-221-TR</code> et une vieille Audi rouge <code>NC-406-DR</code>. « Il a été arrêté le 14 novembre à 6h12. Depuis, ses voitures devraient être au garage. Vérifie les caméras. »`,
  lesson:`<p>Deux plaques possibles <b>et</b> une condition de temps : c'est exactement le piège de l'indice n°3. Sans parenthèses, la condition de date ne s'applique qu'à la seconde plaque.</p>
<pre class="code">WHERE (lieu = 'Porte Maillot' OR lieu = 'Pont de Neuilly')
  AND horodatage &gt; '2026-11-10 00:00:00'</pre>
<p>Les horodatages se comparent comme du texte : <code>&gt;</code> veut dire « plus tard que ».</p>`,
  task:`Dans <code>cameras</code>, affiche <code>horodatage</code>, <code>lieu</code> et <code>immatriculation</code> des passages des plaques <code>'FB-221-TR'</code> ou <code>'NC-406-DR'</code> postérieurs à <code>'2026-11-14 06:12:00'</code>, par ordre chronologique.`,
  solution:`SELECT horodatage, lieu, immatriculation FROM cameras WHERE (immatriculation = 'FB-221-TR' OR immatriculation = 'NC-406-DR') AND horodatage > '2026-11-14 06:12:00' ORDER BY horodatage;`,
  hints:["Mets le OR des deux plaques entre parenthèses.","AND horodatage > '2026-11-14 06:12:00' ORDER BY horodatage"],
  check:{strictCols:true, ordered:true},
  success:`Le 14 à 13h12, l'Audi rouge franchit le pont de Neuilly. Le 15 à 4h24, la Peugeot passe le péage de l'A14. Vasseur était en garde à vue les deux fois. <b>Quelqu'un d'autre a ses clés.</b> Varga : « Ils n'étaient pas trois. Ils étaient au moins quatre. »`
});

/* ============ CHAPITRE 3 ============ */
mis({ id:'3.A', ch:3, side:'annexe', xp:120, title:'Les comptes sans visage',
  story:`Varga : « Dans un braquage, l'argent part toujours vers des comptes qui n'appartiennent à personne. Cherche dans <code>comptes</code> ceux dont le titulaire est inconnu. Et laisse de côté les comptes internes d'Hélios, qui commencent par HEL. »`,
  lesson:`<p><code>IS NULL</code> repère les valeurs absentes, <code>NOT LIKE</code> écarte un motif :</p>
<pre class="code">SELECT prenom, nom
FROM suspects
WHERE telephone IS NULL
  AND nom NOT LIKE 'D%';</pre>`,
  task:`Affiche <code>numero</code>, <code>banque</code> et <code>ouverture</code> des comptes dont <code>titulaire_id</code> est NULL et dont le numéro ne commence pas par <code>HEL</code>, triés par <code>ouverture</code> puis par <code>numero</code>.`,
  solution:`SELECT numero, banque, ouverture FROM comptes WHERE titulaire_id IS NULL AND numero NOT LIKE 'HEL%' ORDER BY ouverture, numero;`,
  hints:["titulaire_id IS NULL","numero NOT LIKE 'HEL%' puis ORDER BY ouverture, numero"],
  require:[{re:'IS\\s+NULL', msg:"Teste l'absence de titulaire avec IS NULL."}],
  check:{strictCols:true, ordered:true},
  success:`Quatre comptes fantômes, tous ouverts en 2025, dans quatre pays : France, Chypre, Lituanie, Malte. Une banque par étape, comme un relais. Quelqu'un a préparé le chemin de l'argent dix mois à l'avance.`
});
mis({ id:'3.S', ch:3, side:'cachee', xp:200, title:'Le numéro en 07',
  teaser:`Dans les fadettes, tous les numéros commencent par 06. Tous, sauf un.`,
  story:`Byte fait défiler la table <code>appels</code>. « Karine Lefort n'a pas de téléphone déclaré, elle utilise un jetable. Or tous les portables fichés de la base commencent par 06. Un numéro qui ne commence pas par 06, ce serait... intéressant. »`,
  lesson:`<p><code>NOT LIKE</code> garde les textes qui <b>ne</b> correspondent <b>pas</b> au motif. Ici le numéro peut être dans l'une ou l'autre colonne : il faut un <code>OR</code>.</p>
<pre class="code">SELECT *
FROM vehicules
WHERE immatriculation NOT LIKE 'A%'
   OR marque NOT LIKE 'R%';</pre>`,
  task:`Affiche <code>horodatage</code>, <code>appelant</code>, <code>appele</code> et <code>duree_s</code> des appels dont l'appelant <b>ou</b> l'appelé ne commence pas par <code>06</code>, par ordre chronologique.`,
  solution:`SELECT horodatage, appelant, appele, duree_s FROM appels WHERE appelant NOT LIKE '06%' OR appele NOT LIKE '06%' ORDER BY horodatage;`,
  hints:["appelant NOT LIKE '06%' OR appele NOT LIKE '06%'","N'oublie pas ORDER BY horodatage."],
  require:[{re:'LIKE', msg:"Utilise LIKE (ou NOT LIKE) pour tester le début du numéro."}],
  check:{strictCols:true, ordered:true},
  success:`Deux appels seulement, avec le <b>0700000713</b>. À 22h30, Vasseur appelle ce jetable pendant une minute. À 0h06, le jetable le rappelle : l'Audi venait de quitter l'Esplanade. Byte : « Je parie mon café que c'est le téléphone de Karine Lefort. »`
});

/* ============ CHAPITRE 4 ============ */
mis({ id:'4.A', ch:4, side:'annexe', xp:120, title:'La fuite minute par minute',
  story:`La juge veut savoir à quelle vitesse l'Audi <code>GH-713-KZ</code> s'est éloignée. « Pour chaque caméra, l'heure, et le nombre de minutes écoulées depuis 23h40, l'heure où le coffre a été vidé. »`,
  lesson:`<p><code>strftime</code> extrait une partie d'un horodatage, <code>julianday</code> permet de calculer un écart. Multiplié par 1 440 (minutes par jour), l'écart est en minutes :</p>
<pre class="code">SELECT strftime('%H:%M', '2026-11-13 08:15:42');   -- '08:15'
SELECT ROUND((julianday('2026-11-13 09:00:00')
            - julianday('2026-11-13 08:00:00')) * 1440);  -- 60.0</pre>`,
  task:`Pour les passages de <code>'GH-713-KZ'</code> entre <code>'2026-11-13 23:00:00'</code> et <code>'2026-11-14 01:00:00'</code>, affiche <code>lieu</code>, <code>heure</code> (format <code>HH:MM</code>) et <code>minutes</code> (minutes écoulées depuis <code>'2026-11-13 23:40:00'</code>, arrondies à l'entier avec ROUND), par ordre chronologique.`,
  solution:`SELECT lieu, strftime('%H:%M', horodatage) AS heure, ROUND((julianday(horodatage) - julianday('2026-11-13 23:40:00')) * 1440) AS minutes FROM cameras WHERE immatriculation = 'GH-713-KZ' AND horodatage BETWEEN '2026-11-13 23:00:00' AND '2026-11-14 01:00:00' ORDER BY horodatage;`,
  hints:["strftime('%H:%M', horodatage) AS heure","ROUND((julianday(horodatage) - julianday('2026-11-13 23:40:00')) * 1440) AS minutes"],
  check:{strictCols:true, ordered:true},
  success:`12 minutes après le casse, l'Audi passe l'Esplanade. Elle y repasse à 25 minutes, puis file vers le pont de Neuilly et atteint le péage de l'A14 51 minutes après. Un double passage sur l'Esplanade : elle attendait quelqu'un.`
});
mis({ id:'4.S', ch:4, side:'cachee', xp:200, title:'Le jour férié',
  teaser:`L'Audi de Karine Lefort est venue à La Défense bien avant la nuit du 13.`,
  story:`Byte, un sourcil levé : « On a toujours regardé l'Audi pendant la nuit du casse. Et avant ? Une conductrice de braquage ne découvre pas le terrain le soir même. »`,
  lesson:`<p>Un <code>CASE</code> peut étiqueter chaque ligne, et les fonctions de date donnent des écarts en jours :</p>
<pre class="code">SELECT date('2026-11-13 22:30:00');                       -- '2026-11-13'
SELECT CAST(julianday('2026-11-13') - julianday('2026-11-01') AS INTEGER);  -- 12
SELECT CASE WHEN lieu = 'A14 Péage' THEN 'Autoroute' ELSE 'Ville' END ...</pre>`,
  task:`Pour les passages de <code>'GH-713-KZ'</code> antérieurs à <code>'2026-11-13 23:00:00'</code>, affiche <code>jour</code> (la date seule, <code>date(horodatage)</code>), <code>heure</code> (format <code>HH:MM</code>), <code>lieu</code>, <code>jours_avant</code> (nombre entier de jours entre ce jour et le <code>'2026-11-13'</code>) et <code>nature</code> : <code>'Repérage'</code> si le lieu est <code>'Esplanade La Défense'</code>, <code>'Trajet'</code> sinon. Tri chronologique.`,
  solution:`SELECT date(horodatage) AS jour, strftime('%H:%M', horodatage) AS heure, lieu, CAST(julianday('2026-11-13') - julianday(date(horodatage)) AS INTEGER) AS jours_avant, CASE WHEN lieu = 'Esplanade La Défense' THEN 'Repérage' ELSE 'Trajet' END AS nature FROM cameras WHERE immatriculation = 'GH-713-KZ' AND horodatage < '2026-11-13 23:00:00' ORDER BY horodatage;`,
  hints:["CAST(julianday('2026-11-13') - julianday(date(horodatage)) AS INTEGER) AS jours_avant","CASE WHEN lieu = 'Esplanade La Défense' THEN 'Repérage' ELSE 'Trajet' END AS nature"],
  require:[{re:'CASE', msg:"Utilise CASE pour la colonne nature."}],
  check:{strictCols:true, ordered:true},
  success:`Le 11 novembre à 17h02, l'Audi était sur l'Esplanade. Un jour férié, banque fermée, deux jours avant le casse : Lefort chronométrait les rondes. Et le 8 au soir, elle passait déjà Porte Maillot. Le casse a été répété.`
});

/* ============ CHAPITRE 5 ============ */
mis({ id:'5.A', ch:5, side:'annexe', xp:120, title:'Les habitudes de Ferrand',
  story:`Farid Ouali hausse les épaules : « Le compte j.ferrand a été piraté, c'est tout. » Byte veut vérifier d'où ce compte se connecte d'habitude. « Un résumé par IP, s'il te plaît. »`,
  lesson:`<p>Plusieurs agrégats par groupe donnent un profil complet. Comme <code>succes</code> vaut 0 ou 1, sa somme compte les réussites :</p>
<pre class="code">SELECT ville, COUNT(*) AS nb, MIN(age) AS plus_jeune
FROM suspects
GROUP BY ville;</pre>`,
  task:`Pour le login <code>'j.ferrand'</code>, affiche par <code>ip</code> : <code>tentatives</code> (nombre de connexions), <code>reussites</code> (somme de <code>succes</code>) et <code>premiere</code> (horodatage le plus ancien), triés par <code>tentatives</code> décroissant.`,
  solution:`SELECT ip, COUNT(*) AS tentatives, SUM(succes) AS reussites, MIN(horodatage) AS premiere FROM connexions WHERE login = 'j.ferrand' GROUP BY ip ORDER BY tentatives DESC;`,
  hints:["WHERE login = 'j.ferrand' GROUP BY ip","COUNT(*), SUM(succes), MIN(horodatage)"],
  check:{strictCols:true, ordered:true, orderKeys:[1]},
  success:`Une IP habituelle, <b>10.1.182.79</b>, quarante connexions. Quelques postes du réseau interne en 192.168. Et puis <b>203.0.113.66</b>, apparue le 13 au soir, avec deux réussites. Byte : « Un pirate qui réussit deux fois sur cinq essais, c'est un pirate qui connaît le mot de passe. »`
});
mis({ id:'5.S', ch:5, side:'cachee', xp:200, title:"L'annuaire",
  teaser:`L'attaquant n'a pas tapé des logins au hasard. Il connaissait presque tout le personnel d'Hélios.`,
  story:`Byte compte sur ses doigts. « Les logins d'Hélios ont tous la même forme : une initiale, un point, le nom. Ça ne se devine pas, ça se connaît. Hélios a 64 employés. Combien de ces logins l'IP <code>203.0.113.66</code> a-t-elle essayés ? »`,
  lesson:`<p><code>COUNT(DISTINCT x)</code> compte les valeurs différentes. Avec un <code>CASE</code> à l'intérieur, on ne compte que celles qui vérifient une condition (le CASE sans ELSE renvoie NULL, et NULL n'est pas compté) :</p>
<pre class="code">SELECT COUNT(DISTINCT ville) AS villes,
       COUNT(DISTINCT CASE WHEN ville LIKE 'P%' THEN ville END) AS villes_en_p
FROM suspects;</pre>`,
  task:`En une seule ligne, pour toutes les connexions de l'IP <code>'203.0.113.66'</code> (réussies ou non), affiche <code>tentatives</code> (nombre de lignes), <code>logins_differents</code> (nombre de logins distincts) et <code>logins_internes</code> (nombre de logins distincts au format Hélios, c'est-à-dire correspondant au motif <code>'_.%'</code>).`,
  solution:`SELECT COUNT(*) AS tentatives, COUNT(DISTINCT login) AS logins_differents, COUNT(DISTINCT CASE WHEN login LIKE '_.%' THEN login END) AS logins_internes FROM connexions WHERE ip = '203.0.113.66';`,
  hints:["COUNT(DISTINCT login) pour les logins différents.","COUNT(DISTINCT CASE WHEN login LIKE '_.%' THEN login END)"],
  check:{strictCols:true, colNames:true},
  success:`246 tentatives, 69 logins différents, dont <b>61 logins internes</b> sur les 64 d'Hélios. L'attaquant avait l'annuaire complet de la banque. Byte, à voix très basse : « Cette liste, seul le service informatique la possède. » Elle ne regarde personne en particulier. Elle regarde Ouali.`
});

/* ============ CHAPITRE 6 ============ */
mis({ id:'6.A', ch:6, side:'annexe', xp:120, title:'Le don d\'ubiquité',
  story:`Varga : « Une connexion réussie depuis l'étranger, c'est rare chez Hélios. Relie chaque connexion réussie hors de France à l'employé et à son agence. »`,
  lesson:`<p>Le login fait le lien entre <code>connexions</code> et <code>employes</code>, puis <code>agence_id</code> mène à <code>agences</code> : une chaîne de trois tables.</p>
<pre class="code">SELECT e.nom, a.nom AS agence
FROM employes e
JOIN agences a ON a.id = e.agence_id;</pre>`,
  task:`Affiche <code>horodatage</code>, <code>ip</code>, <code>pays</code>, <code>prenom</code>, <code>nom</code> (de l'employé) et <code>agence</code> (nom de l'agence) des connexions <b>réussies</b> dont le pays n'est pas <code>'FR'</code>, par ordre chronologique.`,
  solution:`SELECT c.horodatage, c.ip, c.pays, e.prenom, e.nom, a.nom AS agence FROM connexions c JOIN employes e ON e.login = c.login JOIN agences a ON a.id = e.agence_id WHERE c.succes = 1 AND c.pays <> 'FR' ORDER BY c.horodatage;`,
  hints:["JOIN employes e ON e.login = c.login","JOIN agences a ON a.id = e.agence_id, puis WHERE c.succes = 1 AND c.pays <> 'FR'"],
  require:[{re:'JOIN', msg:"Utilise des jointures."}],
  check:{strictCols:true, ordered:true},
  success:`Deux connexions de Julien Ferrand depuis les Pays-Bas, à 23h18 et à 23h44. Or à 23h31 son badge ouvrait la salle des coffres, et à 23h58 il ressortait par l'entrée principale. Ferrand ne peut pas être à La Défense et à Amsterdam : quelqu'un se servait de son compte, avec son accord.`
});
mis({ id:'6.S', ch:6, side:'cachee', xp:200, title:'Le chef du badge cloné',
  teaser:`Le badge refusé devant les coffres appartient à quelqu'un. Et ce quelqu'un a un chef.`,
  story:`Byte ne lâche pas le journal des badges. « À 23h40, un autre badge a tenté la salle des coffres et a été refusé. À qui est-il, et qui est son responsable ? Le chef d'un employé, c'est lui qui gère ses accès. »`,
  lesson:`<p>On peut enchaîner une jointure classique et une auto-jointure : le badge mène à l'employé, puis <code>manager_id</code> mène à une autre ligne de <code>employes</code>.</p>
<pre class="code">SELECT e.nom, m.nom AS chef
FROM employes e
LEFT JOIN employes m ON m.id = e.manager_id;</pre>`,
  task:`Pour les accès <code>'REFUSE'</code> à la porte <code>'Salle des coffres'</code> entre <code>'2026-11-13 22:00:00'</code> et <code>'2026-11-14 01:00:00'</code>, affiche <code>badge</code>, <code>horodatage</code>, <code>titulaire</code> (prénom, espace, nom), <code>poste</code> (du titulaire), <code>responsable</code> (prénom, espace, nom du manager) et <code>poste_responsable</code>.`,
  solution:`SELECT b.badge, b.horodatage, e.prenom || ' ' || e.nom AS titulaire, e.poste, m.prenom || ' ' || m.nom AS responsable, m.poste AS poste_responsable FROM acces_badges b JOIN employes e ON e.id = b.employe_id LEFT JOIN employes m ON m.id = e.manager_id WHERE b.resultat = 'REFUSE' AND b.porte = 'Salle des coffres' AND b.horodatage BETWEEN '2026-11-13 22:00:00' AND '2026-11-14 01:00:00';`,
  hints:["acces_badges b JOIN employes e ON e.id = b.employe_id","Auto-jointure : JOIN employes m ON m.id = e.manager_id"],
  require:[{re:'employes\\s+(AS\\s+)?\\w+[\\s\\S]*JOIN\\s+employes', msg:"Joins la table employes avec elle-même pour trouver le responsable."}],
  check:{strictCols:true},
  success:`<b>B-0019</b>, Valérie Sanchez, administratrice SI. Son responsable : <b>Farid Ouali</b>, Directeur SI. L'homme qui gère les badges de son équipe est celui-là même qui affirme que le badge a été cloné. Byte note le nom dans son carnet, sans rien dire.`
});

/* ============ CHAPITRE 7 ============ */
mis({ id:'7.A', ch:7, side:'annexe', xp:120, title:'Les braqueurs du Cercle',
  story:`Varga : « Vasseur est un braqueur confirmé. Mais un gang qui prépare un coup pareil en a forcément d'autres sous la main. Qui, dans le Cercle, a déjà un braquage au casier ? »`,
  lesson:`<p><code>EXISTS</code> teste la présence d'au moins une ligne, et une sous-requête scalaire corrélée peut compter pour chaque ligne :</p>
<pre class="code">SELECT s.nom,
  (SELECT COUNT(*) FROM vehicules v WHERE v.suspect_id = s.id) AS nb_voitures
FROM suspects s
WHERE EXISTS (SELECT 1 FROM vehicules v WHERE v.suspect_id = s.id);</pre>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code> et <code>nb_braquages</code> (nombre de délits de type <code>'Braquage'</code>) des membres du gang 2 pour lesquels il <b>existe</b> au moins un délit de type <code>'Braquage'</code>, triés par <code>id</code>.`,
  solution:`SELECT s.id, s.prenom, s.nom, (SELECT COUNT(*) FROM delits d WHERE d.suspect_id = s.id AND d.type = 'Braquage') AS nb_braquages FROM suspects s WHERE s.id IN (SELECT suspect_id FROM membres WHERE gang_id = 2) AND EXISTS (SELECT 1 FROM delits d WHERE d.suspect_id = s.id AND d.type = 'Braquage') ORDER BY s.id;`,
  hints:["WHERE s.id IN (SELECT suspect_id FROM membres WHERE gang_id = 2)","AND EXISTS (SELECT 1 FROM delits d WHERE d.suspect_id = s.id AND d.type = 'Braquage')"],
  require:[{re:'EXISTS', msg:"Utilise EXISTS."}],
  check:{strictCols:true, ordered:true},
  success:`Trois noms : Léo Moulin, Marc Vasseur, et <b>Nicolas Pierre</b>, entré au Cercle en mai 2025, trois mois après Vasseur. Varga le fait convoquer. Le Cercle recrutait des spécialistes.`
});
mis({ id:'7.S', ch:7, side:'cachee', xp:200, title:'Le deuxième appel',
  teaser:`Ferrand n'est pas le seul employé d'Hélios à avoir appelé une recrue du Cercle.`,
  story:`Byte a remarqué une chose : Vasseur, Lefort, Nicolas Pierre... beaucoup de membres du Cercle sont arrivés <b>depuis 2025</b>, comme pour préparer le casse. « Quels employés d'Hélios ont <b>eux-mêmes appelé</b> une de ces recrues en novembre ? Ferrand, on le sait. Mais je veux la liste complète. »`,
  lesson:`<p>Les sous-requêtes s'imbriquent : un <code>EXISTS</code> corrélé peut contenir un <code>IN (SELECT ...)</code>, lui-même fait d'une jointure.</p>
<pre class="code">SELECT e.nom
FROM employes e
WHERE EXISTS (
  SELECT 1 FROM appels a
  WHERE a.appelant = e.telephone
    AND a.appele IN (SELECT telephone FROM suspects WHERE ville = 'Lille')
);</pre>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code> et <code>poste</code> des employés pour lesquels il existe un appel dont l'appelant est leur téléphone, daté de novembre 2026 (<code>horodatage LIKE '2026-11%'</code>), et dont l'appelé est le téléphone d'un membre du gang 2 entré <b>depuis le 2025-01-01</b> (<code>membres.depuis &gt;= '2025-01-01'</code>).`,
  solution:`SELECT e.id, e.prenom, e.nom, e.poste FROM employes e WHERE EXISTS (SELECT 1 FROM appels a WHERE a.appelant = e.telephone AND a.horodatage LIKE '2026-11%' AND a.appele IN (SELECT s.telephone FROM suspects s JOIN membres m ON m.suspect_id = s.id WHERE m.gang_id = 2 AND m.depuis >= '2025-01-01'));`,
  hints:["WHERE EXISTS (SELECT 1 FROM appels a WHERE a.appelant = e.telephone AND ...)","a.appele IN (SELECT s.telephone FROM suspects s JOIN membres m ON m.suspect_id = s.id WHERE m.gang_id = 2 AND m.depuis >= '2025-01-01')"],
  require:[{re:'EXISTS|\\bIN\\s*\\(\\s*SELECT', msg:"Utilise une sous-requête (EXISTS ou IN)."}],
  check:{strictCols:true},
  success:`Julien Ferrand, bien sûr. Et <b>Farid Ouali</b>, le Directeur SI. Le 10 novembre à 16h34, il appelle <b>Marie Cousin</b>, membre du Cercle depuis juillet 2025, casier vierge. Six minutes de conversation. Deux heures et demie plus tard, Marchetti appelait Ferrand. Byte referme son ordinateur. « Je ne dis rien à Varga tant que je n'ai pas plus. »`
});

/* ============ CHAPITRE 8 ============ */
mis({ id:'8.A', ch:8, side:'annexe', xp:120, title:'Les petites branches',
  story:`« Les gros virements filent vers la Suisse. Mais à chaque étape, un peu d'argent part ailleurs. Je veux les comptes qui ont reçu de l'argent depuis la piste <b>sans en faire partie</b>, et leurs titulaires. »`,
  lesson:`<p><code>EXCEPT</code> retire du premier résultat les lignes présentes dans le second. Avec des CTE, chaque étape porte un nom :</p>
<pre class="code">WITH a AS (SELECT suspect_id FROM membres WHERE gang_id = 1),
     b AS (SELECT suspect_id FROM membres WHERE gang_id = 2)
SELECT suspect_id FROM a
EXCEPT
SELECT suspect_id FROM b;   -- membres du gang 1 qui ne sont pas au gang 2</pre>`,
  task:`Définis <code>piste</code> : les <code>compte_dest</code> des virements de plus de 100 000 € entre <code>'2026-11-13 23:00:00'</code> et <code>'2026-11-14 23:59:59'</code>. Puis <code>branches</code> : les <code>compte_dest</code> des virements partis d'un compte de la piste, <b>EXCEPT</b> les comptes de la piste. Affiche <code>compte</code>, <code>prenom</code>, <code>nom</code> du titulaire de chaque branche, triés par <code>compte</code>.`,
  solution:`WITH piste AS (SELECT compte_dest AS compte FROM virements WHERE montant > 100000 AND horodatage BETWEEN '2026-11-13 23:00:00' AND '2026-11-14 23:59:59'), branches AS (SELECT compte_dest AS compte FROM virements WHERE compte_source IN (SELECT compte FROM piste) EXCEPT SELECT compte FROM piste) SELECT b.compte, s.prenom, s.nom FROM branches b JOIN comptes c ON c.numero = b.compte JOIN suspects s ON s.id = c.titulaire_id ORDER BY b.compte;`,
  hints:["branches AS (SELECT compte_dest AS compte FROM virements WHERE compte_source IN (SELECT compte FROM piste) EXCEPT SELECT compte FROM piste)","Joins branches à comptes (numero) puis à suspects (titulaire_id)."],
  require:[{re:'EXCEPT', msg:"Utilise EXCEPT."}],
  check:{strictCols:true, ordered:true},
  success:`Quatre branches : un compte de Marchetti elle-même, et trois inconnues du grand public, Romane Marty, Julie Dubois et Manon Guerin. Des « mules », payées quelques milliers d'euros pour prêter leur compte.`
});
mis({ id:'8.S', ch:8, side:'cachee', xp:200, title:'La recruteuse',
  teaser:`Les mules ne connaissent personne au Cercle. Enfin, presque personne.`,
  story:`Byte : « Une mule, on la recrute. Quelqu'un a parlé à ces trois femmes. Croise leurs contacts téléphoniques avec les téléphones des membres du Cercle. »`,
  lesson:`<p>Trois ensembles, trois CTE, puis une intersection :</p>
<pre class="code">WITH x AS (...), y AS (...),
communs AS (
  SELECT numero FROM x
  INTERSECT
  SELECT numero FROM y
)
SELECT ... FROM communs JOIN ...;</pre>
<p>Rappel : les contacts « dans les deux sens » s'obtiennent avec un <code>UNION</code> des appelés et des appelants.</p>`,
  task:`Définis <code>mules</code> : les téléphones des titulaires des comptes ayant reçu un virement de <b>moins de 100 000 €</b> depuis <code>'FR76-7001'</code>, <code>'LT-4402'</code>, <code>'MT-0913'</code> ou <code>'CY-2207'</code>. Puis <code>contacts</code> : tous les numéros en contact avec une mule (dans les deux sens). Garde ceux qui sont <b>aussi</b> le téléphone d'un membre du gang 2, et affiche <code>prenom</code>, <code>nom</code>, <code>role</code> et <code>depuis</code> de ces membres, triés par <code>nom</code>.`,
  solution:`WITH mules AS (SELECT s.telephone FROM virements v JOIN comptes c ON c.numero = v.compte_dest JOIN suspects s ON s.id = c.titulaire_id WHERE v.compte_source IN ('FR76-7001', 'LT-4402', 'MT-0913', 'CY-2207') AND v.montant < 100000), contacts AS (SELECT appele AS numero FROM appels WHERE appelant IN (SELECT telephone FROM mules) UNION SELECT appelant FROM appels WHERE appele IN (SELECT telephone FROM mules)), cercle AS (SELECT s.telephone AS numero FROM suspects s JOIN membres m ON m.suspect_id = s.id WHERE m.gang_id = 2), communs AS (SELECT numero FROM contacts INTERSECT SELECT numero FROM cercle) SELECT s.prenom, s.nom, m.role, m.depuis FROM communs c JOIN suspects s ON s.telephone = c.numero JOIN membres m ON m.suspect_id = s.id AND m.gang_id = 2 ORDER BY s.nom;`,
  hints:["mules : virements v JOIN comptes c ON c.numero = v.compte_dest JOIN suspects s ON s.id = c.titulaire_id","communs AS (SELECT numero FROM contacts INTERSECT SELECT numero FROM cercle)"],
  require:[{re:'^\\s*WITH', msg:"Construis ta requête avec WITH."}],
  check:{strictCols:true, ordered:true},
  success:`Deux noms : Romane Blanchard, guetteuse, et <b>Marie Cousin</b>, que Manon Guerin, la mule de Malte, a appelée le 27 octobre. Marie Cousin, la recrue que Farid Ouali a appelée le 10 novembre. Byte relie les deux fiches au feutre sur le mur : Cousin est l'intermédiaire. Mais l'intermédiaire de qui ?`
});

/* ============ CHAPITRE 9 ============ */
mis({ id:'9.A', ch:9, side:'annexe', xp:120, title:'Le péage de chaque rebond',
  story:`La juge : « À chaque rebond, l'argent fond. Combien prélève chaque étape, et combien de temps l'argent reste-t-il sur chaque compte ? »`,
  lesson:`<p><code>LAG</code> donne accès à la ligne précédente : on peut l'utiliser dans un calcul, sur un montant comme sur une date.</p>
<pre class="code">SELECT date_faits, prejudice,
  prejudice - LAG(prejudice) OVER (ORDER BY date_faits) AS evolution
FROM delits
WHERE suspect_id = 217;</pre>`,
  task:`Pour les virements de plus de 100 000 € entre <code>'2026-11-13 23:00:00'</code> et <code>'2026-11-14 23:59:59'</code>, affiche <code>horodatage</code>, <code>compte_source</code>, <code>compte_dest</code>, <code>montant</code>, <code>commission</code> (montant du virement précédent moins montant actuel) et <code>delai_min</code> (minutes depuis le virement précédent, arrondies à l'entier), triés par horodatage.`,
  solution:`SELECT horodatage, compte_source, compte_dest, montant, LAG(montant) OVER (ORDER BY horodatage) - montant AS commission, ROUND((julianday(horodatage) - julianday(LAG(horodatage) OVER (ORDER BY horodatage))) * 1440) AS delai_min FROM virements WHERE montant > 100000 AND horodatage BETWEEN '2026-11-13 23:00:00' AND '2026-11-14 23:59:59' ORDER BY horodatage;`,
  hints:["LAG(montant) OVER (ORDER BY horodatage) - montant AS commission","ROUND((julianday(horodatage) - julianday(LAG(horodatage) OVER (ORDER BY horodatage))) * 1440)"],
  require:[{re:'LAG', msg:"Utilise LAG()."}],
  check:{strictCols:true, ordered:true},
  success:`5 000 € retenus aux deux premiers rebonds, 7 500 € aux deux suivants. Et l'argent dort de 16 minutes à plus de 5 heures et demie sur chaque compte : le temps qu'il faut à un complice pour valider chaque virement à la main, de jour comme de nuit.`
});
mis({ id:'9.S', ch:9, side:'cachee', xp:200, title:'Les silences du robot',
  teaser:`Le robot de l'attaquant frappait toutes les trois à huit secondes. Sauf à deux moments.`,
  story:`Byte rejoue la force brute à l'écran. « Un robot ne s'arrête jamais. Si l'IP <code>203.0.113.66</code> a fait une pause, c'est qu'un humain a pris la main. Cherche les plus longs silences entre deux tentatives. »`,
  lesson:`<p>On calcule l'écart avec <code>LAG</code> dans une CTE, puis on trie sur cet écart dans la requête externe : impossible de trier directement sur une fenêtre et de la filtrer dans le même SELECT.</p>
<pre class="code">WITH t AS (
  SELECT horodatage,
    (julianday(horodatage) - julianday(LAG(horodatage) OVER (ORDER BY horodatage))) * 86400 AS secondes
  FROM cameras WHERE immatriculation = 'GH-713-KZ'
)
SELECT * FROM t ORDER BY secondes DESC LIMIT 2;</pre>`,
  task:`Pour l'IP <code>'203.0.113.66'</code>, calcule <code>ecart_s</code> : les secondes écoulées depuis la tentative précédente de cette IP (par horodatage), arrondies et converties en entier (<code>CAST(ROUND(...) AS INTEGER)</code>). Affiche <code>horodatage</code>, <code>login</code>, <code>succes</code> et <code>ecart_s</code> des <b>3</b> plus grands écarts, par <code>ecart_s</code> décroissant.`,
  solution:`WITH t AS (SELECT horodatage, login, succes, CAST(ROUND((julianday(horodatage) - julianday(LAG(horodatage) OVER (ORDER BY horodatage))) * 86400) AS INTEGER) AS ecart_s FROM connexions WHERE ip = '203.0.113.66') SELECT horodatage, login, succes, ecart_s FROM t ORDER BY ecart_s DESC LIMIT 3;`,
  hints:["Dans une CTE : LAG(horodatage) OVER (ORDER BY horodatage), écart multiplié par 86400.","Puis ORDER BY ecart_s DESC LIMIT 3 dans la requête externe."],
  require:[{re:'LAG', msg:"Utilise LAG()."}],
  check:{strictCols:true, ordered:true},
  success:`Les deux plus longs silences, 17 et 25 minutes, précèdent les deux seules réussites, sur <b>j.ferrand</b>, du premier coup. La force brute était un écran de fumée : le mot de passe a été transmis pendant la pause. Et entre 23h01 et 23h18, le badge de Ferrand ouvrait la salle serveurs.`
});

/* ============ CHAPITRE 10 ============ */
mis({ id:'10.A', ch:10, side:'annexe', xp:120, title:'Geler les comptes',
  story:`La juge a signé l'ordonnance de gel. « Marque dans la base tous les comptes de la piste : ajoute <i> (gelé)</i> à la fin du nom de leur banque. »`,
  lesson:`<p>Le WHERE d'un UPDATE peut contenir une sous-requête, et SET peut réutiliser l'ancienne valeur :</p>
<pre class="code">UPDATE suspects
SET ville = ville || ' (à vérifier)'
WHERE id IN (SELECT suspect_id FROM vehicules WHERE couleur = 'Rouge');</pre>
<p>Réflexe : écris d'abord le SELECT avec le même WHERE pour vérifier les lignes visées.</p>`,
  task:`Pour les comptes qui sont <code>compte_dest</code> d'un virement de plus de 100 000 € entre <code>'2026-11-13 23:00:00'</code> et <code>'2026-11-14 23:59:59'</code>, remplace <code>banque</code> par l'ancienne valeur suivie de <code>' (gelé)'</code> (avec l'espace avant la parenthèse).`,
  solution:`UPDATE comptes SET banque = banque || ' (gelé)' WHERE numero IN (SELECT compte_dest FROM virements WHERE montant > 100000 AND horodatage BETWEEN '2026-11-13 23:00:00' AND '2026-11-14 23:59:59');`,
  hints:["SET banque = banque || ' (gelé)'","WHERE numero IN (SELECT compte_dest FROM virements WHERE montant > 100000 AND ...)"],
  check:{mode:'dml', verify:["SELECT numero, banque FROM comptes WHERE banque LIKE '%gelé%' ORDER BY numero","SELECT numero, banque FROM comptes ORDER BY numero"]},
  success:`Cinq comptes gelés, de NéoBanq à la Banque Lémanique. L'argent ne bouge plus.`
});
mis({ id:'10.S', ch:10, side:'cachee', xp:200, title:'Les scellés violés',
  teaser:`La salle des coffres de La Défense est sous scellés depuis la nuit du casse. Le journal des badges n'est pas d'accord.`,
  story:`Varga a posé les scellés sur la salle des coffres de La Défense le 14 novembre à 0h30. Byte : « Plus personne n'aurait dû y entrer. Enregistre dans la table <code>violations</code> tous les accès réussis après cette heure. En une transaction : c'est une pièce pour la juge. »`,
  lesson:`<p><code>INSERT ... SELECT</code> se place très bien dans une transaction, même avec une jointure dans le SELECT :</p>
<pre class="code">BEGIN;
INSERT INTO archive (nom, ville)
SELECT s.nom, s.ville FROM suspects s JOIN vehicules v ON v.suspect_id = s.id
WHERE v.marque = 'Tesla';
COMMIT;</pre>
<p>Ici, la table est créée pour toi avant ton code : <code>CREATE TABLE violations (badge TEXT, horodatage TEXT, employe TEXT);</code></p>`,
  setup:`CREATE TABLE violations (badge TEXT, horodatage TEXT, employe TEXT);`,
  task:`Dans une transaction (<code>BEGIN</code> ... <code>COMMIT</code>), insère dans <code>violations</code> (badge, horodatage, employe) les accès <code>'OK'</code> à la porte <code>'Salle des coffres'</code> de l'agence 1 (<code>acces_badges.agence_id = 1</code>) postérieurs à <code>'2026-11-14 00:30:00'</code>, avec <code>employe</code> = prénom, espace, nom de l'employé.`,
  solution:`BEGIN; INSERT INTO violations (badge, horodatage, employe) SELECT b.badge, b.horodatage, e.prenom || ' ' || e.nom FROM acces_badges b JOIN employes e ON e.id = b.employe_id WHERE b.porte = 'Salle des coffres' AND b.agence_id = 1 AND b.resultat = 'OK' AND b.horodatage > '2026-11-14 00:30:00'; COMMIT;`,
  hints:["INSERT INTO violations (badge, horodatage, employe) SELECT b.badge, b.horodatage, e.prenom || ' ' || e.nom FROM acces_badges b JOIN employes e ...","WHERE b.porte = 'Salle des coffres' AND b.agence_id = 1 AND b.resultat = 'OK' AND b.horodatage > '2026-11-14 00:30:00'"],
  require:[{re:'BEGIN', msg:"Ouvre une transaction avec BEGIN."},{re:'COMMIT', msg:"Valide avec COMMIT."},{re:'INSERT[\\s\\S]*SELECT', msg:"Remplis la table avec INSERT ... SELECT."}],
  check:{mode:'dml', verify:["SELECT badge, horodatage, employe FROM violations ORDER BY horodatage"]},
  success:`Cinq violations. Trois viennent de l'équipe SI de Farid Ouali : Sylvie Julien, Valérie Sanchez, et Ouali lui-même le 17 à 8h30. Et le <b>B-0019</b>, le badge soi-disant cloné, s'ouvre sans problème le dimanche 15 à 7h35. Personne ne l'a désactivé.`
});

/* ============ CHAPITRE 11 ============ */
mis({ id:'11.A', ch:11, side:'annexe', xp:120, title:'Les véhicules sous surveillance',
  story:`« Je veux une table propre pour les véhicules à surveiller, avec des contraintes. Pas question d'y mettre une plaque qui n'existe pas. »`,
  lesson:`<p>Une clé étrangère peut viser une clé primaire texte, et <code>DEFAULT</code> remplit une colonne oubliée :</p>
<pre class="code">CREATE TABLE plaques_suivies (
  immatriculation TEXT PRIMARY KEY REFERENCES vehicules(immatriculation),
  note TEXT DEFAULT 'à voir'
);</pre>
<p>Essaie d'y insérer <code>'XX-000-XX'</code> : la clé étrangère refusera la fausse plaque.</p>`,
  task:`Crée <code>vehicules_surveilles</code> : <code>immatriculation</code> TEXT clé primaire et clé étrangère vers <code>vehicules(immatriculation)</code>, <code>motif</code> TEXT NOT NULL, <code>depuis</code> TEXT avec la valeur par défaut <code>'2026-11-14'</code>. Puis insère-y, avec un <code>INSERT ... SELECT</code> et sans fournir <code>depuis</code>, tous les véhicules des suspects 217 et 388, motif <code>'Véhicule de suspect'</code>.`,
  solution:`CREATE TABLE vehicules_surveilles (immatriculation TEXT PRIMARY KEY REFERENCES vehicules(immatriculation), motif TEXT NOT NULL, depuis TEXT DEFAULT '2026-11-14'); INSERT INTO vehicules_surveilles (immatriculation, motif) SELECT immatriculation, 'Véhicule de suspect' FROM vehicules WHERE suspect_id IN (217, 388);`,
  hints:["immatriculation TEXT PRIMARY KEY REFERENCES vehicules(immatriculation)","INSERT INTO vehicules_surveilles (immatriculation, motif) SELECT immatriculation, 'Véhicule de suspect' FROM vehicules WHERE suspect_id IN (217, 388)"],
  check:{mode:'dml', verify:[
    "SELECT name, (\"notnull\" OR pk > 0) AS nn, pk, dflt_value FROM pragma_table_info('vehicules_surveilles') ORDER BY cid",
    "SELECT \"table\", \"from\", COALESCE(\"to\", 'immatriculation') FROM pragma_foreign_key_list('vehicules_surveilles')",
    "SELECT immatriculation, motif, depuis FROM vehicules_surveilles ORDER BY immatriculation"]},
  success:`Trois véhicules sous surveillance : les deux voitures de Vasseur et l'Audi de Lefort. Toute nouvelle caméra qui les voit déclenchera une alerte.`
});
mis({ id:'11.S', ch:11, side:'cachee', xp:200, title:'Le carnet du DSI',
  teaser:`Une simple vue d'annuaire suffit à lire le répertoire de n'importe qui. Y compris celui du consultant.`,
  story:`Byte construit un outil pour toute la brigade : une vue qui transforme un numéro en identité. « Et pour la tester, on va prendre un téléphone au hasard. » Elle tape <code>f.ouali</code> sans sourire.`,
  lesson:`<p>Une vue peut contenir un <code>UNION ALL</code> : elle rassemble alors plusieurs tables sous une seule forme.</p>
<pre class="code">CREATE VIEW v_lieux AS
SELECT ville AS lieu, 'suspect' AS source FROM suspects
UNION ALL
SELECT ville, 'agence' FROM agences;</pre>
<p>On l'interroge ensuite comme une table, y compris dans une jointure.</p>`,
  task:`Crée la vue <code>v_annuaire</code> (<code>numero</code>, <code>identite</code>, <code>categorie</code>) : les téléphones non NULL des suspects avec prénom, espace, nom et la catégorie <code>'suspect'</code>, plus les téléphones des employés avec la catégorie <code>'employé'</code>. Puis, avec cette vue, affiche <code>horodatage</code>, <code>identite</code> et <code>categorie</code> de chaque appel <b>passé</b> par l'employé de login <code>'f.ouali'</code>.`,
  solution:`CREATE VIEW v_annuaire AS SELECT telephone AS numero, prenom || ' ' || nom AS identite, 'suspect' AS categorie FROM suspects WHERE telephone IS NOT NULL UNION ALL SELECT telephone, prenom || ' ' || nom, 'employé' FROM employes; SELECT a.horodatage, v.identite, v.categorie FROM appels a JOIN employes e ON e.telephone = a.appelant LEFT JOIN v_annuaire v ON v.numero = a.appele WHERE e.login = 'f.ouali' ORDER BY a.horodatage;`,
  hints:["CREATE VIEW v_annuaire AS SELECT telephone AS numero, prenom || ' ' || nom AS identite, 'suspect' AS categorie FROM suspects WHERE telephone IS NOT NULL UNION ALL SELECT ...","appels a JOIN employes e ON e.telephone = a.appelant LEFT JOIN v_annuaire v ON v.numero = a.appele"],
  require:[{re:'CREATE\\s+VIEW', msg:"Crée la vue avec CREATE VIEW."}],
  check:{mode:'dml', verify:[
    "SELECT numero, identite, categorie FROM v_annuaire ORDER BY numero",
    "SELECT a.horodatage, v.identite, v.categorie FROM appels a JOIN employes e ON e.telephone = a.appelant LEFT JOIN v_annuaire v ON v.numero = a.appele WHERE e.login = 'f.ouali' ORDER BY a.horodatage"]},
  success:`Cinq appels passés par Farid Ouali en un mois. Deux vers des collègues. Trois vers des <b>personnes fichées</b> : Thierry Barbier, Julien Kaci, et Marie Cousin, du Cercle. Un Directeur SI ne devrait connaître aucun de ces numéros. Byte enregistre la vue, et ferme la session.`
});

/* ============ CHAPITRE 12 ============ */
mis({ id:'12.A', ch:12, side:'annexe', xp:120, title:'Le catalogue des attaques',
  story:`« Pour le rapport à l'ANSSI, chaque tentative d'injection doit être rangée dans une famille. Une ligne par tentative, avec sa technique. »`,
  lesson:`<p>Un <code>CASE</code> fait de plusieurs <code>LIKE</code> classe des chaînes. L'ordre des WHEN compte : une même saisie peut contenir plusieurs motifs, et le premier WHEN vrai l'emporte.</p>
<pre class="code">CASE
  WHEN login LIKE '%''%' AND login LIKE '%x%' THEN '...'
  WHEN login LIKE '%/*%' THEN '...'   -- les jokers ne gênent pas / et *
END</pre>`,
  task:`Pour les connexions dont le login contient une apostrophe, affiche <code>horodatage</code>, <code>login</code> et <code>technique</code>, en testant dans cet ordre : contient <code>UNION</code> donne <code>'UNION'</code>, contient <code>'1'='1'</code> donne <code>'Tautologie'</code>, contient <code>--</code> donne <code>'Commentaire'</code>, contient <code>/*</code> donne <code>'Commentaire bloc'</code>. Tri chronologique.`,
  solution:`SELECT horodatage, login, CASE WHEN login LIKE '%UNION%' THEN 'UNION' WHEN login LIKE '%''1''=''1''%' THEN 'Tautologie' WHEN login LIKE '%--%' THEN 'Commentaire' WHEN login LIKE '%/*%' THEN 'Commentaire bloc' END AS technique FROM connexions WHERE login LIKE '%''%' ORDER BY horodatage;`,
  hints:["WHERE login LIKE '%''%' (deux apostrophes pour une)","Pour '1'='1' dans un motif, double chaque apostrophe : '%''1''=''1''%'"],
  require:[{re:'CASE', msg:"Classe les tentatives avec CASE."}],
  check:{strictCols:true, ordered:true},
  success:`Commentaire, tautologie, UNION, commentaire bloc : quatre techniques classiques en quatre minutes. Un attaquant méthodique, qui suivait une liste.`
});
mis({ id:'12.S', ch:12, side:'cachee', xp:200, title:'Le dictionnaire',
  teaser:`Les mots de passe du portail ne sont stockés qu'en empreintes. Des empreintes sans sel.`,
  story:`Byte sort une clé USB marquée « vieux dicos ». « Les empreintes du portail sont des SHA-256 tronqués, <b>sans sel</b>. Un mot de passe faible donne toujours la même empreinte, n'importe qui peut la reconnaître. Ouali voulait qu'on s'arrête aux injections. Regardons plus loin. »`,
  lesson:`<p>Une CTE peut contenir des données tapées à la main avec <code>VALUES</code>. Voici le dictionnaire de Byte, à coller en tête de ta requête :</p>
<pre class="code">WITH dico(mot, empreinte) AS (VALUES
  ('123456',   '8d969eef6ecad3c2'),
  ('azerty',   'f2d81a260dea8a10'),
  ('password', '5e884898da280471'),
  ('admin',    '8c6976e5b5410415'),
  ('test',     '9f86d081884c7d65'),
  ('foo',      '2c26b46b68ffc68f'),
  ('bar',      'fcde2b2edba56bf4'),
  ('helios',   '48582bd628b7c800'),
  ('soleil',   'e93e24c1b877a15d'))</pre>
<p>Défense : un <b>sel</b> aléatoire par compte et une fonction lente (bcrypt, Argon2) rendent ce type de dictionnaire inutile.</p>`,
  task:`Avec le dictionnaire <code>dico</code>, affiche <code>login</code>, <code>profil</code> et <code>mot_de_passe</code> (le mot du dictionnaire) de chaque compte de <code>utilisateurs_portail</code> dont l'empreinte <code>hash_mdp</code> figure dans le dictionnaire, triés par <code>login</code>.`,
  solution:`WITH dico(mot, empreinte) AS (VALUES ('123456', '8d969eef6ecad3c2'), ('azerty', 'f2d81a260dea8a10'), ('password', '5e884898da280471'), ('admin', '8c6976e5b5410415'), ('test', '9f86d081884c7d65'), ('foo', '2c26b46b68ffc68f'), ('bar', 'fcde2b2edba56bf4'), ('helios', '48582bd628b7c800'), ('soleil', 'e93e24c1b877a15d')) SELECT u.login, u.profil, d.mot AS mot_de_passe FROM utilisateurs_portail u JOIN dico d ON d.empreinte = u.hash_mdp ORDER BY u.login;`,
  hints:["Colle le WITH dico(...) AS (VALUES ...) puis écris le SELECT.","JOIN dico d ON d.empreinte = u.hash_mdp ORDER BY u.login"],
  check:{strictCols:true, ordered:true},
  success:`Quatre comptes sur six tombent. Ferrand : <i>password</i>. Le compte admin : <i>test</i>. Et les deux comptes de direction, Hollier et <b>Ouali</b>, ont gardé <i>foo</i> et <i>bar</i>, les mots bidons que les développeurs utilisent pour leurs essais. Le Directeur SI, profil Administrateur, n'a jamais changé son mot de passe de test. Négligence, ou porte laissée ouverte exprès ?`
});

/* ============ CHAPITRE 13 ============ */
mis({ id:'13.A', ch:13, side:'annexe', xp:120, title:'Le compte des miettes',
  story:`Varga relit le procès-verbal. « 480 000 € sortis du coffre, 445 100 € gelés en Suisse. Où est passé le reste ? Je veux, pour chaque compte de la piste, ce qui est entré, ce qui est sorti, et ce qui y dort encore. »`,
  lesson:`<p>Deux CTE d'agrégats (entrées et sorties par compte), une piste, des <code>LEFT JOIN</code> et un <code>COALESCE</code> pour les comptes sans sortie :</p>
<pre class="code">WITH entrees AS (
  SELECT compte_dest AS compte, SUM(montant) AS total
  FROM virements GROUP BY compte_dest
)
SELECT ... COALESCE(s.total, 0) ...</pre>`,
  task:`Reprends la piste de l'argent (CTE récursive depuis <code>'HEL-COFFRE-01'</code>, virements de plus de 100 000 € postérieurs à <code>'2026-11-13 23:00:00'</code>). Pour chaque compte d'étape 1 ou plus, affiche <code>etape</code>, <code>compte</code>, <code>entrees</code> (somme des montants reçus), <code>sorties</code> (somme des montants envoyés, 0 si aucun) et <code>reste</code> (entrees moins sorties), triés par <code>etape</code>.`,
  solution:`WITH RECURSIVE piste(compte, etape, quand) AS (SELECT 'HEL-COFFRE-01', 0, '2026-11-13 23:00:00' UNION ALL SELECT v.compte_dest, p.etape + 1, v.horodatage FROM virements v JOIN piste p ON v.compte_source = p.compte WHERE v.montant > 100000 AND v.horodatage > p.quand), entrees AS (SELECT compte_dest AS compte, SUM(montant) AS total FROM virements GROUP BY compte_dest), sorties AS (SELECT compte_source AS compte, SUM(montant) AS total FROM virements GROUP BY compte_source) SELECT p.etape, p.compte, COALESCE(e.total, 0) AS entrees, COALESCE(s.total, 0) AS sorties, COALESCE(e.total, 0) - COALESCE(s.total, 0) AS reste FROM piste p LEFT JOIN entrees e ON e.compte = p.compte LEFT JOIN sorties s ON s.compte = p.compte WHERE p.etape >= 1 ORDER BY p.etape;`,
  hints:["entrees : GROUP BY compte_dest ; sorties : GROUP BY compte_source","LEFT JOIN des deux CTE sur la piste, COALESCE(..., 0) pour les sorties manquantes."],
  check:{strictCols:true, ordered:true},
  success:`200 € à Paris, 50 € à Vilnius, 100 € à La Valette, 7 500 € à Kyrenia, 445 100 € à Genève. Le reste a filé vers les trois mules et vers le compte français de Marchetti. Chaque euro a une adresse.`
});
mis({ id:'13.S', ch:13, side:'cachee', xp:200, title:'Épilogue : le dernier appel',
  teaser:`Huit heures après le casse, Solène Marchetti a passé un dernier appel. Dix minutes, vers un numéro que personne ne connaît.`,
  story:`L'affaire est close, les cartons s'empilent. Byte, elle, n'arrive pas à fermer la table <code>appels</code>. « Une cheffe de réseau qui vient de réussir son coup appelle quelqu'un pour rendre compte. Je veux savoir qui Marchetti a appelé en dernier. Sans taper son numéro : pars de la table <code>gangs</code>. »`,
  lesson:`<p>Une sous-requête scalaire retrouve le téléphone de la cheffe, un tri et un <code>LIMIT</code> isolent le dernier appel, et <code>COALESCE</code> enchaîne plusieurs recherches d'identité :</p>
<pre class="code">COALESCE(
  (SELECT nom FROM suspects WHERE telephone = x),
  (SELECT nom FROM employes WHERE telephone = x),
  'personne')</pre>`,
  task:`Affiche <code>horodatage</code>, <code>numero</code> (le numéro appelé), <code>duree_s</code> et <code>titulaire</code> du <b>dernier</b> appel passé par le téléphone de la cheffe du gang <code>'Le Cercle'</code>. <code>titulaire</code> vaut le prénom et le nom (séparés par une espace) du suspect ou, à défaut, de l'employé qui possède ce numéro, et <code>'inconnu'</code> si personne ne le possède.`,
  solution:`SELECT a.horodatage, a.appele AS numero, a.duree_s, COALESCE((SELECT prenom || ' ' || nom FROM suspects WHERE telephone = a.appele), (SELECT prenom || ' ' || nom FROM employes WHERE telephone = a.appele), 'inconnu') AS titulaire FROM appels a WHERE a.appelant = (SELECT s.telephone FROM suspects s JOIN gangs g ON g.chef_id = s.id WHERE g.nom = 'Le Cercle') ORDER BY a.horodatage DESC LIMIT 1;`,
  hints:["WHERE a.appelant = (SELECT s.telephone FROM suspects s JOIN gangs g ON g.chef_id = s.id WHERE g.nom = 'Le Cercle')","ORDER BY a.horodatage DESC LIMIT 1, et COALESCE de deux sous-requêtes puis 'inconnu'."],
  require:[{re:'gangs', msg:"Pars de la table gangs pour retrouver la cheffe."},{re:'^(?![\\s\\S]*(0699887766|Marchetti|Sol[eè]ne|\\b131\\b))', msg:"Ne tape ni le numéro, ni le nom, ni l'id de la cheffe : la requête doit les retrouver."}],
  check:{strictCols:true, colNames:true},
  success:`14 novembre, 8h00 pile. Dix minutes avec le <b>0601020304</b>. Aucun suspect, aucun employé, aucun abonné connu. 01 02 03 04 : un numéro trop parfait pour être honnête. Byte colle un post-it sur son écran : « À qui la cheffe du Cercle rend-elle des comptes ? » Le dossier suivant arrive lundi.`
});
