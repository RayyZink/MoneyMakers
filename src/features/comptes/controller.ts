import { Request, Response } from 'express';
import { ComptesService } from './service';

export class ComptesController {
    constructor(private service: ComptesService) {}

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