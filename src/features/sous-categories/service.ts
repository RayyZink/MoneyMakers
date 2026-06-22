import { SousCategoriesRepository } from './repository';

export class SousCategoriesService {
  constructor(private repository: SousCategoriesRepository) {}

  /**
   * Vérifie que la catégorie est accessible à l'utilisateur (catégorie
   * système ou catégorie personnelle de l'utilisateur).
   */
  private async assertCategorieAccessible(idCategorie: number, idUtilisateur: number): Promise<void> {
    const accessible = await this.repository.categorieAccessible(idCategorie, idUtilisateur);
    if (!accessible) {
      const error: any = new Error('Catégorie introuvable.');
      error.statusCode = 404;
      throw error;
    }
  }

  async getSousCategoriesParCategorie(idCategorie: number, idUtilisateur: number) {
    await this.assertCategorieAccessible(idCategorie, idUtilisateur);

    const sousCategories = await this.repository.findAllByCategorieId(idCategorie);
    return sousCategories.map(sc => ({
      idSousCategorie: sc.idSousCategorie,
      nomSousCategorie: sc.nomSousCategorie,
      idCategorie: sc.idCategorie,
      montant_base: sc.montant_base,
      periode: sc.periode
    }));
  }

  async getSousCategorieParId(idSousCategorie: number, idUtilisateur: number) {
    const sousCategorie = await this.repository.findById(idSousCategorie, idUtilisateur);
    if (!sousCategorie) {
      const error = new Error('Sous-catégorie introuvable ou accès refusé.');
      (error as any).statusCode = 404;
      throw error;
    }
    return sousCategorie;
  }

  async creerSousCategorie(idCategorie: number, data: any, idUtilisateur: number) {
    await this.assertCategorieAccessible(idCategorie, idUtilisateur);

    if (!data.nomSousCategorie || data.nomSousCategorie.trim() === '') {
      const error = new Error('Le nom de la sous-catégorie est obligatoire.');
      (error as any).statusCode = 400;
      throw error;
    }

    const periodeValide = ['M', 'H', 'A', 'Q'].includes(data.periode) ? data.periode : 'M';
    const montantBase = data.montant_base !== undefined ? data.montant_base : null;

    const insertId = await this.repository.create(idCategorie, data.nomSousCategorie.trim(), montantBase, periodeValide);

    return {
      idSousCategorie: insertId,
      nomSousCategorie: data.nomSousCategorie.trim(),
      idCategorie,
      montant_base: montantBase,
      periode: periodeValide
    };
  }

  async modifierSousCategorie(idSousCategorie: number, data: any, idUtilisateur: number) {
    if (!data.nomSousCategorie || data.nomSousCategorie.trim() === '') {
      const error = new Error('Le nom de la sous-catégorie est obligatoire.');
      (error as any).statusCode = 400;
      throw error;
    }

    const periodeValide = ['M', 'H', 'A', 'Q'].includes(data.periode) ? data.periode : 'M';
    const montantBase = data.montant_base !== undefined ? data.montant_base : null;

    const misAJour = await this.repository.update(idSousCategorie, data.nomSousCategorie.trim(), montantBase, periodeValide, idUtilisateur);

    if (!misAJour) {
      const error = new Error('Sous-catégorie introuvable ou accès refusé.');
      (error as any).statusCode = 404;
      throw error;
    }

    // On récupère l'état complet après mise à jour pour renvoyer le bon objet
    return await this.getSousCategorieParId(idSousCategorie, idUtilisateur);
  }

  async supprimerSousCategorie(idSousCategorie: number, idUtilisateur: number) {
    const supprime = await this.repository.delete(idSousCategorie, idUtilisateur);
    if (!supprime) {
      const error = new Error('Sous-catégorie introuvable ou accès refusé.');
      (error as any).statusCode = 404;
      throw error;
    }
  }
}
