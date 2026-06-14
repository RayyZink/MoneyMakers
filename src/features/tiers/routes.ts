import { Router } from 'express';
import { TiersController } from './controller';
import { TiersService } from './service';
import { TiersRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new TiersRepository(pool);
const service = new TiersService(repository);
const controller = new TiersController(service);

export default router;