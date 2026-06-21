import { Router } from 'express';
import { TiersController } from './controller';
import { TiersService } from './service';
import { TiersRepository } from './repository';
import { pool } from '../../config/database';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

const repository = new TiersRepository(pool);
const service = new TiersService(repository);
const controller = new TiersController(service);

// Sécurisation globale du routeur
router.use(authMiddleware);

router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:idTiers', (req, res, next) => controller.getById(req, res, next));
router.post('/', (req, res, next) => controller.create(req, res, next));
router.put('/:idTiers', (req, res, next) => controller.update(req, res, next));
router.delete('/:idTiers', (req, res, next) => controller.delete(req, res, next));

export default router;