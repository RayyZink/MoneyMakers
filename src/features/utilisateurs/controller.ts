import { Request, Response, NextFunction } from 'express';
import { UtilisateursService } from './service';

export class UtilisateursController {
    constructor(private utilisateursService: UtilisateursService) {}
}