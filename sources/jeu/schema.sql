CREATE TABLE suspects (
  id INTEGER PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  sexe TEXT NOT NULL CHECK (sexe IN ('H','F')),
  age INTEGER NOT NULL,
  taille TEXT,
  cheveux TEXT,
  yeux TEXT,
  barbe TEXT,
  tatouages TEXT,
  lunettes TEXT,
  cicatrices TEXT,
  pointure INTEGER,
  ville TEXT,
  telephone TEXT
);
CREATE TABLE gangs (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  territoire TEXT,
  chef_id INTEGER REFERENCES suspects(id),
  fondation INTEGER
);
CREATE TABLE membres (
  suspect_id INTEGER NOT NULL REFERENCES suspects(id),
  gang_id INTEGER NOT NULL REFERENCES gangs(id),
  role TEXT,
  depuis TEXT,
  PRIMARY KEY (suspect_id, gang_id)
);
CREATE TABLE delits (
  id INTEGER PRIMARY KEY,
  suspect_id INTEGER NOT NULL REFERENCES suspects(id),
  type TEXT NOT NULL,
  date_faits TEXT NOT NULL,
  ville TEXT,
  prison TEXT,
  comportement TEXT,
  debut_peine TEXT,
  fin_peine TEXT,
  prejudice REAL
);
CREATE TABLE vehicules (
  immatriculation TEXT PRIMARY KEY,
  suspect_id INTEGER REFERENCES suspects(id),
  marque TEXT,
  couleur TEXT,
  annee INTEGER
);
CREATE TABLE cameras (
  id INTEGER PRIMARY KEY,
  lieu TEXT NOT NULL,
  horodatage TEXT NOT NULL,
  immatriculation TEXT
);
CREATE TABLE employes (
  id INTEGER PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  poste TEXT,
  agence_id INTEGER REFERENCES agences(id),
  manager_id INTEGER REFERENCES employes(id),
  salaire REAL,
  embauche TEXT,
  badge TEXT UNIQUE,
  telephone TEXT,
  login TEXT UNIQUE
);
CREATE TABLE agences (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL,
  ville TEXT,
  responsable_id INTEGER REFERENCES employes(id)
);
CREATE TABLE acces_badges (
  id INTEGER PRIMARY KEY,
  badge TEXT NOT NULL,
  employe_id INTEGER REFERENCES employes(id),
  agence_id INTEGER REFERENCES agences(id),
  porte TEXT NOT NULL,
  horodatage TEXT NOT NULL,
  resultat TEXT CHECK (resultat IN ('OK','REFUSE'))
);
CREATE TABLE connexions (
  id INTEGER PRIMARY KEY,
  login TEXT NOT NULL,
  ip TEXT NOT NULL,
  horodatage TEXT NOT NULL,
  succes INTEGER NOT NULL,
  pays TEXT
);
CREATE TABLE appels (
  id INTEGER PRIMARY KEY,
  appelant TEXT NOT NULL,
  appele TEXT NOT NULL,
  horodatage TEXT NOT NULL,
  duree_s INTEGER
);
CREATE TABLE comptes (
  numero TEXT PRIMARY KEY,
  titulaire_id INTEGER REFERENCES suspects(id),
  banque TEXT,
  ouverture TEXT
);
CREATE TABLE virements (
  id INTEGER PRIMARY KEY,
  compte_source TEXT NOT NULL REFERENCES comptes(numero),
  compte_dest TEXT NOT NULL REFERENCES comptes(numero),
  montant REAL NOT NULL,
  horodatage TEXT NOT NULL
);
CREATE TABLE utilisateurs_portail (
  id INTEGER PRIMARY KEY,
  login TEXT UNIQUE,
  hash_mdp TEXT,
  profil TEXT
);
