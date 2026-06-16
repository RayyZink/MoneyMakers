import { Router } from 'express';
import { MouvementsController } from './controller';
import { MouvementsService }    from './service';
import { MouvementsRepository } from './repository';
import { pool }                 from '../../config/database';

const router = Router();

const repository = new MouvementsRepository(pool);
const service    = new MouvementsService(repository);
const controller = new MouvementsController(service);

// ----------------------------------------------------------------
// Routes sous /comptes/:idCompte/mouvements
// (monté sur le router principal avec le préfixe /comptes)
// ----------------------------------------------------------------



// ----------------------------------------------------------------
// Routes sous /mouvements/:idMouvement
// (monté sur le router principal avec le préfixe /mouvements)
// ----------------------------------------------------------------

// OPTIONS /mouvements/:idMouvement   — CORS preflight
router.options('/:idMouvement', (_req, res) => {
    res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
    return res.status(204).send();
});

// GET    /mouvements/:idMouvement    — récupérer (vue enrichie)
router.get('/:idMouvement', (req, res, next) =>
    controller.getMouvementById(req, res, next)
);

// PUT    /mouvements/:idMouvement    — modifier
router.put('/:idMouvement', (req, res, next) =>
    controller.updateMouvement(req, res, next)
);

// DELETE /mouvements/:idMouvement    — supprimer
router.delete('/:idMouvement', (req, res, next) =>
    controller.deleteMouvement(req, res, next)
);

export default router;