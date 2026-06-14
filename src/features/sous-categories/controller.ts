import { Request, Response, NextFunction } from 'express';
import { SousCategoriesService } from './service';

export class SousCategoriesController {
    constructor(private sousCategoriesService: SousCategoriesService) {}
}