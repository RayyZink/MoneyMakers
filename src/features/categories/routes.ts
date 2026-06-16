import { Router } from 'express';
import { CategoriesController } from './controller';
import { CategoriesService } from './service';
import { CategoriesRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new CategoriesRepository(pool);
const service = new CategoriesService(repository);
const controller = new CategoriesController(service);

// Les routes ici sont montées sur /api/v1/categories —
// définir les chemins relatifs à ce router.

router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:idCategorie', (req, res, next) => controller.getById(req, res, next));
router.post('/', (req, res, next) => controller.create(req, res, next));
router.put('/:idCategorie', (req, res, next) => controller.update(req, res, next));
router.delete('/:idCategorie', (req, res, next) => controller.delete(req, res, next));

export default router;