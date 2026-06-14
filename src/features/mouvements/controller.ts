import { Request, Response, NextFunction } from 'express';
import { MouvementsService } from './service';

export class MouvementsController {
    constructor(private mouvementsService: MouvementsService) {}
}