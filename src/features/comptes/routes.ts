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