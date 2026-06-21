import { Router } from 'express';
import { CategoriesController } from './controller';
import { CategoriesService } from './service';
import { CategoriesRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new CategoriesRepository(pool);
const service = new CategoriesService(repository);
const controller = new CategoriesController(service);


import { authMiddleware } from '../../middlewares/auth';

router.use(authMiddleware);

router.get('/', controller.getAll.bind(controller));
router.get('/:idCategorie', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:idCategorie', controller.update.bind(controller));
router.delete('/:idCategorie', controller.delete.bind(controller));

export default router;