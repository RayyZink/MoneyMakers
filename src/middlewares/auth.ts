import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: {
        idUtilisateur: number;
        login: string;
    };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            code: 401,
            message: "Token manquant ou invalide"
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { idUtilisateur: number; login: string };
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            code: 401,
            message: "Token manquant ou invalide"
        });
    }
};