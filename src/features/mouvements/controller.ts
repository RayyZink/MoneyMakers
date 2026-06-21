import { Request, Response, NextFunction } from 'express';
import { MouvementsService, MouvementUpdateDTO } from './service';

export class MouvementsController {
    constructor(private mouvementsService: MouvementsService) {}


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

            // Mise à jour partielle : on ne transmet que les champs
            // explicitement présents dans le body.
            const body = req.body as Record<string, unknown>;
            const dto: MouvementUpdateDTO = {};
            if ('dateMouvement'   in body) dto.dateMouvement   = body.dateMouvement   as string | null;
            if ('idTiers'         in body) dto.idTiers         = body.idTiers         as number | null;
            if ('idCategorie'     in body) dto.idCategorie     = body.idCategorie     as number | null;
            if ('idSousCategorie' in body) dto.idSousCategorie = body.idSousCategorie as number | null;
            if ('montant'         in body) dto.montant         = body.montant         as number;
            if ('typeMouvement'   in body) dto.typeMouvement   = body.typeMouvement   as 'D' | 'C';

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
