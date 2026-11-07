CREATE TABLE suspects (
  id BIGINT IDENTITY(1,1) NOT NULL,
  prenom NVARCHAR(32) NOT NULL,
  nom NVARCHAR(32) NOT NULL,
  sexe NVARCHAR(32) NOT NULL,
  age BIGINT NOT NULL,
  taille NVARCHAR(32),
  cheveux NVARCHAR(32),
  yeux NVARCHAR(32),
  barbe NVARCHAR(32),
  tatouages NVARCHAR(32),
  lunettes NVARCHAR(32),
  cicatrices NVARCHAR(32),
  pointure BIGINT,
  ville NVARCHAR(40),
  telephone NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE gangs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  nom NVARCHAR(32) NOT NULL,
  territoire NVARCHAR(34),
  chef_id BIGINT,
  fondation BIGINT,
  PRIMARY KEY (id),
  UNIQUE (nom)
);

CREATE TABLE membres (
  suspect_id BIGINT NOT NULL,
  gang_id BIGINT NOT NULL,
  role NVARCHAR(32),
  depuis DATE,
  PRIMARY KEY (suspect_id, gang_id)
);

CREATE TABLE delits (
  id BIGINT IDENTITY(1,1) NOT NULL,
  suspect_id BIGINT NOT NULL,
  type NVARCHAR(48) NOT NULL,
  date_faits DATE NOT NULL,
  ville NVARCHAR(40),
  prison NVARCHAR(32),
  comportement NVARCHAR(32),
  debut_peine DATE,
  fin_peine DATE,
  prejudice FLOAT,
  PRIMARY KEY (id)
);

CREATE TABLE vehicules (
  immatriculation NVARCHAR(32) NOT NULL,
  suspect_id BIGINT,
  marque NVARCHAR(32),
  couleur NVARCHAR(32),
  annee BIGINT,
  PRIMARY KEY (immatriculation)
);

CREATE TABLE cameras (
  id BIGINT IDENTITY(1,1) NOT NULL,
  lieu NVARCHAR(44) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  immatriculation NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE employes (
  id BIGINT IDENTITY(1,1) NOT NULL,
  prenom NVARCHAR(32) NOT NULL,
  nom NVARCHAR(32) NOT NULL,
  poste NVARCHAR(50),
  agence_id BIGINT,
  manager_id BIGINT,
  salaire FLOAT,
  embauche DATE,
  badge NVARCHAR(32),
  telephone NVARCHAR(32),
  login NVARCHAR(32),
  PRIMARY KEY (id),
  UNIQUE (login),
  UNIQUE (badge)
);

CREATE TABLE agences (
  id BIGINT IDENTITY(1,1) NOT NULL,
  nom NVARCHAR(38) NOT NULL,
  ville NVARCHAR(34),
  responsable_id BIGINT,
  PRIMARY KEY (id)
);

CREATE TABLE acces_badges (
  id BIGINT IDENTITY(1,1) NOT NULL,
  badge NVARCHAR(32) NOT NULL,
  employe_id BIGINT,
  agence_id BIGINT,
  porte NVARCHAR(34) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  resultat NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE connexions (
  id BIGINT IDENTITY(1,1) NOT NULL,
  login NVARCHAR(120) NOT NULL,
  ip NVARCHAR(32) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  succes BIGINT NOT NULL,
  pays NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE appels (
  id BIGINT IDENTITY(1,1) NOT NULL,
  appelant NVARCHAR(32) NOT NULL,
  appele NVARCHAR(32) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  duree_s BIGINT,
  PRIMARY KEY (id)
);

CREATE TABLE comptes (
  numero NVARCHAR(32) NOT NULL,
  titulaire_id BIGINT,
  banque NVARCHAR(32),
  ouverture DATE,
  PRIMARY KEY (numero)
);

CREATE TABLE virements (
  id BIGINT IDENTITY(1,1) NOT NULL,
  compte_source NVARCHAR(32) NOT NULL,
  compte_dest NVARCHAR(32) NOT NULL,
  montant FLOAT NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE utilisateurs_portail (
  id BIGINT IDENTITY(1,1) NOT NULL,
  login NVARCHAR(32),
  hash_mdp NVARCHAR(32),
  profil NVARCHAR(32),
  PRIMARY KEY (id),
  UNIQUE (login)
);

CREATE TABLE incidents (
  id BIGINT IDENTITY(1,1) NOT NULL,
  ligne NVARCHAR(32) NOT NULL,
  station NVARCHAR(36) NOT NULL,
  type NVARCHAR(32) NOT NULL,
  debut DATETIME2(0) NOT NULL,
  fin DATETIME2(0),
  PRIMARY KEY (id)
);

CREATE TABLE saisies (
  id BIGINT IDENTITY(1,1) NOT NULL,
  appareil NVARCHAR(32) NOT NULL,
  contenu NVARCHAR(MAX) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE mouvements_port (
  id BIGINT IDENTITY(1,1) NOT NULL,
  conteneur NVARCHAR(32) NOT NULL,
  navire NVARCHAR(32),
  quai BIGINT,
  evenement NVARCHAR(34) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE conteneurs (
  code NVARCHAR(32) NOT NULL,
  importateur_siren NVARCHAR(32),
  contenu_declare NVARCHAR(42),
  poids_kg BIGINT,
  PRIMARY KEY (code)
);

CREATE TABLE societes (
  siren NVARCHAR(32) NOT NULL,
  nom NVARCHAR(36) NOT NULL,
  ville NVARCHAR(32),
  pays NVARCHAR(32),
  creation DATE,
  PRIMARY KEY (siren)
);

CREATE TABLE participations (
  detenteur NVARCHAR(48) NOT NULL,
  detenue NVARCHAR(32) NOT NULL,
  pct FLOAT,
  PRIMARY KEY (detenteur, detenue)
);

CREATE TABLE trafic (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  poste NVARCHAR(32) NOT NULL,
  ip_src NVARCHAR(32),
  ip_dst NVARCHAR(32) NOT NULL,
  port BIGINT,
  octets BIGINT,
  PRIMARY KEY (id)
);

CREATE TABLE sessions_postes (
  id BIGINT IDENTITY(1,1) NOT NULL,
  poste NVARCHAR(32) NOT NULL,
  login NVARCHAR(32) NOT NULL,
  debut DATETIME2(0) NOT NULL,
  fin DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE wallets (
  adresse NVARCHAR(34) NOT NULL,
  type NVARCHAR(32),
  plateforme NVARCHAR(32),
  kyc_nom NVARCHAR(32),
  PRIMARY KEY (adresse)
);

CREATE TABLE tx_crypto (
  id BIGINT IDENTITY(1,1) NOT NULL,
  de NVARCHAR(34) NOT NULL,
  vers NVARCHAR(32) NOT NULL,
  montant FLOAT NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE pieces (
  id BIGINT IDENTITY(1,1) NOT NULL,
  affaire NVARCHAR(32) NOT NULL,
  description NVARCHAR(68) NOT NULL,
  ajoutee_le DATETIME2(0),
  PRIMARY KEY (id)
);

CREATE TABLE journal_brigade (
  id BIGINT IDENTITY(1,1) NOT NULL,
  login NVARCHAR(32) NOT NULL,
  action NVARCHAR(32) NOT NULL,
  table_cible NVARCHAR(32),
  ligne_id BIGINT,
  ancienne_valeur NVARCHAR(MAX),
  horodatage DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE consultants (
  login NVARCHAR(32) NOT NULL,
  nom_complet NVARCHAR(56) NOT NULL,
  societe_siren NVARCHAR(32),
  mission NVARCHAR(78),
  PRIMARY KEY (login)
);

CREATE TABLE compteurs_alertes (
  station NVARCHAR(32) NOT NULL,
  nb BIGINT DEFAULT 0 NOT NULL,
  PRIMARY KEY (station)
);

CREATE TABLE temoignages_bruts (
  id BIGINT IDENTITY(1,1) NOT NULL,
  recu_le DATETIME2(0),
  temoin NVARCHAR(32),
  telephone NVARCHAR(32),
  description NVARCHAR(120),
  plaque NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE cartes_grises (
  immatriculation NVARCHAR(32) NOT NULL,
  marque NVARCHAR(32),
  couleur NVARCHAR(32),
  titulaire NVARCHAR(32),
  PRIMARY KEY (immatriculation)
);

CREATE TABLE dataset_vigie (
  id BIGINT IDENTITY(1,1) NOT NULL,
  quartier NVARCHAR(48) NOT NULL,
  date DATE NOT NULL,
  creneau NVARCHAR(32) NOT NULL,
  jour_semaine BIGINT,
  meteo NVARCHAR(32),
  evenement BIGINT,
  incidents_7j BIGINT,
  label_risque BIGINT,
  reel BIGINT,
  split NVARCHAR(32),
  annote_par BIGINT,
  annote_le DATETIME2(0),
  PRIMARY KEY (id)
);

CREATE TABLE predictions_vigie (
  id BIGINT IDENTITY(1,1) NOT NULL,
  dataset_id BIGINT NOT NULL,
  modele NVARCHAR(32) NOT NULL,
  score FLOAT NOT NULL,
  prediction BIGINT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE annotateurs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  pseudo NVARCHAR(32) NOT NULL,
  inscrit_le DATETIME2(0),
  pays NVARCHAR(32),
  compte_paiement NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE annotations (
  id BIGINT IDENTITY(1,1) NOT NULL,
  item_id BIGINT NOT NULL,
  annotateur_id BIGINT NOT NULL,
  label BIGINT NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE paiements_annotation (
  id BIGINT IDENTITY(1,1) NOT NULL,
  compte_paiement NVARCHAR(32) NOT NULL,
  payeur_siren NVARCHAR(32),
  montant FLOAT,
  date DATE,
  PRIMARY KEY (id)
);

CREATE TABLE patrouilles (
  id BIGINT IDENTITY(1,1) NOT NULL,
  date DATE NOT NULL,
  creneau NVARCHAR(32) NOT NULL,
  quartier NVARCHAR(48) NOT NULL,
  nb_agents BIGINT NOT NULL,
  decide_par NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE voix_ref (
  locuteur NVARCHAR(32) NOT NULL,
  vecteur NVARCHAR(MAX) NOT NULL,
  PRIMARY KEY (locuteur)
);

CREATE TABLE appels_vocaux (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  numero_appelant NVARCHAR(32),
  destinataire NVARCHAR(46),
  locuteur_declare NVARCHAR(32),
  duree_s BIGINT,
  vecteur NVARCHAR(MAX) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE echantillons_tts (
  id BIGINT IDENTITY(1,1) NOT NULL,
  fichier NVARCHAR(42),
  depose_par NVARCHAR(32),
  depose_le DATETIME2(0),
  vecteur NVARCHAR(MAX) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE chatbot_sessions (
  session NVARCHAR(32) NOT NULL,
  debut DATETIME2(0),
  ip NVARCHAR(32),
  appareil NVARCHAR(32),
  PRIMARY KEY (session)
);

CREATE TABLE chatbot_logs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  session NVARCHAR(32) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  role NVARCHAR(32),
  message NVARCHAR(352) NOT NULL,
  tokens BIGINT,
  PRIMARY KEY (id)
);

CREATE TABLE documents_rag (
  id BIGINT IDENTITY(1,1) NOT NULL,
  titre NVARCHAR(64) NOT NULL,
  contenu NVARCHAR(280) NOT NULL,
  confidentialite NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE appareils (
  appareil NVARCHAR(32) NOT NULL,
  proprietaire_login NVARCHAR(32),
  type NVARCHAR(32),
  PRIMARY KEY (appareil)
);

CREATE TABLE employes_neurocite (
  login NVARCHAR(32) NOT NULL,
  nom NVARCHAR(32) NOT NULL,
  poste NVARCHAR(44),
  arrivee DATE,
  PRIMARY KEY (login)
);

CREATE TABLE acces_datacenter (
  id BIGINT IDENTITY(1,1) NOT NULL,
  badge NVARCHAR(32) NOT NULL,
  site NVARCHAR(42) NOT NULL,
  porte NVARCHAR(34),
  horodatage DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE inventaire_gpu (
  serveur NVARCHAR(32) NOT NULL,
  baie NVARCHAR(32),
  valeur_eur BIGINT,
  PRIMARY KEY (serveur)
);

CREATE TABLE scans_gpu (
  id BIGINT IDENTITY(1,1) NOT NULL,
  serveur NVARCHAR(32) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  lieu NVARCHAR(38),
  PRIMARY KEY (id)
);

CREATE TABLE carnet_delorme (
  page BIGINT NOT NULL,
  ligne BIGINT NOT NULL,
  texte NVARCHAR(118) NOT NULL,
  PRIMARY KEY (page, ligne)
);

CREATE TABLE sous_stations (
  nom NVARCHAR(32) NOT NULL,
  station NVARCHAR(34),
  contrat NVARCHAR(32),
  payeur_siren NVARCHAR(32),
  PRIMARY KEY (nom)
);

CREATE TABLE releves_electriques (
  id BIGINT IDENTITY(1,1) NOT NULL,
  sous_station NVARCHAR(32) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  kwh FLOAT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE minotaure_checkpoints (
  epoch BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  metriques NVARCHAR(MAX) NOT NULL,
  PRIMARY KEY (epoch)
);

CREATE TABLE troncons (
  id BIGINT IDENTITY(1,1) NOT NULL,
  de NVARCHAR(36) NOT NULL,
  vers NVARCHAR(36) NOT NULL,
  minutes BIGINT NOT NULL,
  etat NVARCHAR(32) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE antennes (
  antenne NVARCHAR(32) NOT NULL,
  station NVARCHAR(32),
  PRIMARY KEY (antenne)
);

CREATE TABLE abonnes (
  numero NVARCHAR(32) NOT NULL,
  titulaire NVARCHAR(36),
  type NVARCHAR(32),
  PRIMARY KEY (numero)
);

CREATE TABLE bornages (
  id BIGINT IDENTITY(1,1) NOT NULL,
  numero NVARCHAR(32) NOT NULL,
  antenne NVARCHAR(32) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE communications (
  id BIGINT IDENTITY(1,1) NOT NULL,
  appelant NVARCHAR(32) NOT NULL,
  appele NVARCHAR(32) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  duree_s BIGINT,
  PRIMARY KEY (id)
);

CREATE TABLE file_minotaure (
  id BIGINT IDENTITY(1,1) NOT NULL,
  compte_source NVARCHAR(32) NOT NULL,
  compte_dest NVARCHAR(32) NOT NULL,
  montant FLOAT NOT NULL,
  prevu_le DATETIME2(0) NOT NULL,
  statut NVARCHAR(32) DEFAULT 'en_attente' NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE comptes_ad (
  login NVARCHAR(32) NOT NULL,
  nom NVARCHAR(44) NOT NULL,
  service NVARCHAR(36),
  admin BIGINT DEFAULT 0 NOT NULL,
  actif BIGINT DEFAULT 1 NOT NULL,
  PRIMARY KEY (login)
);

CREATE TABLE postes (
  hostname NVARCHAR(32) NOT NULL,
  ip NVARCHAR(32) NOT NULL,
  type NVARCHAR(32) NOT NULL,
  utilisateur NVARCHAR(32),
  PRIMARY KEY (hostname),
  UNIQUE (ip)
);

CREATE TABLE auth_logs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  login NVARCHAR(32) NOT NULL,
  source_ip NVARCHAR(32) NOT NULL,
  dest_host NVARCHAR(32) NOT NULL,
  methode NVARCHAR(32) NOT NULL,
  resultat NVARCHAR(32) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE mail_logs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  expediteur NVARCHAR(72) NOT NULL,
  destinataire NVARCHAR(34) NOT NULL,
  sujet NVARCHAR(78),
  piece_jointe NVARCHAR(34),
  verdict NVARCHAR(32) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE clics (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  login NVARCHAR(32) NOT NULL,
  url NVARCHAR(90) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE process_logs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  host NVARCHAR(32) NOT NULL,
  pid BIGINT NOT NULL,
  ppid BIGINT,
  process NVARCHAR(32) NOT NULL,
  ligne_commande NVARCHAR(194),
  login NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE proxy_logs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  host NVARCHAR(32) NOT NULL,
  domaine NVARCHAR(40) NOT NULL,
  ip_dest NVARCHAR(32) NOT NULL,
  octets_out BIGINT,
  octets_in BIGINT,
  PRIMARY KEY (id)
);

CREATE TABLE domaines_connus (
  domaine NVARCHAR(38) NOT NULL,
  categorie NVARCHAR(32),
  PRIMARY KEY (domaine)
);

CREATE TABLE dns_logs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  host NVARCHAR(32) NOT NULL,
  requete NVARCHAR(122) NOT NULL,
  domaine NVARCHAR(38) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE capteurs (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  site NVARCHAR(44) NOT NULL,
  valeur FLOAT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE commandes_ot (
  id BIGINT IDENTITY(1,1) NOT NULL,
  horodatage DATETIME2(0) NOT NULL,
  site NVARCHAR(44) NOT NULL,
  parametre NVARCHAR(34) NOT NULL,
  ancienne FLOAT,
  nouvelle FLOAT,
  login NVARCHAR(32),
  source_ip NVARCHAR(32),
  PRIMARY KEY (id)
);

CREATE TABLE deplacements (
  id BIGINT IDENTITY(1,1) NOT NULL,
  login NVARCHAR(32) NOT NULL,
  lieu NVARCHAR(32) NOT NULL,
  debut DATETIME2(0) NOT NULL,
  fin DATETIME2(0) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE lignes_internet (
  ip NVARCHAR(32) NOT NULL,
  abonne_siren NVARCHAR(32),
  adresse NVARCHAR(86),
  station NVARCHAR(32),
  PRIMARY KEY (ip)
);

ALTER TABLE gangs ADD CONSTRAINT fk_gangs_0 FOREIGN KEY (chef_id) REFERENCES suspects (id);

ALTER TABLE membres ADD CONSTRAINT fk_membres_0 FOREIGN KEY (gang_id) REFERENCES gangs (id);

ALTER TABLE membres ADD CONSTRAINT fk_membres_1 FOREIGN KEY (suspect_id) REFERENCES suspects (id);

ALTER TABLE delits ADD CONSTRAINT fk_delits_0 FOREIGN KEY (suspect_id) REFERENCES suspects (id);

ALTER TABLE vehicules ADD CONSTRAINT fk_vehicules_0 FOREIGN KEY (suspect_id) REFERENCES suspects (id);

ALTER TABLE employes ADD CONSTRAINT fk_employes_0 FOREIGN KEY (manager_id) REFERENCES employes (id);

ALTER TABLE employes ADD CONSTRAINT fk_employes_1 FOREIGN KEY (agence_id) REFERENCES agences (id);

ALTER TABLE agences ADD CONSTRAINT fk_agences_0 FOREIGN KEY (responsable_id) REFERENCES employes (id);

ALTER TABLE acces_badges ADD CONSTRAINT fk_acces_badges_0 FOREIGN KEY (agence_id) REFERENCES agences (id);

ALTER TABLE acces_badges ADD CONSTRAINT fk_acces_badges_1 FOREIGN KEY (employe_id) REFERENCES employes (id);

ALTER TABLE comptes ADD CONSTRAINT fk_comptes_0 FOREIGN KEY (titulaire_id) REFERENCES suspects (id);

ALTER TABLE virements ADD CONSTRAINT fk_virements_0 FOREIGN KEY (compte_dest) REFERENCES comptes (numero);

ALTER TABLE virements ADD CONSTRAINT fk_virements_1 FOREIGN KEY (compte_source) REFERENCES comptes (numero);

ALTER TABLE participations ADD CONSTRAINT fk_participations_0 FOREIGN KEY (detenue) REFERENCES societes (siren);

ALTER TABLE predictions_vigie ADD CONSTRAINT fk_predictions_vigie_0 FOREIGN KEY (dataset_id) REFERENCES dataset_vigie (id);

ALTER TABLE annotations ADD CONSTRAINT fk_annotations_0 FOREIGN KEY (annotateur_id) REFERENCES annotateurs (id);

ALTER TABLE annotations ADD CONSTRAINT fk_annotations_1 FOREIGN KEY (item_id) REFERENCES dataset_vigie (id);

ALTER TABLE chatbot_logs ADD CONSTRAINT fk_chatbot_logs_0 FOREIGN KEY (session) REFERENCES chatbot_sessions (session);

ALTER TABLE releves_electriques ADD CONSTRAINT fk_releves_electriques_0 FOREIGN KEY (sous_station) REFERENCES sous_stations (nom);

ALTER TABLE bornages ADD CONSTRAINT fk_bornages_0 FOREIGN KEY (antenne) REFERENCES antennes (antenne);
