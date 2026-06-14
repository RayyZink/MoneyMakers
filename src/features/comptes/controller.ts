import { Request, Response, NextFunction } from 'express';
import { ComptesService } from './service';

export class ComptesController {
    constructor(private comptesService: ComptesService) {}
}