import { Router } from 'express';
import { ComptesController } from './controller';
import { ComptesService } from './service';
import { ComptesRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new ComptesRepository(pool);
const service = new ComptesService(repository);
const controller = new ComptesController(service);

export default router;


// GET  /comptes/:idCompte/mouvements  — liste paginée + filtres
router.get('/:idCompte/mouvements', (req, res, next) =>
    controller.getMouvements(req, res, next)
);

// POST /comptes/:idCompte/mouvements  — créer un mouvement
router.post('/:idCompte/mouvements', (req, res, next) =>
    controller.createMouvement(req, res, next)
);