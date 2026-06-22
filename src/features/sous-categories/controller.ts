import { Request, Response, NextFunction } from 'express';
import { SousCategoriesService } from './service';
import { AuthenticatedRequest } from '../../middlewares/auth';

export class SousCategoriesController {
  constructor(private service: SousCategoriesService) {}

  private getUserId(req: AuthenticatedRequest): number {
    const idUtilisateur = req.user?.idUtilisateur;
    if (idUtilisateur === undefined || idUtilisateur === null) {
      const error: any = new Error('Utilisateur non authentifié');
      error.statusCode = 401;
      throw error;
    }
    return idUtilisateur;
  }

  async getByCategorie(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = this.getUserId(req);
      const idCategorie = parseInt(req.params.idCategorie, 10);
      const resultat = await this.service.getSousCategoriesParCategorie(idCategorie, idUtilisateur);
      return res.status(200).json(resultat);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = this.getUserId(req);
      const idSousCategorie = parseInt(req.params.idSousCategorie, 10);

      const resultat = await this.service.getSousCategorieParId(idSousCategorie, idUtilisateur);
      return res.status(200).json(resultat);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = this.getUserId(req);
      const idCategorie = parseInt(req.params.idCategorie, 10);
      const nouvelleSousCategorie = await this.service.creerSousCategorie(idCategorie, req.body, idUtilisateur);
      return res.status(201).json(nouvelleSousCategorie);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = this.getUserId(req);
      const idSousCategorie = parseInt(req.params.idSousCategorie, 10);

      const scModifiee = await this.service.modifierSousCategorie(idSousCategorie, req.body, idUtilisateur);
      return res.status(200).json(scModifiee);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = this.getUserId(req);
      const idSousCategorie = parseInt(req.params.idSousCategorie, 10);

      await this.service.supprimerSousCategorie(idSousCategorie, idUtilisateur);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
