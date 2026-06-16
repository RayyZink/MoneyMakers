import { Request, Response, NextFunction } from 'express';
import { MouvementsService, MouvementCreationDTO } from './service';

export class MouvementsController {
    constructor(private mouvementsService: MouvementsService) {}

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

            const resultat = await this.mouvementsService.getMouvementsPourCompte(
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

            const mouvement = await this.mouvementsService.createMouvement(idCompte, dto);

            return res.status(201).json(mouvement);
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------------------------------------------
    // GET /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async getMouvementById(req: Request, res: Response, next: NextFunction) {
        try {
            const idMouvement = parseInt(req.params.idMouvement, 10);

            const mouvement = await this.mouvementsService.getMouvementById(idMouvement);

            return res.status(200).json(mouvement);
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------------------------------------------
    // PUT /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async updateMouvement(req: Request, res: Response, next: NextFunction) {
        try {
            const idMouvement = parseInt(req.params.idMouvement, 10);
            const dto         = req.body as MouvementCreationDTO;

            const mouvement = await this.mouvementsService.updateMouvement(idMouvement, dto);

            return res.status(200).json(mouvement);
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------------------------------------------
    // DELETE /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async deleteMouvement(req: Request, res: Response, next: NextFunction) {
        try {
            const idMouvement = parseInt(req.params.idMouvement, 10);

            await this.mouvementsService.deleteMouvement(idMouvement);

            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
