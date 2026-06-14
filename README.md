# MoneyMakers API — Guide de Développement et Socle Commun

Ce document constitue la feuille de route unique pour le groupe de 5 ingénieurs. Il définit le cadre fonctionnel, les processus de déploiement en ligne de commande via Docker, la procédure d'arrêt de l'environnement et la structure du code afin d'assurer des fusions de branches saines et sans conflits.

---

## 1. Notes de Cadrage Fonctionnel et Métier

L'application MoneyMakers repose sur la réécriture et la modernisation d'une base pensée à l'origine pour du mono-utilisateur :
* **Migration Multi-utilisateur :** L'application est strictement multi-utilisateurs. Chaque utilisateur possède et gère ses propres comptes, ses propres tiers et ses propres catégories/sous-catégories.
* **Création dynamique :** Les catégories et sous-catégories ne sont pas figées en base de données. L'utilisateur final doit pouvoir instancier ses propres structures budgétaires à tout moment.
* **Cloisonnement et Confidentialité :** Sécuriser l'API pour qu'un utilisateur ne puisse jamais voir, modifier ou manipuler les catégories, comptes ou mouvements d'un autre utilisateur.
* **Sécurité Anti-Fraude :** L'API et le SGBD collaborent pour bloquer toute opération frauduleuse. Des triggers spécifiques (SIGNAL SQLSTATE '45000') rejettent les requêtes d'insertion ou de modification si un utilisateur tente d'associer une catégorie ou un tiers qui ne lui appartient pas à un compte bancaire.
* **Atomisation des Flux :** La création d'un virement (via la procédure stockée creerVirement) génère automatiquement et de manière atomique deux mouvements en base de données : un débit sur le compte émetteur et un crédit sur le compte récepteur. Une évolution fonctionnelle est intégrée pour gérer de manière sécurisée les virements inter-utilisateurs.
* **Spécifications Complètes :** Le document de conception de référence est accessible via le lien suivant : [Google Doc - Spécifications Money API](https://docs.google.com/document/d/1BjyCx92OEzXsKWaT_WiEJuKxd-OY3fIjIaO5Hr42Un0/edit?tab=t.0).

---

## 2. Instructions d'Installation, de Démarrage et d'Arrêt

### Étape A : Cloner le projet et créer une branche de travail
Avant d'écrire du code, cloner le dépôt et s'isoler sur une branche de travail dédiée :
```bash
# Clonage du dépôt
git clone https://github.com/RayyZink/MoneyMakers.git
cd MoneyMakers

# Création d'une branche de travail
git checkout -b feature/[nom_de_la_branche]
```

### Étape B : Lancer l'environnement de développement conteneurisé
L'intégralité de l'environnement (base de données MySQL 8.0 et serveur d'application Node.js) est configurée pour s'exécuter dans Docker. L'installation des packages s'effectue automatiquement au démarrage de l'infrastructure.

1. S'assurer que le script SQL se trouve dans le répertoire `./docker/db/database.sql`.
2. Ouvrir un terminal à la racine du projet et exécuter la commande suivante pour construire et démarrer l'écosystème en arrière-plan :
```bash
docker compose up -d
```

### Étape C : Suivre la compilation et les logs applicatifs
Le conteneur applicatif gère lui-même l'installation des dépendances et démarre le serveur avec rechargement automatique.
1. Consulter les logs en temps réel pour vérifier le bon démarrage ou inspecter les erreurs :
```bash
docker logs -f money_api_container
```
2. L'API est active et accessible sur l'URL : `http://localhost:3000/api/v1`.

### Étape D : Fermer et arrêter proprement l'environnement de travail
1. Ouvrir un terminal à la racine du projet et exécuter la commande suivante pour éteindre les conteneurs tout en préservant intactes les données de la base de données :
```bash
docker compose down
```
2. Dans le cas exceptionnel où une réinitialisation totale de la base de données est requise (prise en compte de modifications structurelles dans le fichier `database.sql`), exécuter la commande suivante pour supprimer également le volume de stockage associé :
```bash
docker compose down -v
```

---

## 3. Description des Fichiers et Rôles de l'Architecture

L'architecture respecte le design pattern en couches organisé par fonctionnalités (feature-based) sous le répertoire `src/features/`. Le couplage entre les classes est réalisé par injection de dépendances manuelle par constructeur.

* **`routes.ts` :** Point d'entrée d'un module. Définir les URI et associer les verbes HTTP (GET, POST, etc.) conformes au contrat OpenAPI. Instancier le Repository, le passer au Service, puis passer le Service au Controller.
* **`controller.ts` (Thin Controller) :** Gérer uniquement l'interface HTTP. Extraire les données de la requête (req.params, req.body), vérifier l'identité de l'utilisateur via le token, déléguer le traitement au Service et formater la réponse JSON finale. Ne contenir aucun SQL ni logique métier. Pousser toutes les erreurs vers le bas via la fonction next(error).
* **`service.ts` :** Cœur de la logique métier applicative. Appliquer les règles de gestion du budget, filtrer les permissions de accès et transformer les structures de données. Rester totalement découplé d'Express et du protocole HTTP. Convertir les formats bruts SQL en camelCase normalisé pour le JSON.
* **`repository.ts` :** Unique passerelle vers la base de données. Contenir l'intégralité des requêtes SQL pures et les appels de procédures stockées. Recevoir l'instance de connexion globale Pool par son constructeur.
* **`src/app.ts` :** Fichier de configuration d'Express. Centraliser les middlewares de sécurité (helmet, cors, rate-limit), monter les routes de l'équipe et héberger le middleware global de gestion des erreurs (`src/middlewares/error.ts`) chargé de capturer les exceptions Zod ou les codes 45000 des triggers SQL.

---

## 4. Exemple d'Implémentation

Pour comprendre comment implémenter les requêtes sur les branches respectives, voici le modèle d'architecture complet pour le endpoint `GET /comptes/{idCompte}/mouvements` rédigé ici à titre d'exemple.

### Fichier `src/features/mouvements/repository.ts`
```typescript
import { Pool } from 'mysql2/promise';

export class MouvementsRepository {
  // Injection du pool de connexion par le constructeur
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

### Fichier `src/features/mouvements/service.ts`
```typescript
import { MouvementsRepository } from './repository';

export class MouvementsService {
  // Injection du repository par le constructeur
  constructor(private mouvementsRepository: MouvementsRepository) {}

  async getMouvementsPourCompte(idCompte: number) {
    const lignesDonnees = await this.mouvementsRepository.findMouvementsByCompteId(idCompte);
    
    // Transformation des données SQL vers le format JSON camelCase du Swagger
    return lignesDonnees.map(row => ({
      idMouvement: row.idMouvement,
      dateMouvement: row.dateMouvement,
      descriptionCompte: row.descriptionCompte,
      nomTiers: row.nomTiers || null,
      nomCategorie: row.nomCategorie || null,
      nomSousCategorie: row.nomSousCategorie || null,
      montant: parseFloat(row.montant),
      typeMouvement: row.typeMouvement
    }));
  }
}
```

### Fichier `src/features/mouvements/controller.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { MouvementsService } from './service';

export class MouvementsController {
  // Injection du service par le constructeur
  constructor(private mouvementsService: MouvementsService) {}

  async getMouvements(req: Request, res: Response, next: NextFunction) {
    try {
      // Extraction et typage des paramètres de l'URL HTTP
      const idCompte = parseInt(req.params.idCompte, 10);
      
      // Délégation du traitement de fond à la couche métier
      const resultats = await this.mouvementsService.getMouvementsPourCompte(idCompte);
      
      // Envoi de la réponse HTTP standardisée avec le code 200 OK
      return res.status(200).json({
        data: resultats,
        meta: {
          page: 1,
          limit: resultats.length,
          total: resultats.length,
          totalPages: 1
        }
      });
    } catch (error) {
      // En cas d'erreur, passage au middleware global sans bloquer l'API
      next(error);
    }
  }
}
```

### Fichier `src/features/mouvements/routes.ts`
```typescript
import { Router } from 'express';
import { MouvementsController } from './controller';
import { MouvementsService } from './service';
import { MouvementsRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

// Assemblage par couplage faible conformément au cours
const repository = new MouvementsRepository(pool);
const service = new MouvementsService(repository);
const controller = new MouvementsController(service);

// Association de l'URI, de la méthode HTTP et de la fonction du contrôleur
router.get('/:idCompte/mouvements', (req, res, next) =>
    controller.getMouvements(req, res, next)
);

export default router;
```

---

## 5. Répartition Officielle des Modules de l'Équipe

Afin d'éviter tout conflit de versioning, chaque membre doit développer uniquement les endpoints liés à sa fonctionnalité désignée :

* **Rania :** Module `comptes` (7 routes) -> Lister, créer, récupérer, modifier, supprimer les comptes d'un utilisateur, et calcul du solde historique à une date donnée.
* **Milan :** Modules `mouvements` & `virements` (Partie 1) -> Liste paginée et filtrée des mouvements d'un compte, création de mouvements, et `POST /virements` pour initier l'appel à la procédure stockée.
* **Théophile :** Modules `categories` & `virements` (Partie 2) -> Gestion complète du catalogue des catégories (système et personnelles), consultation d'un virement unitaire par son ID, modification et suppression de virements.
* **Leo :** Modules `auth` (Logout) & `utilisateurs` -> Gestion de la déconnexion, récupération sécurisée du profil utilisateur et modification des informations personnelles (ville, code postal, etc.).
* **Corentin :** Modules `sous-categories`, `tiers` & `auth` (Register/Login) -> CRUD complet sur les sous-catégories rattachées aux catégories parentes, gestion complète des tiers par défaut de l'utilisateur, et formulaires d'inscription/connexion pour la délivrance du token JWT.