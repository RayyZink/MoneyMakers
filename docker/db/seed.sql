USE MONEY_2026;
SET FOREIGN_KEY_CHECKS = 0;

-- Nettoyer les tables pour éviter les doublons
TRUNCATE TABLE Mouvement;
TRUNCATE TABLE Tiers;
TRUNCATE TABLE SousCategorie;
TRUNCATE TABLE Categorie;
TRUNCATE TABLE Compte;
TRUNCATE TABLE Utilisateur;

SET FOREIGN_KEY_CHECKS = 1;

-- Insertion d'un utilisateur de test
INSERT INTO Utilisateur (idUtilisateur, nomUtilisateur, prenomUtilisateur, login, hashcode)
VALUES (1, 'Dupont', 'Jean', 'jean.dupont@email.com', 'mot_de_passe_provisoire');

-- Insertion de catégories
INSERT INTO Categorie (idCategorie, nomCategorie, idUtilisateur)
VALUES (1, 'Alimentation', 1),
       (2, 'Loisirs', 1);

-- Insertion de sous-catégories
INSERT INTO SousCategorie (idSousCategorie, nomSousCategorie, idCategorie)
VALUES (1, 'Supermarché', 1),
       (2, 'Restaurant', 1),
       (3, 'Cinéma', 2);

-- Insertion de tiers
INSERT INTO Tiers (idTiers, nomTiers, idUtilisateur)
VALUES (1, 'Auchan', 1),
       (2, 'Burger King', 1),
       (3, 'Gaumont', 1);

-- Insertion d'un compte bancaire de test
INSERT INTO Compte (idCompte, descriptionCompte, soldeInitial, idUtilisateur)
VALUES (1, 'Compte Courant', 1500.00, 1);

-- Insertion de mouvements de test
INSERT INTO Mouvement (idMouvement, dateMouvement, idCompte, idTiers, idCategorie, idSousCategorie, montant, typeMouvement)
VALUES (1, '2026-06-14 12:00:00', 1, 1, 1, 1, -54.30, 'Débit'),
       (2, '2026-06-14 13:15:00', 1, 2, 1, 2, -18.50, 'Débit'),
       (3, '2026-06-14 18:00:00', 1, 3, 2, 3, -11.00, 'Débit');