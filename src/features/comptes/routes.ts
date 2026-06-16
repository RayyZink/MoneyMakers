import { Router } from 'express';
import { ComptesController } from './controller';
import { ComptesService } from './service';
import { ComptesRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new ComptesRepository(pool);
const service = new ComptesService(repository);
const controller = new ComptesController(service);

router.get('/utilisateurs/:idUtilisateur', controller.getComptes);
router.post('/utilisateurs/:idUtilisateur', controller.createCompte);

router.get('/:idCompte', controller.getCompteById);
router.put('/:idCompte', controller.updateCompte);
router.delete('/:idCompte', controller.deleteCompte);

router.get('/:idCompte/solde', controller.getSolde);

export default router;