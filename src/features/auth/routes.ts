import { Router } from 'express';
import { AuthController } from './controller';
import { AuthService } from './service';
import { AuthRepository } from './repository';
import { pool } from '../../config/database';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

const repository = new AuthRepository(pool);
const service = new AuthService(repository);
const controller = new AuthController(service);

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', authMiddleware, controller.logout);

export default router;