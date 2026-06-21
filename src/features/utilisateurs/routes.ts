import { Router } from 'express';
import { UtilisateursController } from './controller';
import { UtilisateursService } from './service';
import { UtilisateursRepository } from './repository';
import { pool } from '../../config/database';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

const repository = new UtilisateursRepository(pool);
const service = new UtilisateursService(repository);
const controller = new UtilisateursController(service);

router.get('/:idUtilisateur', authMiddleware, controller.getById);
router.put('/:idUtilisateur', authMiddleware, controller.update);

export default router;
