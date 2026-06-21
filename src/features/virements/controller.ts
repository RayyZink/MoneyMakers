import { Request, Response, NextFunction } from 'express';
import { VirementsService, VirementCreationDTO, VirementUpdateDTO } from './service';

export class VirementsController {
    constructor(private virementsService: VirementsService) {}

    // ----------------------------------------------------------------
    // POST /virements
    // ----------------------------------------------------------------
    async createVirement(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as VirementCreationDTO;
            return res.status(201).json(await this.virementsService.createVirement(dto));
        } catch (error) { next(error); }
    }

    // ----------------------------------------------------------------
    // GET /virements/:idVirement
    // ----------------------------------------------------------------
    async getVirementById(req: Request, res: Response, next: NextFunction) {
        try {
            const idVirement = parseInt(req.params.idVirement, 10);
            return res.status(200).json(await this.virementsService.getVirementById(idVirement));
        } catch (error) { next(error); }
    }

    // ----------------------------------------------------------------
    // PUT /virements/:idVirement — mise à jour partielle
    // ----------------------------------------------------------------
    async updateVirement(req: Request, res: Response, next: NextFunction) {
        try {
            const idVirement = parseInt(req.params.idVirement, 10);
            const body = req.body as Record<string, unknown>;

            const dto: VirementUpdateDTO = {};
            if ('montant'      in body) dto.montant      = body.montant      as number;
            if ('dateVirement' in body) dto.dateVirement = body.dateVirement as string | null;
            if ('commentaire'  in body) dto.commentaire  = body.commentaire  as string | null;

            return res.status(200).json(await this.virementsService.updateVirement(idVirement, dto));
        } catch (error) { next(error); }
    }

    // ----------------------------------------------------------------
    // DELETE /virements/:idVirement
    // ----------------------------------------------------------------
    async deleteVirement(req: Request, res: Response, next: NextFunction) {
        try {
            const idVirement = parseInt(req.params.idVirement, 10);
            await this.virementsService.deleteVirement(idVirement);
            return res.status(204).send();
        } catch (error) { next(error); }
    }
}
