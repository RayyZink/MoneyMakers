import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export class CategoriesController {
    constructor(private categoriesService: CategoriesService) { }


    /**
     * Récupère toutes les catégories pour l'utilisateur spécifié.
     */
    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = req.user?.idUtilisateur ?? (req.query.idUtilisateur ? parseInt(req.query.idUtilisateur as unknown as string, 10) : undefined);
            if (!idUtilisateur) {
                return res.status(400).json({ code: 400, message: 'idUtilisateur manquant (fournir un token ou ?idUtilisateur=...)' });
            }

            // Délégation totale à la couche métier
            const resultats = await this.categoriesService.getAll(idUtilisateur);

            // Réponse HTTP standardisée
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
            // Toutes les erreurs remontent au middleware global — jamais gérées ici
            next(error);
        }
    }

    /**
        * Récupère toutes les catégories pour l'utilisateur spécifié.
        */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = req.user?.idUtilisateur ?? (req.query.idUtilisateur ? parseInt(req.query.idUtilisateur as unknown as string, 10) : undefined);
            if (!idUtilisateur) {
                return res.status(400).json({ code: 400, message: 'idUtilisateur manquant (fournir un token ou ?idUtilisateur=...)' });
            }
            const idCategorie = parseInt(req.params.idCategorie, 10);

            // Délégation totale à la couche métier
            const resultats = await this.categoriesService.getById(idCategorie, idUtilisateur);

            // Réponse HTTP standardisée
            return res.status(200).json({
                data: resultats,
                meta: {
                    page: 1,
                    limit: Array.isArray(resultats) ? resultats.length : 1,
                    total: Array.isArray(resultats) ? resultats.length : 1,
                    totalPages: 1,
                },
            });
        } catch (error) {
            // Toutes les erreurs remontent au middleware global — jamais gérées ici
            next(error);
        }
    }
    

    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = req.user?.idUtilisateur ?? (req.query.idUtilisateur ? parseInt(req.query.idUtilisateur as unknown as string, 10) : undefined);
            if (!idUtilisateur) {
                return res.status(400).json({ code: 400, message: 'idUtilisateur manquant (fournir un token ou ?idUtilisateur=...)' });
            }
            const nomCategorie = req.body.nomCategorie ?? (req.query.nomCategorie ? String(req.query.nomCategorie) : undefined);
            if (!nomCategorie || typeof nomCategorie !== 'string' || !nomCategorie.trim()) {
                return res.status(400).json({ code: 400, message: 'nomCategorie manquant ou invalide (envoyer dans le corps JSON ou ?nomCategorie=...)' });
            }
            const resultats = await this.categoriesService.create(nomCategorie, idUtilisateur);

            return res.status(201).json({
                data: resultats,
                meta: {
                    page: 1,
                    limit: 1,
                    total: 1,
                    totalPages: 1,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = req.user?.idUtilisateur ?? (req.query.idUtilisateur ? parseInt(req.query.idUtilisateur as unknown as string, 10) : undefined);
            if (!idUtilisateur) {
                return res.status(400).json({ code: 400, message: 'idUtilisateur manquant (fournir un token ou ?idUtilisateur=...)' });
            }
            const idCategorie = parseInt(req.params.idCategorie, 10);
            const nomCategorie = req.body.nomCategorie ?? (req.query.nomCategorie ? String(req.query.nomCategorie) : undefined);
            if (!nomCategorie || typeof nomCategorie !== 'string' || !nomCategorie.trim()) {
                return res.status(400).json({ code: 400, message: 'nomCategorie manquant ou invalide (envoyer dans le corps JSON ou ?nomCategorie=...)' });
            }

            const resultats = await this.categoriesService.update(idCategorie, nomCategorie, idUtilisateur);

            return res.status(200).json({
                data: resultats,
                meta: {
                    page: 1,
                    limit: 1,
                    total: 1,
                    totalPages: 1,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const idUtilisateur = req.user?.idUtilisateur ?? (req.query.idUtilisateur ? parseInt(req.query.idUtilisateur as unknown as string, 10) : undefined);
        if (!idUtilisateur) {
            return res.status(400).json({ code: 400, message: 'idUtilisateur manquant (fournir un token ou ?idUtilisateur=...)' });
        }
        const idCategorie = parseInt(req.params.idCategorie, 10);

        const resultats = await this.categoriesService.delete(idCategorie, idUtilisateur);
        try {
            return res.status(200).json({
                data: resultats,
                meta: {
                    page: 1,
                    limit: 1,
                    total: 1,
                    totalPages: 1,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}