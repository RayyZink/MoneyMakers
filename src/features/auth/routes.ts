import { Router } from 'express';
import { AuthController } from './controller';
import { AuthService } from './service';
import { AuthRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new AuthRepository(pool);
const service = new AuthService(repository);
const controller = new AuthController(service);

export default router;