import { Request, Response, NextFunction } from 'express';
import { MouvementsService } from './service';

export class MouvementsController {
    // Injection du service par le constructeur
    constructor(private mouvementsService: MouvementsService) {}

    async getMouvements(req: Request, res: Response, next: NextFunction) {
        try {
            const idCompte = parseInt(req.params.idCompte, 10);

            const resultats = await this.mouvementsService.getMouvementsPourCompte(idCompte);

            return res.status(200).json({
                data: resultats,
                meta: {
                    page: 1,
                    limit: resultats.length,
                    total: resultats.length,
                    totalPages: 1
                }
            });
        } catch (error) {
            next(error);
        }
    }
}