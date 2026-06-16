import { Router } from 'express';
import { CategoriesController } from './controller';
import { CategoriesService } from './service';
import { CategoriesRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new CategoriesRepository(pool);
const service = new CategoriesService(repository);
const controller = new CategoriesController(service);

export default router;