import {
    CategoriesRepository,
    CategorieRow,
} from "./repository";


export interface Categories {
    idCategorie: number;
    nomCategorie: string;
    idUtilisateur: number | null;
}

export class CategoriesService {
    constructor(private readonly categoriesRepository: CategoriesRepository) { }

    private mapCategorie(row: CategorieRow): Categories {
        return {
            idCategorie: row.idCategorie,
            nomCategorie: row.nomCategorie,
            idUtilisateur: row.idUtilisateur,
        };
    }
    /**
    * Récupère toutes les catégories pour l'utilisateur spécifié.
 */
    async getAll(idUtilisateur: number): Promise<Categories[]> {
        const categories =
            await this.categoriesRepository.findAll(idUtilisateur);

        return categories.map((categorie) => this.mapCategorie(categorie));
    }
    /**
        * Récupère une catégorie par son ID pour l'utilisateur spécifié.
     */

    async getById(
        idCategorie: number,
        idUtilisateur: number
    ): Promise<Categories | null> {
        const categorie = await this.categoriesRepository.findById(
            idCategorie,
            idUtilisateur
        );
        return categorie ? this.mapCategorie(categorie) : null;
    }

    /**
       * Crée une nouvelle catégorie pour l'utilisateur spécifié.
      **/
    async create(
        nomCategorie: string,
        idUtilisateur: number
    ): Promise<Categories> {
        nomCategorie = typeof nomCategorie === 'string' ? nomCategorie.trim() : '';

        if (!nomCategorie) {
            const error = new Error("Le nom de la catégorie est obligatoire.") as Error & { statusCode?: number };
            error.statusCode = 400;
            throw error;
        }

        if (nomCategorie.length > 50) {
            const error = new Error("Le nom de la catégorie ne doit pas dépasser 50 caractères.") as Error & { statusCode?: number };
            error.statusCode = 400;
            throw error;
        }

        const exists = await this.categoriesRepository.existsByName(
            nomCategorie,
            idUtilisateur
        );

        if (exists) {
            const error = new Error("Une catégorie portant ce nom existe déjà.") as Error & { statusCode?: number };
            error.statusCode = 409;
            throw error;
        }

        const idCategorie = await this.categoriesRepository.create(
            nomCategorie,
            idUtilisateur
        );

        const categorie = await this.categoriesRepository.findById(
            idCategorie,
            idUtilisateur
        );

        if (!categorie) {
            throw new Error("Erreur lors de la création de la catégorie.");
        }

        return this.mapCategorie(categorie);
    }

    /**
     * Met à jour le nom d'une catégorie.
    **/
    async update(
        idCategorie: number,
        nomCategorie: string,
        idUtilisateur: number
    ): Promise<Categories> {
        nomCategorie = typeof nomCategorie === 'string' ? nomCategorie.trim() : '';

        if (!nomCategorie) {
            const error = new Error("Le nom de la catégorie est obligatoire.") as Error & { statusCode?: number };
            error.statusCode = 400;
            throw error;
        }

        if (nomCategorie.length > 50) {
            const error = new Error("Le nom de la catégorie ne doit pas dépasser 50 caractères.") as Error & { statusCode?: number };
            error.statusCode = 400;
            throw error;
        }

        const categorie = await this.categoriesRepository.findById(
            idCategorie,
            idUtilisateur
        );

        if (!categorie) {
            const error = new Error("Catégorie introuvable.") as Error & { statusCode?: number };
            error.statusCode = 404;
            throw error;
        }

        if (categorie.idUtilisateur === null) {
            const error = new Error("Les catégories système ne peuvent pas être modifiées.") as Error & { statusCode?: number };
            error.statusCode = 403;
            throw error;
        }

        await this.categoriesRepository.update(
            idCategorie,
            nomCategorie,
            idUtilisateur
        );

        const misAJour = await this.categoriesRepository.findById(idCategorie, idUtilisateur);
        if (!misAJour) {
            throw new Error("Catégorie introuvable après mise à jour.");
        }

        return this.mapCategorie(misAJour);
    }

    /**
     * Suppression d'une catégorie personnelle.
     */
    async delete(
        idCategorie: number,
        idUtilisateur: number
    ): Promise<boolean> {
        const categorie = await this.categoriesRepository.findById(
            idCategorie,
            idUtilisateur
        );

        if (!categorie) {
            const error = new Error("Catégorie introuvable.") as Error & { statusCode?: number };
            error.statusCode = 404;
            throw error;
        }

        if (categorie.idUtilisateur === null) {
            const error = new Error("Les catégories système ne peuvent pas être supprimées.") as Error & { statusCode?: number };
            error.statusCode = 403;
            throw error;
        }

        return this.categoriesRepository.delete(
            idCategorie,
            idUtilisateur
        );
    }

}
