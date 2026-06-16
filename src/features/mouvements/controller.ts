import { Request, Response, NextFunction } from 'express';
import { MouvementsService, MouvementCreationDTO } from './service';

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
