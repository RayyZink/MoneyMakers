import { Request, Response, NextFunction } from 'express';
import { UtilisateursService } from './service';
import { HttpError } from './service';

export class UtilisateursController {
    constructor(private utilisateursService: UtilisateursService) {}

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const idCible = Number(req.params.idUtilisateur);

            // On ne peut consulter QUE son propre profil
            if (req.user!.idUtilisateur !== idCible) {
                return res.status(403).json({ code: 403, message: 'Accès refusé.' });
            }

            const user = await this.utilisateursService.getById(idCible);
            res.status(200).json(user);
        } catch (e) {
            if (e instanceof HttpError) {
                return res.status(e.status).json({ code: e.status, message: e.message });
            }
            next(e);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const idCible = Number(req.params.idUtilisateur);

            if (req.user!.idUtilisateur !== idCible) {
                return res.status(403).json({ code: 403, message: 'Accès refusé.' });
            }

            const { nomUtilisateur, prenomUtilisateur, ville, codePostal } = req.body;
            const updated = await this.utilisateursService.update(idCible, {
                nomUtilisateur, prenomUtilisateur, ville, codePostal,
            });
            res.status(200).json(updated);
        } catch (e) {
            if (e instanceof HttpError) {
                return res.status(e.status).json({ code: e.status, message: e.message });
            }
            next(e);
        }
    };
}