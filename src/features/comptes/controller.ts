import { Request, Response, NextFunction } from 'express';
import { ComptesService, MouvementCreationDTO } from './service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export class ComptesController {
    constructor(private comptesService: ComptesService) {}

    private getUserId(req: AuthenticatedRequest): number {
        const idUtilisateur = req.user?.idUtilisateur;
        if (idUtilisateur === undefined || idUtilisateur === null) {
            const error: any = new Error('Utilisateur non authentifié');
            error.statusCode = 401;
            throw error;
        }
        return idUtilisateur;
    }

    // ----------------------------------------------------------------
    // GET /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async getMouvements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const idCompte = parseInt(req.params.idCompte, 10);

            const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
            const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));

            const filtres = {
                dateDebut:     req.query.dateDebut     as string | undefined,
                dateFin:       req.query.dateFin       as string | undefined,
                typeMouvement: req.query.typeMouvement as 'D' | 'C' | undefined,
                page,
                limit,
            };

            const resultat = await this.comptesService.getMouvementsPourCompte(
                idCompte,
                idUtilisateur,
                filtres,
            );

            return res.status(200).json(resultat);
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------------------------------------------
    // POST /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async createMouvement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const idCompte = parseInt(req.params.idCompte, 10);
            const dto      = req.body as MouvementCreationDTO;

            const mouvement = await this.comptesService.createMouvement(idCompte, idUtilisateur, dto);

            return res.status(201).json(mouvement);
        } catch (error) {
            next(error);
        }
    }


    getComptes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const idUtilisateur = this.getUserId(req);
            const idCible = Number(req.params.idUtilisateur);

            if (idUtilisateur !== idCible) {
                return res.status(403).json({ code: 403, message: 'Accès refusé.' });
            }

            const comptes = await this.comptesService.getComptes(idUtilisateur);
            res.status(200).json(comptes);
        } catch (error) {
            next(error);
        }
    };

    getCompteById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const idUtilisateur = this.getUserId(req);
            const idCompte = Number(req.params.idCompte);
            const compte = await this.comptesService.getCompteById(idCompte, idUtilisateur);
            if (!compte) {
                return res.status(404).json({ code: 404, message: "Compte non trouvé" });
            }
            res.status(200).json(compte);
        } catch (error) {
            next(error);
        }
    };

    createCompte = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const idUtilisateur = this.getUserId(req);
            const idCible = Number(req.params.idUtilisateur);

            if (idUtilisateur !== idCible) {
                return res.status(403).json({ code: 403, message: 'Accès refusé.' });
            }

            const { descriptionCompte, nomBanque, montantInitial } = req.body;
            const compte = await this.comptesService.createCompte(idUtilisateur, descriptionCompte, nomBanque, montantInitial ?? 0);
            res.status(201).json(compte);
        } catch (error) {
            next(error);
        }
    };

    updateCompte = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const idUtilisateur = this.getUserId(req);
            const idCompte = Number(req.params.idCompte);

            const body = req.body as Record<string, unknown>;
            const champs: { descriptionCompte?: string; nomBanque?: string } = {};
            if ('descriptionCompte' in body) champs.descriptionCompte = body.descriptionCompte as string;
            if ('nomBanque'          in body) champs.nomBanque          = body.nomBanque as string;

            const compte = await this.comptesService.updateCompte(idCompte, idUtilisateur, champs);
            res.status(200).json(compte);
        } catch (error) {
            next(error);
        }
    };

    deleteCompte = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const idUtilisateur = this.getUserId(req);
            const idCompte = Number(req.params.idCompte);
            await this.comptesService.deleteCompte(idCompte, idUtilisateur);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    getSolde = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const idUtilisateur = this.getUserId(req);
            const idCompte = Number(req.params.idCompte);
            const date = req.query.date as string;
            const solde = await this.comptesService.getSolde(idCompte, idUtilisateur, date);
            res.status(200).json(solde);
        } catch (error) {
            next(error);
        }
    };

}