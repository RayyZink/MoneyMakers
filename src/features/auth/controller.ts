import { Request, Response, NextFunction } from 'express';
import { AuthService, HttpError } from './service';

export class AuthController {
    constructor(private authService: AuthService) {}

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { nomUtilisateur, prenomUtilisateur, login, motDePasse, ville, codePostal } = req.body;

            if (!nomUtilisateur || !prenomUtilisateur || !login || !motDePasse) {
                return res.status(400).json({ code: 400, message: 'Champs obligatoires manquants.' });
            }
            if (motDePasse.length < 8) {
                return res.status(400).json({ code: 400, message: 'Le mot de passe doit faire au moins 8 caractères.' });
            }

            const user = await this.authService.register({
                nomUtilisateur, prenomUtilisateur, login, motDePasse, ville, codePostal,
            });
            res.status(201).json(user);
        } catch (e) {
            if (e instanceof HttpError) {
                return res.status(e.status).json({ code: e.status, message: e.message });
            }
            next(e);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { login, motDePasse } = req.body;
            if (!login || !motDePasse) {
                return res.status(400).json({ code: 400, message: 'Login et mot de passe requis.' });
            }
            const result = await this.authService.login(login, motDePasse);
            res.status(200).json(result);
        } catch (e) {
            if (e instanceof HttpError) {
                return res.status(e.status).json({ code: e.status, message: e.message });
            }
            next(e);
        }
    };

    logout = async (_req: Request, res: Response) => {
        res.status(204).send();
    };
}