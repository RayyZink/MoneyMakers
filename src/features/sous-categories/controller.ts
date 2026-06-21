import { Request, Response, NextFunction } from 'express';
import { SousCategoriesService } from './service';

export class SousCategoriesController {
  constructor(private service: SousCategoriesService) {}

  async getByCategorie(req: Request, res: Response, next: NextFunction) {
    try {
      const idCategorie = parseInt(req.params.idCategorie, 10);
      const resultat = await this.service.getSousCategoriesParCategorie(idCategorie);
      return res.status(200).json(resultat);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = (req as any).user.id;
      const idSousCategorie = parseInt(req.params.idSousCategorie, 10);
      
      const resultat = await this.service.getSousCategorieParId(idSousCategorie, idUtilisateur);
      return res.status(200).json(resultat);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const idCategorie = parseInt(req.params.idCategorie, 10);
      const nouvelleSousCategorie = await this.service.creerSousCategorie(idCategorie, req.body);
      return res.status(201).json(nouvelleSousCategorie);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = (req as any).user.id;
      const idSousCategorie = parseInt(req.params.idSousCategorie, 10);
      
      const scModifiee = await this.service.modifierSousCategorie(idSousCategorie, req.body, idUtilisateur);
      return res.status(200).json(scModifiee);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = (req as any).user.id;
      const idSousCategorie = parseInt(req.params.idSousCategorie, 10);
      
      await this.service.supprimerSousCategorie(idSousCategorie, idUtilisateur);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}