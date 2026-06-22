import { Router, Request, Response } from 'express';
import { ComptesController } from './controller';
import { ComptesService } from './service';
import { ComptesRepository } from './repository';
import { pool } from '../../config/database';
import { authMiddleware } from '../../middlewares/auth';

const repository = new ComptesRepository(pool);
const service = new ComptesService(repository);
const controller = new ComptesController(service);

// Router 1 : à monter sur /api/v1/utilisateurs
export const comptesUtilisateursRouter = Router();
comptesUtilisateursRouter.get('/:idUtilisateur/comptes', authMiddleware, controller.getComptes);
comptesUtilisateursRouter.post('/:idUtilisateur/comptes', authMiddleware, controller.createCompte);

// Router 2 : à monter sur /api/v1/comptes
export const comptesRouter = Router();

comptesRouter.options('/:idCompte', (req: Request, res: Response) => {
    res.set('Allow', 'GET, PUT, DELETE, OPTIONS');
    res.status(204).send();
});

comptesRouter.get('/:idCompte', authMiddleware, controller.getCompteById);
comptesRouter.put('/:idCompte', authMiddleware, controller.updateCompte);
comptesRouter.delete('/:idCompte', authMiddleware, controller.deleteCompte);
comptesRouter.get('/:idCompte/solde', authMiddleware, controller.getSolde);

// GET  /comptes/:idCompte/mouvements  — liste paginée + filtres
comptesRouter.get('/:idCompte/mouvements', authMiddleware, (req, res, next) =>
    controller.getMouvements(req, res, next)
);

// POST /comptes/:idCompte/mouvements  — créer un mouvement
comptesRouter.post('/:idCompte/mouvements', authMiddleware, (req, res, next) =>
    controller.createMouvement(req, res, next)
);

export default comptesRouter;