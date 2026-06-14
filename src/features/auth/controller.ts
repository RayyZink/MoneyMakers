import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';

export class AuthController {
    constructor(private authService: AuthService) {}
}