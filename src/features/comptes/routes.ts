import { Router, Request, Response } from 'express';
import { ComptesController } from './controller';
import { ComptesService } from './service';
import { ComptesRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new ComptesRepository(pool);
const service = new ComptesService(repository);
const controller = new ComptesController(service);

// GET  /comptes/:idCompte/mouvements  — liste paginée + filtres
router.get('/:idCompte/mouvements', (req, res, next) =>
    controller.getMouvements(req, res, next)
);

// POST /comptes/:idCompte/mouvements  — créer un mouvement
router.post('/:idCompte/mouvements', (req, res, next) =>
    controller.createMouvement(req, res, next)
);
// Router 1 : à monter sur /api/v1/utilisateurs
export const comptesUtilisateursRouter = Router();
comptesUtilisateursRouter.get('/:idUtilisateur/comptes', controller.getComptes);
comptesUtilisateursRouter.post('/:idUtilisateur/comptes', controller.createCompte);

// Router 2 : à monter sur /api/v1/comptes
export const comptesRouter = Router();

comptesRouter.options('/:idCompte', (req: Request, res: Response) => {
    res.set('Allow', 'GET, PUT, DELETE, OPTIONS');
    res.status(204).send();
});

comptesRouter.get('/:idCompte', controller.getCompteById);
comptesRouter.put('/:idCompte', controller.updateCompte);
comptesRouter.delete('/:idCompte', controller.deleteCompte);
comptesRouter.get('/:idCompte/solde', controller.getSolde);

export default comptesRouter;