import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './service';

export class CategoriesController {
    constructor(private categoriesService: CategoriesService) {}
}