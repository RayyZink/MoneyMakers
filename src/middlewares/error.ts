import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    // 1. Interception du code SQLSTATE 45000 levé par les triggers MySQL
    if (err.sqlState === '45000') {
        return res.status(422).json({
            code: 422,
            message: "Erreur de validation des contraintes métiers (Base de données)",
            details: err.message
        });
    }

    // 2. Erreurs de validation de format d'entrée
    if (err.name === 'ZodError') {
        return res.status(400).json({
            code: 400,
            message: "Format de la requête invalide",
            details: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
    }

    // 3. Erreur générique par défaut (500)
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        code: statusCode,
        message: statusCode === 500 ? "Internal Server Error" : err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : null
    });
};