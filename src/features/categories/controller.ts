import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export class CategoriesController {
    constructor(private categoriesService: CategoriesService) { }

    private getUserId(req: AuthenticatedRequest): number {
        const idUtilisateur = req.user?.idUtilisateur;

        if (idUtilisateur === undefined || idUtilisateur === null) {
            const error = new Error('Utilisateur non authentifié') as Error & { statusCode?: number };
            error.statusCode = 401;
            throw error;
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

            return res.status(200).json(resultats);
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

            if (!resultat) {
                const error = new Error("Catégorie introuvable.") as Error & { statusCode?: number };
                error.statusCode = 404;
                throw error;
            }

            return res.status(200).json(resultat);
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

            return res.status(201).json(resultat);
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

            return res.status(200).json(resultat);
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

            await this.categoriesService.delete(
                idCategorie,
                idUtilisateur
            );

            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

}
