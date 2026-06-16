import { Request, Response, NextFunction } from 'express';
import { TiersService } from './service';

export class TiersController {
  constructor(private tiersService: TiersService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = (req as any).user.id;
      
      // Extraction des paramètres de pagination conformes aux defaults du Swagger
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string | undefined;

      const resultat = await this.tiersService.getTiersPagine(idUtilisateur, page, limit, search);
      return res.status(200).json(resultat);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = (req as any).user.id;
      const idTiers = parseInt(req.params.idTiers, 10);

      const tiers = await this.tiersService.getTiersParId(idTiers, idUtilisateur);
      return res.status(200).json(tiers);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = (req as any).user.id;
      const { nomTiers, idSousCategorieDefaut } = req.body;

      const nouveauTiers = await this.tiersService.creerTiers(nomTiers, idSousCategorieDefaut || null, idUtilisateur);
      return res.status(201).json(nouveauTiers);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = (req as any).user.id;
      const idTiers = parseInt(req.params.idTiers, 10);
      const { nomTiers, idSousCategorieDefaut } = req.body;

      const tiersModifie = await this.tiersService.modifierTiers(idTiers, nomTiers, idSousCategorieDefaut || null, idUtilisateur);
      return res.status(200).json(tiersModifie);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const idUtilisateur = (req as any).user.id;
      const idTiers = parseInt(req.params.idTiers, 10);

      await this.tiersService.supprimerTiers(idTiers, idUtilisateur);
      return res.status(204).send(); // 204 No Content d'après le Swagger
    } catch (error) {
      next(error);
    }
  }
}