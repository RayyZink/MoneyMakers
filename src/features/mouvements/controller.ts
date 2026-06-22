import { Request, Response, NextFunction } from 'express';
import { MouvementsService, MouvementUpdateDTO } from './service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export class MouvementsController {
    constructor(private mouvementsService: MouvementsService) {}

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
    // GET /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async getMouvementById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const idMouvement = parseInt(req.params.idMouvement, 10);

            const mouvement = await this.mouvementsService.getMouvementById(idMouvement, idUtilisateur);

            return res.status(200).json(mouvement);
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------------------------------------------
    // PUT /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async updateMouvement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const idMouvement = parseInt(req.params.idMouvement, 10);

            const body = req.body as Record<string, unknown>;
            const dto: MouvementUpdateDTO = {};
            if ('dateMouvement'   in body) dto.dateMouvement   = body.dateMouvement   as string | null;
            if ('idTiers'         in body) dto.idTiers         = body.idTiers         as number | null;
            if ('idCategorie'     in body) dto.idCategorie     = body.idCategorie     as number | null;
            if ('idSousCategorie' in body) dto.idSousCategorie = body.idSousCategorie as number | null;
            if ('montant'         in body) dto.montant         = body.montant         as number;
            if ('typeMouvement'   in body) dto.typeMouvement   = body.typeMouvement   as 'D' | 'C';

            const mouvement = await this.mouvementsService.updateMouvement(idMouvement, idUtilisateur, dto);

            return res.status(200).json(mouvement);
        } catch (error) {
            next(error);
        }
    }

    // ----------------------------------------------------------------
    // DELETE /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async deleteMouvement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const idMouvement = parseInt(req.params.idMouvement, 10);

            await this.mouvementsService.deleteMouvement(idMouvement, idUtilisateur);

            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
