import { Router } from 'express';
import { SousCategoriesController } from './controller';
import { SousCategoriesService } from './service';
import { SousCategoriesRepository } from './repository';
import { pool } from '../../config/database';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

const repository = new SousCategoriesRepository(pool);
const service = new SousCategoriesService(repository);
const controller = new SousCategoriesController(service);

// Sécurisation globale
router.use(authMiddleware);

// Routes imbriquées sous /categories
router.get('/categories/:idCategorie/sous-categories', (req, res, next) => controller.getByCategorie(req, res, next));
router.post('/categories/:idCategorie/sous-categories', (req, res, next) => controller.create(req, res, next));

// Routes directes sous /sous-categories
router.get('/sous-categories/:idSousCategorie', (req, res, next) => controller.getById(req, res, next));
router.put('/sous-categories/:idSousCategorie', (req, res, next) => controller.update(req, res, next));
router.delete('/sous-categories/:idSousCategorie', (req, res, next) => controller.delete(req, res, next));

export default router;