-- ============================================================
-- MONEY_2026 - Migration mono-utilisateur → multi-utilisateur
-- ============================================================

create database MONEY_2026;
use MONEY_2026;

create table Utilisateur
(
    idUtilisateur     int auto_increment
        primary key,
    nomUtilisateur    varchar(50)                           not null,
    prenomUtilisateur varchar(50)                           not null,
    login             varchar(50)                           not null,
    mdp               varchar(50)                           null,
    hashcode          varchar(128)                          null,
    dateHeureCreation timestamp default current_timestamp() not null,
    dateHeureMAJ      timestamp default current_timestamp() null,
    ville             varchar(50)                           null,
    codePostal        char(5)                               null,
    -- [AJOUT] Contrainte unicité sur le login pour éviter les doublons
    constraint Utilisateur_login_unique unique (login)
);

-- ============================================================
-- [MODIF] Categorie : ajout de idUtilisateur
-- Chaque utilisateur gère ses propres catégories.
-- NULL = catégorie système partagée (visible par tous, non modifiable par les users).
-- ============================================================
create table Categorie
(
    idCategorie       int auto_increment
        primary key,
    nomCategorie      varchar(50)                           not null,
    idUtilisateur     int                                   null     comment 'NULL = catégorie système partagée, sinon appartient à cet utilisateur',
    dateHeureCreation timestamp default current_timestamp() null,
    dateHeureMAJ      timestamp default current_timestamp() not null,
    constraint Categorie_Utilisateur_fk
        foreign key (idUtilisateur) references Utilisateur (idUtilisateur)
            on delete cascade
);

-- ============================================================
-- [MODIF] SousCategorie : idUtilisateur hérité de Categorie,
-- pas besoin de le dupliquer ici — la FK vers Categorie suffit.
-- ============================================================
create table SousCategorie
(
    idSousCategorie   int auto_increment
        primary key,
    nomSousCategorie  varchar(50)                           not null,
    idcategorie       int                                   not null,
    dateHeureCreation timestamp default current_timestamp() not null,
    dateHeureMAJ      timestamp default current_timestamp() not null,
    montant_base      int       default 10                  null,
    periode           char      default 'M'                 not null comment 'M (mensuel) H (Hebdo) A (Aléatoire) Q (Quotidien)',
    constraint SousCategorie_Categorie_fk
        foreign key (idcategorie) references Categorie (idCategorie)
            on delete cascade
);

create table Compte
(
    idCompte             int auto_increment
        primary key,
    descriptionCompte    varchar(50)                                not null,
    nomBanque            varchar(50)                                not null,
    idUtilisateur        int                                        not null,
    dateHeureCreation    timestamp      default current_timestamp() not null,
    dateHeureMAJ         timestamp      default current_timestamp() null,
    montantInitial       decimal(7, 2)  default 0.00                not null,
    dernierMontantCalcule decimal(10, 2) default 0.00               not null,
    constraint Compte_Utilisateur_fk
        foreign key (idUtilisateur) references Utilisateur (idUtilisateur)
            on delete cascade
);

create table Tiers
(
    idTiers               int auto_increment
        primary key,
    nomTiers              varchar(50)                           not null,
    dateHeureCreation     timestamp default current_timestamp() not null,
    dateHeureMAJ          timestamp default current_timestamp() not null,
    idUtilisateur         int                                   not null comment 'Utilisateur propriétaire de ce tiers',
    idSousCategorieDefaut int       default null                null    comment 'Sous-catégorie par défaut associée à ce tiers',
    constraint Tiers_Utilisateur_fk
        foreign key (idUtilisateur) references Utilisateur (idUtilisateur),
    constraint Tiers_SousCategorie_fk
        foreign key (idSousCategorieDefaut) references SousCategorie (idSousCategorie)
            on delete set null
);

-- ============================================================
-- [MODIF] Virement : ajout de idUtilisateurInitiateur
-- Permet de tracer qui a initié le virement.
-- [SECURITE] La vérification que les deux comptes appartiennent
-- au même utilisateur (ou à des utilisateurs consentants)
-- doit être faite au niveau applicatif / procédure stockée.
-- Pour un virement inter-utilisateurs, on autorise explicitement
-- via un champ virementInterUtilisateur.
-- ============================================================
create table Virement
(
    idVirement               int auto_increment
        primary key,
    idCompteDebit            int                                       not null,
    idCompteCredit           int                                       not null,
    montant                  decimal(6, 2) default 0.00                not null,
    dateVirement             date          default (curdate())          not null,
    dateHeureCreation        timestamp     default current_timestamp() not null,
    dateHeureMAJ             timestamp     default current_timestamp() not null,
    commentaire              varchar(255)                              null,
    -- [AJOUT] Initiateur du virement (utilisateur connecté au moment de la création)
    idUtilisateurInitiateur  int                                       not null,
    -- [AJOUT] Flag pour distinguer un virement entre deux utilisateurs différents
    virementInterUtilisateur tinyint(1)    default 0                   not null comment '0 = même utilisateur, 1 = inter-utilisateurs',
    constraint Virement_compteCrediteur_fk
        foreign key (idCompteCredit) references Compte (idCompte),
    constraint Virement_compteDebiteur_fk
        foreign key (idCompteDebit) references Compte (idCompte),
    constraint Virement_Utilisateur_fk
        foreign key (idUtilisateurInitiateur) references Utilisateur (idUtilisateur)
);

create table Mouvement
(
    idMouvement       int auto_increment
        primary key,
    dateMouvement     date          default (curdate())          not null,
    idCompte          int                                      not null,
    idTiers           int           default null               null,
    idCategorie       int           default null               null,
    idSousCategorie   int           default null               null,
    idVirement        int                                      null,
    montant           decimal(6, 2)                            null,
    typeMouvement     char          default 'D'                null    comment 'D = Débit, C = Crédit',
    dateHeureCreation timestamp     default current_timestamp() not null,
    dateHeureMAJ      timestamp     default current_timestamp() not null,
    constraint Mouvement_Categorie_fk
        foreign key (idCategorie) references Categorie (idCategorie),
    constraint Mouvement_Compte_fk
        foreign key (idCompte) references Compte (idCompte)
            on delete cascade,
    constraint Mouvement_SousCategorie_fk
        foreign key (idSousCategorie) references SousCategorie (idSousCategorie)
            on update cascade on delete set null,
    constraint Mouvement_Tiers_fk
        foreign key (idTiers) references Tiers (idTiers),
    constraint Mouvement_Virement_fk
        foreign key (idVirement) references Virement (idVirement)
            on update cascade on delete set null
);

-- ============================================================
-- VUES
-- ============================================================

-- [MODIF] V_CATEGORIE : filtre par utilisateur
-- Renvoie les catégories système (idUtilisateur IS NULL)
-- + les catégories propres à l'utilisateur passé en contexte.
-- En pratique, le filtre se fait côté applicatif via un paramètre ;
-- ici la vue expose toutes les données, la sécurité est en procédure.
create view V_CATEGORIE as
select c.idCategorie       AS idCategorie,
       c.nomCategorie      AS nomCategorie,
       c.idUtilisateur     AS idUtilisateurCategorie,
       sc.idSousCategorie  AS idSousCategorie,
       sc.nomSousCategorie AS nomSousCategorie
from Categorie c
         join SousCategorie sc on sc.idcategorie = c.idCategorie
order by c.idCategorie, sc.idSousCategorie;

-- [MODIF] V_MOUVEMENT : expose idUtilisateur du compte pour filtrage applicatif
create view V_MOUVEMENT as
select m.idMouvement         AS idMouvement,
       m.dateMouvement       AS dateMouvement,
       c.idUtilisateur       AS idUtilisateur,
       c.descriptionCompte   AS descriptionCompte,
       c.nomBanque           AS nomBanque,
       t.nomTiers            AS nomTiers,
       ctg.idCategorie       AS idCategorie,
       ctg.nomCategorie      AS nomCategorie,
       sctg.nomSousCategorie AS nomSousCategorie,
       sctg.idSousCategorie  AS idSousCategorie,
       m.montant             AS montant,
       m.typeMouvement       AS typeMouvement
from Mouvement m
         join Compte c on m.idCompte = c.idCompte
         join Tiers t on m.idTiers = t.idTiers
         join Categorie ctg on m.idCategorie = ctg.idCategorie
         left join SousCategorie sctg on m.idSousCategorie = sctg.idSousCategorie
order by m.dateMouvement;

-- ============================================================
-- PROCÉDURE : creerVirement
-- [NOUVEAU] Crée un virement sécurisé entre deux comptes.
-- - Vérifie que le compte débiteur appartient à l'initiateur.
-- - Vérifie que si les comptes sont de deux utilisateurs différents,
--   le flag inter-utilisateurs est bien positionné (extensible
--   pour y ajouter un mécanisme de consentement).
-- - Crée automatiquement les 2 mouvements (débit + crédit).
-- ============================================================
create procedure creerVirement(
    IN pIdCompteDebit           int,
    IN pIdCompteCredit          int,
    IN pMontant                 decimal(6, 2),
    IN pDateVirement            date,
    IN pCommentaire             varchar(255),
    IN pIdUtilisateurInitiateur int,
    IN pIdCategorie             int,
    IN pIdSousCategorie         int
)
BEGIN
    DECLARE vIdUtilisateurDebit  INT;
    DECLARE vIdUtilisateurCredit INT;
    DECLARE vIdVirement          INT;
    DECLARE vInterUtilisateur    TINYINT(1) DEFAULT 0;

    -- Récupérer les propriétaires des comptes
    SELECT idUtilisateur INTO vIdUtilisateurDebit  FROM Compte WHERE idCompte = pIdCompteDebit;
    SELECT idUtilisateur INTO vIdUtilisateurCredit FROM Compte WHERE idCompte = pIdCompteCredit;

    -- [SECURITE] L'initiateur doit posséder le compte débiteur
    IF vIdUtilisateurDebit != pIdUtilisateurInitiateur THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Accès refusé : le compte débiteur n\'appartient pas à l\'utilisateur initiateur.';
    END IF;

    -- [SECURITE] Détecter si c'est un virement inter-utilisateurs
    IF vIdUtilisateurDebit != vIdUtilisateurCredit THEN
        SET vInterUtilisateur = 1;
        -- Point d'extension : ajouter ici une vérification de consentement
        -- (ex : vérifier une table DemandeVirement avec statut 'ACCEPTE')
    END IF;

    -- Créer l'enregistrement Virement
    INSERT INTO Virement (idCompteDebit, idCompteCredit, montant, dateVirement,
                          commentaire, idUtilisateurInitiateur, virementInterUtilisateur)
    VALUES (pIdCompteDebit, pIdCompteCredit, pMontant, pDateVirement,
            pCommentaire, pIdUtilisateurInitiateur, vInterUtilisateur);

    SET vIdVirement = LAST_INSERT_ID();

    -- [NOUVEAU] Créer le mouvement DÉBIT sur le compte débiteur
    INSERT INTO Mouvement (dateMouvement, idCompte, idCategorie, idSousCategorie,
                           idVirement, montant, typeMouvement)
    VALUES (pDateVirement, pIdCompteDebit, pIdCategorie, pIdSousCategorie,
            vIdVirement, pMontant, 'D');

    -- [NOUVEAU] Créer le mouvement CRÉDIT sur le compte créditeur
    INSERT INTO Mouvement (dateMouvement, idCompte, idCategorie, idSousCategorie,
                           idVirement, montant, typeMouvement)
    VALUES (pDateVirement, pIdCompteCredit, pIdCategorie, pIdSousCategorie,
            vIdVirement, pMontant, 'C');

END;

-- ============================================================
-- PROCÉDURE : getCategories
-- [NOUVEAU] Retourne les catégories visibles par un utilisateur :
-- catégories système (idUtilisateur IS NULL) + ses propres catégories.
-- ============================================================
create procedure getCategories(IN pIdUtilisateur int)
BEGIN
    SELECT c.idCategorie,
           c.nomCategorie,
           sc.idSousCategorie,
           sc.nomSousCategorie
    FROM Categorie c
             JOIN SousCategorie sc ON sc.idcategorie = c.idCategorie
    WHERE c.idUtilisateur IS NULL        -- catégories système partagées
       OR c.idUtilisateur = pIdUtilisateur  -- catégories propres à l'utilisateur
    ORDER BY c.idCategorie, sc.idSousCategorie;
END;

-- ============================================================
-- PROCÉDURE : maj_mouvements (inchangée fonctionnellement)
-- ============================================================
create procedure maj_mouvements()
BEGIN
    DECLARE v_idMouvement INT DEFAULT 0;
    DECLARE v_montant DECIMAL(10,2) DEFAULT 0;
    DECLARE v_delta DECIMAL(6,2) DEFAULT 0;
    DECLARE v_done INT DEFAULT 0;
    DECLARE cur_mvt CURSOR FOR
        SELECT idMouvement, montant FROM Mouvement WHERE typeMouvement = 'D' AND idCategorie = 7;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    OPEN cur_mvt;
    mvt_loop : LOOP
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
END;

-- ============================================================
-- FONCTION : soldeHistorique (inchangée)
-- ============================================================
create function soldeHistorique(pIdCompte int, pDate date) returns decimal(7, 2) deterministic
BEGIN
    DECLARE vSolde decimal(7,2) DEFAULT 0;
    SELECT sum(montant) INTO vSolde FROM Mouvement WHERE idCompte = pIdCompte AND dateMouvement <= pDate;
    IF vSolde IS NULL THEN
        SET vSolde = 0;
    END IF;
    return vSolde;
END;
