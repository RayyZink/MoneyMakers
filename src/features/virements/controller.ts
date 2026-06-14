import { Request, Response, NextFunction } from 'express';
import { VirementsService } from './service';

export class VirementsController {
    constructor(private virementsService: VirementsService) {}
}