# MoneyMakers API — Guide de Développement et Socle Commun

Ce document constitue la feuille de route unique pour le groupe de 5 ingénieurs. Il définit le cadre fonctionnel, les processus de déploiement via Docker, la procédure d'arrêt et la structure du code afin d'assurer des fusions de branches saines et sans conflits.

---

## 1. Notes de Cadrage Fonctionnel et Métier

L'application MoneyMakers repose sur la réécriture et la modernisation d'une base pensée à l'origine pour du mono-utilisateur :

- **Migration Multi-utilisateur :** L'application est strictement multi-utilisateurs. Chaque utilisateur possède et gère ses propres comptes, ses propres tiers et ses propres catégories/sous-catégories.
- **Création dynamique :** Les catégories et sous-catégories ne sont pas figées en base de données. L'utilisateur final peut instancier ses propres structures budgétaires à tout moment.
- **Cloisonnement et Confidentialité :** L'API garantit qu'un utilisateur ne peut jamais voir, modifier ou manipuler les catégories, comptes ou mouvements d'un autre utilisateur.
- **Sécurité Anti-Fraude :** L'API et le SGBD collaborent pour bloquer toute opération frauduleuse. Des triggers spécifiques (`SIGNAL SQLSTATE '45000'`) rejettent les requêtes d'insertion ou de modification si un utilisateur tente d'associer une catégorie ou un tiers qui ne lui appartient pas.
- **Atomisation des Flux :** La création d'un virement (via la procédure stockée `creerVirement`) génère automatiquement et de manière atomique deux mouvements en base de données : un débit sur le compte émetteur et un crédit sur le compte récepteur.
- **Spécifications Complètes :** [Google Doc - Spécifications Money API](https://docs.google.com/document/d/1BjyCx92OEzXsKWaT_WiEJuKxd-OY3fIjIaO5Hr42Un0/edit?tab=t.0)

-**Grille d'évaluation d'API :** [Google sheet](https://docs.google.com/spreadsheets/d/1XH-ubJQZ47jEu012_QayPxYYJ8LDeVUBSldTtPeyvnk/edit?gid=0#gid=0)
---

## 2. Instructions d'Installation, de Démarrage et d'Arrêt

### Étape A — Cloner le projet et créer une branche de travail

Avant d'écrire du code, cloner le dépôt et s'isoler sur une branche dédiée :

```bash
git clone https://github.com/RayyZink/MoneyMakers.git
cd MoneyMakers

# Exemple pour Corentin
git checkout -b feature/gestion-tiers
```

### Étape B — Premier lancement (ou après une modification du schéma SQL)

> ⚠️ **Important :** MySQL n'exécute les scripts `docker-entrypoint-initdb.d/` (database.sql, seed.sql) **que si le volume de données est vierge**. Si l'environnement a déjà été lancé une fois, il faut obligatoirement supprimer le volume avant de relancer pour que les modifications du schéma ou du seed soient prises en compte.

```bash
# Supprimer les conteneurs ET le volume de données (réinitialisation complète)
docker compose down -v

# Reconstruire et démarrer l'écosystème en arrière-plan
docker compose up -d --build
```

L'installation des dépendances Node.js (`npm install`) s'effectue automatiquement au démarrage du conteneur applicatif. L'API attend que le healthcheck MySQL soit vert avant de démarrer — ce délai est normal lors du premier lancement (15-30 secondes).

### Étape C — Lancement standard (session de développement courante)

Pour une session normale où le schéma SQL n'a pas changé :

```bash
docker compose up -d
```

### Étape D — Suivre les logs applicatifs

```bash
# Logs en temps réel du serveur Node.js (erreurs TypeScript, requêtes, etc.)
docker logs -f money_api_container

# Logs de la base de données MySQL
docker logs -f money_db_container
```

L'API est active et accessible sur :

| Endpoint | URL |
|---|---|
| Racine API | `http://localhost:3000/api/v1` |
| Documentation Swagger | `http://localhost:3000/docs` |

### Étape E — Arrêter proprement l'environnement

```bash
# Arrêt des conteneurs uniquement — les données MySQL sont préservées
docker compose down

# Arrêt ET suppression du volume — à utiliser après une modif du schéma SQL
docker compose down -v
```

---

## 3. Description des Fichiers et Rôles de l'Architecture

L'architecture respecte le design pattern en couches organisé par fonctionnalités (feature-based) sous `src/features/`. Le couplage entre les classes est réalisé par **injection de dépendances manuelle par constructeur** dans `routes.ts`.

```
src/
├── config/
│   └── database.ts          # Création du Pool de connexion MySQL (exporté, jamais instancié ailleurs)
├── features/
│   └── [module]/
│       ├── routes.ts        # Point d'entrée : URI, verbes HTTP, assemblage DI
│       ├── controller.ts    # Thin Controller : HTTP uniquement, délègue au service
│       ├── service.ts       # Logique métier, transformation camelCase, découplé d'Express
│       └── repository.ts    # SQL pur, appels de procédures stockées
├── middlewares/
│   ├── auth.ts              # Vérification du token JWT, enrichit req.user
│   └── error.ts             # Middleware global : Zod 400, JWT 401, SQL-45000 422, 500
├── app.ts                   # Configuration Express : middlewares, montage des routes, Swagger
└── server.ts                # Point d'entrée Node.js, écoute sur le port
```

### Responsabilités par couche

- **`routes.ts`** — Définit les URI et associe les verbes HTTP. **C'est ici que s'effectue l'assemblage par injection de dépendances** : instancier le Repository (en lui passant `pool`), le passer au Service, puis passer le Service au Controller. Ne contient aucune logique.

- **`controller.ts` (Thin Controller)** — Gère uniquement l'interface HTTP. Extrait les données de la requête (`req.params`, `req.body`, `req.user`), délègue immédiatement au Service, formate la réponse JSON. **Aucun SQL, aucune logique métier.** Toutes les erreurs sont poussées vers `next(error)`.

- **`service.ts`** — Cœur de la logique métier. Applique les règles de gestion, filtre les permissions, transforme les données SQL brutes en format camelCase conforme au contrat Swagger. **Totalement découplé d'Express** (pas d'import de `Request`/`Response`).

- **`repository.ts`** — Unique passerelle vers la base de données. Contient l'intégralité des requêtes SQL et les appels de procédures stockées. Reçoit l'instance `Pool` par constructeur.

- **`src/app.ts`** — Configure Express : middlewares de sécurité (helmet, cors, rate-limit), Swagger UI sur `/docs`, montage de tous les routeurs, middleware global d'erreurs en dernier.

- **`src/middlewares/error.ts`** — Intercepte dans l'ordre : triggers SQL `45000` → 422, erreurs Zod → 400, erreurs JWT → 401, erreurs HTTP métier (statusCode 4xx), puis 500 générique.

---

## 4. Exemple d'Implémentation de Référence : Le Module Mouvements

Pour comprendre comment implémenter une route sur vos branches, voici le modèle complet du endpoint `GET /api/v1/comptes/{idCompte}/mouvements`.

### `src/features/mouvements/repository.ts`

```typescript
import { Pool } from 'mysql2/promise';

export class MouvementsRepository {
  // Le Pool est injecté par le constructeur — jamais importé directement
  constructor(private db: Pool) {}

  async findMouvementsByCompteId(idCompte: number): Promise<any[]> {
    // Le SQL pur est strictement isolé ici dans le Repository
    const query = `
      SELECT idMouvement, dateMouvement, descriptionCompte, nomTiers,
             nomCategorie, nomSousCategorie, montant, typeMouvement
      FROM V_MOUVEMENT
      WHERE idCompte = ?
    `;
    const [rows] = await this.db.query(query, [idCompte]);
    return rows as any[];
  }
}
```

### `src/features/mouvements/service.ts`

```typescript
import { MouvementsRepository } from './repository';

export class MouvementsService {
  // Le Repository est injecté par le constructeur
  constructor(private mouvementsRepository: MouvementsRepository) {}

  async getMouvementsPourCompte(idCompte: number) {
    const lignesDonnees = await this.mouvementsRepository.findMouvementsByCompteId(idCompte);

    // Transformation des données SQL vers le format JSON camelCase du Swagger
    return lignesDonnees.map(row => ({
      idMouvement:      row.idMouvement,
      dateMouvement:    row.dateMouvement,
      descriptionCompte: row.descriptionCompte,
      nomTiers:         row.nomTiers         || null,
      nomCategorie:     row.nomCategorie     || null,
      nomSousCategorie: row.nomSousCategorie || null,
      montant:          parseFloat(row.montant),
      typeMouvement:    row.typeMouvement,
    }));
  }
}
```

### `src/features/mouvements/controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { MouvementsService } from './service';

export class MouvementsController {
  // Le Service est injecté par le constructeur
  constructor(private mouvementsService: MouvementsService) {}

  async getMouvements(req: Request, res: Response, next: NextFunction) {
    try {
      // Extraction et typage du paramètre d'URL — rien d'autre ici
      const idCompte = parseInt(req.params.idCompte, 10);

      // Délégation totale à la couche métier
      const resultats = await this.mouvementsService.getMouvementsPourCompte(idCompte);

      // Réponse HTTP standardisée
      return res.status(200).json({
        data: resultats,
        meta: {
          page:       1,
          limit:      resultats.length,
          total:      resultats.length,
          totalPages: 1,
        },
      });
    } catch (error) {
      // Toutes les erreurs remontent au middleware global — jamais gérées ici
      next(error);
    }
  }
}
```

### `src/features/mouvements/routes.ts`

```typescript
import { Router } from 'express';
import { MouvementsController } from './controller';
import { MouvementsService }    from './service';
import { MouvementsRepository } from './repository';
import { pool }                 from '../../config/database';

const router = Router();

// ── Assemblage par injection de dépendances manuelle (exigence du cours) ──
const repository = new MouvementsRepository(pool);
const service    = new MouvementsService(repository);
const controller = new MouvementsController(service);

// Association de l'URI, du verbe HTTP et de la méthode du contrôleur
router.get('/:idCompte/mouvements', (req, res, next) =>
  controller.getMouvements(req, res, next)
);

export default router;
```

### Montage dans `src/app.ts`

```typescript
import mouvementsRoutes from './features/mouvements/routes';

// Les mouvements sont sous /comptes car l'URL est /comptes/:idCompte/mouvements
app.use('/api/v1/comptes', mouvementsRoutes);
```

---

## 5. Variables d'Environnement

Le fichier `.env` à la racine du projet est chargé automatiquement par Docker Compose (directive `env_file`) et par `dotenv` dans le code. **Ne jamais committer ce fichier.**

| Variable | Description | Valeur par défaut |
|---|---|---|
| `PORT` | Port d'écoute de l'API | `3000` |
| `NODE_ENV` | Environnement d'exécution | `development` |
| `DB_HOST` | Hôte MySQL (**doit être `db`** dans Docker) | `db` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | Utilisateur MySQL | `root` |
| `DB_PASSWORD` | Mot de passe MySQL | `root_password` |
| `DB_NAME` | Nom de la base de données | `MONEY_2026` |
| `JWT_SECRET` | Clé secrète de signature des tokens JWT | *(à garder privé)* |

> ⚠️ `DB_HOST` doit valoir `db` (le nom du service Docker Compose) et non `localhost` lorsque l'API tourne dans un conteneur.

---

## 6. Répartition Officielle des Modules de l'Équipe

Afin d'éviter tout conflit de versioning, chaque membre développe uniquement les endpoints liés à sa fonctionnalité désignée et ne touche pas aux fichiers communs (`app.ts`, `error.ts`, `docker-compose.yml`) sans coordination préalable.

| Membre | Modules | Périmètre |
|---|---|---|
| **Rania** | `comptes` | Lister, créer, récupérer, modifier, supprimer les comptes ; calcul du solde historique à une date donnée (7 routes) |
| **Milan** | `mouvements` & `virements` (partie 1) | Liste paginée et filtrée des mouvements, création de mouvements, `POST /virements` |
| **Théophile** | `categories` & `virements` (partie 2) | CRUD catégories (système et personnelles), consultation/modification/suppression d'un virement |
| **Leo** | `auth` (logout) & `utilisateurs` | Déconnexion, profil utilisateur, modification des informations personnelles |
| **Corentin** | `sous-categories`, `tiers` & `auth` (register/login) | CRUD sous-catégories, CRUD tiers, inscription et connexion JWT |
