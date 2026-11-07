CREATE TABLE suspects (
  id BIGINT AUTO_INCREMENT NOT NULL,
  prenom VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  nom VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  sexe VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  age BIGINT NOT NULL,
  taille VARCHAR(32) COLLATE utf8mb4_bin,
  cheveux VARCHAR(32) COLLATE utf8mb4_bin,
  yeux VARCHAR(32) COLLATE utf8mb4_bin,
  barbe VARCHAR(32) COLLATE utf8mb4_bin,
  tatouages VARCHAR(32) COLLATE utf8mb4_bin,
  lunettes VARCHAR(32) COLLATE utf8mb4_bin,
  cicatrices VARCHAR(32) COLLATE utf8mb4_bin,
  pointure BIGINT,
  ville VARCHAR(40) COLLATE utf8mb4_bin,
  telephone VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE gangs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  nom VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  territoire VARCHAR(34) COLLATE utf8mb4_bin,
  chef_id BIGINT,
  fondation BIGINT,
  PRIMARY KEY (id),
  UNIQUE (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE membres (
  suspect_id BIGINT NOT NULL,
  gang_id BIGINT NOT NULL,
  role VARCHAR(32) COLLATE utf8mb4_bin,
  depuis DATE,
  PRIMARY KEY (suspect_id, gang_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE delits (
  id BIGINT AUTO_INCREMENT NOT NULL,
  suspect_id BIGINT NOT NULL,
  type VARCHAR(48) COLLATE utf8mb4_bin NOT NULL,
  date_faits DATE NOT NULL,
  ville VARCHAR(40) COLLATE utf8mb4_bin,
  prison VARCHAR(32) COLLATE utf8mb4_bin,
  comportement VARCHAR(32) COLLATE utf8mb4_bin,
  debut_peine DATE,
  fin_peine DATE,
  prejudice DOUBLE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE vehicules (
  immatriculation VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  suspect_id BIGINT,
  marque VARCHAR(32) COLLATE utf8mb4_bin,
  couleur VARCHAR(32) COLLATE utf8mb4_bin,
  annee BIGINT,
  PRIMARY KEY (immatriculation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE cameras (
  id BIGINT AUTO_INCREMENT NOT NULL,
  lieu VARCHAR(44) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  immatriculation VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE employes (
  id BIGINT AUTO_INCREMENT NOT NULL,
  prenom VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  nom VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  poste VARCHAR(50) COLLATE utf8mb4_bin,
  agence_id BIGINT,
  manager_id BIGINT,
  salaire DOUBLE,
  embauche DATE,
  badge VARCHAR(32) COLLATE utf8mb4_bin,
  telephone VARCHAR(32) COLLATE utf8mb4_bin,
  login VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id),
  UNIQUE (login),
  UNIQUE (badge)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE agences (
  id BIGINT AUTO_INCREMENT NOT NULL,
  nom VARCHAR(38) COLLATE utf8mb4_bin NOT NULL,
  ville VARCHAR(34) COLLATE utf8mb4_bin,
  responsable_id BIGINT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE acces_badges (
  id BIGINT AUTO_INCREMENT NOT NULL,
  badge VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  employe_id BIGINT,
  agence_id BIGINT,
  porte VARCHAR(34) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  resultat VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE connexions (
  id BIGINT AUTO_INCREMENT NOT NULL,
  login VARCHAR(120) COLLATE utf8mb4_bin NOT NULL,
  ip VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  succes BIGINT NOT NULL,
  pays VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE appels (
  id BIGINT AUTO_INCREMENT NOT NULL,
  appelant VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  appele VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  duree_s BIGINT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE comptes (
  numero VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  titulaire_id BIGINT,
  banque VARCHAR(32) COLLATE utf8mb4_bin,
  ouverture DATE,
  PRIMARY KEY (numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE virements (
  id BIGINT AUTO_INCREMENT NOT NULL,
  compte_source VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  compte_dest VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  montant DOUBLE NOT NULL,
  horodatage DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE utilisateurs_portail (
  id BIGINT AUTO_INCREMENT NOT NULL,
  login VARCHAR(32) COLLATE utf8mb4_bin,
  hash_mdp VARCHAR(32) COLLATE utf8mb4_bin,
  profil VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id),
  UNIQUE (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE incidents (
  id BIGINT AUTO_INCREMENT NOT NULL,
  ligne VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  station VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  type VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  debut DATETIME NOT NULL,
  fin DATETIME,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE saisies (
  id BIGINT AUTO_INCREMENT NOT NULL,
  appareil VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  contenu JSON NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE mouvements_port (
  id BIGINT AUTO_INCREMENT NOT NULL,
  conteneur VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  navire VARCHAR(32) COLLATE utf8mb4_bin,
  quai BIGINT,
  evenement VARCHAR(34) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE conteneurs (
  code VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  importateur_siren VARCHAR(32) COLLATE utf8mb4_bin,
  contenu_declare VARCHAR(42) COLLATE utf8mb4_bin,
  poids_kg BIGINT,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE societes (
  siren VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  nom VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  ville VARCHAR(32) COLLATE utf8mb4_bin,
  pays VARCHAR(32) COLLATE utf8mb4_bin,
  creation DATE,
  PRIMARY KEY (siren)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE participations (
  detenteur VARCHAR(48) COLLATE utf8mb4_bin NOT NULL,
  detenue VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  pct DOUBLE,
  PRIMARY KEY (detenteur, detenue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE trafic (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  poste VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  ip_src VARCHAR(32) COLLATE utf8mb4_bin,
  ip_dst VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  port BIGINT,
  octets BIGINT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE sessions_postes (
  id BIGINT AUTO_INCREMENT NOT NULL,
  poste VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  login VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  debut DATETIME NOT NULL,
  fin DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE wallets (
  adresse VARCHAR(34) COLLATE utf8mb4_bin NOT NULL,
  type VARCHAR(32) COLLATE utf8mb4_bin,
  plateforme VARCHAR(32) COLLATE utf8mb4_bin,
  kyc_nom VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (adresse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE tx_crypto (
  id BIGINT AUTO_INCREMENT NOT NULL,
  de VARCHAR(34) COLLATE utf8mb4_bin NOT NULL,
  vers VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  montant DOUBLE NOT NULL,
  horodatage DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE pieces (
  id BIGINT AUTO_INCREMENT NOT NULL,
  affaire VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  description VARCHAR(68) COLLATE utf8mb4_bin NOT NULL,
  ajoutee_le DATETIME,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE journal_brigade (
  id BIGINT AUTO_INCREMENT NOT NULL,
  login VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  action VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  table_cible VARCHAR(32) COLLATE utf8mb4_bin,
  ligne_id BIGINT,
  ancienne_valeur JSON,
  horodatage DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE consultants (
  login VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  nom_complet VARCHAR(56) COLLATE utf8mb4_bin NOT NULL,
  societe_siren VARCHAR(32) COLLATE utf8mb4_bin,
  mission VARCHAR(78) COLLATE utf8mb4_bin,
  PRIMARY KEY (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE compteurs_alertes (
  station VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  nb BIGINT DEFAULT 0 NOT NULL,
  PRIMARY KEY (station)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE temoignages_bruts (
  id BIGINT AUTO_INCREMENT NOT NULL,
  recu_le DATETIME,
  temoin VARCHAR(32) COLLATE utf8mb4_bin,
  telephone VARCHAR(32) COLLATE utf8mb4_bin,
  description VARCHAR(120) COLLATE utf8mb4_bin,
  plaque VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE cartes_grises (
  immatriculation VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  marque VARCHAR(32) COLLATE utf8mb4_bin,
  couleur VARCHAR(32) COLLATE utf8mb4_bin,
  titulaire VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (immatriculation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE dataset_vigie (
  id BIGINT AUTO_INCREMENT NOT NULL,
  quartier VARCHAR(48) COLLATE utf8mb4_bin NOT NULL,
  date DATE NOT NULL,
  creneau VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  jour_semaine BIGINT,
  meteo VARCHAR(32) COLLATE utf8mb4_bin,
  evenement BIGINT,
  incidents_7j BIGINT,
  label_risque BIGINT,
  reel BIGINT,
  split VARCHAR(32) COLLATE utf8mb4_bin,
  annote_par BIGINT,
  annote_le DATETIME,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE predictions_vigie (
  id BIGINT AUTO_INCREMENT NOT NULL,
  dataset_id BIGINT NOT NULL,
  modele VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  score DOUBLE NOT NULL,
  prediction BIGINT NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE annotateurs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  pseudo VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  inscrit_le DATETIME,
  pays VARCHAR(32) COLLATE utf8mb4_bin,
  compte_paiement VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE annotations (
  id BIGINT AUTO_INCREMENT NOT NULL,
  item_id BIGINT NOT NULL,
  annotateur_id BIGINT NOT NULL,
  label BIGINT NOT NULL,
  horodatage DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE paiements_annotation (
  id BIGINT AUTO_INCREMENT NOT NULL,
  compte_paiement VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  payeur_siren VARCHAR(32) COLLATE utf8mb4_bin,
  montant DOUBLE,
  date DATE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE patrouilles (
  id BIGINT AUTO_INCREMENT NOT NULL,
  date DATE NOT NULL,
  creneau VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  quartier VARCHAR(48) COLLATE utf8mb4_bin NOT NULL,
  nb_agents BIGINT NOT NULL,
  decide_par VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE voix_ref (
  locuteur VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  vecteur JSON NOT NULL,
  PRIMARY KEY (locuteur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE appels_vocaux (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  numero_appelant VARCHAR(32) COLLATE utf8mb4_bin,
  destinataire VARCHAR(46) COLLATE utf8mb4_bin,
  locuteur_declare VARCHAR(32) COLLATE utf8mb4_bin,
  duree_s BIGINT,
  vecteur JSON NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE echantillons_tts (
  id BIGINT AUTO_INCREMENT NOT NULL,
  fichier VARCHAR(42) COLLATE utf8mb4_bin,
  depose_par VARCHAR(32) COLLATE utf8mb4_bin,
  depose_le DATETIME,
  vecteur JSON NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE chatbot_sessions (
  session VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  debut DATETIME,
  ip VARCHAR(32) COLLATE utf8mb4_bin,
  appareil VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (session)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE chatbot_logs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  session VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  role VARCHAR(32) COLLATE utf8mb4_bin,
  message VARCHAR(352) COLLATE utf8mb4_bin NOT NULL,
  tokens BIGINT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE documents_rag (
  id BIGINT AUTO_INCREMENT NOT NULL,
  titre VARCHAR(64) COLLATE utf8mb4_bin NOT NULL,
  contenu VARCHAR(280) COLLATE utf8mb4_bin NOT NULL,
  confidentialite VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE appareils (
  appareil VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  proprietaire_login VARCHAR(32) COLLATE utf8mb4_bin,
  type VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (appareil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE employes_neurocite (
  login VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  nom VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  poste VARCHAR(44) COLLATE utf8mb4_bin,
  arrivee DATE,
  PRIMARY KEY (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE acces_datacenter (
  id BIGINT AUTO_INCREMENT NOT NULL,
  badge VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  site VARCHAR(42) COLLATE utf8mb4_bin NOT NULL,
  porte VARCHAR(34) COLLATE utf8mb4_bin,
  horodatage DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE inventaire_gpu (
  serveur VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  baie VARCHAR(32) COLLATE utf8mb4_bin,
  valeur_eur BIGINT,
  PRIMARY KEY (serveur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE scans_gpu (
  id BIGINT AUTO_INCREMENT NOT NULL,
  serveur VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  lieu VARCHAR(38) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE carnet_delorme (
  page BIGINT NOT NULL,
  ligne BIGINT NOT NULL,
  texte VARCHAR(118) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (page, ligne)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE sous_stations (
  nom VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  station VARCHAR(34) COLLATE utf8mb4_bin,
  contrat VARCHAR(32) COLLATE utf8mb4_bin,
  payeur_siren VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE releves_electriques (
  id BIGINT AUTO_INCREMENT NOT NULL,
  sous_station VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  kwh DOUBLE NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE minotaure_checkpoints (
  epoch BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  metriques JSON NOT NULL,
  PRIMARY KEY (epoch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE troncons (
  id BIGINT AUTO_INCREMENT NOT NULL,
  de VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  vers VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  minutes BIGINT NOT NULL,
  etat VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE antennes (
  antenne VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  station VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (antenne)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE abonnes (
  numero VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  titulaire VARCHAR(36) COLLATE utf8mb4_bin,
  type VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE bornages (
  id BIGINT AUTO_INCREMENT NOT NULL,
  numero VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  antenne VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE communications (
  id BIGINT AUTO_INCREMENT NOT NULL,
  appelant VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  appele VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  horodatage DATETIME NOT NULL,
  duree_s BIGINT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE file_minotaure (
  id BIGINT AUTO_INCREMENT NOT NULL,
  compte_source VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  compte_dest VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  montant DOUBLE NOT NULL,
  prevu_le DATETIME NOT NULL,
  statut VARCHAR(32) COLLATE utf8mb4_bin DEFAULT 'en_attente' NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE comptes_ad (
  login VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  nom VARCHAR(44) COLLATE utf8mb4_bin NOT NULL,
  service VARCHAR(36) COLLATE utf8mb4_bin,
  admin BIGINT DEFAULT 0 NOT NULL,
  actif BIGINT DEFAULT 1 NOT NULL,
  PRIMARY KEY (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE postes (
  hostname VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  ip VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  type VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  utilisateur VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (hostname),
  UNIQUE (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE auth_logs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  login VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  source_ip VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  dest_host VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  methode VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  resultat VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE mail_logs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  expediteur VARCHAR(72) COLLATE utf8mb4_bin NOT NULL,
  destinataire VARCHAR(34) COLLATE utf8mb4_bin NOT NULL,
  sujet VARCHAR(78) COLLATE utf8mb4_bin,
  piece_jointe VARCHAR(34) COLLATE utf8mb4_bin,
  verdict VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE clics (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  login VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  url VARCHAR(90) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE process_logs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  host VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  pid BIGINT NOT NULL,
  ppid BIGINT,
  process VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  ligne_commande VARCHAR(194) COLLATE utf8mb4_bin,
  login VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE proxy_logs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  host VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  domaine VARCHAR(40) COLLATE utf8mb4_bin NOT NULL,
  ip_dest VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  octets_out BIGINT,
  octets_in BIGINT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE domaines_connus (
  domaine VARCHAR(38) COLLATE utf8mb4_bin NOT NULL,
  categorie VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (domaine)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE dns_logs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  host VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  requete VARCHAR(122) COLLATE utf8mb4_bin NOT NULL,
  domaine VARCHAR(38) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE capteurs (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  site VARCHAR(44) COLLATE utf8mb4_bin NOT NULL,
  valeur DOUBLE NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE commandes_ot (
  id BIGINT AUTO_INCREMENT NOT NULL,
  horodatage DATETIME NOT NULL,
  site VARCHAR(44) COLLATE utf8mb4_bin NOT NULL,
  parametre VARCHAR(34) COLLATE utf8mb4_bin NOT NULL,
  ancienne DOUBLE,
  nouvelle DOUBLE,
  login VARCHAR(32) COLLATE utf8mb4_bin,
  source_ip VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE deplacements (
  id BIGINT AUTO_INCREMENT NOT NULL,
  login VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  lieu VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  debut DATETIME NOT NULL,
  fin DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE lignes_internet (
  ip VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  abonne_siren VARCHAR(32) COLLATE utf8mb4_bin,
  adresse VARCHAR(86) COLLATE utf8mb4_bin,
  station VARCHAR(32) COLLATE utf8mb4_bin,
  PRIMARY KEY (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
