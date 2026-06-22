import { Request, Response, NextFunction } from 'express';
import { VirementsService, VirementCreationDTO, VirementUpdateDTO } from './service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export class VirementsController {
    constructor(private virementsService: VirementsService) {}

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
    // POST /virements
    // ----------------------------------------------------------------
    async createVirement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const dto = req.body as VirementCreationDTO;
            return res.status(201).json(await this.virementsService.createVirement(dto, idUtilisateur));
        } catch (error) { next(error); }
    }

    // ----------------------------------------------------------------
    // GET /virements/:idVirement
    // ----------------------------------------------------------------
    async getVirementById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const idVirement = parseInt(req.params.idVirement, 10);
            return res.status(200).json(await this.virementsService.getVirementById(idVirement, idUtilisateur));
        } catch (error) { next(error); }
    }

    // ----------------------------------------------------------------
    // PUT /virements/:idVirement — mise à jour partielle
    // ----------------------------------------------------------------
    async updateVirement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const idVirement = parseInt(req.params.idVirement, 10);
            const body = req.body as Record<string, unknown>;

            const dto: VirementUpdateDTO = {};
            if ('montant'      in body) dto.montant      = body.montant      as number;
            if ('dateVirement' in body) dto.dateVirement = body.dateVirement as string | null;
            if ('commentaire'  in body) dto.commentaire  = body.commentaire  as string | null;

            return res.status(200).json(await this.virementsService.updateVirement(idVirement, idUtilisateur, dto));
        } catch (error) { next(error); }
    }

    // ----------------------------------------------------------------
    // DELETE /virements/:idVirement
    // ----------------------------------------------------------------
    async deleteVirement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const idUtilisateur = this.getUserId(req);
            const idVirement = parseInt(req.params.idVirement, 10);
            await this.virementsService.deleteVirement(idVirement, idUtilisateur);
            return res.status(204).send();
        } catch (error) { next(error); }
    }
}
