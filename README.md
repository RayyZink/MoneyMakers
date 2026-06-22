# MoneyMakers API — Guide d'utilisation

MoneyMakers est une API de gestion de budget personnel. Permet de créer des comptes bancaires, d'enregistrer des mouvements (dépenses et revenus), d'organiser les dépenses par catégories et sous-catégories, de suivre des tiers (commerçants, employeurs...) et d'effectuer des virements entre comptes.

Ce guide explique comment installer l'application, l'utiliser via Swagger, et tester chaque fonctionnalité.

---

## 1. Installation et démarrage

### Prérequis

Docker et Docker Compose installés sur la machine.

### Premier démarrage

```bash
git clone https://github.com/RayyZink/MoneyMakers.git
cd MoneyMakers
docker compose up -d --build
```

Le premier démarrage initialise la base de données avec un jeu de données de test (3 utilisateurs, 8 comptes, environ 200 mouvements). Un délai de 15 à 30 secondes est normal lors de cette étape.

### Démarrages suivants

```bash
docker compose up -d
```

> ⚠️ Toute modification du schéma de la base de données (`docker/db/database.sql` ou `seed.sql`) ne sera prise en compte qu'après une réinitialisation complète du volume :
> ```bash
> docker compose down -v
> docker compose up -d --build
> ```
> Cette commande supprime toutes les données existantes et restaure le jeu de données de test fourni.

### Arrêt de l'application

```bash
# Conserver les données
docker compose down

# Supprimer aussi les données (le seed sera rechargé au prochain démarrage)
docker compose down -v
```

### Accès à l'application

| Élément | URL |
|---|---|
| API | `http://localhost:3000/api/v1` |
| Documentation interactive (Swagger) | `http://localhost:3000/docs` |

La suite de ce guide se base sur Swagger, l'interface web permettant de tester l'API sans écrire de code.

---

## 2. Authentification

Presque toutes les routes de l'API exigent une authentification. Sans elle, l'API répond systématiquement :

```json
{ "code": 401, "message": "Token manquant ou invalide" }
```

L'authentification fonctionne par token JWT : une connexion réussie fournit une chaîne de caractères (le token), à transmettre ensuite à chaque requête pour prouver l'identité de l'appelant.

### Méthode 1 — Se connecter avec un compte du jeu de données de test (recommandé)

Le jeu de données de test contient 3 utilisateurs, tous avec le mot de passe `password123` :

| Login | Nom | Id utilisateur | Comptes associés |
|---|---|---|---|
| `jean.dupont` | Jean Dupont | 1 | 1, 2, 3 |
| `sophie.martin` | Sophie Martin | 2 | 4, 5 |
| `thomas.leclerc` | Thomas Leclerc | 3 | 6, 7, 8 |

Dans Swagger, ouvrir **POST /auth/login**, cliquer sur **Try it out**, et remplir le corps de la requête :

```json
{
  "login": "jean.dupont",
  "motDePasse": "password123"
}
```

La réponse contient un champ `token` :

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "utilisateur": { "idUtilisateur": 1, "nomUtilisateur": "Dupont", ... }
}
```

Copier cette valeur de `token` (sans les guillemets). Cette méthode est la plus pratique pour tester les endpoints car les comptes, mouvements, catégories et tiers de ces utilisateurs sont déjà peuplés par le seed.

### Méthode 2 — Créer son propre compte

Utiliser **POST /auth/register** dans Swagger, avec un corps de requête de ce type :

```json
{
  "nomUtilisateur": "Test",
  "prenomUtilisateur": "Utilisateur",
  "login": "test.utilisateur",
  "motDePasse": "motdepasse123"
}
```

Le mot de passe doit faire au moins 8 caractères. La réponse contient l'utilisateur créé, avec son `idUtilisateur` (très probablement `4`, puisque le seed va de 1 à 3). Se connecter ensuite avec ces identifiants via **POST /auth/login** pour récupérer le token.

> Note : un compte créé manuellement ne possède aucun compte bancaire, catégorie ni tiers au départ. Certains tests de la section 4 (qui s'appuient sur les ids du seed) ne fonctionneront donc pas avec ce compte — utiliser la méthode 1 pour ces cas.

### Méthode 3 — Générer un token directement (pour les développeurs)

Un script `token.ts` est fourni à la racine du projet pour générer un token sans passer par un mot de passe, en spécifiant directement l'id de l'utilisateur souhaité.

```bash
npx ts-node token.ts
```

Cette commande affiche un token dans la console, signé pour l'utilisateur `idUtilisateur: 1` (Jean Dupont) par défaut. Modifier cette valeur directement dans le fichier `token.ts` permet de générer un token pour un autre utilisateur. Ce token est valide 1 heure.

> ⚠️ Cette commande doit être lancée depuis le dossier racine du projet (là où se trouve le fichier `.env`), sous peine de signature avec une mauvaise clé et de rejet par le serveur.

### Utilisation du token dans Swagger

Une fois le token récupéré (par l'une des 3 méthodes), cliquer sur le bouton **Authorize** 🔒 en haut de la page Swagger, et coller dans le champ ``bearerAuth``.

Toutes les requêtes suivantes seront authentifiées avec ce token jusqu'à fermeture de la page ou changement de token.

Le token expire après un certain temps. En cas d'expiration, l'API renvoie de nouveau une erreur 401 — il suffit de recommencer la procédure d'authentification.

---

## 3. Règle générale : cloisonnement des données par utilisateur

Règle la plus importante de cette API : un utilisateur ne peut jamais consulter, modifier ou supprimer les comptes, mouvements, catégories, sous-catégories ou tiers d'un autre utilisateur. Ces ressources sont strictement privées, conformément au principe multi-utilisateurs du cahier des charges (chaque utilisateur déclare ses propres tiers, catégories et sous-catégories).

Concrètement, une tentative d'accès à une ressource appartenant à un autre utilisateur que celui authentifié par le token actif renvoie soit une erreur 403 (« Accès refusé »), soit une erreur 404 (« introuvable ») selon la route — l'API choisit volontairement de répondre 404 sur certaines ressources pour ne même pas révéler leur existence.

### Exception : les virements

Le virement est la seule opération autorisée entre deux utilisateurs différents. Un utilisateur peut débiter l'un de ses propres comptes pour créditer le compte d'un autre utilisateur (par exemple pour remboursement d'une dépense partagée). L'inverse n'est jamais permis : il est impossible de débiter le compte de quelqu'un d'autre, même pour créditer son propre compte. Cette règle est vérifiée à la fois par l'API et par une procédure stockée côté base de données.

Lorsque les deux comptes impliqués appartiennent à des utilisateurs différents, le virement est marqué `virementInterUtilisateur: true` dans sa réponse. Les deux utilisateurs concernés (celui qui débite et celui qui crédite) peuvent ensuite consulter ce virement, puisque chacun y est partie prenante. Un troisième utilisateur non impliqué n'y a pas accès.

À garder en tête pendant les tests : si une requête censée fonctionner renvoie une erreur d'accès, vérifier en premier que l'id utilisé appartient bien à l'utilisateur authentifié par le token actuellement actif dans Swagger.

---

## 4. Parcours de test recommandé

Suite de tests à effectuer dans Swagger pour valider chaque fonctionnalité, dans un ordre logique. Cette section utilise les ids du seed (utilisateur 1 = Jean Dupont, comptes 1 à 3 ; utilisateur 2 = Sophie Martin, comptes 4 et 5) ; un token correspondant à l'utilisateur 1 est donc nécessaire au préalable — voir méthode 2 de la section précédente pour l'obtenir.

### Utilisateurs

- **GET /utilisateurs/1** → 200, profil de l'utilisateur 1.
- **GET /utilisateurs/2** → 403, tentative de consultation du profil d'un autre utilisateur.
- **PUT /utilisateurs/1** avec `{ "ville": "Marseille" }` → 200, seul le champ ville change, le reste du profil est conservé.

### Comptes

- **GET /utilisateurs/1/comptes** → 200, liste des 3 comptes de l'utilisateur 1 (Compte Courant BNP Paribas, Livret A, Compte Joint Crédit Agricole).
- **GET /comptes/1** → 200, détail du Compte Courant.
- **GET /comptes/4** → 404, ce compte appartient à l'utilisateur 2.
- **PUT /comptes/1** avec `{ "descriptionCompte": "Compte Courant Principal", "nomBanque": "BNP Paribas" }` → 200.
- **GET /comptes/1/solde?date=2026-03-31** → 200, calcul du solde du compte à cette date précise.

### Mouvements

- **GET /comptes/1/mouvements** → 200, liste paginée (20 résultats par page par défaut).
- **GET /comptes/1/mouvements?typeMouvement=C** → 200, uniquement les crédits (revenus).
- **GET /comptes/1/mouvements?dateDebut=2026-03-01&dateFin=2026-03-31** → 200, uniquement les mouvements de mars 2026.
- **POST /comptes/1/mouvements** avec :
  ```json
  { "montant": -45.50, "typeMouvement": "D", "idTiers": 1, "idCategorie": 1, "idSousCategorie": 1 }
  ```
  → 201 (tiers, catégorie et sous-catégorie utilisés appartiennent bien à l'utilisateur 1 : Carrefour / Alimentation / Supermarché).
- **POST /comptes/1/mouvements** en remplaçant `idCategorie` par `7` (catégorie appartenant à l'utilisateur 2) → 422, blocage de l'association d'une catégorie n'appartenant pas à l'utilisateur.
- Récupération de l'id d'un mouvement existant via `GET /comptes/1/mouvements?limit=1`, puis :
    - **GET /mouvements/{id}** → 200.
    - **PUT /mouvements/{id}** avec `{ "montant": 100 }` → 200, seul le montant change (les autres champs restent identiques, aucun besoin de tout renvoyer).
    - **DELETE /mouvements/{id}** → 204.

### Virements

- **POST /virements** avec :
  ```json
  { "idCompteDebit": 1, "idCompteCredit": 2, "montant": 200, "dateVirement": "2026-06-21" }
  ```
  → 201, virement entre deux comptes de l'utilisateur 1. Création automatique de deux mouvements liés (un débit, un crédit).
- **POST /virements** avec `{ "idCompteDebit": 4, "idCompteCredit": 1, "montant": 100 }` → 422, le compte débiteur (4) appartient à l'utilisateur 2 : un utilisateur ne peut débiter que ses propres comptes, même pour créditer son propre compte.
- **POST /virements** avec `{ "idCompteDebit": 1, "idCompteCredit": 4, "montant": 50 }` → 201, cas autorisé conformément à l'exception décrite en section 3 : débit d'un compte propre pour créditer celui d'un autre utilisateur (virement inter-utilisateurs, signalé par `virementInterUtilisateur: true` dans la réponse).

### Catégories et sous-catégories

- **GET /categories** → 200, les 6 catégories personnelles de l'utilisateur 1 (Alimentation, Logement, Transport, Loisirs, Santé, Revenus).
- **POST /categories** avec `{ "nomCategorie": "Alimentation" }` → 409, une catégorie de ce nom existe déjà pour cet utilisateur.
- **POST /categories** avec `{ "nomCategorie": "Cadeaux" }` → 201.
- **GET /categories/1/sous-categories** → 200, retourne Supermarché, Restaurant, Boulangerie.
- **POST /categories/1/sous-categories** avec `{ "nomSousCategorie": "Marché bio", "periode": "M" }` → 201.

### Tiers

- **GET /tiers** → 200, liste paginée des tiers de l'utilisateur 1 (Carrefour, Lidl, McDonald's...).
- **GET /tiers?search=Carrefour** → 200, un seul résultat filtré par nom.
- **POST /tiers** avec `{ "nomTiers": "Decathlon", "idSousCategorieDefaut": 12 }` → 201.

---

## 5. Codes d'erreur

| Code | Signification | Cause typique |
|---|---|---|
| **400** | Requête mal formée | Champ obligatoire manquant, format JSON invalide (virgule en trop, guillemets manquants) |
| **401** | Non authentifié | Token absent, expiré, ou mal formé dans le champ Authorize (oubli du mot `Bearer`) |
| **403** | Accès refusé | Tentative d'accès à une ressource n'appartenant pas à l'utilisateur authentifié, signalée explicitement |
| **404** | Introuvable | La ressource n'existe pas, ou existe mais appartient à un autre utilisateur (existence volontairement masquée) |
| **409** | Conflit | Tentative de création d'une ressource déjà existante (login déjà pris, catégorie de même nom) |
| **422** | Règle métier violée | Donnée valide dans sa forme, mais violant une règle de cohérence (catégorie n'appartenant pas à l'utilisateur du compte, compte débiteur et créditeur identiques) |
| **429** | Trop de requêtes | Plus de 100 requêtes envoyées depuis la même adresse IP en 15 minutes |
| **500** | Erreur serveur | Bug interne, à signaler en cas d'occurrence reproductible |

Un code 400 avec un message du type *"Expected double-quoted property name in JSON"* signale une erreur de syntaxe JSON dans le corps de la requête, le plus souvent une virgule en trop après le dernier champ. Exemple invalide :

```json
{
  "montant": 1410,
}
```

Exemple corrigé (absence de virgule après la dernière valeur) :

```json
{
  "montant": 1410
}
```

---

## 6. Réinitialisation des données de test

En cas de modification ou de suppression de données lors des tests, deux options permettent de repartir d'une base propre.

**Option rapide** (relance uniquement le seed, sans toucher au schéma) :
```bash
docker compose exec db mysql -u root -proot_password MONEY_2026 < docker/db/seed.sql
```

**Option complète** (réinitialise tout, y compris en cas de modification du schéma) :
```bash
docker compose down -v
docker compose up -d --build
```

---

## 7. Architecture du projet

```
src/
├── config/
│   └── database.ts          # Pool de connexion MySQL
├── features/
│   └── [module]/
│       ├── routes.ts        # URI, verbes HTTP, assemblage des dépendances
│       ├── controller.ts    # Gestion HTTP uniquement (extraction req, formatage réponse)
│       ├── service.ts       # Logique métier, règles de permission
│       └── repository.ts    # Requêtes SQL et appels de procédures stockées
├── middlewares/
│   ├── auth.ts               # Vérification du token JWT
│   └── error.ts              # Gestion centralisée des erreurs
├── app.ts                    # Configuration Express, montage des routes, Swagger
└── server.ts                 # Point d'entrée
```

Chaque module suit le même schéma en couches : `routes.ts` assemble repository, service et controller par injection de dépendances ; `controller.ts` ne contient aucune logique métier ni SQL ; `service.ts` applique les règles métier et les contrôles de propriété ; `repository.ts` est le seul point d'accès SQL.

### Variables d'environnement (`.env`, à la racine, jamais commité)

| Variable | Rôle |
|---|---|
| `PORT` | Port d'écoute de l'API |
| `DB_HOST` | Doit valoir `db` (nom du service Docker), pas `localhost` |
| `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Connexion MySQL |
| `JWT_SECRET` | Clé de signature des tokens, à garder strictement privée |

### Suivi des logs

```bash
docker logs -f money_api_container   # logs du serveur Node.js
docker logs -f money_db_container    # logs MySQL
```

### Spécifications complètes

[Google Doc — Spécifications Money API](https://docs.google.com/document/d/1BjyCx92OEzXsKWaT_WiEJuKxd-OY3fIjIaO5Hr42Un0/edit?tab=t.0)