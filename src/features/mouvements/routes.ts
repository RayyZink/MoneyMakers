import { Router } from 'express';
import { MouvementsController } from './controller';
import { MouvementsService }    from './service';
import { MouvementsRepository } from './repository';
import { pool }                 from '../../config/database';

const router = Router();

const repository = new MouvementsRepository(pool);
const service    = new MouvementsService(repository);
const controller = new MouvementsController(service);

router.get('/:idCompte/mouvements', (req, res, next) =>
    controller.getMouvements(req, res, next)
);

export default router;