import { Router } from 'express';
import { SousCategoriesController } from './controller';
import { SousCategoriesService } from './service';
import { SousCategoriesRepository } from './repository';
import { pool } from '../../config/database';

const router = Router();

const repository = new SousCategoriesRepository(pool);
const service = new SousCategoriesService(repository);
const controller = new SousCategoriesController(service);

export default router;