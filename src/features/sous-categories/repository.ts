import { Pool } from 'mysql2/promise';

export class SousCategoriesRepository {
    constructor(private db: Pool) {}

    /**
     * Vérifie qu'une catégorie est une catégorie système (idUtilisateur NULL)
     * ou appartient à l'utilisateur donné.
     */
    async categorieAccessible(idCategorie: number, idUtilisateur: number): Promise<boolean> {
        const query = `
            SELECT idCategorie FROM Categorie
            WHERE idCategorie = ? AND (idUtilisateur IS NULL OR idUtilisateur = ?)
        `;
        const [rows] = await this.db.query(query, [idCategorie, idUtilisateur]);
        return (rows as any[]).length > 0;
    }

    async findAllByCategorieId(idCategorie: number): Promise<any[]> {
        const query = `
            SELECT idSousCategorie, nomSousCategorie, idCategorie, montant_base, periode
            FROM SousCategorie
            WHERE idCategorie = ?
            ORDER BY nomSousCategorie ASC
        `;
        const [rows] = await this.db.query(query, [idCategorie]);
        return rows as any[];
    }

    async findById(idSousCategorie: number, idUtilisateur: number): Promise<any | null> {
        // Vérifie que la sous-catégorie appartient bien à l'utilisateur via sa catégorie parente,
        // ou qu'il s'agit d'une catégorie système (idUtilisateur IS NULL)
        const query = `
            SELECT sc.idSousCategorie, sc.nomSousCategorie, sc.idCategorie, sc.montant_base, sc.periode
            FROM SousCategorie sc
                     JOIN Categorie c ON sc.idCategorie = c.idCategorie
            WHERE sc.idSousCategorie = ?
              AND (c.idUtilisateur = ? OR c.idUtilisateur IS NULL)
        `;
        const [rows] = await this.db.query(query, [idSousCategorie, idUtilisateur]);
        const sc = rows as any[];
        return sc.length > 0 ? sc[0] : null;
    }

    async create(idCategorie: number, nomSousCategorie: string, montantBase: number | null, periode: string): Promise<number> {
        const query = `
            INSERT INTO SousCategorie (nomSousCategorie, idCategorie, montant_base, periode)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await this.db.query(query, [nomSousCategorie, idCategorie, montantBase, periode]);
        return (result as any).insertId;
    }

    async update(
        idSousCategorie: number,
        nomSousCategorie: string,
        montantBase: number | null,
        periode: string,
        idUtilisateur: number
    ): Promise<boolean> {
        const query = `
            UPDATE SousCategorie sc
                JOIN Categorie c ON sc.idCategorie = c.idCategorie
                SET sc.nomSousCategorie = ?, sc.montant_base = ?, sc.periode = ?
            WHERE sc.idSousCategorie = ? AND (c.idUtilisateur = ? OR c.idUtilisateur IS NULL)
        `;
        const [result] = await this.db.query(query, [nomSousCategorie, montantBase, periode, idSousCategorie, idUtilisateur]);
        return (result as any).affectedRows > 0;
    }

    async delete(idSousCategorie: number, idUtilisateur: number): Promise<boolean> {
        const query = `
            DELETE sc FROM SousCategorie sc
      JOIN Categorie c ON sc.idCategorie = c.idCategorie
      WHERE sc.idSousCategorie = ? AND c.idUtilisateur = ?
        `;
        const [result] = await this.db.query(query, [idSousCategorie, idUtilisateur]);
        return (result as any).affectedRows > 0;
    }
}