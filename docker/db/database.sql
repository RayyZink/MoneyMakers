-- ============================================================
-- MONEY_2026 - Script complet
-- Migration mono-utilisateur → multi-utilisateur
-- + Triggers de sécurité
-- ============================================================

CREATE DATABASE IF NOT EXISTS MONEY_2026;
USE MONEY_2026;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE Utilisateur
(
    idUtilisateur     INT AUTO_INCREMENT PRIMARY KEY,
    nomUtilisateur    VARCHAR(50)                           NOT NULL,
    prenomUtilisateur VARCHAR(50)                           NOT NULL,
    login             VARCHAR(50)                           NOT NULL,
    hashcode          VARCHAR(128)                          NULL,
    dateHeureCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    dateHeureMAJ      TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NULL,
    ville             VARCHAR(50)                           NULL,
    codePostal        CHAR(5)                               NULL,
    -- Unicité du login pour éviter les doublons
    CONSTRAINT Utilisateur_login_unique UNIQUE (login)
);

-- ------------------------------------------------------------
-- Categorie : rattachée à un utilisateur (NULL = système partagée)
-- ------------------------------------------------------------
CREATE TABLE Categorie
(
    idCategorie       INT AUTO_INCREMENT PRIMARY KEY,
    nomCategorie      VARCHAR(50)                           NOT NULL,
    idUtilisateur     INT                                   NULL    COMMENT 'NULL = catégorie système partagée, sinon appartient à cet utilisateur',
    dateHeureCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NULL,
    dateHeureMAJ      TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    CONSTRAINT Categorie_Utilisateur_fk
        FOREIGN KEY (idUtilisateur) REFERENCES Utilisateur (idUtilisateur)
            ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- SousCategorie : hérite du user via sa Categorie parente
-- ------------------------------------------------------------
CREATE TABLE SousCategorie
(
    idSousCategorie   INT AUTO_INCREMENT PRIMARY KEY,
    nomSousCategorie  VARCHAR(50)                           NOT NULL,
    idCategorie       INT                                   NOT NULL,
    dateHeureCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    dateHeureMAJ      TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    montant_base      INT       DEFAULT 10                  NULL,
    periode           CHAR      DEFAULT 'M'                 NOT NULL COMMENT 'M (mensuel) H (Hebdo) A (Aléatoire) Q (Quotidien)',
    CONSTRAINT SousCategorie_Categorie_fk
        FOREIGN KEY (idcategorie) REFERENCES Categorie (idCategorie)
            ON DELETE CASCADE
);

CREATE TABLE Compte
(
    idCompte              INT AUTO_INCREMENT PRIMARY KEY,
    descriptionCompte     VARCHAR(50)                                NOT NULL,
    nomBanque             VARCHAR(50)                                NOT NULL,
    idUtilisateur         INT                                        NOT NULL,
    dateHeureCreation     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    dateHeureMAJ          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP() NULL,
    montantInitial        DECIMAL(7, 2)  DEFAULT 0.00                NOT NULL,
    dernierMontantCalcule DECIMAL(10, 2) DEFAULT 0.00                NOT NULL,
    CONSTRAINT Compte_Utilisateur_fk
        FOREIGN KEY (idUtilisateur) REFERENCES Utilisateur (idUtilisateur)
            ON DELETE CASCADE
);

CREATE TABLE Tiers
(
    idTiers               INT AUTO_INCREMENT PRIMARY KEY,
    nomTiers              VARCHAR(50)                           NOT NULL,
    dateHeureCreation     TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    dateHeureMAJ          TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    idUtilisateur         INT                                   NOT NULL COMMENT 'Utilisateur propriétaire de ce tiers',
    idSousCategorieDefaut INT       DEFAULT NULL                NULL   COMMENT 'Sous-catégorie par défaut associée à ce tiers',
    CONSTRAINT Tiers_Utilisateur_fk
        FOREIGN KEY (idUtilisateur) REFERENCES Utilisateur (idUtilisateur),
    CONSTRAINT Tiers_SousCategorie_fk
        FOREIGN KEY (idSousCategorieDefaut) REFERENCES SousCategorie (idSousCategorie)
            ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Virement : tracé + flag inter-utilisateurs
-- ------------------------------------------------------------
CREATE TABLE Virement
(
    idVirement               INT AUTO_INCREMENT PRIMARY KEY,
    idCompteDebit            INT                                       NOT NULL,
    idCompteCredit           INT                                       NOT NULL,
    montant                  DECIMAL(10, 2) DEFAULT 0.00               NOT NULL,
    dateVirement             DATE          DEFAULT (CURDATE())          NOT NULL,
    dateHeureCreation        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    dateHeureMAJ             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    commentaire              VARCHAR(255)                              NULL,
    idUtilisateurInitiateur  INT                                       NOT NULL COMMENT 'Utilisateur connecté au moment de la création',
    virementInterUtilisateur TINYINT(1)    DEFAULT 0                   NOT NULL COMMENT '0 = même utilisateur, 1 = inter-utilisateurs',
    CONSTRAINT Virement_compteCrediteur_fk
        FOREIGN KEY (idCompteCredit) REFERENCES Compte (idCompte),
    CONSTRAINT Virement_compteDebiteur_fk
        FOREIGN KEY (idCompteDebit) REFERENCES Compte (idCompte),
    CONSTRAINT Virement_Utilisateur_fk
        FOREIGN KEY (idUtilisateurInitiateur) REFERENCES Utilisateur (idUtilisateur)
);

CREATE TABLE Mouvement
(
    idMouvement       INT AUTO_INCREMENT PRIMARY KEY,
    dateMouvement     DATE          DEFAULT (CURDATE())          NOT NULL,
    idCompte          INT                                        NOT NULL,
    idTiers           INT           DEFAULT NULL                 NULL,
    idCategorie       INT           DEFAULT NULL                 NULL,
    idSousCategorie   INT           DEFAULT NULL                 NULL,
    idVirement        INT                                        NULL,
    montant           DECIMAL(10, 2)                             NOT NULL DEFAULT 0.00,
    typeMouvement     CHAR(1)       DEFAULT 'D'                  NOT NULL COMMENT 'D = Débit, C = Crédit',
    CONSTRAINT chk_typeMouvement CHECK (typeMouvement IN ('D', 'C')),
    dateHeureCreation TIMESTAMP     DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    dateHeureMAJ      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    CONSTRAINT Mouvement_Categorie_fk
        FOREIGN KEY (idCategorie) REFERENCES Categorie (idCategorie),
    CONSTRAINT Mouvement_Compte_fk
        FOREIGN KEY (idCompte) REFERENCES Compte (idCompte)
            ON DELETE CASCADE,
    CONSTRAINT Mouvement_SousCategorie_fk
        FOREIGN KEY (idSousCategorie) REFERENCES SousCategorie (idSousCategorie)
            ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT Mouvement_Tiers_fk
        FOREIGN KEY (idTiers) REFERENCES Tiers (idTiers),
    CONSTRAINT Mouvement_Virement_fk
        FOREIGN KEY (idVirement) REFERENCES Virement (idVirement)
            ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================
-- VUES
-- ============================================================

CREATE VIEW V_CATEGORIE AS
SELECT c.idCategorie       AS idCategorie,
       c.nomCategorie      AS nomCategorie,
       c.idUtilisateur     AS idUtilisateurCategorie,
       sc.idSousCategorie  AS idSousCategorie,
       sc.nomSousCategorie AS nomSousCategorie
FROM Categorie c
         JOIN SousCategorie sc ON sc.idCategorie = c.idCategorie;
-- ORDER BY supprime : trier cote applicatif (ORDER BY dans vue non garanti)

-- V_MOUVEMENT expose idUtilisateur pour filtrage applicatif
-- Note : le JOIN sur Tiers est LEFT JOIN car idTiers peut être NULL
CREATE VIEW V_MOUVEMENT AS
SELECT m.idMouvement         AS idMouvement,
       m.idCompte            AS idCompte,
       m.dateMouvement       AS dateMouvement,
       c.idUtilisateur       AS idUtilisateur,
       c.descriptionCompte   AS descriptionCompte,
       c.nomBanque           AS nomBanque,
       m.idTiers             AS idTiers,
       t.nomTiers            AS nomTiers,
       ctg.idCategorie       AS idCategorie,
       ctg.nomCategorie      AS nomCategorie,
       sctg.nomSousCategorie AS nomSousCategorie,
       sctg.idSousCategorie  AS idSousCategorie,
       m.montant             AS montant,
       m.typeMouvement       AS typeMouvement,
       m.idVirement          AS idVirement
FROM Mouvement m
         JOIN  Compte       c    ON m.idCompte       = c.idCompte
         LEFT JOIN Tiers    t    ON m.idTiers         = t.idTiers
         LEFT JOIN Categorie ctg ON m.idCategorie     = ctg.idCategorie
         LEFT JOIN SousCategorie sctg ON m.idSousCategorie = sctg.idSousCategorie;
-- ORDER BY supprime : trier dans le repository (ORDER BY dans vue non garanti)

-- ============================================================
-- TRIGGERS DE SÉCURITÉ
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- trg_mouvement_before_insert
-- Vérifie sur tout INSERT dans Mouvement :
--   1. Catégorie accessible à l'utilisateur du compte
--   2. SousCategorie cohérente avec la Categorie
--   3. Tiers appartenant à l'utilisateur du compte
-- ------------------------------------------------------------
CREATE TRIGGER trg_mouvement_before_insert
    BEFORE INSERT ON Mouvement
    FOR EACH ROW
BEGIN
    DECLARE vIdUtilisateurCompte    INT;
    DECLARE vIdUtilisateurCategorie INT;
    DECLARE vIdUtilisateurTiers     INT;
    DECLARE vIdCategorieDeScat      INT;

    -- Propriétaire du compte ciblé
    SELECT idUtilisateur INTO vIdUtilisateurCompte
    FROM Compte WHERE idCompte = NEW.idCompte;

    -- Vérification Catégorie
    IF NEW.idCategorie IS NOT NULL THEN
    SELECT idUtilisateur INTO vIdUtilisateurCategorie
    FROM Categorie WHERE idCategorie = NEW.idCategorie;

    IF vIdUtilisateurCategorie IS NOT NULL
            AND vIdUtilisateurCategorie != vIdUtilisateurCompte THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Sécurité : la catégorie n\'appartient pas à l\'utilisateur du compte.';
END IF;
END IF;

    -- Vérification SousCategorie (cohérence avec Categorie)
    IF NEW.idSousCategorie IS NOT NULL THEN
SELECT idcategorie INTO vIdCategorieDeScat
FROM SousCategorie WHERE idSousCategorie = NEW.idSousCategorie;

IF NEW.idCategorie IS NULL OR vIdCategorieDeScat != NEW.idCategorie THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Sécurité : la sous-catégorie n''appartient pas à la catégorie indiquée.';
END IF;
END IF;

    -- Vérification Tiers
    IF NEW.idTiers IS NOT NULL THEN
SELECT idUtilisateur INTO vIdUtilisateurTiers
FROM Tiers WHERE idTiers = NEW.idTiers;

IF vIdUtilisateurTiers != vIdUtilisateurCompte THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Sécurité : le tiers n\'appartient pas à l\'utilisateur du compte.';
END IF;
END IF;
END$$

-- ------------------------------------------------------------
-- trg_mouvement_before_update
-- Mêmes vérifications sur UPDATE + blocage du changement de compte
-- vers un compte d'un autre utilisateur
-- ------------------------------------------------------------
CREATE TRIGGER trg_mouvement_before_update
    BEFORE UPDATE ON Mouvement
    FOR EACH ROW
BEGIN
    DECLARE vIdUtilisateurCompte        INT;
    DECLARE vIdUtilisateurAncienCompte  INT;
    DECLARE vIdUtilisateurCategorie     INT;
    DECLARE vIdUtilisateurTiers         INT;
    DECLARE vIdCategorieDeScat          INT;

    -- Propriétaire du nouveau compte ciblé
    SELECT idUtilisateur INTO vIdUtilisateurCompte
    FROM Compte WHERE idCompte = NEW.idCompte;

    -- Blocage du déplacement inter-utilisateurs d'un mouvement
    IF NEW.idCompte != OLD.idCompte THEN
    SELECT idUtilisateur INTO vIdUtilisateurAncienCompte
    FROM Compte WHERE idCompte = OLD.idCompte;

    IF vIdUtilisateurAncienCompte != vIdUtilisateurCompte THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Sécurité : impossible de déplacer un mouvement vers le compte d''un autre utilisateur.';
END IF;
END IF;

    -- Vérification Catégorie
    IF NEW.idCategorie IS NOT NULL THEN
SELECT idUtilisateur INTO vIdUtilisateurCategorie
FROM Categorie WHERE idCategorie = NEW.idCategorie;

IF vIdUtilisateurCategorie IS NOT NULL
            AND vIdUtilisateurCategorie != vIdUtilisateurCompte THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Sécurité : la catégorie n\'appartient pas à l\'utilisateur du compte.';
END IF;
END IF;

    -- Vérification SousCategorie
    IF NEW.idSousCategorie IS NOT NULL THEN
SELECT idcategorie INTO vIdCategorieDeScat
FROM SousCategorie WHERE idSousCategorie = NEW.idSousCategorie;

IF NEW.idCategorie IS NULL OR vIdCategorieDeScat != NEW.idCategorie THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Sécurité : la sous-catégorie n''appartient pas à la catégorie indiquée.';
END IF;
END IF;

    -- Vérification Tiers
    IF NEW.idTiers IS NOT NULL THEN
SELECT idUtilisateur INTO vIdUtilisateurTiers
FROM Tiers WHERE idTiers = NEW.idTiers;

IF vIdUtilisateurTiers != vIdUtilisateurCompte THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Sécurité : le tiers n\'appartient pas à l\'utilisateur du compte.';
END IF;
END IF;
END$$

DELIMITER ;

-- ============================================================
-- PROCÉDURES STOCKÉES
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- creerVirement : virement sécurisé avec création des 2 mouvements
-- Les triggers ci-dessus constituent un second filet de sécurité
-- sur les INSERT de Mouvement générés ici.
-- ------------------------------------------------------------
CREATE PROCEDURE creerVirement(
    IN pIdCompteDebit           INT,
    IN pIdCompteCredit          INT,
    IN pMontant                 DECIMAL(6, 2),
    IN pDateVirement            DATE,
    IN pCommentaire             VARCHAR(255),
    IN pIdUtilisateurInitiateur INT,
    IN pIdCategorie             INT,
    IN pIdSousCategorie         INT
)
BEGIN
    DECLARE vIdUtilisateurDebit     INT;
    DECLARE vIdUtilisateurCredit    INT;
    DECLARE vIdVirement             INT;
    DECLARE vInterUtilisateur       TINYINT(1) DEFAULT 0;
    DECLARE vIdUtilisateurCategorie INT;
    DECLARE vIdCategorieDeScat      INT;

    -- Propriétaires des comptes
SELECT idUtilisateur INTO vIdUtilisateurDebit  FROM Compte WHERE idCompte = pIdCompteDebit;
SELECT idUtilisateur INTO vIdUtilisateurCredit FROM Compte WHERE idCompte = pIdCompteCredit;

-- L'initiateur doit posséder le compte débiteur
IF vIdUtilisateurDebit != pIdUtilisateurInitiateur THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Accès refusé : le compte débiteur n''appartient pas à l''utilisateur initiateur.';
END IF;

    -- Détection virement inter-utilisateurs
    IF vIdUtilisateurDebit != vIdUtilisateurCredit THEN
        SET vInterUtilisateur = 1;
        -- Point d'extension : vérifier ici une table DemandeVirement avec statut 'ACCEPTE'
END IF;

    -- Vérification catégorie accessible à l'initiateur
    IF pIdCategorie IS NOT NULL THEN
SELECT idUtilisateur INTO vIdUtilisateurCategorie
FROM Categorie WHERE idCategorie = pIdCategorie;

IF vIdUtilisateurCategorie IS NOT NULL
            AND vIdUtilisateurCategorie != pIdUtilisateurInitiateur THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Accès refusé : la catégorie n''appartient pas à l''utilisateur initiateur.';
END IF;
END IF;

    -- Vérification cohérence sous-catégorie / catégorie
    IF pIdSousCategorie IS NOT NULL THEN
SELECT idcategorie INTO vIdCategorieDeScat
FROM SousCategorie WHERE idSousCategorie = pIdSousCategorie;

IF pIdCategorie IS NULL OR vIdCategorieDeScat != pIdCategorie THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Erreur : la sous-catégorie n''appartient pas à la catégorie indiquée.';
END IF;
END IF;

    -- Création du Virement
INSERT INTO Virement (idCompteDebit, idCompteCredit, montant, dateVirement,
                      commentaire, idUtilisateurInitiateur, virementInterUtilisateur)
VALUES (pIdCompteDebit, pIdCompteCredit, pMontant, pDateVirement,
        pCommentaire, pIdUtilisateurInitiateur, vInterUtilisateur);

SET vIdVirement = LAST_INSERT_ID();

    -- Mouvement DÉBIT (compte source)
INSERT INTO Mouvement (dateMouvement, idCompte, idCategorie, idSousCategorie,
                       idVirement, montant, typeMouvement)
VALUES (pDateVirement, pIdCompteDebit, pIdCategorie, pIdSousCategorie,
        vIdVirement, pMontant, 'D');

-- Mouvement CRÉDIT (compte destination)
INSERT INTO Mouvement (dateMouvement, idCompte, idCategorie, idSousCategorie,
                       idVirement, montant, typeMouvement)
VALUES (pDateVirement, pIdCompteCredit, pIdCategorie, pIdSousCategorie,
        vIdVirement, pMontant, 'C');
END$$

-- ------------------------------------------------------------
-- getCategories : catégories visibles par un utilisateur donné
-- (système partagées + ses propres)
-- ------------------------------------------------------------
CREATE PROCEDURE getCategories(IN pIdUtilisateur INT)
BEGIN
SELECT c.idCategorie,
       c.nomCategorie,
       sc.idSousCategorie,
       sc.nomSousCategorie
FROM Categorie c
         JOIN SousCategorie sc ON sc.idcategorie = c.idCategorie
WHERE c.idUtilisateur IS NULL
   OR c.idUtilisateur = pIdUtilisateur
ORDER BY c.idCategorie, sc.idSousCategorie;
END$$

-- ------------------------------------------------------------
-- maj_mouvements (inchangée fonctionnellement)
-- ------------------------------------------------------------
CREATE PROCEDURE maj_mouvements()
BEGIN
    DECLARE v_idMouvement INT DEFAULT 0;
    DECLARE v_montant     DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_delta       DECIMAL(6, 2)  DEFAULT 0;
    DECLARE v_done        INT DEFAULT 0;
    DECLARE cur_mvt CURSOR FOR
        -- AVERTISSEMENT : idCategorie=7 est herite du mono-utilisateur. Remplacer par un parametre.
SELECT idMouvement, montant FROM Mouvement WHERE typeMouvement = 'D' AND idCategorie = 7;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

OPEN cur_mvt;
mvt_loop: LOOP
        FETCH cur_mvt INTO v_idMouvement, v_montant;
        IF v_done = 1 THEN
            LEAVE mvt_loop;
END IF;
        SET v_delta = 10 * v_montant * (RAND() * 0.2) - 0.1;
        IF v_delta > 0 THEN
            SET v_delta = v_delta * -1;
END IF;
UPDATE Mouvement SET montant = v_delta WHERE idMouvement = v_idMouvement;
END LOOP;
CLOSE cur_mvt;
END$$

DELIMITER ;

-- ============================================================
-- FONCTION
-- ============================================================

DELIMITER $$

-- soldeHistorique : solde d'un compte à une date donnée
CREATE FUNCTION soldeHistorique(pIdCompte INT, pDate DATE)
    RETURNS DECIMAL(12, 2) DETERMINISTIC
BEGIN
    DECLARE vSolde DECIMAL(12, 2) DEFAULT 0;
    -- CORRECTIF : inclut montantInitial et respecte le signe D/C
SELECT COALESCE(c.montantInitial, 0) + COALESCE(SUM(
                                                        CASE WHEN m.typeMouvement = 'C' THEN  m.montant
                                                             WHEN m.typeMouvement = 'D' THEN -m.montant
                                                             ELSE 0 END
                                                ), 0) INTO vSolde
FROM Compte c
         LEFT JOIN Mouvement m
                   ON m.idCompte = pIdCompte
                       AND m.dateMouvement <= pDate
WHERE c.idCompte = pIdCompte
GROUP BY c.idCompte;
IF vSolde IS NULL THEN
        SET vSolde = 0;
END IF;
RETURN vSolde;
END$$

DELIMITER ;