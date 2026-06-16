import { Router } from 'express';
import { UtilisateursController } from './controller';
import { UtilisateursService } from './service';
import { UtilisateursRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new UtilisateursRepository(pool);
const service = new UtilisateursService(repository);
const controller = new UtilisateursController(service);

export default router;