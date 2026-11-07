// Grande finale : scène et tableau
CAST.ricci = { nom:'Paul Ricci', role:'Armateur, Calanques Fret' };
Object.assign(SCENES, {
 41:[['narr',"Station Dédale, 21 mars 2028, 4h00. L'heure prévue passe. Rien ne se passe. Seul le ventilateur d'un serveur éteint finit de tourner."],
     ['ricci',"Vous savez combien de temps il a fallu pour réunir ces données ? Trois affaires, deux ans. Il avait tout prévu."],
     ['haddad',"Sauf qu'il y a des tables qu'il ne contrôlait pas. L'électricité, les antennes, les tunnels inondés."],
     ['narr',"Fleury-Mérogis, 6h. Dans la cellule de Farid Ouali, les surveillants trouvent un téléphone prépayé et un plan du métro couvert d'annotations."],
     ['ouali',"Vous avez trouvé le centre. Personne n'avait jamais trouvé le centre."],
     ['varga',"Vous avez dessiné un labyrinthe, Farid. Nous, on a juste écrit des requêtes."],
     ['narr',"Préfecture de police, 9h. La préfète remet à la Brigade Data la médaille de la sécurité intérieure. Byte la met dans sa poche de sweat, à côté de sa clé USB."],
     ['byte',"Hélios, TransSeine, VIGIE, l'Hydre. Quatre affaires, des centaines de tables, une seule langue."],
     ['varga',"Et une nouvelle recrue qui la parle mieux que nous tous. Bienvenue dans la légende, inspecteur."],
     ['narr',"FIN. Merci d'avoir mené l'enquête jusqu'au bout."]]
});
BOARD.push(
 {id:'dedale', img:null, t:'Station Dédale', s:'Le centre du labyrinthe', unlock:'41.3', facts:['Station fantôme fermée depuis 1939','Sous-station : de 2 à plus de 40 kWh','En marche depuis le 11 mars','Payée par Labyrinthe Énergie']},
 {id:'minotaure', img:null, t:'MINOTAURE', s:'L\'IA du Cartographe', unlock:'41.4', facts:['Entraînée sur les 6 serveurs GPU volés','Nourrie des données volées par l\'Hydre','Cible : exactitude 0,99 le 21 mars à 4h','Virements de moins de 1 000 € vers des mules']},
 {id:'ricci', img:'ricci', t:'Paul Ricci', s:'Le complice', unlock:'41.10', facts:['49 % de Calanques Fret (Marseille)','10 % d\'Ariane Labs','Relié à la cellule d\'Ouali en deux appels','Arrêté à Dédale le 21 mars à 3h52']}
);
