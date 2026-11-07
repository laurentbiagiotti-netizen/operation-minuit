// Contenu pédagogique : chapitres 0 à 6
window.CHAPTERS = [];
window.MISSIONS = [];
function chap(o){ CHAPTERS.push(o); }
function mis(o){ MISSIONS.push(o); }
const NIGHT = "horodatage BETWEEN '2026-11-13 23:00:00' AND '2026-11-14 00:30:00'";

/* ============ CHAPITRE 1 ============ */
chap({ id:1, code:'01', title:'Le dossier', subtitle:'SELECT, colonnes, alias, tri',
  intro:`<p>Vendredi 13 novembre 2026, 23h40. La salle des coffres de l'agence <b>Hélios La Défense</b> a été vidée. Vingt minutes plus tôt, 480 000 € avaient quitté le système bancaire par virement.</p>
<p>Tu viens d'intégrer la <b>Brigade Data</b>, la cellule d'enquête numérique de la commissaire <b>Inès Varga</b>. Ton binôme, l'analyste <b>Nora Kessler</b> (tout le monde l'appelle « Byte »), t'ouvre l'accès à la base de données de la brigade.</p>
<p class="quote">« Ici, on ne court pas après les voleurs. On les interroge en SQL. » (Byte)</p>`,
  oracle:`<p>En Oracle (Oracle Academy, APEX), la syntaxe de ce chapitre est identique, à une exception près : <code>LIMIT 5</code> n'existe pas. On écrit <code>FETCH FIRST 5 ROWS ONLY</code> (Oracle 12c et plus) ou, en version ancienne, on trie dans une sous-requête puis on filtre : <code>SELECT * FROM (SELECT ... ORDER BY age DESC) WHERE ROWNUM &lt;= 5</code>. Attention : <code>WHERE ROWNUM &lt;= 5 ORDER BY ...</code> prend 5 lignes au hasard avant de les trier. Pour un calcul sans table, Oracle impose la table factice <code>DUAL</code> : <code>SELECT 2026 - 54 FROM DUAL;</code></p>`,
  quiz:[
    {q:"Que renvoie <code>SELECT * FROM suspects;</code> ?", o:["Toutes les colonnes et toutes les lignes de la table","Uniquement la première ligne","La liste des tables","Le nombre de lignes"], a:0, e:"L'étoile signifie « toutes les colonnes ». Sans WHERE, toutes les lignes sont renvoyées."},
    {q:"Quel mot-clé supprime les doublons dans un résultat ?", o:["UNIQUE","DISTINCT","GROUP","DIFFERENT"], a:1, e:"SELECT DISTINCT ne garde qu'un exemplaire de chaque combinaison de valeurs."},
    {q:"Dans quel ordre SQL lit-il une requête simple ?", o:["SELECT puis FROM puis ORDER BY","FROM puis SELECT puis ORDER BY","ORDER BY puis FROM puis SELECT","L'ordre d'écriture"], a:1, e:"Le moteur part de la table (FROM), calcule les colonnes (SELECT) puis trie (ORDER BY). C'est pour ça qu'un alias défini dans SELECT est utilisable dans ORDER BY."}
  ]});

mis({ id:'1.1', ch:1, title:'Premier contact',
  story:`Byte pose un café sur ton bureau. « La table <code>suspects</code> contient tous les individus fichés de la région. Commence par la regarder en entier. »`,
  lesson:`<p>Une <b>base de données relationnelle</b> range l'information dans des <b>tables</b>. Une table, c'est un tableau : chaque <b>ligne</b> est un enregistrement (un suspect), chaque <b>colonne</b> un attribut (nom, âge, pointure...).</p>
<p>Le SQL (Structured Query Language) sert à interroger ces tables. L'instruction de base est <code>SELECT</code> :</p>
<pre class="code">SELECT *
FROM suspects;</pre>
<p><code>*</code> veut dire « toutes les colonnes ». Le point-virgule termine l'instruction. Les mots-clés ne sont pas sensibles à la casse (<code>select</code> marche aussi), mais on les écrit souvent en majuscules par lisibilité.</p>`,
  task:`Affiche <b>toutes les colonnes</b> de <b>tous les suspects</b>. Combien de lignes la table contient-elle ?`,
  solution:`SELECT * FROM suspects;`,
  hints:["La table s'appelle suspects.","SELECT * FROM ...;"],
  check:{strictCols:true},
  success:`500 lignes : 500 suspects fichés. Byte : « Bienvenue dans la base. »`
});
mis({ id:'1.2', ch:1, title:'Choisir ses colonnes',
  story:`« Trop d'informations tue l'information. Pour la fiche de synthèse, je veux juste le prénom, le nom et l'âge. »`,
  lesson:`<p>Au lieu de <code>*</code>, on liste les colonnes voulues, séparées par des virgules, dans l'ordre où on veut les voir :</p>
<pre class="code">SELECT nom, ville
FROM suspects;</pre>
<p>C'est la <b>projection</b> : on choisit les colonnes. Bonne pratique en production : éviter <code>SELECT *</code>, qui charge des données inutiles et casse si la table change.</p>
<p>Le bouton <b>Schéma</b> (en haut) liste toutes les tables et leurs colonnes. Un clic sur une colonne l'insère dans l'éditeur.</p>`,
  task:`Affiche uniquement les colonnes <code>prenom</code>, <code>nom</code> et <code>age</code> de tous les suspects.`,
  solution:`SELECT prenom, nom, age FROM suspects;`,
  hints:["Liste les trois colonnes après SELECT, séparées par des virgules.","SELECT prenom, nom, age FROM suspects;"],
  check:{strictCols:true}
});
mis({ id:'1.3', ch:1, title:'Alias et calculs',
  story:`« Les témoins donnent souvent une année de naissance plutôt qu'un âge. Calcule-la pour chaque suspect. »`,
  lesson:`<p>Une colonne du SELECT peut être une <b>expression</b> : un calcul avec <code>+ - * /</code>. On lui donne un nom lisible avec un <b>alias</b> grâce à <code>AS</code> :</p>
<pre class="code">SELECT nom, pointure, pointure + 1 AS pointure_avec_chaussettes
FROM suspects;</pre>
<p>L'alias ne modifie pas la table : il renomme seulement la colonne dans le résultat. Si l'alias contient des espaces, il faut des guillemets doubles : <code>AS "Année de naissance"</code>.</p>`,
  task:`Affiche <code>nom</code>, <code>age</code> et une colonne calculée <code>annee_naissance</code> égale à <code>2026 - age</code>.`,
  solution:`SELECT nom, age, 2026 - age AS annee_naissance FROM suspects;`,
  hints:["Une colonne peut être un calcul : 2026 - age.","Ajoute AS annee_naissance après le calcul."],
  check:{strictCols:true, colNames:true}
});
mis({ id:'1.4', ch:1, title:'Coller des textes',
  story:`« Pour les avis de recherche, il me faut l'identité complète dans une seule colonne, du genre <i>Marc Vasseur</i>. »`,
  lesson:`<p>L'opérateur <code>||</code> <b>concatène</b> (colle) des chaînes de caractères. Les textes littéraux s'écrivent entre <b>apostrophes simples</b> :</p>
<pre class="code">SELECT nom || ' (' || ville || ')' AS fiche
FROM suspects;</pre>
<p>Attention : en SQL, les guillemets simples <code>'...'</code> délimitent des <b>valeurs</b>, les guillemets doubles <code>"..."</code> délimitent des <b>noms</b> (colonnes, alias).</p>`,
  task:`Affiche une colonne <code>identite</code> contenant le prénom, une espace, puis le nom, suivie de la colonne <code>ville</code>.`,
  solution:`SELECT prenom || ' ' || nom AS identite, ville FROM suspects;`,
  hints:["prenom || ' ' || nom","N'oublie pas AS identite, puis ajoute la colonne ville"],
  check:{strictCols:true, colNames:true}
});
mis({ id:'1.5', ch:1, title:'Sans doublons',
  story:`« Dans quelles villes nos suspects habitent-ils ? Je veux chaque ville une seule fois. »`,
  lesson:`<p><code>DISTINCT</code>, placé juste après <code>SELECT</code>, élimine les lignes en double du résultat :</p>
<pre class="code">SELECT DISTINCT yeux
FROM suspects;</pre>
<p>Avec plusieurs colonnes, c'est la <b>combinaison</b> qui doit être unique : <code>SELECT DISTINCT ville, sexe</code> garde chaque couple (ville, sexe) une fois.</p>`,
  task:`Affiche la liste des <b>villes</b> où habitent les suspects, sans doublon.`,
  solution:`SELECT DISTINCT ville FROM suspects;`,
  hints:["Le mot-clé se place juste après SELECT."],
  check:{strictCols:true}
});
mis({ id:'1.6', ch:1, title:'Trier les fiches',
  story:`« Classe-moi les suspects du plus âgé au plus jeune. À âge égal, par ordre alphabétique du nom. »`,
  lesson:`<p><code>ORDER BY</code> trie le résultat. <code>ASC</code> (croissant) est la valeur par défaut, <code>DESC</code> trie en décroissant. On peut enchaîner plusieurs critères : le second ne sert qu'en cas d'égalité sur le premier.</p>
<pre class="code">SELECT nom, ville
FROM suspects
ORDER BY ville ASC, nom DESC;</pre>
<p>Sans ORDER BY, l'ordre des lignes n'est <b>jamais garanti</b>, même s'il a l'air stable.</p>`,
  task:`Affiche <code>prenom</code>, <code>nom</code>, <code>age</code>, triés par âge <b>décroissant</b>, puis par nom <b>croissant</b>.`,
  solution:`SELECT prenom, nom, age FROM suspects ORDER BY age DESC, nom ASC, prenom ASC;`,
  hints:["ORDER BY age DESC, ...","ORDER BY age DESC, nom ASC"],
  check:{ordered:true, orderKeys:[2,1], strictCols:true}
});
mis({ id:'1.7', ch:1, title:'Le top 5',
  story:`« Les cinq suspects les plus âgés, c'est tout ce que je veux voir. À âge égal, départage par numéro <code>id</code>. »`,
  lesson:`<p><code>LIMIT n</code> ne garde que les <i>n</i> premières lignes du résultat (après le tri). Combiné à ORDER BY, il donne un « top N ».</p>
<pre class="code">SELECT nom, pointure
FROM suspects
ORDER BY pointure DESC
LIMIT 3;</pre>
<p><code>LIMIT 10 OFFSET 20</code> saute les 20 premières lignes : c'est la base de la <b>pagination</b>. Sans critère de départage, un top N avec des ex aequo peut changer d'une exécution à l'autre.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>age</code> des <b>5</b> suspects les plus âgés (âge décroissant, puis <code>id</code> croissant).`,
  solution:`SELECT id, prenom, nom, age FROM suspects ORDER BY age DESC, id ASC LIMIT 5;`,
  hints:["ORDER BY age DESC, id ASC","Ajoute LIMIT 5 à la fin."],
  check:{ordered:true, strictCols:true}
});

/* ============ CHAPITRE 2 ============ */
chap({ id:2, code:'02', title:'Le premier braqueur', subtitle:'WHERE, AND, OR, priorités, comparaisons',
  intro:`<p>Les caméras de l'agence étaient coupées, mais trois témoins ont vu un homme sortir par l'issue de secours. La commissaire Varga te transmet leurs dépositions, une à une.</p>
<p class="quote">« 500 suspects. Chaque indice doit en éliminer. À la fin, il doit en rester un seul. » (Inès Varga)</p>`,
  oracle:`<p>Identique en Oracle. Attention, dans les supports Oracle Academy les valeurs sont souvent en anglais et sensibles à la casse : <code>'Yes'</code> n'est pas <code>'yes'</code>. En SQLite comme en Oracle, la comparaison de texte avec <code>=</code> est sensible à la casse.</p>`,
  quiz:[
    {q:"<code>WHERE a = 1 OR b = 2 AND c = 3</code> est évalué comme :", o:["(a = 1 OR b = 2) AND c = 3","a = 1 OR (b = 2 AND c = 3)","Une erreur de syntaxe","Au hasard"], a:1, e:"AND est prioritaire sur OR, comme la multiplication sur l'addition. Mets toujours des parenthèses pour lever le doute."},
    {q:"<code>age BETWEEN 50 AND 59</code> inclut-il 50 et 59 ?", o:["Oui, les deux bornes","Non, aucune","Seulement 50","Seulement 59"], a:0, e:"BETWEEN est inclusif : c'est l'équivalent de age >= 50 AND age <= 59."},
    {q:"Quel opérateur signifie « différent de » en SQL standard ?", o:["!==","<>","=!","NOT ="], a:1, e:"Le standard est <>. La plupart des moteurs acceptent aussi !=."}
  ]});
mis({ id:'2.1', ch:2, title:'Indice n°1',
  story:`Premier témoin, le vigile : <i>« C'était un homme, j'en suis sûr. »</i>`,
  lesson:`<p>La clause <code>WHERE</code> <b>filtre les lignes</b> : seules celles pour lesquelles la condition est vraie sont gardées. C'est la <b>sélection</b>.</p>
<pre class="code">SELECT prenom, nom
FROM suspects
WHERE ville = 'Lille';</pre>
<p>Dans la table, le sexe est codé <code>'H'</code> ou <code>'F'</code>. Les valeurs texte se mettent entre apostrophes, les nombres non.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code> des suspects <b>hommes</b>.`,
  solution:`SELECT id, prenom, nom FROM suspects WHERE sexe = 'H';`,
  hints:["La colonne s'appelle sexe.","WHERE sexe = 'H'"], check:{strictCols:true}
});
mis({ id:'2.2', ch:2, title:'Indice n°2',
  story:`Deuxième témoin, une cliente : <i>« Il avait une cicatrice sur la joue. »</i>`,
  lesson:`<p><code>AND</code> combine deux conditions : la ligne doit vérifier <b>les deux</b>.</p>
<pre class="code">SELECT prenom, nom
FROM suspects
WHERE sexe = 'F' AND lunettes = 'Oui';</pre>
<p>Chaque AND supplémentaire ne peut que réduire (ou garder) le nombre de lignes.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code> des hommes <b>qui ont des cicatrices</b> (<code>cicatrices = 'Oui'</code>).`,
  solution:`SELECT id, prenom, nom FROM suspects WHERE sexe = 'H' AND cicatrices = 'Oui';`,
  hints:["Deux conditions reliées par AND.","WHERE sexe = 'H' AND cicatrices = 'Oui'"], check:{strictCols:true}
});
mis({ id:'2.3', ch:2, title:'Indice n°3, le piège des priorités',
  story:`Troisième témoin : <i>« Cheveux sombres. Noirs ou bruns, il faisait nuit. »</i> Byte sourit : « Attention, c'est ici que la moitié des stagiaires se plantent. »`,
  lesson:`<p><code>OR</code> garde la ligne si <b>au moins une</b> condition est vraie. Mais <b>AND est prioritaire sur OR</b>. Cette requête est fausse :</p>
<pre class="code">WHERE sexe = 'H' AND cicatrices = 'Oui' AND cheveux = 'Noirs' OR cheveux = 'Bruns'</pre>
<p>Elle se lit « (homme ET cicatrice ET noirs) OU bruns » : elle ramène toutes les personnes brunes, femmes comprises. Il faut des <b>parenthèses</b> :</p>
<pre class="code">WHERE sexe = 'H' AND cicatrices = 'Oui'
  AND (cheveux = 'Noirs' OR cheveux = 'Bruns')</pre>
<p>Ordre de priorité : comparaisons, puis <code>NOT</code>, puis <code>AND</code>, puis <code>OR</code>.</p>`,
  task:`Ajoute l'indice n°3 : hommes, avec cicatrices, aux cheveux <code>'Noirs'</code> <b>ou</b> <code>'Bruns'</code>. Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>cheveux</code>. Essaie d'abord sans parenthèses pour voir le piège.`,
  solution:`SELECT id, prenom, nom, cheveux FROM suspects WHERE sexe = 'H' AND cicatrices = 'Oui' AND (cheveux = 'Noirs' OR cheveux = 'Bruns');`,
  hints:["Utilise OR entre les deux couleurs.","Entoure le OR de parenthèses : (cheveux = 'Noirs' OR cheveux = 'Bruns')"], check:{strictCols:true}
});
mis({ id:'2.4', ch:2, title:'Indice n°4',
  story:`La police scientifique a relevé une empreinte de chaussure dans la poussière du coffre : <b>pointure 44 ou plus</b>.`,
  lesson:`<p>Les opérateurs de comparaison : <code>=</code>, <code>&lt;&gt;</code> (ou <code>!=</code>), <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>.</p>
<pre class="code">SELECT nom, age
FROM suspects
WHERE age &lt; 25;</pre>
<p>Sur du texte, <code>&lt;</code> et <code>&gt;</code> comparent caractère par caractère selon leur code : <code>'B' &lt; 'C'</code>, mais aussi <code>'Z' &lt; 'a'</code> et <code>'z' &lt; 'é'</code>.</p>`,
  task:`Reprends la requête précédente et ajoute : <code>pointure</code> supérieure ou égale à 44. Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>pointure</code>.`,
  solution:`SELECT id, prenom, nom, pointure FROM suspects WHERE sexe = 'H' AND cicatrices = 'Oui' AND (cheveux = 'Noirs' OR cheveux = 'Bruns') AND pointure >= 44;`,
  hints:["Ajoute AND pointure >= 44","Garde bien les parenthèses autour du OR."], check:{strictCols:true}
});
mis({ id:'2.5', ch:2, title:'Indice n°5',
  story:`Le vigile revient : <i>« Il avait la cinquantaine. Entre 50 et 59 ans, je dirais. »</i>`,
  lesson:`<p><code>BETWEEN a AND b</code> teste un intervalle <b>bornes incluses</b>. C'est un raccourci pour <code>x &gt;= a AND x &lt;= b</code>.</p>
<pre class="code">SELECT nom, pointure
FROM suspects
WHERE pointure BETWEEN 38 AND 40;</pre>
<p>Il marche aussi sur les dates et les textes. <code>NOT BETWEEN</code> fait l'inverse.</p>`,
  task:`Ajoute la condition sur l'âge (de 50 à 59 ans) avec <code>BETWEEN</code>. Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>age</code>, <code>lunettes</code>.`,
  solution:`SELECT id, prenom, nom, age, lunettes FROM suspects WHERE sexe = 'H' AND cicatrices = 'Oui' AND (cheveux = 'Noirs' OR cheveux = 'Bruns') AND pointure >= 44 AND age BETWEEN 50 AND 59;`,
  hints:["age BETWEEN 50 AND 59"],
  require:[{re:'BETWEEN', msg:"Utilise BETWEEN pour cette mission."}], check:{strictCols:true}
});
mis({ id:'2.6', ch:2, title:'Démasqué',
  story:`Dernier détail, sur l'image floue d'une caméra de rue : le fuyard <b>portait des lunettes</b>. Il ne doit en rester qu'un.`,
  lesson:`<p>Tu as construit la requête pas à pas : c'est la bonne méthode. Une requête complexe se vérifie <b>condition par condition</b>, en regardant combien de lignes chaque ajout élimine.</p>
<p>Astuce de lisibilité : une condition par ligne.</p>
<pre class="code">SELECT ...
FROM suspects
WHERE condition_1
  AND condition_2
  AND (condition_3 OR condition_4);</pre>`,
  task:`Ajoute <code>lunettes = 'Oui'</code>. Affiche toutes les colonnes (<code>*</code>) du seul suspect restant.`,
  solution:`SELECT * FROM suspects WHERE sexe = 'H' AND cicatrices = 'Oui' AND (cheveux = 'Noirs' OR cheveux = 'Bruns') AND pointure >= 44 AND age BETWEEN 50 AND 59 AND lunettes = 'Oui';`,
  hints:["Ajoute AND lunettes = 'Oui' à la requête précédente.","SELECT * pour toutes les colonnes."],
  success:`<b>Marc Vasseur</b>, 54 ans, de Courbevoie. Varga lance le mandat. « Beau travail. Mais il n'était pas seul : quelqu'un conduisait. »`
});

/* ============ CHAPITRE 3 ============ */
chap({ id:3, code:'03', title:'La conductrice', subtitle:'IN, LIKE, IS NULL, NOT',
  intro:`<p>Un riverain a vu une voiture noire démarrer en trombe à 23h52. Au volant, une femme. Il n'a retenu que des bribes.</p>
<p class="quote">« Des bribes, c'est parfait. Le SQL adore les jokers. » (Byte)</p>`,
  oracle:`<p>Identique en Oracle. Un point important : en Oracle, <b>la chaîne vide <code>''</code> est traitée comme NULL</b>, ce qui n'est pas le cas en SQLite, PostgreSQL ou MySQL. En Oracle, <code>LIKE</code> est sensible à la casse ; en SQLite il ne l'est pas pour les lettres ASCII.</p>`,
  quiz:[
    {q:"Comment trouver les suspects sans téléphone renseigné ?", o:["WHERE telephone = NULL","WHERE telephone IS NULL","WHERE telephone = ''","WHERE NOT telephone"], a:1, e:"NULL signifie « inconnu » : toute comparaison avec = renvoie inconnu, donc jamais vrai. Il faut IS NULL."},
    {q:"Que trouve <code>LIKE '_a%'</code> ?", o:["Les textes qui contiennent « a »","Les textes dont la 2e lettre est « a »","Les textes qui finissent par « a »","Les textes de 2 lettres"], a:1, e:"_ remplace exactement un caractère, % remplace n'importe quelle suite (même vide)."},
    {q:"<code>cheveux NOT IN ('Noirs','Bruns')</code> renvoie-t-il les suspects dont <code>cheveux</code> est NULL ?", o:["Oui","Non"], a:1, e:"NULL NOT IN (...) vaut inconnu, la ligne est écartée. Les NULL ne sont jamais « différents » de quoi que ce soit."}
  ]});
mis({ id:'3.1', ch:3, title:'Une liste de valeurs',
  story:`<i>« Une grande femme. Rousse, ou alors blonde vénitienne, sous les lampadaires c'est dur à dire. »</i>`,
  lesson:`<p><code>IN (...)</code> teste l'appartenance à une liste. C'est plus lisible qu'une série de OR :</p>
<pre class="code">SELECT nom, ville
FROM suspects
WHERE ville IN ('Lille', 'Marseille');
-- équivalent à : ville = 'Lille' OR ville = 'Marseille'</pre>
<p>Les deux tirets <code>--</code> commencent un <b>commentaire</b> : le moteur ignore la fin de la ligne.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>cheveux</code> des <b>femmes</b> de taille <code>'Grande'</code> aux cheveux <code>'Roux'</code> ou <code>'Blonds'</code>, en utilisant <code>IN</code>.`,
  solution:`SELECT id, prenom, nom, cheveux FROM suspects WHERE sexe = 'F' AND taille = 'Grande' AND cheveux IN ('Roux', 'Blonds');`,
  hints:["cheveux IN ('Roux', 'Blonds')","Trois conditions reliées par AND."],
  require:[{re:'\\bIN\\s*\\(', msg:"Utilise l'opérateur IN."}], check:{strictCols:true}
});
mis({ id:'3.2', ch:3, title:'Un nom qui commence par...',
  story:`<i>« Elle avait des tatouages sur l'avant-bras. Et son complice l'a appelée en criant un nom de famille... Le-quelque chose. »</i>`,
  lesson:`<p><code>LIKE</code> compare un texte à un <b>motif</b> avec deux jokers :</p>
<ul><li><code>%</code> : n'importe quelle suite de caractères (même vide)</li><li><code>_</code> : exactement un caractère</li></ul>
<pre class="code">WHERE nom LIKE 'Ma%'     -- commence par Ma
WHERE nom LIKE '%ard'    -- finit par ard
WHERE nom LIKE '%on%'    -- contient on
WHERE prenom LIKE '_a%'  -- 2e lettre = a</pre>`,
  task:`Ajoute : <code>tatouages = 'Oui'</code> et un nom qui <b>commence par</b> « Le ». Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>telephone</code>.`,
  solution:`SELECT id, prenom, nom, telephone FROM suspects WHERE sexe = 'F' AND taille = 'Grande' AND cheveux IN ('Roux', 'Blonds') AND tatouages = 'Oui' AND nom LIKE 'Le%';`,
  hints:["nom LIKE 'Le%'"],
  require:[{re:'LIKE', msg:"Utilise LIKE pour le nom."}], check:{strictCols:true}
});
mis({ id:'3.3', ch:3, title:'La valeur inconnue',
  story:`Byte : « Deux candidates. Mais une conductrice de braquage n'a pas de téléphone déclaré. Elle utilise un jetable. »`,
  lesson:`<p><code>NULL</code> représente une valeur <b>absente ou inconnue</b>. Ce n'est ni 0 ni un texte vide. Toute comparaison avec NULL (<code>= NULL</code>, <code>&lt;&gt; NULL</code>) donne <i>inconnu</i>, donc la ligne n'est jamais retenue.</p>
<pre class="code">-- FAUX : ne renvoie jamais rien
WHERE telephone = NULL
-- JUSTE
WHERE telephone IS NULL
WHERE telephone IS NOT NULL</pre>
<p>C'est la logique à trois valeurs du SQL : vrai, faux, inconnu.</p>`,
  task:`Ajoute la condition « téléphone non renseigné ». Affiche toutes les colonnes de la suspecte restante.`,
  solution:`SELECT * FROM suspects WHERE sexe = 'F' AND taille = 'Grande' AND cheveux IN ('Roux', 'Blonds') AND tatouages = 'Oui' AND nom LIKE 'Le%' AND telephone IS NULL;`,
  hints:["telephone IS NULL","Pas = NULL !"],
  require:[{re:'IS\\s+NULL', msg:"Teste l'absence de valeur avec IS NULL."}],
  success:`<b>Karine Lefort</b>, 37 ans, Nanterre. Déjà condamnée pour vols de voitures. Tout concorde.`
});
mis({ id:'3.4', ch:3, title:'La négation',
  story:`« Par curiosité : lesquels de nos suspects ont une couleur de cheveux connue, mais <b>ni noire, ni brune, ni chauve</b> ? C'est pour calibrer les portraits-robots. »`,
  lesson:`<p><code>NOT</code> inverse une condition : <code>NOT IN</code>, <code>NOT LIKE</code>, <code>NOT BETWEEN</code>, <code>IS NOT NULL</code>.</p>
<pre class="code">WHERE ville NOT IN ('Paris', 'Lille')
WHERE nom NOT LIKE 'D%'</pre>
<p>Piège : <code>NOT IN</code> écarte aussi les lignes où la colonne est NULL. Ici c'est voulu, mais il vaut mieux l'écrire explicitement pour le relecteur.</p>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>cheveux</code> des suspects dont <code>cheveux</code> n'est pas NULL et n'est ni <code>'Noirs'</code>, ni <code>'Bruns'</code>, ni <code>'Chauve'</code>.`,
  solution:`SELECT id, prenom, nom, cheveux FROM suspects WHERE cheveux IS NOT NULL AND cheveux NOT IN ('Noirs', 'Bruns', 'Chauve');`,
  hints:["cheveux NOT IN ('Noirs', 'Bruns', 'Chauve')","Ajoute cheveux IS NOT NULL pour être explicite."], check:{strictCols:true}
});
mis({ id:'3.5', ch:3, title:'La plaque partielle',
  story:`Le riverain a noté une partie de la plaque : <b>G ? - 7 ? ? - K ?</b> Les points d'interrogation sont des caractères qu'il n'a pas vus.`,
  lesson:`<p>Le joker <code>_</code> vaut <b>exactement un caractère</b>. Une plaque française a le format <code>AA-123-AA</code> :</p>
<pre class="code">WHERE immatriculation LIKE 'A_-___-B_'</pre>
<p>Nouvelle table : <code>vehicules</code> (immatriculation, suspect_id, marque, couleur, annee). La colonne <code>suspect_id</code> désigne le propriétaire.</p>`,
  task:`Affiche toutes les colonnes des véhicules dont la plaque correspond au motif <code>G?-7??-K?</code>.`,
  solution:`SELECT * FROM vehicules WHERE immatriculation LIKE 'G_-7__-K_';`,
  hints:["Remplace chaque ? par _","LIKE 'G_-7__-K_'"],
  success:`Une Audi noire, <b>GH-713-KZ</b>, propriétaire n°388 : Karine Lefort. Le duo est identifié.`
});

/* ============ CHAPITRE 4 ============ */
chap({ id:4, code:'04', title:'Les traces', subtitle:'Fonctions texte, nombres, dates, CASE, COALESCE',
  intro:`<p>Varga veut un dossier propre pour la juge : avis de recherche, casiers datés, chronologie de la nuit. Il va falloir transformer les données.</p>`,
  oracle:`<p>Les fonctions varient beaucoup d'un moteur à l'autre. Équivalences SQLite / Oracle :</p>
<table class="mini"><tr><th>SQLite</th><th>Oracle</th></tr>
<tr><td>SUBSTR, UPPER, LOWER, LENGTH, REPLACE, TRIM, ROUND</td><td>identiques</td></tr>
<tr><td>IFNULL(x, y) ou COALESCE</td><td>NVL(x, y) ou COALESCE</td></tr>
<tr><td>date('now')</td><td>TRUNC(SYSDATE) (SYSDATE et CURRENT_DATE contiennent aussi l'heure)</td></tr>
<tr><td>strftime('%Y', d)</td><td>TO_CHAR(d, 'YYYY') ou EXTRACT(YEAR FROM d)</td></tr>
<tr><td>julianday(b) - julianday(a)</td><td>b - a (différence de DATE en jours)</td></tr>
<tr><td>dates stockées en texte ISO</td><td>type DATE natif, TO_DATE('13-11-2026','DD-MM-YYYY')</td></tr></table>`,
  quiz:[
    {q:"Que renvoie <code>COALESCE(NULL, NULL, 'x', 'y')</code> ?", o:["NULL","'x'","'y'","Une erreur"], a:1, e:"COALESCE renvoie le premier argument non NULL."},
    {q:"Pourquoi stocker les dates au format <code>AAAA-MM-JJ</code> en texte ?", o:["C'est plus joli","L'ordre alphabétique est alors aussi l'ordre chronologique","C'est obligatoire","Pour gagner de la place"], a:1, e:"Le format ISO 8601 se trie et se compare correctement comme du texte. Avec JJ/MM/AAAA, '02/01' passerait avant '15/12' de l'année précédente."},
    {q:"Dans <code>CASE WHEN x &lt; 10 THEN 'A' WHEN x &lt; 100 THEN 'B' ELSE 'C' END</code>, que vaut le résultat pour x = 5 ?", o:["'A'","'B'","'A' et 'B'","'C'"], a:0, e:"Les WHEN sont testés dans l'ordre : le premier vrai l'emporte."}
  ]});
mis({ id:'4.1', ch:4, title:"L'avis de recherche",
  story:`« Format officiel des avis : NOM en majuscules, virgule, prénom. Pour nos deux fugitifs, les n°217 et 388. »`,
  lesson:`<p>Fonctions de texte courantes :</p>
<pre class="code">UPPER('Marc')          -- 'MARC'
LOWER('MARC')          -- 'marc'
-- attention : en SQLite, seules les lettres sans accent changent
UPPER('Hélène')        -- 'HéLèNE'
LENGTH('Vasseur')      -- 7
SUBSTR('Vasseur', 1, 3) -- 'Vas' (début, longueur)
REPLACE('a-b-c', '-', '') -- 'abc'
TRIM('  x  ')          -- 'x'</pre>
<p>Les fonctions s'imbriquent et se combinent avec <code>||</code>.</p>`,
  task:`Pour les suspects d'<code>id</code> 217 et 388, affiche une colonne <code>avis</code> au format <code>VASSEUR, Marc</code>, puis la colonne <code>ville</code>.`,
  solution:`SELECT UPPER(nom) || ', ' || prenom AS avis, ville FROM suspects WHERE id IN (217, 388);`,
  hints:["UPPER(nom) || ', ' || prenom","WHERE id IN (217, 388)"],
  check:{strictCols:true}
});
mis({ id:'4.2', ch:4, title:'Plaques brutes',
  story:`« Le fichier national des cartes grises veut les plaques sans tirets, et la longueur pour contrôle. Véhicules de nos deux suspects. »`,
  lesson:`<p><code>REPLACE(texte, cherche, remplace)</code> remplace toutes les occurrences. <code>LENGTH</code> compte les caractères.</p>
<pre class="code">SELECT REPLACE(telephone, '06', '+336')
FROM suspects;</pre>
<p>Attention : ici REPLACE remplacerait aussi un « 06 » au milieu du numéro. Pour ne toucher que le début : <code>'+33' || SUBSTR(telephone, 2)</code>.</p>`,
  task:`Pour les véhicules dont <code>suspect_id</code> est 217 ou 388, affiche <code>immatriculation</code>, <code>plaque_brute</code> (sans tirets) et <code>longueur</code> (longueur de la plaque brute).`,
  solution:`SELECT immatriculation, REPLACE(immatriculation, '-', '') AS plaque_brute, LENGTH(REPLACE(immatriculation, '-', '')) AS longueur FROM vehicules WHERE suspect_id IN (217, 388);`,
  hints:["REPLACE(immatriculation, '-', '')","LENGTH(REPLACE(...))"],
  check:{strictCols:true}
});
mis({ id:'4.3', ch:4, title:'Le casier daté',
  story:`« Le casier de Vasseur : pour chaque délit, l'année et la durée de la peine en jours. »`,
  lesson:`<p>Table <code>delits</code> : id, suspect_id, type, date_faits, ville, prison, comportement, debut_peine, fin_peine, prejudice. Les dates sont du texte au format ISO <code>AAAA-MM-JJ</code>.</p>
<pre class="code">strftime('%Y', '2026-11-13')   -- '2026'
strftime('%m', '2026-11-13')   -- '11'
date('2026-11-13', '+7 days')  -- '2026-11-20'
julianday('2026-11-20') - julianday('2026-11-13')  -- 7.0</pre>
<p><code>julianday</code> convertit une date en nombre de jours : la soustraction donne un écart.</p>`,
  task:`Pour le suspect 217, affiche <code>type</code>, <code>date_faits</code>, <code>annee</code> (année des faits) et <code>jours</code> (fin_peine moins debut_peine, en jours), triés par date des faits.`,
  solution:`SELECT type, date_faits, strftime('%Y', date_faits) AS annee, julianday(fin_peine) - julianday(debut_peine) AS jours FROM delits WHERE suspect_id = 217 ORDER BY date_faits;`,
  hints:["strftime('%Y', date_faits)","julianday(fin_peine) - julianday(debut_peine)"],
  check:{ordered:true, strictCols:true}
});
mis({ id:'4.4', ch:4, title:'La nuit du 13',
  story:`Les caméras de lecture de plaques (table <code>cameras</code>) enregistrent chaque passage. « Qu'est-ce qui est passé sur l'Esplanade La Défense entre 23h00 et 0h30 ? »`,
  lesson:`<p>Les horodatages sont au format <code>AAAA-MM-JJ HH:MM:SS</code>. Comme ils sont triables en texte, on peut les filtrer avec BETWEEN :</p>
<pre class="code">WHERE horodatage BETWEEN '2026-11-13 08:00:00'
                     AND '2026-11-13 12:00:00'</pre>
<p>Pour ne garder qu'un jour : <code>WHERE date(horodatage) = '2026-11-13'</code> ou <code>WHERE horodatage LIKE '2026-11-13%'</code>.</p>`,
  task:`Affiche <code>horodatage</code> et <code>immatriculation</code> des passages au lieu <code>'Esplanade La Défense'</code> entre <code>2026-11-13 23:00:00</code> et <code>2026-11-14 00:30:00</code>, par ordre chronologique.`,
  solution:`SELECT horodatage, immatriculation FROM cameras WHERE lieu = 'Esplanade La Défense' AND ${NIGHT} ORDER BY horodatage;`,
  hints:["Deux conditions : le lieu et l'intervalle de temps.","horodatage BETWEEN '2026-11-13 23:00:00' AND '2026-11-14 00:30:00'"],
  check:{ordered:true}
});
mis({ id:'4.5', ch:4, title:'Classer la gravité',
  story:`« La juge veut une gravité lisible plutôt que des montants : <b>Mineur</b> sous 1 000 €, <b>Moyen</b> sous 20 000 €, <b>Majeur</b> au-delà, et <b>Inconnu</b> si le préjudice n'est pas chiffré. »`,
  lesson:`<p><code>CASE</code> est le « si... alors... sinon » du SQL :</p>
<pre class="code">SELECT nom,
  CASE
    WHEN age &lt; 25 THEN 'Jeune'
    WHEN age &lt; 60 THEN 'Adulte'
    ELSE 'Senior'
  END AS tranche
FROM suspects;</pre>
<p>Les WHEN sont évalués dans l'ordre. Sans ELSE, le résultat vaut NULL quand aucun WHEN n'est vrai. Pour tester NULL : <code>WHEN prejudice IS NULL THEN ...</code></p>`,
  task:`Pour les délits des suspects 217 et 388, affiche <code>id</code>, <code>type</code>, <code>prejudice</code> et <code>gravite</code> selon la règle ci-dessus.`,
  solution:`SELECT id, type, prejudice, CASE WHEN prejudice IS NULL THEN 'Inconnu' WHEN prejudice < 1000 THEN 'Mineur' WHEN prejudice < 20000 THEN 'Moyen' ELSE 'Majeur' END AS gravite FROM delits WHERE suspect_id IN (217, 388);`,
  hints:["Commence par WHEN prejudice IS NULL THEN 'Inconnu'","CASE WHEN ... THEN ... WHEN ... THEN ... ELSE 'Majeur' END AS gravite"],
  require:[{re:'CASE', msg:"Utilise une expression CASE."}],
  check:{strictCols:true}
});
mis({ id:'4.6', ch:4, title:'Remplacer les trous',
  story:`« Liste d'appel pour Nanterre. Quand le téléphone est inconnu, écris <i>non renseigné</i> plutôt qu'une case vide. »`,
  lesson:`<p><code>COALESCE(a, b, c...)</code> renvoie le premier argument <b>non NULL</b>. C'est la façon standard de remplacer un NULL par une valeur par défaut. SQLite propose aussi <code>IFNULL(a, b)</code>, Oracle <code>NVL(a, b)</code>.</p>
<pre class="code">SELECT nom, COALESCE(cheveux, 'inconnu') AS cheveux
FROM suspects;</pre>
<p><code>ROUND(x, n)</code> arrondit à n décimales, <code>ABS(x)</code> donne la valeur absolue, <code>CAST(x AS INTEGER)</code> convertit un type.</p>`,
  task:`Pour les suspects de la ville <code>'Nanterre'</code>, affiche <code>prenom</code>, <code>nom</code> et <code>tel</code> (le téléphone, ou <code>'non renseigné'</code> s'il est NULL).`,
  solution:`SELECT prenom, nom, COALESCE(telephone, 'non renseigné') AS tel FROM suspects WHERE ville = 'Nanterre';`,
  hints:["COALESCE(telephone, 'non renseigné')"],
  check:{strictCols:true}
});

/* ============ CHAPITRE 5 ============ */
chap({ id:5, code:'05', title:'La brèche', subtitle:'COUNT, SUM, AVG, GROUP BY, HAVING',
  intro:`<p>Pendant que le coffre était vidé, quelqu'un s'est connecté au système d'information d'Hélios. Le directeur SI, Farid Ouali, te transmet le journal d'authentification : la table <code>connexions</code> (login, ip, horodatage, succes, pays). Près de 3 000 lignes.</p>
<p class="quote">« On ne lit pas 3 000 lignes. On les résume. » (Byte)</p>`,
  oracle:`<p>Identique en Oracle. Une différence : Oracle refuse toute colonne du SELECT qui n'est ni agrégée ni dans le GROUP BY (erreur ORA-00979). SQLite est plus permissif et renvoie une valeur arbitraire : prends l'habitude de la règle stricte, elle est valable partout. Oracle (avant 23ai) refuse aussi un alias dans GROUP BY : répète l'expression, par exemple <code>GROUP BY ip, TO_CHAR(horodatage, 'YYYY-MM-DD HH24')</code>.</p>`,
  quiz:[
    {q:"Différence entre <code>COUNT(*)</code> et <code>COUNT(telephone)</code> ?", o:["Aucune","COUNT(telephone) ignore les NULL","COUNT(*) ignore les NULL","COUNT(telephone) compte les valeurs distinctes"], a:1, e:"COUNT(colonne) ne compte que les valeurs non NULL. COUNT(*) compte les lignes."},
    {q:"Où filtrer sur le résultat d'un agrégat (ex : plus de 10 échecs) ?", o:["Dans WHERE","Dans HAVING","Dans ORDER BY","Dans SELECT"], a:1, e:"WHERE filtre les lignes avant le regroupement, HAVING filtre les groupes après."},
    {q:"Ordre logique d'exécution :", o:["SELECT, FROM, WHERE, GROUP BY, HAVING","FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY","FROM, GROUP BY, WHERE, SELECT, HAVING","WHERE, FROM, SELECT, GROUP BY"], a:1, e:"FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. En SQL standard et en Oracle, un alias du SELECT n'existe donc pas encore dans WHERE ni dans GROUP BY (Oracle l'accepte dans GROUP BY seulement depuis 23ai). SQLite est permissif et le tolère : ne compte pas dessus."}
  ]});
mis({ id:'5.1', ch:5, title:'Compter les échecs',
  story:`« Première question : combien de tentatives de connexion ont <b>échoué</b> dans tout le journal ? » (<code>succes = 0</code>)`,
  lesson:`<p>Les <b>fonctions d'agrégation</b> résument plusieurs lignes en une seule valeur : <code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, <code>MAX</code>.</p>
<pre class="code">SELECT COUNT(*) AS nb_suspects
FROM suspects
WHERE ville = 'Lille';</pre>
<p>Le WHERE s'applique <b>avant</b> le calcul : on compte seulement les lignes retenues.</p>`,
  task:`Affiche le nombre de connexions échouées, dans une colonne nommée <code>echecs</code>.`,
  solution:`SELECT COUNT(*) AS echecs FROM connexions WHERE succes = 0;`,
  hints:["COUNT(*) avec WHERE succes = 0"]
});
mis({ id:'5.2', ch:5, title:'COUNT et les NULL',
  story:`« Petite vérification de qualité de données sur la table des suspects. »`,
  lesson:`<p>Trois façons de compter :</p>
<pre class="code">COUNT(*)              -- nombre de lignes
COUNT(cheveux)        -- lignes où cheveux n'est pas NULL
COUNT(DISTINCT ville) -- nombre de valeurs différentes</pre>
<p>Plusieurs agrégats peuvent cohabiter dans le même SELECT.</p>`,
  task:`En une seule ligne, affiche : <code>total</code> (nombre de suspects), <code>avec_tel</code> (nombre de téléphones renseignés) et <code>villes</code> (nombre de villes différentes).`,
  solution:`SELECT COUNT(*) AS total, COUNT(telephone) AS avec_tel, COUNT(DISTINCT ville) AS villes FROM suspects;`,
  hints:["COUNT(telephone) ignore les NULL.","COUNT(DISTINCT ville)"],
  check:{strictCols:true}
});
mis({ id:'5.3', ch:5, title:'Le préjudice',
  story:`« Le procureur demande des ordres de grandeur sur l'ensemble des délits fichés. »`,
  lesson:`<pre class="code">SELECT MIN(age), MAX(age), AVG(age), SUM(age)
FROM suspects;</pre>
<p><code>AVG</code> et <code>SUM</code> <b>ignorent les NULL</b> : la moyenne porte sur les valeurs connues seulement. <code>ROUND(AVG(x), 2)</code> arrondit le résultat.</p>`,
  task:`Affiche <code>mini</code>, <code>maxi</code> et <code>moyenne</code> (arrondie à 2 décimales) du <code>prejudice</code> de la table <code>delits</code>.`,
  solution:`SELECT MIN(prejudice) AS mini, MAX(prejudice) AS maxi, ROUND(AVG(prejudice), 2) AS moyenne FROM delits;`,
  hints:["ROUND(AVG(prejudice), 2)"],
  check:{strictCols:true}
});
mis({ id:'5.4', ch:5, title:'Regrouper par IP',
  story:`« D'où viennent les échecs ? Je veux le nombre d'échecs <b>par adresse IP</b>, les plus nombreux en premier. »`,
  lesson:`<p><code>GROUP BY</code> forme des groupes de lignes ayant la même valeur, puis calcule l'agrégat <b>pour chaque groupe</b> :</p>
<pre class="code">SELECT ville, COUNT(*) AS nb
FROM suspects
GROUP BY ville
ORDER BY nb DESC;</pre>
<p>Règle d'or : toute colonne du SELECT doit être soit dans le GROUP BY, soit dans un agrégat.</p>`,
  task:`Affiche <code>ip</code> et <code>echecs</code> (nombre de connexions échouées) pour chaque IP, triés par <code>echecs</code> décroissant.`,
  solution:`SELECT ip, COUNT(*) AS echecs FROM connexions WHERE succes = 0 GROUP BY ip ORDER BY echecs DESC;`,
  hints:["WHERE succes = 0 puis GROUP BY ip","ORDER BY echecs DESC"],
  check:{ordered:true, orderKeys:[1]}
});
mis({ id:'5.5', ch:5, title:'Filtrer les groupes',
  story:`« Ne garde que les IP qui ont échoué <b>au moins 10 fois</b>. Le bruit de fond ne m'intéresse pas. »`,
  lesson:`<p><code>WHERE</code> filtre les lignes <b>avant</b> le regroupement. <code>HAVING</code> filtre les groupes <b>après</b>, et peut donc utiliser un agrégat :</p>
<pre class="code">SELECT ville, COUNT(*) AS nb
FROM suspects
GROUP BY ville
HAVING COUNT(*) &gt; 30;</pre>
<p><code>WHERE COUNT(*) &gt; 30</code> provoque une erreur : au moment du WHERE, les groupes n'existent pas encore.</p>`,
  task:`Affiche <code>ip</code>, <code>echecs</code> et <code>pays</code> (MAX(pays) suffit) des IP ayant au moins 10 échecs, triées par échecs décroissants.`,
  solution:`SELECT ip, COUNT(*) AS echecs, MAX(pays) AS pays FROM connexions WHERE succes = 0 GROUP BY ip HAVING COUNT(*) >= 10 ORDER BY echecs DESC;`,
  hints:["HAVING COUNT(*) >= 10","MAX(pays) AS pays : chaque IP n'a qu'un pays ici."],
  require:[{re:'HAVING', msg:"Filtre les groupes avec HAVING."}],
  check:{ordered:true}
});
mis({ id:'5.6', ch:5, title:'Le compte compromis',
  story:`L'IP <code>203.0.113.66</code> (Pays-Bas) a tenté plus de 240 connexions en une heure. Classique attaque par force brute. « A-t-elle fini par réussir ? Sur quel compte ? »`,
  lesson:`<p>Une analyse d'incident procède souvent ainsi : <b>agréger</b> pour repérer l'anomalie, puis <b>zoomer</b> sur le détail avec un WHERE précis.</p>
<pre class="code">SELECT *
FROM connexions
WHERE ip = '...'
ORDER BY horodatage;</pre>`,
  task:`Affiche <code>login</code> et <code>horodatage</code> des connexions <b>réussies</b> depuis l'IP <code>203.0.113.66</code>.`,
  solution:`SELECT login, horodatage FROM connexions WHERE ip = '203.0.113.66' AND succes = 1;`,
  hints:["Deux conditions : ip et succes = 1."],
  success:`Le compte <b>j.ferrand</b>. Julien Ferrand, technicien sécurité de l'agence La Défense. Coïncidence ? Byte n'y croit pas.`
});
mis({ id:'5.7', ch:5, title:'Bilan par type',
  story:`« Pour le rapport annuel : nombre de délits et préjudice total <b>par type</b>, seulement les types dont le préjudice total dépasse 1 million d'euros. »`,
  lesson:`<p>On peut grouper, agréger, filtrer les groupes et trier dans la même requête. L'ordre d'écriture des clauses est imposé :</p>
<pre class="code">SELECT ...
FROM ...
WHERE ...
GROUP BY ...
HAVING ...
ORDER BY ...
LIMIT ...;</pre>`,
  task:`Affiche <code>type</code>, <code>nb</code> (nombre de délits) et <code>total</code> (somme du préjudice arrondie à 2 décimales), pour les types dont le total dépasse 1 000 000, triés par total décroissant.`,
  solution:`SELECT type, COUNT(*) AS nb, ROUND(SUM(prejudice), 2) AS total FROM delits GROUP BY type HAVING SUM(prejudice) > 1000000 ORDER BY total DESC;`,
  hints:["GROUP BY type HAVING SUM(prejudice) > 1000000","ROUND(SUM(prejudice), 2) AS total"],
  check:{ordered:true}
});

/* ============ CHAPITRE 6 ============ */
chap({ id:6, code:'06', title:'Les liens', subtitle:'INNER JOIN, LEFT JOIN, auto-jointure',
  intro:`<p>Vasseur, Lefort, Ferrand. Trois noms, trois tables différentes. Une base relationnelle n'a d'intérêt que si l'on sait <b>relier</b> ses tables : c'est le rôle des <b>jointures</b>.</p>
<p>Le lien se fait par des <b>clés</b> : <code>delits.suspect_id</code> fait référence à <code>suspects.id</code>. On parle de <b>clé étrangère</b> (FK) qui pointe vers une <b>clé primaire</b> (PK).</p>`,
  oracle:`<p>Les jointures ANSI (<code>JOIN ... ON</code>) sont identiques en Oracle. Les supports Oracle Academy présentent aussi :</p>
<ul><li><code>NATURAL JOIN</code> : jointure automatique sur les colonnes de même nom (pratique mais risqué)</li>
<li><code>JOIN ... USING (col)</code></li>
<li>l'ancienne syntaxe : <code>FROM a, b WHERE a.id = b.a_id</code> et <code>(+)</code> pour les jointures externes, à éviter dans du code neuf.</li></ul>
<p>Oracle supporte <code>FULL OUTER JOIN</code> ; SQLite aussi depuis la version 3.39.</p>`,
  quiz:[
    {q:"Un INNER JOIN entre suspects et delits renvoie :", o:["Tous les suspects","Seulement les suspects qui ont au moins un délit","Seulement les délits sans suspect","Le produit de toutes les lignes"], a:1, e:"L'INNER JOIN ne garde que les lignes qui ont une correspondance des deux côtés."},
    {q:"Pour trouver les suspects SANS aucun délit :", o:["INNER JOIN ... WHERE d.id IS NULL","LEFT JOIN delits d ... WHERE d.id IS NULL","RIGHT JOIN sans condition","CROSS JOIN"], a:1, e:"Le LEFT JOIN garde tous les suspects ; ceux sans correspondance ont des NULL côté delits. C'est l'anti-jointure."},
    {q:"Une auto-jointure, c'est :", o:["Une jointure générée automatiquement","Joindre une table avec elle-même grâce à deux alias","Une jointure sans ON","Une jointure sur la clé primaire"], a:1, e:"Exemple : employes e JOIN employes m ON m.id = e.manager_id, pour afficher chaque employé avec son manager."}
  ]});
mis({ id:'6.1', ch:6, title:'Le casier de Vasseur',
  story:`« Je veux le nom du suspect <b>et</b> ses délits sur la même ligne. »`,
  lesson:`<p><code>JOIN ... ON</code> associe chaque ligne d'une table aux lignes correspondantes d'une autre :</p>
<pre class="code">SELECT s.nom, d.type, d.date_faits
FROM suspects s
JOIN delits d ON d.suspect_id = s.id
WHERE s.ville = 'Lille';</pre>
<p><code>s</code> et <code>d</code> sont des <b>alias de table</b>. On préfixe les colonnes (<code>s.nom</code>) pour savoir d'où elles viennent, et c'est obligatoire si le nom existe dans les deux tables (<code>id</code>, <code>ville</code>...), sinon erreur « ambiguous column name ».</p>`,
  task:`Affiche <code>prenom</code>, <code>nom</code> (du suspect), <code>type</code> et <code>date_faits</code> de tous les délits du suspect d'id 217, par date.`,
  solution:`SELECT s.prenom, s.nom, d.type, d.date_faits FROM suspects s JOIN delits d ON d.suspect_id = s.id WHERE s.id = 217 ORDER BY d.date_faits;`,
  hints:["FROM suspects s JOIN delits d ON d.suspect_id = s.id","WHERE s.id = 217 ORDER BY d.date_faits"],
  require:[{re:'JOIN', msg:"Utilise une jointure JOIN."}],
  check:{ordered:true}
});
mis({ id:'6.2', ch:6, title:'Les récidivistes',
  story:`« Vasseur a 6 condamnations. Est-ce beaucoup ? Liste les suspects ayant <b>au moins 6</b> délits. »`,
  lesson:`<p>Jointure et agrégation se combinent : on joint d'abord, puis on regroupe.</p>
<pre class="code">SELECT s.id, s.nom, COUNT(*) AS nb
FROM suspects s
JOIN delits d ON d.suspect_id = s.id
GROUP BY s.id, s.nom
ORDER BY nb DESC;</pre>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code>, <code>nb</code> (nombre de délits) des suspects ayant au moins 6 délits, par <code>nb</code> décroissant.`,
  solution:`SELECT s.id, s.prenom, s.nom, COUNT(*) AS nb FROM suspects s JOIN delits d ON d.suspect_id = s.id GROUP BY s.id, s.prenom, s.nom HAVING COUNT(*) >= 6 ORDER BY nb DESC;`,
  hints:["GROUP BY s.id, s.prenom, s.nom","HAVING COUNT(*) >= 6"],
  check:{ordered:true, orderKeys:[3]}
});
mis({ id:'6.3', ch:6, title:'Les gangs',
  story:`« À quels gangs Vasseur appartient-il ? » Les appartenances sont dans <code>membres</code> (suspect_id, gang_id, role, depuis), les gangs dans <code>gangs</code>.`,
  lesson:`<p>Un suspect peut appartenir à plusieurs gangs, un gang a plusieurs membres : c'est une relation <b>plusieurs à plusieurs</b>. Elle passe par une <b>table d'association</b> (ici <code>membres</code>). Il faut donc <b>deux</b> jointures :</p>
<pre class="code">SELECT s.nom, g.nom AS gang
FROM suspects s
JOIN membres m ON m.suspect_id = s.id
JOIN gangs g   ON g.id = m.gang_id;</pre>`,
  task:`Affiche <code>gang</code> (nom du gang), <code>role</code> et <code>depuis</code> pour le suspect 217.`,
  solution:`SELECT g.nom AS gang, m.role, m.depuis FROM suspects s JOIN membres m ON m.suspect_id = s.id JOIN gangs g ON g.id = m.gang_id WHERE s.id = 217;`,
  hints:["Trois tables : suspects, membres, gangs.","JOIN gangs g ON g.id = m.gang_id"],
  success:`Les Corbeaux, depuis 2011, et <b>Le Cercle</b>, un gang très discret, rejoint en février 2025. Karine Lefort aussi en fait partie.`
});
mis({ id:'6.4', ch:6, title:'Qui conduisait ?',
  story:`« Relie les passages caméra de la nuit à leurs propriétaires. »`,
  lesson:`<p>On peut joindre sur n'importe quelle colonne commune, pas seulement un id : ici l'<code>immatriculation</code>.</p>
<pre class="code">FROM cameras c
JOIN vehicules v ON v.immatriculation = c.immatriculation
JOIN suspects s  ON s.id = v.suspect_id</pre>`,
  task:`Pour les passages à <code>'Esplanade La Défense'</code> entre 2026-11-13 23:00:00 et 2026-11-14 00:30:00, affiche <code>horodatage</code>, <code>immatriculation</code>, <code>prenom</code> et <code>nom</code> du propriétaire.`,
  solution:`SELECT c.horodatage, c.immatriculation, s.prenom, s.nom FROM cameras c JOIN vehicules v ON v.immatriculation = c.immatriculation JOIN suspects s ON s.id = v.suspect_id WHERE c.lieu = 'Esplanade La Défense' AND c.${NIGHT};`,
  hints:["Trois tables : cameras, vehicules, suspects.","Préfixe horodatage par c. dans le WHERE."]
});
mis({ id:'6.5', ch:6, title:'La plaque fantôme',
  story:`Byte fronce les sourcils : « Il y a 9 passages dans le journal, mais ta jointure n'en montre que 8. Il en manque un. »`,
  lesson:`<p>L'<code>INNER JOIN</code> élimine les lignes sans correspondance. Le <code>LEFT JOIN</code> garde <b>toutes</b> les lignes de la table de gauche et met des NULL quand il n'y a pas de correspondance à droite :</p>
<pre class="code">SELECT s.nom, d.type
FROM suspects s
LEFT JOIN delits d ON d.suspect_id = s.id;
-- les suspects sans délit apparaissent avec type = NULL</pre>
<p>Attention : une condition sur la table de droite placée dans le WHERE annule l'effet du LEFT JOIN. Mets-la dans le ON.</p>`,
  task:`Même période et même lieu : affiche <code>horodatage</code>, <code>immatriculation</code> et <code>suspect_id</code> (propriétaire) de <b>tous</b> les passages, y compris ceux dont la plaque est inconnue.`,
  solution:`SELECT c.horodatage, c.immatriculation, v.suspect_id FROM cameras c LEFT JOIN vehicules v ON v.immatriculation = c.immatriculation WHERE c.lieu = 'Esplanade La Défense' AND c.${NIGHT};`,
  hints:["LEFT JOIN vehicules v ON ...","La plaque XX-000-XX n'existe pas dans vehicules : elle doit apparaître avec NULL."],
  require:[{re:'LEFT\\s+(OUTER\\s+)?JOIN', msg:"Utilise un LEFT JOIN."}],
  success:`<b>XX-000-XX</b> : une fausse plaque, à 23h58. Un troisième véhicule était sur place.`
});
mis({ id:'6.6', ch:6, title:'Les casiers vierges',
  story:`« Le Cercle est trop propre. Quels membres du Cercle (gang n°2) n'ont <b>jamais</b> été condamnés ? »`,
  lesson:`<p>L'<b>anti-jointure</b> trouve les lignes qui n'ont <b>pas</b> de correspondance : LEFT JOIN, puis on garde celles où la table de droite est NULL.</p>
<pre class="code">SELECT s.nom
FROM suspects s
LEFT JOIN vehicules v ON v.suspect_id = s.id
WHERE v.immatriculation IS NULL;   -- suspects sans véhicule</pre>`,
  task:`Affiche <code>id</code>, <code>prenom</code>, <code>nom</code> et <code>role</code> des membres du gang 2 qui n'ont aucun délit.`,
  solution:`SELECT s.id, s.prenom, s.nom, m.role FROM membres m JOIN suspects s ON s.id = m.suspect_id LEFT JOIN delits d ON d.suspect_id = s.id WHERE m.gang_id = 2 AND d.id IS NULL;`,
  hints:["membres JOIN suspects, puis LEFT JOIN delits","WHERE m.gang_id = 2 AND d.id IS NULL"],
  success:`Parmi eux, <b>Solène Marchetti</b> : la cheffe du Cercle. Jamais condamnée. Varga note le nom.`
});
mis({ id:'6.7', ch:6, title:'Qui est le chef de qui ?',
  story:`« Ferrand travaille à l'agence 1. Je veux l'organigramme de l'agence : chaque employé avec le nom de son manager. »`,
  lesson:`<p>Dans <code>employes</code>, <code>manager_id</code> pointe vers... <code>employes.id</code>. Pour l'exploiter, on joint la table <b>avec elle-même</b>, avec deux alias :</p>
<pre class="code">SELECT e.nom AS employe, m.nom AS manager
FROM employes e
JOIN employes m ON m.id = e.manager_id;</pre>
<p>Avec un INNER JOIN, le président (sans manager, <code>manager_id</code> NULL) disparaît. Avec un LEFT JOIN, il reste.</p>`,
  task:`Pour les employés de l'agence 1 (<code>agence_id = 1</code>), affiche <code>prenom</code>, <code>nom</code>, <code>poste</code>, <code>manager</code> (prénom et nom du manager séparés par une espace).`,
  solution:`SELECT e.prenom, e.nom, e.poste, m.prenom || ' ' || m.nom AS manager FROM employes e LEFT JOIN employes m ON m.id = e.manager_id WHERE e.agence_id = 1;`,
  hints:["FROM employes e LEFT JOIN employes m ON m.id = e.manager_id","m.prenom || ' ' || m.nom AS manager"],
  require:[{re:'employes\\s+(AS\\s+)?\\w+[\\s\\S]*JOIN\\s+employes', msg:"Joins la table employes avec elle-même (deux alias)."}],
  check:{strictCols:true}
});
mis({ id:'6.8', ch:6, title:'Les appels de Vasseur',
  story:`Les fadettes sont arrivées : table <code>appels</code> (appelant, appele, horodatage, duree_s). Le numéro de Vasseur est le <code>0611223344</code>. « Un employé d'Hélios l'aurait-il appelé ? »`,
  lesson:`<p>Une jointure peut se faire sur une colonne qui n'est pas déclarée comme clé, ici le numéro de téléphone :</p>
<pre class="code">FROM appels a
JOIN employes e ON e.telephone = a.appelant</pre>
<p>Si la jointure ne renvoie rien, vérifie le sens (appelant ou appelé) et les formats (espaces, +33...).</p>`,
  task:`Affiche <code>horodatage</code>, <code>prenom</code>, <code>nom</code> de l'employé et <code>duree_s</code> pour les appels passés <b>par un employé</b> vers le numéro de Vasseur.`,
  solution:`SELECT a.horodatage, e.prenom, e.nom, a.duree_s FROM appels a JOIN employes e ON e.telephone = a.appelant WHERE a.appele = '0611223344';`,
  hints:["JOIN employes e ON e.telephone = a.appelant","WHERE a.appele = '0611223344'"],
  success:`Julien Ferrand a appelé Vasseur la veille, puis à <b>23h33</b>, deux minutes après avoir ouvert la salle des coffres. Le complice interne est identifié.`
});
