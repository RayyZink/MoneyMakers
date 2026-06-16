import { TiersRepository } from './repository';

export class TiersService {
  constructor(private tiersRepository: TiersRepository) {}

  async getTiersPagine(idUtilisateur: number, page: number, limit: number, search?: string) {
    const { rows, total } = await this.tiersRepository.findAndCountAll(idUtilisateur, page, limit, search);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: rows.map(r => ({
        idTiers: r.idTiers,
        nomTiers: r.nomTiers,
        idUtilisateur: r.idUtilisateur,
        idSousCategorieDefaut: r.idSousCategorieDefaut
      })),
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async getTiersParId(idTiers: number, idUtilisateur: number) {
    const tiers = await this.tiersRepository.findById(idTiers, idUtilisateur);
    if (!tiers) {
      const error = new Error('Tiers non trouvé');
      (error as any).statusCode = 404;
      throw error;
    }
    return tiers;
  }

  async creerTiers(nomTiers: string, idSousCategorieDefaut: number | null, idUtilisateur: number) {
    if (!nomTiers || nomTiers.trim() === '') {
      const error = new Error('Le nom du tiers est obligatoire.');
      (error as any).statusCode = 400;
      throw error;
    }
    const insertId = await this.tiersRepository.create(nomTiers.trim(), idSousCategorieDefaut, idUtilisateur);
    return {
      idTiers: insertId,
      nomTiers: nomTiers.trim(),
      idUtilisateur,
      idSousCategorieDefaut
    };
  }

  async modifierTiers(idTiers: number, nomTiers: string, idSousCategorieDefaut: number | null, idUtilisateur: number) {
    const misAJour = await this.tiersRepository.update(idTiers, nomTiers, idSousCategorieDefaut, idUtilisateur);
    if (!misAJour) {
      const error = new Error('Tiers introuvable ou non autorisé.');
      (error as any).statusCode = 404;
      throw error;
    }
    return {
      idTiers,
      nomTiers,
      idUtilisateur,
      idSousCategorieDefaut
    };
  }

  async supprimerTiers(idTiers: number, idUtilisateur: number) {
    const supprime = await this.tiersRepository.delete(idTiers, idUtilisateur);
    if (!supprime) {
      const error = new Error('Tiers introuvable ou non autorisé.');
      (error as any).statusCode = 404;
      throw error;
    }
  }
}