import { Request, Response, NextFunction } from 'express';

// Interface interne pour typer les erreurs
interface AppError extends Error {
    statusCode?: number;
    sqlState?: string;
    errors?: Array<{ path: string[]; message: string }>;
}

/**
 * Middleware global de gestion des erreurs — Express 4.x.
 *
 * Doit être enregistré EN DERNIER dans app.ts (après toutes les routes).
 * Les controllers délèguent via next(error) ; aucun try/catch ici.
 *
 * Priorité de traitement :
 *   1. Triggers MySQL SQLSTATE 45000  → 422 Unprocessable Entity
 *   2. Erreurs de validation Zod      → 400 Bad Request
 *   3. Erreurs JWT                    → 401 Unauthorized
 *   4. Erreurs HTTP métier (4xx)      → statusCode porté par l'erreur
 *   5. Erreur générique               → 500 Internal Server Error
 */
export const errorMiddleware = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Trigger MySQL SQLSTATE '45000'
    if (err.sqlState === '45000') {
        res.status(422).json({
            code: 422,
            message: 'Erreur de validation des contraintes métier (base de données)',
            details: err.message,
        });
        return;
    }

    // 2. Erreur de validation Zod
    if (err.name === 'ZodError') {
        res.status(400).json({
            code: 400,
            message: 'Format de la requête invalide',
            details: err.errors
                ?.map((e) => `${e.path.join('.')}: ${e.message}`)
                .join(', '),
        });
        return;
    }

    // Erreurs JWT
    if (
        err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError' ||
        err.name === 'NotBeforeError'
    ) {
        res.status(401).json({
            code: 401,
            message: 'Token manquant ou invalide',
            details:
                process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
        return;
    }

    // Erreurs HTTP métier (statusCode porté par l'erreur)
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
        res.status(err.statusCode).json({
            code: err.statusCode,
            message: err.message,
        });
        return;
    }

    // Erreur générique 500
    console.error('[MoneyMakers] Erreur non gérée :', err);
    res.status(500).json({
        code: 500,
        message: 'Internal Server Error',
        // La stack n'est exposée qu'en développement pour éviter les fuites d'info.
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};