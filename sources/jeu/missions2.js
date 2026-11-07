// Contenu pédagogique : chapitres 7 à 13
/* ============ CHAPITRE 7 ============ */
chap({ id:7, code:'07', title:'Le complice', subtitle:'Sous-requêtes, IN, EXISTS, corrélation',
  intro:`<p>Ferrand est dans le viseur, mais un avocat démontera un dossier fondé sur un seul appel. Il faut croiser les sources : badges, journaux, gangs.</p>
<p class="quote">« Une requête dans une requête. Comme une enquête dans l'enquête. » (Byte)</p>`,
  oracle:`<p>Identique en Oracle. Oracle n'exige pas d'alias pour une sous-requête dans le FROM (PostgreSQL avant la version 16 et MySQL, si) : prends quand même l'habitude d'en mettre un. Piège Oracle : <code>FROM (SELECT ...) t</code> est accepté, <code>FROM (SELECT ...) AS t</code> provoque une erreur, car AS est interdit devant un alias de table. Oracle accepte aussi l'imbrication d'agrégats avec GROUP BY : <code>SELECT AVG(COUNT(*)) FROM delits GROUP BY suspect_id</code>, que SQLite refuse.</p>`,
  quiz:[
    {q:"Une sous-requête scalaire renvoie :", o:["Une table entière","Exactement une valeur (une ligne, une colonne)","Une liste de colonnes","Rien"], a:1, e:"On peut alors l'utiliser comme une valeur : WHERE prejudice > (SELECT AVG(prejudice) FROM delits)."},
    {q:"Si la sous-requête de <code>x NOT IN (SELECT y ...)</code> renvoie un NULL :", o:["Le NULL est ignoré","La condition n'est jamais vraie, le résultat est vide","Erreur","Toutes les lignes sont renvoyées"], a:1, e:"x NOT IN (1, NULL) vaut inconnu pour tout x différent de 1. Préfère NOT EXISTS, qui n'a pas ce piège."},
    {q:"Une sous-requête corrélée :", o:["Est exécutée une seule fois","Fait référence à une colonne de la requête principale","Est interdite dans WHERE","Ne peut pas contenir d'agrégat"], a:1, e:"Elle est (logiquement) réévaluée pour chaque ligne de la requête externe."}
  ]});
mis({ id:'7.1', ch:7, title:'Au-dessus de la moyenne',
  story:`« Quels délits ont un préjudice <b>supérieur à la moyenne</b> de tous les délits ? »`,
  lesson:`<p>Une <b>sous-requête</b> est une requête entre parenthèses utilisée à l'intérieur d'une autre. Si elle renvoie une seule valeur (sous-requête <b>scalaire</b>), on l'utilise comme une constante :</p>
<pre class="code">SELECT nom, age
FROM suspects
WHERE age &gt; (SELECT AVG(age) FROM suspects);</pre>
<p>Impossible d'écrire <code>WHERE age &gt; AVG(age)</code> : un agrégat n'est pas permis dans WHERE.</p>`,
  task:`Affiche <code>id</code>, <code>type</code>, <code>prejudice</code> des délits dont le préjudice est supérieur au préjudice moyen.`,
  solution:`SELECT id, type, prejudice FROM delits WHERE prejudice > (SELECT AVG(prejudice) FROM delits);`,
  hints:["WHERE prejudice > (SELECT AVG(prejudice) FROM delits)"],
  require:[{re:'\\(\\s*SELECT', msg:"Utilise une sous-requête (SELECT ...) entre parenthèses."}]
});
mis({ id:'7.2', ch:7, title:'Les membres du Cercle',
  story:`« Liste les membres du Cercle, mais <b>sans jointure</b> : je veux voir si tu maîtrises <code>IN</code> avec une sous-requête. »`,
  lesson:`<p>Une sous-requête qui renvoie <b>une colonne de plusieurs lignes</b> s'utilise avec <code>IN</code> :</p>
<pre class="code">SELECT nom
FROM suspects
WHERE id IN (SELECT suspect_id FROM vehicules WHERE marque = 'Tesla');</pre>
<p>Les sous-requêtes s'imbriquent : on peut chercher l'id du gang à partir de son nom dans une sous-sous-requête.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code> des suspects membres du gang nommé <code>'Le Cercle'</code>, en utilisant des sous-requêtes (pas de JOIN).`,
  solution:`SELECT id, prenom, nom FROM suspects WHERE id IN (SELECT suspect_id FROM membres WHERE gang_id = (SELECT id FROM gangs WHERE nom = 'Le Cercle'));`,
  hints:["WHERE id IN (SELECT suspect_id FROM membres WHERE gang_id = ...)","gang_id = (SELECT id FROM gangs WHERE nom = 'Le Cercle')"],
  require:[{re:'\\bIN\\s*\\(\\s*SELECT', msg:"Utilise IN (SELECT ...)."},{re:'^(?![\\s\\S]*\\bJOIN\\b)', msg:"Cette mission se fait sans JOIN."}]
});
mis({ id:'7.3', ch:7, title:'Les badges de la nuit',
  story:`Table <code>acces_badges</code> (badge, employe_id, agence_id, porte, horodatage, resultat). « Quels employés sont entrés <b>avec succès</b> dans la salle des coffres la nuit du 13 (entre 22h et 1h) ? »`,
  lesson:`<p><code>EXISTS (sous-requête)</code> est vrai si la sous-requête renvoie <b>au moins une ligne</b>. Elle fait souvent référence à la requête principale : c'est une sous-requête <b>corrélée</b>.</p>
<pre class="code">SELECT s.nom
FROM suspects s
WHERE EXISTS (
  SELECT 1 FROM delits d
  WHERE d.suspect_id = s.id AND d.type = 'Braquage'
);</pre>
<p><code>SELECT 1</code> est une convention : seule l'existence d'une ligne compte, pas son contenu.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>poste</code> des employés pour lesquels il <b>existe</b> un accès <code>'OK'</code> à la porte <code>'Salle des coffres'</code> entre <code>2026-11-13 22:00:00</code> et <code>2026-11-14 01:00:00</code>.`,
  solution:`SELECT e.id, e.prenom, e.nom, e.poste FROM employes e WHERE EXISTS (SELECT 1 FROM acces_badges b WHERE b.employe_id = e.id AND b.porte = 'Salle des coffres' AND b.resultat = 'OK' AND b.horodatage BETWEEN '2026-11-13 22:00:00' AND '2026-11-14 01:00:00');`,
  hints:["WHERE EXISTS (SELECT 1 FROM acces_badges b WHERE b.employe_id = e.id AND ...)","N'oublie pas resultat = 'OK' : un autre badge a été refusé."],
  require:[{re:'EXISTS', msg:"Utilise EXISTS."}],
  success:`Un seul badge : <b>B-0027, Julien Ferrand</b>, à 23h31. Le badge B-0019 a été <i>refusé</i> à 23h40 : quelqu'un a essayé d'utiliser un autre badge.`
});
mis({ id:'7.4', ch:7, title:'Sans voiture',
  story:`« Quels membres du Cercle ne possèdent <b>aucun véhicule</b> ? Ils ont forcément emprunté celui de quelqu'un. »`,
  lesson:`<p><code>NOT EXISTS</code> est la manière la plus sûre d'exprimer « il n'existe aucun... ». Évite <code>NOT IN (SELECT ...)</code> si la sous-requête peut contenir des NULL : un seul NULL et le résultat est vide.</p>
<pre class="code">SELECT g.nom
FROM gangs g
WHERE NOT EXISTS (
  SELECT 1 FROM membres m WHERE m.gang_id = g.id AND m.role = 'Chauffeur'
);</pre>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code> des membres du gang 2 pour lesquels il n'existe aucun véhicule (<code>NOT EXISTS</code>).`,
  solution:`SELECT s.id, s.prenom, s.nom FROM suspects s JOIN membres m ON m.suspect_id = s.id WHERE m.gang_id = 2 AND NOT EXISTS (SELECT 1 FROM vehicules v WHERE v.suspect_id = s.id);`,
  hints:["NOT EXISTS (SELECT 1 FROM vehicules v WHERE v.suspect_id = s.id)"],
  require:[{re:'NOT\\s+EXISTS', msg:"Utilise NOT EXISTS."}]
});
mis({ id:'7.5', ch:7, title:'Le doyen de chaque gang',
  story:`« Dans chaque gang, qui est le plus âgé ? Les doyens savent toujours tout. »`,
  lesson:`<p>Une sous-requête <b>corrélée</b> est recalculée pour chaque ligne externe. Ici, pour chaque membre, on compare son âge au maximum de <b>son</b> gang :</p>
<pre class="code">SELECT d.type, d.prejudice
FROM delits d
WHERE d.prejudice = (
  SELECT MAX(d2.prejudice) FROM delits d2 WHERE d2.type = d.type
);  -- le délit le plus coûteux de chaque type</pre>
<p>Les alias différents (<code>d</code>, <code>d2</code>) évitent toute confusion.</p>`,
  task:`Affiche <code>gang</code> (nom), <code>prenom</code>, <code>nom</code>, <code>age</code> du ou des membres les plus âgés de chaque gang.`,
  solution:`SELECT g.nom AS gang, s.prenom, s.nom, s.age FROM gangs g JOIN membres m ON m.gang_id = g.id JOIN suspects s ON s.id = m.suspect_id WHERE s.age = (SELECT MAX(s2.age) FROM membres m2 JOIN suspects s2 ON s2.id = m2.suspect_id WHERE m2.gang_id = g.id);`,
  hints:["Joins gangs, membres, suspects.","WHERE s.age = (SELECT MAX(s2.age) FROM membres m2 JOIN suspects s2 ... WHERE m2.gang_id = g.id)"]
});
mis({ id:'7.6', ch:7, title:'Table dérivée',
  story:`« En moyenne, combien de délits a commis un suspect qui a un casier ? »`,
  lesson:`<p>Une sous-requête dans le <code>FROM</code> crée une <b>table dérivée</b> (vue en ligne). Elle permet d'agréger un résultat déjà agrégé :</p>
<pre class="code">SELECT MAX(nb)
FROM (
  SELECT ville, COUNT(*) AS nb
  FROM suspects
  GROUP BY ville
) t;</pre>
<p>On ne peut pas imbriquer directement deux agrégats : <code>AVG(COUNT(*))</code> est refusé en SQLite.</p>`,
  task:`Affiche <code>moyenne</code> : la moyenne, arrondie à 2 décimales, du nombre de délits par suspect ayant au moins un délit.`,
  solution:`SELECT ROUND(AVG(nb), 2) AS moyenne FROM (SELECT suspect_id, COUNT(*) AS nb FROM delits GROUP BY suspect_id) t;`,
  hints:["FROM (SELECT suspect_id, COUNT(*) AS nb FROM delits GROUP BY suspect_id) t","SELECT ROUND(AVG(nb), 2)"],
  require:[{re:'FROM\\s*\\(\\s*SELECT', msg:"Utilise une sous-requête dans le FROM."}]
});

/* ============ CHAPITRE 8 ============ */
chap({ id:8, code:'08', title:"L'argent", subtitle:'UNION, INTERSECT, EXCEPT, WITH, CTE récursives',
  intro:`<p>480 000 € ont quitté le compte <code>HEL-COFFRE-01</code> à 23h21. L'argent a rebondi de compte en compte à travers l'Europe. Tables : <code>comptes</code> (numero, titulaire_id, banque, ouverture) et <code>virements</code> (compte_source, compte_dest, montant, horodatage).</p>
<p class="quote">« Suis l'argent. Toujours. » (Inès Varga)</p>`,
  oracle:`<p>En Oracle, <code>EXCEPT</code> s'appelle <code>MINUS</code> (Oracle 21c accepte aussi EXCEPT). Les CTE récursives s'écrivent <code>WITH piste (col1, col2) AS (...)</code> <b>sans</b> le mot RECURSIVE, et la liste de colonnes est obligatoire. Oracle propose aussi sa syntaxe historique de parcours hiérarchique : <code>START WITH ... CONNECT BY PRIOR</code>.</p>`,
  quiz:[
    {q:"Différence entre UNION et UNION ALL ?", o:["Aucune","UNION supprime les doublons, UNION ALL les garde","UNION ALL trie le résultat","UNION ALL est plus lent"], a:1, e:"UNION ALL est aussi plus rapide, puisqu'il n'a pas à dédoublonner."},
    {q:"Pour combiner deux SELECT avec UNION, il faut :", o:["Les mêmes noms de colonnes","Le même nombre de colonnes, de types compatibles","La même table","Un ORDER BY dans chaque SELECT"], a:1, e:"Les noms de colonnes du résultat viennent du premier SELECT."},
    {q:"Une CTE récursive contient :", o:["Une seule requête","Une partie initiale, UNION ALL, et une partie qui se référence elle-même","Obligatoirement un GROUP BY","Une procédure stockée"], a:1, e:"La partie récursive s'exécute jusqu'à ne plus produire de nouvelles lignes. Prévois toujours une condition d'arrêt."}
  ]});
mis({ id:'8.1', ch:8, title:'Le répertoire de Vasseur',
  story:`« Tous les numéros en contact avec Vasseur (<code>0611223344</code>), qu'il ait appelé ou été appelé. Une seule colonne, sans doublons. »`,
  lesson:`<p><code>UNION</code> empile les résultats de deux SELECT et supprime les doublons. <code>UNION ALL</code> garde tout. Les deux SELECT doivent avoir le même nombre de colonnes.</p>
<pre class="code">SELECT telephone FROM suspects WHERE ville = 'Lille'
UNION
SELECT telephone FROM employes WHERE agence_id = 4;</pre>`,
  task:`Affiche une colonne <code>numero</code> : les numéros appelés par Vasseur, <b>union</b> les numéros qui ont appelé Vasseur.`,
  solution:`SELECT appele AS numero FROM appels WHERE appelant = '0611223344' UNION SELECT appelant FROM appels WHERE appele = '0611223344';`,
  hints:["SELECT appele AS numero FROM appels WHERE appelant = '0611223344'","UNION SELECT appelant FROM appels WHERE appele = '0611223344'"],
  require:[{re:'UNION', msg:"Utilise UNION."}]
});
mis({ id:'8.2', ch:8, title:'Le contact commun',
  story:`« Ferrand (<code>0645454545</code>) et Vasseur ont-ils un contact <b>en commun</b> ? »`,
  lesson:`<p><code>INTERSECT</code> garde les lignes présentes dans <b>les deux</b> résultats. <code>EXCEPT</code> garde celles du premier absentes du second.</p>
<pre class="code">SELECT suspect_id FROM membres WHERE gang_id = 1
INTERSECT
SELECT suspect_id FROM membres WHERE gang_id = 2;
-- membres des deux gangs à la fois</pre>
<p>Pour combiner des unions entre elles, place-les dans des sous-requêtes.</p>`,
  task:`Affiche <code>numero</code> : les contacts de Vasseur (dans les deux sens) <b>INTERSECT</b> les contacts de Ferrand (dans les deux sens).`,
  solution:`SELECT numero FROM (SELECT appele AS numero FROM appels WHERE appelant = '0611223344' UNION SELECT appelant FROM appels WHERE appele = '0611223344') INTERSECT SELECT numero FROM (SELECT appele AS numero FROM appels WHERE appelant = '0645454545' UNION SELECT appelant FROM appels WHERE appele = '0645454545');`,
  hints:["Mets chaque UNION dans une sous-requête du FROM.","SELECT numero FROM (... UNION ...) INTERSECT SELECT numero FROM (... UNION ...)"],
  require:[{re:'INTERSECT', msg:"Utilise INTERSECT."}],
  success:`Un seul numéro commun : <b>0699887766</b>.`
});
mis({ id:'8.3', ch:8, title:'Nommer la requête',
  story:`« À qui appartient ce numéro ? Et réécris ta requête proprement, elle est illisible. »`,
  lesson:`<p>La clause <code>WITH</code> définit une <b>CTE</b> (Common Table Expression) : une sous-requête nommée, utilisable ensuite comme une table. On peut en enchaîner plusieurs, séparées par des virgules.</p>
<pre class="code">WITH lillois AS (
  SELECT * FROM suspects WHERE ville = 'Lille'
),
lillois_condamnes AS (
  SELECT DISTINCT l.* FROM lillois l JOIN delits d ON d.suspect_id = l.id
)
SELECT COUNT(*) FROM lillois_condamnes;</pre>`,
  task:`Avec <code>WITH</code>, définis <code>contacts_v</code> et <code>contacts_f</code> (les contacts de Vasseur et de Ferrand), puis affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>telephone</code> du ou des suspects dont le téléphone est dans les deux.`,
  solution:`WITH contacts_v AS (SELECT appele AS numero FROM appels WHERE appelant = '0611223344' UNION SELECT appelant FROM appels WHERE appele = '0611223344'), contacts_f AS (SELECT appele AS numero FROM appels WHERE appelant = '0645454545' UNION SELECT appelant FROM appels WHERE appele = '0645454545') SELECT s.id, s.prenom, s.nom, s.telephone FROM suspects s WHERE s.telephone IN (SELECT numero FROM contacts_v) AND s.telephone IN (SELECT numero FROM contacts_f);`,
  hints:["WITH contacts_v AS (...), contacts_f AS (...) SELECT ...","WHERE s.telephone IN (SELECT numero FROM contacts_v) AND s.telephone IN (SELECT numero FROM contacts_f)"],
  require:[{re:'^\\s*WITH', msg:"Commence ta requête par WITH."}],
  success:`<b>Solène Marchetti</b>, la cheffe du Cercle, à la fois en contact avec le braqueur et avec l'homme de l'intérieur.`
});
mis({ id:'8.4', ch:8, title:'La piste récursive',
  story:`« Suis les gros virements (plus de 100 000 €) partis de <code>HEL-COFFRE-01</code> à partir du 13 novembre 23h00, rebond après rebond, jusqu'au dernier compte. »`,
  lesson:`<p>Une <b>CTE récursive</b> se référence elle-même. Elle a deux parties reliées par <code>UNION ALL</code> :</p>
<pre class="code">WITH RECURSIVE compte_a_rebours(n) AS (
  SELECT 10                         -- partie initiale
  UNION ALL
  SELECT n - 1 FROM compte_a_rebours -- partie récursive
  WHERE n &gt; 0                       -- condition d'arrêt
)
SELECT n FROM compte_a_rebours;</pre>
<p>Le moteur exécute la partie initiale, puis applique la partie récursive aux nouvelles lignes, encore et encore, jusqu'à ce qu'elle ne produise plus rien. Idéal pour suivre une chaîne : virements, hiérarchies, graphes.</p>`,
  task:`Construis <code>piste(compte, etape, montant, quand)</code> : au départ <code>('HEL-COFFRE-01', 0, NULL, '2026-11-13 23:00:00')</code>, puis à chaque étape le <code>compte_dest</code> des virements de plus de 100 000 € partant du compte courant <b>après</b> <code>quand</code>. Affiche toute la piste.`,
  solution:`WITH RECURSIVE piste(compte, etape, montant, quand) AS (SELECT 'HEL-COFFRE-01', 0, NULL, '2026-11-13 23:00:00' UNION ALL SELECT v.compte_dest, p.etape + 1, v.montant, v.horodatage FROM virements v JOIN piste p ON v.compte_source = p.compte WHERE v.montant > 100000 AND v.horodatage > p.quand) SELECT * FROM piste;`,
  hints:["Partie initiale : SELECT 'HEL-COFFRE-01', 0, NULL, '2026-11-13 23:00:00'","Partie récursive : FROM virements v JOIN piste p ON v.compte_source = p.compte WHERE v.montant > 100000 AND v.horodatage > p.quand"],
  require:[{re:'RECURSIVE', msg:"Utilise WITH RECURSIVE."}],
  success:`Cinq rebonds en douze heures : France, Lituanie, Malte, Chypre, et enfin la Suisse, compte <b>CH-9131</b>.`
});
mis({ id:'8.5', ch:8, title:'Le bout de la piste',
  story:`« À qui appartient <code>CH-9131</code> ? Je veux la réponse en une seule requête à partir de la piste, pas en recopiant le numéro. »`,
  lesson:`<p>Une CTE récursive se combine avec n'importe quelle requête : on peut la joindre, la filtrer, la trier. Pour prendre la dernière étape :</p>
<pre class="code">SELECT * FROM piste
ORDER BY etape DESC
LIMIT 1;</pre>`,
  task:`Reprends la CTE <code>piste</code> et affiche <code>numero</code>, <code>banque</code>, <code>prenom</code>, <code>nom</code> du titulaire du compte de la <b>dernière étape</b>.`,
  solution:`WITH RECURSIVE piste(compte, etape, montant, quand) AS (SELECT 'HEL-COFFRE-01', 0, NULL, '2026-11-13 23:00:00' UNION ALL SELECT v.compte_dest, p.etape + 1, v.montant, v.horodatage FROM virements v JOIN piste p ON v.compte_source = p.compte WHERE v.montant > 100000 AND v.horodatage > p.quand) SELECT c.numero, c.banque, s.prenom, s.nom FROM piste p JOIN comptes c ON c.numero = p.compte JOIN suspects s ON s.id = c.titulaire_id WHERE p.etape = (SELECT MAX(etape) FROM piste);`,
  hints:["Joins piste à comptes, puis comptes à suspects (titulaire_id).","WHERE p.etape = (SELECT MAX(etape) FROM piste), ou ORDER BY etape DESC LIMIT 1"],
  require:[{re:'RECURSIVE', msg:"Repars de la CTE récursive."}]
});
mis({ id:'8.6', ch:8, title:'La chaîne de commandement',
  story:`« Côté Hélios, qui aurait dû surveiller Ferrand ? Remonte toute sa chaîne hiérarchique jusqu'au président. »`,
  lesson:`<p>Les hiérarchies (manager, catégorie parente, dossier parent) se parcourent aussi avec une CTE récursive : on part d'une personne, et à chaque étape on remonte vers <code>manager_id</code>.</p>
<pre class="code">WITH RECURSIVE chaine(id, nom, manager_id, niveau) AS (
  SELECT id, nom, manager_id, 0 FROM employes WHERE id = 42
  UNION ALL
  SELECT e.id, e.nom, e.manager_id, c.niveau + 1
  FROM employes e JOIN chaine c ON e.id = c.manager_id
)
SELECT * FROM chaine;</pre>`,
  task:`Affiche <code>niveau</code>, <code>prenom</code>, <code>nom</code>, <code>poste</code> de Ferrand (id 27, niveau 0) et de tous ses supérieurs, par niveau croissant.`,
  solution:`WITH RECURSIVE chaine(id, prenom, nom, poste, manager_id, niveau) AS (SELECT id, prenom, nom, poste, manager_id, 0 FROM employes WHERE id = 27 UNION ALL SELECT e.id, e.prenom, e.nom, e.poste, e.manager_id, c.niveau + 1 FROM employes e JOIN chaine c ON e.id = c.manager_id) SELECT niveau, prenom, nom, poste FROM chaine ORDER BY niveau;`,
  hints:["Partie initiale : WHERE id = 27, niveau 0","Partie récursive : JOIN chaine c ON e.id = c.manager_id"],
  require:[{re:'RECURSIVE', msg:"Utilise WITH RECURSIVE."}],
  check:{ordered:true}
});

/* ============ CHAPITRE 9 ============ */
chap({ id:9, code:'09', title:'La chronologie', subtitle:'Fonctions de fenêtrage : ROW_NUMBER, RANK, LAG, SUM OVER',
  intro:`<p>La juge d'instruction veut une chronologie minute par minute et des classements. Les agrégats écrasent les lignes ; les <b>fonctions de fenêtrage</b> calculent sur un groupe <b>tout en gardant chaque ligne</b>.</p>`,
  oracle:`<p>Oracle a été l'un des premiers moteurs à proposer les fonctions analytiques : la syntaxe <code>OVER (PARTITION BY ... ORDER BY ...)</code> est identique. Oracle ajoute <code>KEEP (DENSE_RANK FIRST ...)</code>, <code>LISTAGG</code> (équivalent de <code>group_concat</code>) et <code>RATIO_TO_REPORT</code>. SQLite supporte les fenêtres depuis la version 3.25.</p>`,
  quiz:[
    {q:"Différence entre RANK() et DENSE_RANK() avec des ex aequo (100, 100, 90) ?", o:["Aucune","RANK donne 1,1,3 ; DENSE_RANK donne 1,1,2","RANK donne 1,2,3","DENSE_RANK donne 1,2,2"], a:1, e:"RANK laisse un trou après les ex aequo, DENSE_RANK non. ROW_NUMBER donnerait 1,2,3."},
    {q:"À quoi sert PARTITION BY dans OVER(...) ?", o:["À trier","À découper les lignes en groupes indépendants pour le calcul","À filtrer","À créer une table"], a:1, e:"Le calcul (rang, somme...) recommence à zéro dans chaque partition."},
    {q:"Peut-on filtrer directement <code>WHERE ROW_NUMBER() OVER (...) = 1</code> ?", o:["Oui","Non, il faut passer par une sous-requête ou une CTE"], a:1, e:"Les fenêtres sont calculées après le WHERE. On les calcule dans une CTE, puis on filtre dessus."}
  ]});
mis({ id:'9.1', ch:9, title:'Numéroter les passages',
  story:`« Les accès badge de Ferrand (employé 27) le 13 au soir, numérotés dans l'ordre. »`,
  lesson:`<p>Une fonction de fenêtrage s'écrit <code>fonction() OVER (...)</code>. <code>ROW_NUMBER()</code> numérote les lignes selon l'ordre donné dans la fenêtre :</p>
<pre class="code">SELECT nom, age,
  ROW_NUMBER() OVER (ORDER BY age DESC) AS rang
FROM suspects;</pre>
<p>Contrairement à GROUP BY, toutes les lignes sont conservées.</p>`,
  task:`Pour l'employé 27 et les horodatages entre <code>'2026-11-13 20:00:00'</code> et <code>'2026-11-14 06:00:00'</code>, affiche <code>n</code> (ROW_NUMBER par horodatage), <code>horodatage</code>, <code>porte</code>, triés par horodatage.`,
  solution:`SELECT ROW_NUMBER() OVER (ORDER BY horodatage) AS n, horodatage, porte FROM acces_badges WHERE employe_id = 27 AND horodatage BETWEEN '2026-11-13 20:00:00' AND '2026-11-14 06:00:00' ORDER BY horodatage;`,
  hints:["ROW_NUMBER() OVER (ORDER BY horodatage) AS n"],
  require:[{re:'ROW_NUMBER', msg:"Utilise ROW_NUMBER()."}],
  check:{ordered:true}
});
mis({ id:'9.2', ch:9, title:'Le temps entre deux portes',
  story:`« Combien de minutes Ferrand a-t-il passées entre deux portes ? Je veux savoir combien de temps il est resté dans les coffres. »`,
  lesson:`<p><code>LAG(col)</code> renvoie la valeur de la <b>ligne précédente</b> dans la fenêtre, <code>LEAD(col)</code> celle de la suivante. Idéal pour calculer des écarts :</p>
<pre class="code">SELECT horodatage,
  LAG(horodatage) OVER (ORDER BY horodatage) AS precedent
FROM cameras
WHERE immatriculation = 'GH-713-KZ';</pre>
<p>Pour la première ligne, il n'y a pas de précédent : LAG renvoie NULL.</p>`,
  task:`Même périmètre que 9.1 : affiche <code>horodatage</code>, <code>porte</code> et <code>minutes</code> = écart avec l'accès précédent en minutes, arrondi à l'entier (<code>ROUND((julianday(a) - julianday(b)) * 1440)</code>), triés par horodatage.`,
  solution:`SELECT horodatage, porte, ROUND((julianday(horodatage) - julianday(LAG(horodatage) OVER (ORDER BY horodatage))) * 1440) AS minutes FROM acces_badges WHERE employe_id = 27 AND horodatage BETWEEN '2026-11-13 20:00:00' AND '2026-11-14 06:00:00' ORDER BY horodatage;`,
  hints:["LAG(horodatage) OVER (ORDER BY horodatage)","1440 = nombre de minutes dans une journée."],
  require:[{re:'LAG', msg:"Utilise LAG()."}],
  check:{ordered:true}
});
mis({ id:'9.3', ch:9, title:'Classement dans chaque gang',
  story:`« Dans chaque gang, classe les membres par nombre de délits. »`,
  lesson:`<p><code>PARTITION BY</code> découpe les lignes en groupes ; le calcul recommence dans chaque groupe :</p>
<pre class="code">SELECT ville, nom, age,
  RANK() OVER (PARTITION BY ville ORDER BY age DESC) AS rang
FROM suspects;</pre>
<p><code>RANK()</code> donne le même rang aux ex aequo et laisse un trou ensuite, <code>DENSE_RANK()</code> ne laisse pas de trou.</p>`,
  task:`Avec une CTE <code>nb</code> (suspect_id, nb_delits) incluant les membres sans délit (0), affiche <code>gang</code>, <code>nom</code>, <code>nb_delits</code> et <code>rang</code> (RANK par gang, du plus grand nombre de délits au plus petit).`,
  solution:`WITH nb AS (SELECT s.id AS suspect_id, COUNT(d.id) AS nb_delits FROM suspects s LEFT JOIN delits d ON d.suspect_id = s.id GROUP BY s.id) SELECT g.nom AS gang, s.nom, nb.nb_delits, RANK() OVER (PARTITION BY g.id ORDER BY nb.nb_delits DESC) AS rang FROM membres m JOIN gangs g ON g.id = m.gang_id JOIN suspects s ON s.id = m.suspect_id JOIN nb ON nb.suspect_id = s.id;`,
  hints:["COUNT(d.id) avec un LEFT JOIN compte 0 pour les suspects sans délit.","RANK() OVER (PARTITION BY g.id ORDER BY nb.nb_delits DESC)"],
  require:[{re:'PARTITION\\s+BY', msg:"Utilise PARTITION BY."}]
});
mis({ id:'9.4', ch:9, title:'Le numéro un',
  story:`« Je ne veux que le membre le plus chargé de chaque gang (ex aequo compris). »`,
  lesson:`<p>Les fenêtres sont calculées <b>après</b> le WHERE : impossible de filtrer dessus directement. On calcule le rang dans une CTE, puis on filtre :</p>
<pre class="code">WITH classes AS (
  SELECT ..., RANK() OVER (...) AS rang FROM ...
)
SELECT * FROM classes WHERE rang = 1;</pre>
<p>C'est le motif « top N par groupe », très demandé en entretien.</p>`,
  task:`Affiche <code>gang</code>, <code>nom</code>, <code>nb_delits</code> des membres classés <b>premiers</b> de leur gang (rang = 1).`,
  solution:`WITH nb AS (SELECT s.id AS suspect_id, COUNT(d.id) AS nb_delits FROM suspects s LEFT JOIN delits d ON d.suspect_id = s.id GROUP BY s.id), classes AS (SELECT g.nom AS gang, s.nom, nb.nb_delits, RANK() OVER (PARTITION BY g.id ORDER BY nb.nb_delits DESC) AS rang FROM membres m JOIN gangs g ON g.id = m.gang_id JOIN suspects s ON s.id = m.suspect_id JOIN nb ON nb.suspect_id = s.id) SELECT gang, nom, nb_delits FROM classes WHERE rang = 1;`,
  hints:["Mets la requête de 9.3 dans une CTE classes.","SELECT gang, nom, nb_delits FROM classes WHERE rang = 1"]
});
mis({ id:'9.5', ch:9, title:'Le cumul',
  story:`« Pour l'audit : les virements sortants du compte <code>HEL-COFFRE-01</code> en novembre, avec le montant <b>cumulé</b> au fil du temps. »`,
  lesson:`<p>Un agrégat utilisé avec <code>OVER (ORDER BY ...)</code> devient un <b>cumul progressif</b> (un total courant). À horodatage égal, les lignes reçoivent le même cumul (cadre RANGE par défaut).</p>
<pre class="code">SELECT horodatage, montant,
  SUM(montant) OVER (ORDER BY horodatage) AS cumul,
  AVG(montant) OVER (ORDER BY horodatage
                     ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moy3
FROM virements;</pre>
<p>La clause <code>ROWS BETWEEN</code> définit précisément la fenêtre (ici la ligne et les deux précédentes) : c'est alors une fenêtre <b>glissante</b>.</p>`,
  task:`Affiche <code>horodatage</code>, <code>compte_dest</code>, <code>montant</code> et <code>cumul</code> (arrondi à 2 décimales) pour les virements dont la source est <code>HEL-COFFRE-01</code> et l'horodatage commence par <code>2026-11</code>, triés par horodatage.`,
  solution:`SELECT horodatage, compte_dest, montant, ROUND(SUM(montant) OVER (ORDER BY horodatage), 2) AS cumul FROM virements WHERE compte_source = 'HEL-COFFRE-01' AND horodatage LIKE '2026-11%' ORDER BY horodatage;`,
  hints:["SUM(montant) OVER (ORDER BY horodatage) AS cumul"],
  require:[{re:'OVER', msg:"Utilise une fonction de fenêtrage avec OVER."}],
  check:{ordered:true}
});

/* ============ CHAPITRE 10 ============ */
chap({ id:10, code:'10', title:'Le dossier judiciaire', subtitle:'INSERT, UPDATE, DELETE, transactions',
  intro:`<p>Les preuves s'accumulent. Il faut maintenant <b>mettre à jour</b> la base : enregistrer les nouveaux délits, corriger les fiches, supprimer les erreurs. C'est le <b>DML</b> (Data Manipulation Language).</p>
<p class="quote">« Un SELECT ne casse rien. Un UPDATE sans WHERE, si. » (Byte)</p>
<p>Ici, chaque exécution repart d'une copie propre de la base : tu peux te tromper sans risque.</p>`,
  oracle:`<p>En Oracle (SQL*Plus, SQL Developer, APEX selon le réglage), les modifications ne sont <b>pas validées automatiquement</b> : il faut <code>COMMIT;</code> pour les rendre définitives, ou <code>ROLLBACK;</code> pour les annuler. SQLite et la plupart des clients sont en autocommit tant qu'on n'a pas ouvert de transaction avec <code>BEGIN</code>. Oracle insère plusieurs lignes avec <code>INSERT ALL</code> ou plusieurs INSERT, la forme <code>VALUES (...), (...)</code> n'étant acceptée qu'à partir de la version 23ai.</p>`,
  quiz:[
    {q:"Que fait <code>UPDATE suspects SET ville = 'Paris';</code> ?", o:["Rien sans WHERE","Modifie la ville de TOUS les suspects","Modifie le premier suspect","Erreur"], a:1, e:"Sans WHERE, toutes les lignes sont touchées. Réflexe : écrire d'abord le SELECT avec le WHERE, vérifier, puis le transformer en UPDATE."},
    {q:"<code>ROLLBACK</code> :", o:["Valide la transaction","Annule les modifications depuis le BEGIN","Supprime la table","Recharge la base"], a:1, e:"COMMIT valide, ROLLBACK annule. Une transaction est atomique : tout ou rien."},
    {q:"Que garantit le A de ACID ?", o:["Accessibilité","Atomicité : une transaction s'applique entièrement ou pas du tout","Authentification","Archivage"], a:1, e:"ACID : Atomicité, Cohérence, Isolation, Durabilité."}
  ]});
mis({ id:'10.1', ch:10, title:'Enregistrer le braquage',
  story:`« Ajoute le braquage au casier de Vasseur. »`,
  lesson:`<p><code>INSERT INTO</code> ajoute une ligne. On liste les colonnes puis les valeurs dans le même ordre :</p>
<pre class="code">INSERT INTO vehicules (immatriculation, suspect_id, marque, couleur, annee)
VALUES ('AB-123-CD', 42, 'Renault', 'Bleue', 2020);</pre>
<p>Les colonnes non citées prennent leur valeur par défaut, ou NULL. Toujours lister les colonnes : le code reste juste si la table évolue.</p>`,
  task:`Insère dans <code>delits</code> la ligne : id <code>9001</code>, suspect_id <code>217</code>, type <code>'Braquage'</code>, date_faits <code>'2026-11-13'</code>, ville <code>'Puteaux'</code>.`,
  solution:`INSERT INTO delits (id, suspect_id, type, date_faits, ville) VALUES (9001, 217, 'Braquage', '2026-11-13', 'Puteaux');`,
  hints:["INSERT INTO delits (id, suspect_id, type, date_faits, ville) VALUES (...);"],
  check:{mode:'dml', verify:["SELECT id, suspect_id, type, date_faits, ville FROM delits WHERE id >= 9000","SELECT COUNT(*) FROM delits"]}
});
mis({ id:'10.2', ch:10, title:'Plusieurs lignes',
  story:`« Et les deux autres : Lefort pour le braquage, Marchetti pour blanchiment. »`,
  lesson:`<p>SQLite (comme PostgreSQL et MySQL) accepte plusieurs lignes dans un seul INSERT :</p>
<pre class="code">INSERT INTO gangs (id, nom, territoire)
VALUES (9, 'Les Ombres', 'Lyon'),
       (10, 'Le Réseau', 'Nice');</pre>`,
  task:`En une seule instruction, insère dans <code>delits</code> (id, suspect_id, type, date_faits, ville) : <code>(9002, 388, 'Braquage', '2026-11-13', 'Puteaux')</code> et <code>(9003, 131, 'Blanchiment', '2026-11-14', 'Neuilly-sur-Seine')</code>.`,
  solution:`INSERT INTO delits (id, suspect_id, type, date_faits, ville) VALUES (9002, 388, 'Braquage', '2026-11-13', 'Puteaux'), (9003, 131, 'Blanchiment', '2026-11-14', 'Neuilly-sur-Seine');`,
  hints:["VALUES (...), (...);"],
  check:{mode:'dml', verify:["SELECT id, suspect_id, type, date_faits, ville FROM delits WHERE id >= 9000","SELECT COUNT(*) FROM delits"]}
});
mis({ id:'10.3', ch:10, title:'Corriger une fiche',
  story:`Le téléphone jetable de Karine Lefort a été retrouvé : <code>0700000713</code>. Mets sa fiche à jour (id 388).`,
  lesson:`<p><code>UPDATE</code> modifie des lignes existantes :</p>
<pre class="code">UPDATE suspects
SET ville = 'Lyon', telephone = NULL
WHERE id = 42;</pre>
<p>Méthode sûre : écris d'abord <code>SELECT * FROM suspects WHERE id = 42;</code>, vérifie que seules les bonnes lignes ressortent, puis remplace par UPDATE en gardant le même WHERE.</p>`,
  task:`Mets le téléphone du suspect 388 à <code>'0700000713'</code>.`,
  solution:`UPDATE suspects SET telephone = '0700000713' WHERE id = 388;`,
  hints:["UPDATE suspects SET telephone = '...' WHERE id = 388;"],
  check:{mode:'dml', verify:["SELECT id, telephone FROM suspects WHERE telephone = '0700000713' OR id = 388","SELECT COUNT(*) FROM suspects WHERE telephone IS NULL"]}
});
mis({ id:'10.4', ch:10, title:'Mise à jour calculée',
  story:`« Tous les membres du Cercle passent au statut d'interpellables : préfixe leur rôle par <i>Cible : </i> (exemple : <code>Cible : Membre</code>). »`,
  lesson:`<p>Dans SET, la nouvelle valeur peut être calculée à partir de l'ancienne, ou d'une sous-requête :</p>
<pre class="code">UPDATE employes
SET salaire = ROUND(salaire * 1.03, 2)
WHERE agence_id = 2;

UPDATE gangs
SET chef_id = (SELECT id FROM suspects WHERE nom = 'Vasseur' AND prenom = 'Marc')
WHERE id = 1;</pre>`,
  task:`Dans <code>membres</code>, pour le gang 2, remplace <code>role</code> par <code>'Cible : '</code> suivi de l'ancien rôle.`,
  solution:`UPDATE membres SET role = 'Cible : ' || role WHERE gang_id = 2;`,
  hints:["SET role = 'Cible : ' || role","WHERE gang_id = 2"],
  check:{mode:'dml', verify:["SELECT suspect_id, gang_id, role FROM membres ORDER BY suspect_id, gang_id"]}
});
mis({ id:'10.5', ch:10, title:'Supprimer le faux positif',
  story:`La plaque <code>XX-000-XX</code> était une fausse plaque : ces passages polluent les recherches. « Supprime-les de <code>cameras</code>. »`,
  lesson:`<p><code>DELETE FROM</code> supprime des lignes :</p>
<pre class="code">DELETE FROM cameras
WHERE lieu = 'A14 Péage' AND horodatage &lt; '2026-11-02';</pre>
<p><code>DELETE FROM cameras;</code> sans WHERE vide toute la table. Les contraintes de clé étrangère peuvent bloquer une suppression (ou la propager avec <code>ON DELETE CASCADE</code>).</p>`,
  task:`Supprime de <code>cameras</code> tous les passages de la plaque <code>'XX-000-XX'</code>.`,
  solution:`DELETE FROM cameras WHERE immatriculation = 'XX-000-XX';`,
  hints:["DELETE FROM cameras WHERE immatriculation = 'XX-000-XX';"],
  check:{mode:'dml', verify:["SELECT COUNT(*) FROM cameras","SELECT COUNT(*) FROM cameras WHERE immatriculation = 'XX-000-XX'"]}
});
mis({ id:'10.6', ch:10, title:'INSERT à partir d\'un SELECT',
  story:`La juge a créé une table <code>interpellations</code> (suspect_id, motif, date_prevue). « Remplis-la avec tous les membres du Cercle, motif <i>Association de malfaiteurs</i>, prévue le <code>2026-11-16</code>. »`,
  lesson:`<p>On peut insérer le résultat d'une requête au lieu de valeurs fixes :</p>
<pre class="code">INSERT INTO archive_delits (id, suspect_id, type)
SELECT id, suspect_id, type
FROM delits
WHERE date_faits &lt; '2010-01-01';</pre>
<p>Pas de mot-clé VALUES dans ce cas. Les colonnes du SELECT doivent correspondre, dans l'ordre, à celles de l'INSERT.</p>
<p>Ici, la table est créée pour toi avant ton code : <code>CREATE TABLE interpellations (suspect_id INTEGER, motif TEXT, date_prevue TEXT);</code></p>`,
  task:`Insère dans <code>interpellations</code> une ligne par membre du gang 2, avec le motif et la date indiqués.`,
  setup:`CREATE TABLE interpellations (suspect_id INTEGER, motif TEXT, date_prevue TEXT);`,
  solution:`INSERT INTO interpellations (suspect_id, motif, date_prevue) SELECT suspect_id, 'Association de malfaiteurs', '2026-11-16' FROM membres WHERE gang_id = 2;`,
  hints:["INSERT INTO interpellations (suspect_id, motif, date_prevue) SELECT ...","SELECT suspect_id, 'Association de malfaiteurs', '2026-11-16' FROM membres WHERE gang_id = 2"],
  check:{mode:'dml', verify:["SELECT suspect_id, motif, date_prevue FROM interpellations ORDER BY suspect_id"]}
});
mis({ id:'10.7', ch:10, title:'Le bouton annuler',
  story:`Un stagiaire veut tester une remise à zéro des salaires des employés. Varga : « Dans une transaction, et tu annules derrière. »`,
  lesson:`<p>Une <b>transaction</b> regroupe plusieurs instructions en un bloc indivisible :</p>
<pre class="code">BEGIN;
UPDATE comptes SET banque = 'Test' WHERE numero = 'FR76-1000';
DELETE FROM virements WHERE montant &lt; 1;
-- tout va bien ?
COMMIT;     -- on valide
-- ou
ROLLBACK;   -- on annule tout depuis BEGIN</pre>
<p>C'est ce qui garantit qu'un virement débite et crédite, ou ne fait rien du tout.</p>`,
  task:`Ouvre une transaction, mets <code>salaire = 0</code> pour tous les employés, affiche la somme des salaires (elle doit valoir 0), puis annule avec <code>ROLLBACK</code>.`,
  solution:`BEGIN; UPDATE employes SET salaire = 0; SELECT SUM(salaire) FROM employes; ROLLBACK;`,
  hints:["BEGIN; UPDATE employes SET salaire = 0;","SELECT SUM(salaire) FROM employes; ROLLBACK;"],
  require:[{re:'BEGIN[\\s\\S]*UPDATE\\s+employes\\s+SET\\s+salaire\\s*=\\s*0[\\s\\S]*SUM\\s*\\(\\s*salaire\\s*\\)[\\s\\S]*ROLLBACK', msg:"Dans l'ordre : BEGIN, UPDATE employes SET salaire = 0, SELECT SUM(salaire), puis ROLLBACK."}],
  check:{mode:'dml', verify:["SELECT SUM(salaire) FROM employes"]}
});

/* ============ CHAPITRE 11 ============ */
chap({ id:11, code:'11', title:"L'architecte", subtitle:'CREATE TABLE, contraintes, ALTER, VIEW, INDEX, normalisation',
  intro:`<p>L'affaire Minuit a révélé les limites de la base de la brigade : pas de table pour les preuves, des requêtes lentes. Varga te confie la <b>conception</b> : le <b>DDL</b> (Data Definition Language).</p>
<p>Une bonne base se conçoit en trois temps : le <b>modèle conceptuel</b> (entités et relations, le schéma entité-association), le <b>modèle logique</b> (tables, clés), puis le <b>modèle physique</b> (types, index, contraintes dans un moteur précis).</p>`,
  oracle:`<p>Types Oracle : <code>VARCHAR2(30)</code> pour le texte, <code>NUMBER(6)</code> ou <code>NUMBER(8,2)</code> pour les nombres, <code>DATE</code> pour les dates. Auto-incrément : <code>GENERATED ALWAYS AS IDENTITY</code> ou une <code>SEQUENCE</code>. Ajout de colonne : <code>ALTER TABLE preuves ADD (scellee NUMBER(1) DEFAULT 0);</code> (sans le mot COLUMN). Oracle applique toujours les clés étrangères ; SQLite seulement avec <code>PRAGMA foreign_keys = ON</code> (activé dans ce jeu).</p>`,
  quiz:[
    {q:"Une table <code>enquete(id, suspect_nom, suspect_tel, gang_nom, gang_territoire)</code> où <code>gang_territoire</code> dépend de <code>gang_nom</code> viole :", o:["La 1re forme normale","La 3e forme normale (dépendance transitive)","Aucune","La clé primaire"], a:1, e:"gang_territoire dépend de gang_nom, qui n'est pas la clé : c'est une dépendance transitive. On sépare une table gangs."},
    {q:"Une colonne qui contient « 0611, 0622, 0633 » viole :", o:["La 1NF : une case doit contenir une seule valeur atomique","La 2NF","La 3NF","Rien"], a:0, e:"On crée une table telephones(suspect_id, numero) à la place."},
    {q:"Un index accélère :", o:["Les INSERT","Les recherches et jointures sur la colonne indexée","Toutes les requêtes sans exception","Les DELETE sans WHERE"], a:1, e:"Il ralentit légèrement les écritures (l'index doit être tenu à jour) et occupe de la place."}
  ]});
mis({ id:'11.1', ch:11, title:'La table des preuves',
  story:`« Il nous faut une table pour les scellés. »`,
  lesson:`<p><code>CREATE TABLE</code> définit une table, ses colonnes, leurs types et leurs <b>contraintes</b> :</p>
<pre class="code">CREATE TABLE temoins (
  id        INTEGER PRIMARY KEY,         -- identifiant unique
  nom       TEXT NOT NULL,               -- obligatoire
  email     TEXT UNIQUE,                 -- pas de doublon
  age       INTEGER CHECK (age &gt;= 0),    -- règle métier
  ville     TEXT DEFAULT 'Puteaux',      -- valeur par défaut
  suspect_id INTEGER REFERENCES suspects(id)  -- clé étrangère
);</pre>
<p>Les contraintes protègent la qualité des données : le moteur refuse toute ligne qui les viole.</p>`,
  task:`Crée <code>preuves</code> : <code>id</code> INTEGER clé primaire, <code>affaire</code> TEXT NOT NULL, <code>description</code> TEXT NOT NULL, <code>type</code> TEXT avec CHECK dans (<code>'Physique'</code>, <code>'Numérique'</code>, <code>'Témoignage'</code>), <code>suspect_id</code> INTEGER clé étrangère vers <code>suspects(id)</code>.`,
  solution:`CREATE TABLE preuves (id INTEGER PRIMARY KEY, affaire TEXT NOT NULL, description TEXT NOT NULL, type TEXT CHECK (type IN ('Physique', 'Numérique', 'Témoignage')), suspect_id INTEGER REFERENCES suspects(id));`,
  hints:["type TEXT CHECK (type IN ('Physique', 'Numérique', 'Témoignage'))","suspect_id INTEGER REFERENCES suspects(id)"],
  check:{mode:'dml', verify:[
    "SELECT name, pk, CASE WHEN name IN ('affaire','description') THEN \"notnull\" ELSE 0 END AS nn FROM pragma_table_info('preuves') ORDER BY cid",
    "SELECT \"table\", \"from\", COALESCE(\"to\", 'id') FROM pragma_foreign_key_list('preuves')",
    "SELECT (SELECT sql FROM sqlite_master WHERE name = 'preuves') LIKE '%Physique%Numérique%Témoignage%'"]}
});
mis({ id:'11.2', ch:11, title:'Tester les contraintes',
  story:`« Enregistre les deux premiers scellés. » La table <code>preuves</code> de 11.1 est créée pour toi avant ton code.`,
  lesson:`<p>Essaie aussi d'insérer une ligne invalide, par exemple <code>type = 'Autre'</code> ou un <code>suspect_id</code> inexistant : le moteur répond <i>CHECK constraint failed</i> ou <i>FOREIGN KEY constraint failed</i>. Ces erreurs sont une protection, pas un bug.</p>
<p>Avec <code>id INTEGER PRIMARY KEY</code>, SQLite attribue automatiquement un id si tu ne le fournis pas.</p>`,
  setup:`CREATE TABLE preuves (id INTEGER PRIMARY KEY, affaire TEXT NOT NULL, description TEXT NOT NULL, type TEXT CHECK (type IN ('Physique', 'Numérique', 'Témoignage')), suspect_id INTEGER REFERENCES suspects(id));`,
  task:`Insère dans <code>preuves</code> (affaire, description, type, suspect_id) : <code>('Minuit', 'Empreinte de chaussure pointure 45', 'Physique', 217)</code> et <code>('Minuit', 'Journal de connexion 203.0.113.66', 'Numérique', NULL)</code>.`,
  solution:`INSERT INTO preuves (affaire, description, type, suspect_id) VALUES ('Minuit', 'Empreinte de chaussure pointure 45', 'Physique', 217), ('Minuit', 'Journal de connexion 203.0.113.66', 'Numérique', NULL);`,
  hints:["Ne fournis pas l'id : il est attribué automatiquement."],
  check:{mode:'dml', verify:["SELECT affaire, description, type, suspect_id FROM preuves"]}
});
mis({ id:'11.3', ch:11, title:'Faire évoluer la table',
  story:`« Il manque une information : le scellé est-il fermé ? »`,
  lesson:`<p><code>ALTER TABLE</code> modifie une table existante sans perdre ses données :</p>
<pre class="code">ALTER TABLE suspects ADD COLUMN email TEXT;
ALTER TABLE suspects RENAME COLUMN ville TO commune;
ALTER TABLE preuves RENAME TO scelles;
DROP TABLE scelles;  -- supprime la table et ses données</pre>
<p>SQLite a un ALTER TABLE limité (pas de modification de type, par exemple) : on recrée alors la table.</p>`,
  setup:`CREATE TABLE preuves (id INTEGER PRIMARY KEY, affaire TEXT NOT NULL, description TEXT NOT NULL, type TEXT CHECK (type IN ('Physique', 'Numérique', 'Témoignage')), suspect_id INTEGER REFERENCES suspects(id));`,
  task:`Ajoute à <code>preuves</code> une colonne <code>scellee</code> de type INTEGER avec la valeur par défaut <code>0</code>.`,
  solution:`ALTER TABLE preuves ADD COLUMN scellee INTEGER DEFAULT 0;`,
  hints:["ALTER TABLE preuves ADD COLUMN scellee INTEGER DEFAULT 0;"],
  check:{mode:'dml', verify:["SELECT name, dflt_value FROM pragma_table_info('preuves') ORDER BY cid"]}
});
mis({ id:'11.4', ch:11, title:'Une vue pour la juge',
  story:`« La juge tape la même requête tous les matins. Fais-lui une vue. »`,
  lesson:`<p>Une <b>vue</b> est une requête enregistrée sous un nom. On l'interroge comme une table, mais elle ne stocke pas de données : elle est recalculée à chaque appel.</p>
<pre class="code">CREATE VIEW v_vehicules_cercle AS
SELECT v.*
FROM vehicules v
JOIN membres m ON m.suspect_id = v.suspect_id
WHERE m.gang_id = 2;

SELECT * FROM v_vehicules_cercle;</pre>
<p>Usages : simplifier, réutiliser, et restreindre l'accès (on donne le droit sur la vue, pas sur la table).</p>`,
  task:`Crée la vue <code>v_casiers</code> (id, prenom, nom, nb_delits) donnant pour <b>chaque</b> suspect son nombre de délits, 0 compris.`,
  solution:`CREATE VIEW v_casiers AS SELECT s.id, s.prenom, s.nom, COUNT(d.id) AS nb_delits FROM suspects s LEFT JOIN delits d ON d.suspect_id = s.id GROUP BY s.id, s.prenom, s.nom;`,
  hints:["CREATE VIEW v_casiers AS SELECT ...","LEFT JOIN et COUNT(d.id) pour avoir les 0."],
  check:{mode:'dml', verify:["SELECT id, prenom, nom, nb_delits FROM v_casiers ORDER BY id"]}
});
mis({ id:'11.5', ch:11, title:'Accélérer les recherches',
  story:`« Les recherches de plaques dans <code>cameras</code> rament. Sur une vraie base de 50 millions de passages, c'est inutilisable. »`,
  lesson:`<p>Un <b>index</b> est une structure triée (un arbre B) qui permet de trouver une valeur sans lire toute la table, comme l'index d'un livre.</p>
<pre class="code">CREATE INDEX idx_delits_suspect ON delits(suspect_id);

EXPLAIN QUERY PLAN
SELECT * FROM delits WHERE suspect_id = 217;
-- avant : SCAN delits (lecture complète)
-- après : SEARCH delits USING INDEX idx_delits_suspect</pre>
<p>Les clés primaires et les colonnes UNIQUE sont indexées automatiquement. On indexe les colonnes utilisées dans les WHERE et les jointures.</p>`,
  task:`Crée un index (nom libre) sur la colonne <code>immatriculation</code> de <code>cameras</code>. Bonus : regarde l'effet avec <code>EXPLAIN QUERY PLAN</code> dans le bac à sable.`,
  solution:`CREATE INDEX idx_cameras_immat ON cameras(immatriculation);`,
  hints:["CREATE INDEX nom_index ON table(colonne);"],
  check:{mode:'dml', verify:["SELECT ii.name FROM pragma_index_list('cameras') il, pragma_index_info(il.name) ii"]}
});
mis({ id:'11.6', ch:11, title:'Normaliser les témoignages',
  story:`Un enquêteur stockait tout dans une seule table : <code>temoignage(id, temoin_nom, temoin_tel, date, texte)</code>. Le même témoin apparaît dix fois, avec parfois un numéro différent. « Corrige ça. »`,
  lesson:`<p>La <b>normalisation</b> supprime les redondances :</p>
<ul><li><b>1NF</b> : chaque case contient une seule valeur, pas de liste.</li>
<li><b>2NF</b> : chaque colonne dépend de toute la clé (pas d'une partie seulement).</li>
<li><b>3NF</b> : pas de dépendance entre colonnes non clés (ici, le téléphone dépend du témoin, pas du témoignage).</li></ul>
<p>Solution : une table <code>temoins</code>, et des <code>temoignages</code> qui y font référence par clé étrangère. Relation <b>1 à plusieurs</b> : un témoin, plusieurs témoignages.</p>`,
  task:`Crée <code>temoins</code> (<code>id</code> INTEGER PRIMARY KEY, <code>nom</code> TEXT NOT NULL, <code>telephone</code> TEXT) puis <code>temoignages</code> (<code>id</code> INTEGER PRIMARY KEY, <code>temoin_id</code> INTEGER NOT NULL clé étrangère vers <code>temoins(id)</code>, <code>date</code> TEXT, <code>texte</code> TEXT NOT NULL).`,
  solution:`CREATE TABLE temoins (id INTEGER PRIMARY KEY, nom TEXT NOT NULL, telephone TEXT); CREATE TABLE temoignages (id INTEGER PRIMARY KEY, temoin_id INTEGER NOT NULL REFERENCES temoins(id), date TEXT, texte TEXT NOT NULL);`,
  hints:["Deux CREATE TABLE séparés par un point-virgule.","temoin_id INTEGER NOT NULL REFERENCES temoins(id)"],
  check:{mode:'dml', verify:["SELECT name, (\"notnull\" OR pk > 0) AS nn, pk FROM pragma_table_info('temoins') ORDER BY cid","SELECT name, (\"notnull\" OR pk > 0) AS nn, pk FROM pragma_table_info('temoignages') ORDER BY cid","SELECT \"table\", \"from\", COALESCE(\"to\", 'id') FROM pragma_foreign_key_list('temoignages')"]}
});

/* ============ CHAPITRE 12 ============ */
chap({ id:12, code:'12', title:'Le portail', subtitle:'Injection SQL : comprendre, détecter, se défendre',
  intro:`<p>Avant la force brute, l'IP <code>203.0.113.66</code> a tenté autre chose sur le portail web d'Hélios : des <b>injections SQL</b>. Farid Ouali te montre l'<b>ancien</b> code du formulaire de connexion, remplacé l'an dernier par des requêtes paramétrées :</p>
<pre class="code">requete = "SELECT * FROM utilisateurs_portail WHERE login = '"
          + login + "' AND hash_mdp = '" + hash + "'"</pre>
<p class="quote">« Le développeur a collé la saisie de l'utilisateur dans la requête. C'est l'erreur de sécurité la plus célèbre du web. » (Byte)</p>
<p>Ce chapitre sert à comprendre l'attaque pour savoir la détecter et l'empêcher. Toute tentative sur un système sans autorisation écrite est illégale (article 323-1 du Code pénal).</p>`,
  oracle:`<p>Le principe est identique sur tous les moteurs. Les commentaires diffèrent : <code>--</code> partout, <code>/* */</code> partout, <code>#</code> en MySQL. Côté Oracle, la défense passe par les <b>variables de liaison</b> (<code>:login</code>) en PL/SQL et dans APEX, et par le package <code>DBMS_ASSERT</code> pour les noms d'objets dynamiques.</p>`,
  quiz:[
    {q:"La meilleure défense contre l'injection SQL :", o:["Filtrer les mots SELECT et UNION","Les requêtes paramétrées (requêtes préparées)","Cacher les messages d'erreur","Chiffrer la base"], a:1, e:"Avec une requête paramétrée, la saisie est transmise comme une valeur, jamais interprétée comme du code. Les listes noires se contournent toujours."},
    {q:"Pourquoi l'attaquant termine-t-il sa saisie par <code>--</code> ?", o:["Pour faire joli","Pour mettre en commentaire la fin de la requête d'origine (le test du mot de passe)","Pour valider la transaction","Pour supprimer la table"], a:1, e:"Tout ce qui suit -- est ignoré : la condition sur le mot de passe disparaît."},
    {q:"Pour une injection UNION, l'attaquant doit :", o:["Connaître le mot de passe admin","Produire le même nombre de colonnes que la requête d'origine","Avoir un compte","Utiliser INTERSECT"], a:1, e:"Un UNION exige le même nombre de colonnes des deux côtés."}
  ]});
mis({ id:'12.1', ch:12, title:'Le commentaire assassin',
  story:`Première tentative dans le journal : login <code>admin' --</code>, mot de passe <code>x</code>.`,
  lesson:`<p>Recolle la saisie dans le code du portail. La requête générée devient :</p>
<pre class="code">SELECT * FROM utilisateurs_portail
WHERE login = 'admin' --' AND hash_mdp = 'x'</pre>
<p>L'apostrophe de l'attaquant <b>ferme la chaîne</b>, et <code>--</code> transforme le reste en commentaire. Le test du mot de passe a disparu.</p>`,
  task:`Exécute la requête que l'ancien code du portail aurait construite pour cette tentative, et observe ce qu'elle renvoie.`,
  solution:`SELECT * FROM utilisateurs_portail WHERE login = 'admin' --' AND hash_mdp = 'x'`,
  hints:["Copie la requête de la leçon, telle quelle."],
  require:[{re:"--", msg:"La requête injectée contient le commentaire --."}],
  check:{strictCols:true}
});
mis({ id:'12.2', ch:12, title:'La tautologie',
  story:`Deuxième tentative : login <code>' OR '1'='1' --</code>. L'attaquant ne connaît aucun compte.`,
  lesson:`<p>La requête générée :</p>
<pre class="code">SELECT * FROM utilisateurs_portail
WHERE login = '' OR '1'='1' --' AND hash_mdp = '...'</pre>
<p><code>'1'='1'</code> est toujours vrai : avec le OR, <b>toutes</b> les lignes passent. Beaucoup d'applications connectent alors l'attaquant avec le premier compte renvoyé, souvent l'administrateur.</p>`,
  task:`Exécute la requête générée par cette tentative.`,
  solution:`SELECT * FROM utilisateurs_portail WHERE login = '' OR '1'='1' --' AND hash_mdp = 'x'`,
  hints:["WHERE login = '' OR '1'='1' --..."],
  require:[{re:"'1'\\s*=\\s*'1'", msg:"Reproduis la tautologie '1'='1'."}],
  check:{strictCols:true}
});
mis({ id:'12.3', ch:12, title:"L'injection UNION",
  story:`Troisième tentative, toujours dans le champ login : <code>x' UNION SELECT login, hash_mdp FROM utilisateurs_portail --</code>. Byte : « Sur une page vulnérable comme l'ancienne recherche d'agences, <code>"SELECT nom, ville FROM agences WHERE ville = '" + saisie + "'"</code>, voici ce qu'il aurait obtenu. »`,
  lesson:`<p>La requête générée affiche des agences... puis les identifiants du portail :</p>
<pre class="code">SELECT nom, ville FROM agences WHERE ville = 'x'
UNION SELECT login, hash_mdp FROM utilisateurs_portail --'</pre>
<p>L'attaquant a dû deviner que la requête d'origine renvoyait <b>2 colonnes</b>, pour que l'UNION soit valide. C'est ainsi qu'on exfiltre une base entière par un simple champ de recherche.</p>`,
  task:`Exécute la requête générée par cette saisie.`,
  solution:`SELECT nom, ville FROM agences WHERE ville = 'x' UNION SELECT login, hash_mdp FROM utilisateurs_portail --'`,
  hints:["Recolle la saisie entre les deux apostrophes du code."],
  require:[{re:"UNION", msg:"La requête injectée utilise UNION."}]
});
mis({ id:'12.4', ch:12, title:'Détecter les tentatives',
  story:`« Côté défense : retrouve dans <code>connexions</code> tous les logins qui contiennent une apostrophe. Un login normal n'en contient jamais. »`,
  lesson:`<p>Pour écrire une apostrophe <b>à l'intérieur</b> d'une chaîne SQL, on la <b>double</b> :</p>
<pre class="code">SELECT * FROM suspects WHERE nom = 'D''Artagnan';
-- et pour chercher une apostrophe n'importe où :
WHERE login LIKE '%''%'</pre>
<p>Et la vraie défense, côté code, est la <b>requête paramétrée</b> : la saisie est envoyée séparément et ne peut jamais devenir du code.</p>
<pre class="code"># Python
cur.execute("SELECT * FROM utilisateurs_portail WHERE login = ? AND hash_mdp = ?",
            (login, hash))
// Java
PreparedStatement ps = cx.prepareStatement(
  "SELECT * FROM utilisateurs_portail WHERE login = ? AND hash_mdp = ?");
ps.setString(1, login);</pre>`,
  task:`Affiche <code>horodatage</code>, <code>ip</code>, <code>login</code> des connexions dont le login contient une apostrophe, par ordre chronologique.`,
  solution:`SELECT horodatage, ip, login FROM connexions WHERE login LIKE '%''%' ORDER BY horodatage;`,
  hints:["LIKE '%''%' : deux apostrophes pour en représenter une."],
  check:{ordered:true},
  success:`Quatre tentatives entre 22h31 et 22h35, toutes depuis <b>203.0.113.66</b>, juste avant la force brute. Le portail était protégé : l'attaquant a dû se rabattre sur les identifiants de Ferrand.`
});

/* ============ CHAPITRE 13 ============ */
chap({ id:13, code:'13', title:'Minuit', subtitle:"L'affaire finale",
  intro:`<p>Tout est là. Le braqueur, la conductrice, l'homme de l'intérieur, l'argent. Il reste à convaincre le juge que <b>la tête du réseau</b> est bien celle que tu soupçonnes. Pas d'indice cette fois : une requête, un nom.</p>
<p class="quote">« Prouve-le avec les données. Juste avec les données. » (Inès Varga)</p>`,
  oracle:`<p>Tu as couvert l'équivalent du programme Oracle Academy « Database Foundations / Database Programming with SQL » : sélection, filtres, fonctions, agrégats, jointures, sous-requêtes, ensembles, DML, DDL, conception. Pour passer à la pratique Oracle, ouvre un espace gratuit sur <a href="https://apex.oracle.com" target="_blank" rel="noopener">apex.oracle.com</a> ou <a href="https://livesql.oracle.com" target="_blank" rel="noopener">livesql.oracle.com</a>.</p>`,
  quiz:[
    {q:"Pour croiser trois conditions sur des tables différentes, la méthode la plus lisible est :", o:["Une seule ligne de 600 caractères","Une CTE par condition, puis une requête finale qui les combine","Trois requêtes et un tableur","Un trigger"], a:1, e:"Les CTE découpent un raisonnement complexe en étapes nommées, testables une par une."},
    {q:"Les données de ce jeu sont-elles réelles ?", o:["Oui, anonymisées","Non, elles sont entièrement fictives","Elles viennent d'Oracle","Elles viennent de la police"], a:1, e:"Tous les noms, comptes, numéros et adresses IP sont inventés (les IP 203.0.113.x, 198.51.100.x et 192.0.2.x sont réservées à la documentation)."}
  ]});
mis({ id:'13.1', ch:13, title:'Le cerveau', xp:300,
  story:`Écris <b>une seule requête</b> qui renvoie le prénom et le nom de la personne qui remplit <b>les trois</b> conditions suivantes :<ol><li>elle est <b>cheffe</b> d'un gang (<code>gangs.chef_id</code>) ;</li><li>elle est titulaire du <b>compte final</b> de la piste de l'argent ;</li><li>son téléphone a été <b>en contact</b> (dans un sens ou l'autre) avec celui de Julien Ferrand.</li></ol>`,
  lesson:`<p>Méthode d'expert : une CTE par preuve, puis l'intersection.</p>
<pre class="code">WITH RECURSIVE
piste(...) AS (...),
compte_final AS (...),
contacts_ferrand AS (...)
SELECT s.prenom, s.nom
FROM suspects s
WHERE s.id IN (SELECT chef_id FROM gangs)
  AND s.id IN (...)
  AND s.telephone IN (...);</pre>
<p>Ne recopie aucune valeur trouvée avant (numéro de compte, id de la suspecte) : seuls le compte de départ, la date et le téléphone de Ferrand sont autorisés comme points d'entrée.</p>`,
  task:`Affiche <code>prenom</code> et <code>nom</code> de la personne qui remplit les trois conditions.`,
  solution:`WITH RECURSIVE piste(compte, etape, quand) AS (SELECT 'HEL-COFFRE-01', 0, '2026-11-13 23:00:00' UNION ALL SELECT v.compte_dest, p.etape + 1, v.horodatage FROM virements v JOIN piste p ON v.compte_source = p.compte WHERE v.montant > 100000 AND v.horodatage > p.quand), compte_final AS (SELECT compte FROM piste WHERE etape = (SELECT MAX(etape) FROM piste)), contacts_ferrand AS (SELECT appele AS numero FROM appels WHERE appelant = (SELECT telephone FROM employes WHERE nom = 'Ferrand' AND prenom = 'Julien') UNION SELECT appelant FROM appels WHERE appele = (SELECT telephone FROM employes WHERE nom = 'Ferrand' AND prenom = 'Julien')) SELECT s.prenom, s.nom FROM suspects s WHERE s.id IN (SELECT chef_id FROM gangs) AND s.id IN (SELECT titulaire_id FROM comptes WHERE numero IN (SELECT compte FROM compte_final)) AND s.telephone IN (SELECT numero FROM contacts_ferrand);`,
  hints:["Repars de la CTE piste du chapitre 8.","contacts_ferrand : UNION des appelés et appelants du téléphone de Ferrand.","Trois conditions IN dans le WHERE final."],
  require:[{re:'RECURSIVE', msg:"La piste de l'argent nécessite une CTE récursive."},{re:'^(?![\\s\\S]*(CH-9131|131|0699887766))', msg:"Ne recopie pas les valeurs déjà trouvées (compte, id ou téléphone de la suspecte) : la requête doit les retrouver seule."}],
  check:{strictCols:true}
});
mis({ id:'13.2', ch:13, title:'Le rapport', xp:200,
  story:`La commissaire Varga signe le procès-verbal. Il ne manque qu'une ligne au procès-verbal, et c'est une requête qui doit l'écrire.`,
  lesson:`<p>Récapitulatif de l'enquête :</p>
<ul><li><b>Marc Vasseur</b> : le braqueur (chapitre 2, WHERE)</li><li><b>Karine Lefort</b> : la conductrice (chapitre 3, LIKE et IS NULL)</li><li><b>Julien Ferrand</b> : l'homme de l'intérieur (chapitres 5 à 7, agrégats, jointures, EXISTS)</li><li>La piste de l'argent jusqu'en Suisse (chapitre 8, CTE récursive)</li></ul>`,
  setup: "CREATE TABLE proces_verbal (affaire TEXT NOT NULL, coupable TEXT NOT NULL, preuve TEXT);",
  task:`Remplis la table <code>proces_verbal</code> (affaire, coupable, preuve) avec <b>une seule ligne</b> : affaire 'Minuit', coupable = prénom et nom (séparés par une espace) du chef du gang 'Le Cercle', preuve 'chef du Cercle'. Le nom doit venir d'un <code>INSERT ... SELECT</code>.`,
  solution:`INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT 'Minuit', s.prenom || ' ' || s.nom, 'chef du Cercle' FROM suspects s JOIN gangs g ON g.chef_id = s.id WHERE g.nom = 'Le Cercle';`,
  hints:["INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT ...","JOIN gangs g ON g.chef_id = s.id WHERE g.nom = 'Le Cercle'"],
  require:[{re:'gangs', msg:"Pars des données : ta requête doit utiliser la table gangs."},{re:'INSERT', msg:"Écris le procès-verbal avec un INSERT."},{re:'SELECT', msg:"Le nom doit venir d'une requête (INSERT ... SELECT), pas être tapé à la main."},{re:'^(?![\\s\\S]*(Marchetti|Sol[eè]ne|131))', msg:"Ne tape pas le nom ni l'id : la requête doit les retrouver."}],
  check:{mode:'dml', verify:["SELECT affaire, coupable FROM proces_verbal"]},
  success:`Affaire Minuit résolue. Le Cercle est démantelé. Bienvenue dans la Brigade Data.`
});
