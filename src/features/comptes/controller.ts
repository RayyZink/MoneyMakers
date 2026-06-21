import { Request, Response, NextFunction } from 'express';
import { ComptesService, MouvementCreationDTO } from './service';

export class ComptesController {
    constructor(private comptesService: ComptesService) {}

    // ----------------------------------------------------------------
    // GET /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async getMouvements(req: Request, res: Response, next: NextFunction) {
        try {
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
    async createMouvement(req: Request, res: Response, next: NextFunction) {
        try {
            const idCompte = parseInt(req.params.idCompte, 10);
            const dto      = req.body as MouvementCreationDTO;

            const mouvement = await this.comptesService.createMouvement(idCompte, dto);

            return res.status(201).json(mouvement);
        } catch (error) {
            next(error);
        }
    }


    getComptes = async (req: Request, res: Response) => {
        const idUtilisateur = Number(req.params.idUtilisateur);
        const comptes = await this.service.getComptes(idUtilisateur);
        res.status(200).json(comptes);
    };

    getCompteById = async (req: Request, res: Response) => {
        const idCompte = Number(req.params.idCompte);
        const compte = await this.service.getCompteById(idCompte);
        if (!compte) {
            return res.status(404).json({ message: "Compte non trouvé" });
        }
        res.status(200).json(compte);
    };

    createCompte = async (req: Request, res: Response) => {
        const idUtilisateur = Number(req.params.idUtilisateur);
        const { descriptionCompte, nomBanque, montantInitial } = req.body;
        const compte = await this.service.createCompte(idUtilisateur, descriptionCompte, nomBanque, montantInitial ?? 0);
        res.status(201).json(compte);
    };

    updateCompte = async (req: Request, res: Response) => {
        const idCompte = Number(req.params.idCompte);
        const { descriptionCompte, nomBanque } = req.body;
        const compte = await this.service.updateCompte(idCompte, descriptionCompte, nomBanque);
        res.status(200).json(compte);
    };

    deleteCompte = async (req: Request, res: Response) => {
        const idCompte = Number(req.params.idCompte);
        await this.service.deleteCompte(idCompte);
        res.status(204).send();
    };

    getSolde = async (req: Request, res: Response) => {
        const idCompte = Number(req.params.idCompte);
        const date = req.query.date as string;
        const solde = await this.service.getSolde(idCompte, date);
        res.status(200).json(solde);
    };

}