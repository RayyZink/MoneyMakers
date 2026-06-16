import { Router } from 'express';
import { VirementsController } from './controller';
import { VirementsService } from './service';
import { VirementsRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new VirementsRepository(pool);
const service = new VirementsService(repository);
const controller = new VirementsController(service);

export default router;