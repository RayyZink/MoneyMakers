import { Router } from 'express';
import { SousCategoriesController } from './controller';
import { SousCategoriesService } from './service';
import { SousCategoriesRepository } from './repository';
import { pool } from '../../config/database';
import { authMiddleware } from '../../middlewares/auth';

const repository = new SousCategoriesRepository(pool);
const service = new SousCategoriesService(repository);
const controller = new SousCategoriesController(service);

export const sousCategoriesImbriqueesRouter = Router();
sousCategoriesImbriqueesRouter.get('/:idCategorie/sous-categories', authMiddleware, (req, res, next) =>
    controller.getByCategorie(req, res, next)
);
sousCategoriesImbriqueesRouter.post('/:idCategorie/sous-categories', authMiddleware, (req, res, next) =>
    controller.create(req, res, next)
);

export const sousCategoriesRouter = Router();
sousCategoriesRouter.get('/:idSousCategorie', authMiddleware, (req, res, next) => controller.getById(req, res, next));
sousCategoriesRouter.put('/:idSousCategorie', authMiddleware, (req, res, next) => controller.update(req, res, next));
sousCategoriesRouter.delete('/:idSousCategorie', authMiddleware, (req, res, next) => controller.delete(req, res, next));

export default sousCategoriesRouter;