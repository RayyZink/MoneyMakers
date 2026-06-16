import { Request, Response, NextFunction } from 'express';
import { TiersService } from './service';

export class TiersController {
    constructor(private tiersService: TiersService) {}
}