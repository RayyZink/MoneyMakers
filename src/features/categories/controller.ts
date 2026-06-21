import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export class CategoriesController {
    constructor(private categoriesService: CategoriesService) { }

private getUserId(req: AuthenticatedRequest): number {
    const idUtilisateur = req.user?.idUtilisateur;

    if (!idUtilisateur) {
        throw new Error('Utilisateur non authentifié');
    }

    return idUtilisateur;
}

async getAll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const idUtilisateur = this.getUserId(req);

        const resultats = await this.categoriesService.getAll(idUtilisateur);

        return res.status(200).json({
            data: resultats,
            meta: {
                page: 1,
                limit: resultats.length,
                total: resultats.length,
                totalPages: 1,
            },
        });
    } catch (error) {
        next(error);
    }
}

async getById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const idUtilisateur = this.getUserId(req);
        const idCategorie = parseInt(req.params.idCategorie, 10);

        const resultat = await this.categoriesService.getById(
            idCategorie,
            idUtilisateur
        );

        return res.status(200).json({
            data: resultat,
            meta: {
                page: 1,
                limit: resultat ? 1 : 0,
                total: resultat ? 1 : 0,
                totalPages: 1,
            },
        });
    } catch (error) {
        next(error);
    }
}

async create(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const idUtilisateur = this.getUserId(req);

        const { nomCategorie } = req.body;

        const resultat = await this.categoriesService.create(
            nomCategorie,
            idUtilisateur
        );

        return res.status(201).json({
            data: resultat,
            meta: {
                page: 1,
                limit: 1,
                total: 1,
                totalPages: 1,
            },
        });
    } catch (error) {
        next(error);
    }
}

async update(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const idUtilisateur = this.getUserId(req);
        const idCategorie = parseInt(req.params.idCategorie, 10);
        const { nomCategorie } = req.body;

        const resultat = await this.categoriesService.update(
            idCategorie,
            nomCategorie,
            idUtilisateur
        );

        return res.status(200).json({
            data: resultat,
            meta: {
                page: 1,
                limit: 1,
                total: 1,
                totalPages: 1,
            },
        });
    } catch (error) {
        next(error);
    }
}

async delete(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const idUtilisateur = this.getUserId(req);
        const idCategorie = parseInt(req.params.idCategorie, 10);

        const resultat = await this.categoriesService.delete(
            idCategorie,
            idUtilisateur
        );

        return res.status(200).json({
            data: resultat,
            meta: {
                page: 1,
                limit: 1,
                total: 1,
                totalPages: 1,
            },
        });
    } catch (error) {
        next(error);
    }
}

}