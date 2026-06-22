import { Router } from 'express';
import { VirementsController } from './controller';
import { VirementsService } from './service';
import { VirementsRepository } from './repository';
import { pool } from '../../config/database';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

const repository = new VirementsRepository(pool);
const service    = new VirementsService(repository);
const controller = new VirementsController(service);

router.use(authMiddleware);

router.post('/', (req, res, next) => controller.createVirement(req, res, next));
router.get('/:idVirement', (req, res, next) => controller.getVirementById(req, res, next));
router.put('/:idVirement', (req, res, next) => controller.updateVirement(req, res, next));
router.delete('/:idVirement', (req, res, next) => controller.deleteVirement(req, res, next));

export default router;
