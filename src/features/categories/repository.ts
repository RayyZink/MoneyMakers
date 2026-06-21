import { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
 
// ─── Types bruts retournés par la BDD ───────────────────────────────────────
 
export interface CategorieRow extends RowDataPacket {
  idCategorie: number;
  nomCategorie: string;
  idUtilisateur: number | null;
}
 
 
// ─── Repository ───────────────────────────────────────────────────────────────
 
export class CategoriesRepository {
  constructor(private readonly db: Pool) {}
 
  // ── Catégories ──────────────────────────────────────────────────────────────
 
  /**
   * Retourne toutes les catégories accessibles à cet utilisateur :
   * catégories système (idUtilisateur IS NULL) + catégories personnelles.
   */
  async findAll(idUtilisateur: number): Promise<CategorieRow[]> {
    const [rows] = await this.db.execute<CategorieRow[]>(
      `SELECT idCategorie, nomCategorie, idUtilisateur
       FROM Categorie
       WHERE idUtilisateur IS NULL
          OR idUtilisateur = ?
       ORDER BY nomCategorie`,
      [idUtilisateur]
    );
    return rows;
  }
 
  async findById(idCategorie: number, idUtilisateur: number): Promise<CategorieRow | null> {
    const [rows] = await this.db.execute<CategorieRow[]>(
      `SELECT idCategorie, nomCategorie, idUtilisateur
       FROM Categorie
       WHERE idCategorie = ?
         AND (idUtilisateur IS NULL OR idUtilisateur = ?)`,
      [idCategorie, idUtilisateur]
    );
    return rows[0] ?? null;
  }
 
  async existsByName(nomCategorie: string, idUtilisateur: number): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT 1 FROM Categorie
       WHERE nomCategorie = ?
         AND (idUtilisateur IS NULL OR idUtilisateur = ?)
       LIMIT 1`,
      [nomCategorie, idUtilisateur]
    );
    return rows.length > 0;
  }
 
  async create(nomCategorie: string, idUtilisateur: number): Promise<number> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO Categorie (nomCategorie, idUtilisateur)
       VALUES (?, ?)`,
      [nomCategorie, idUtilisateur]
    );
    return result.insertId;
  }
 
  async update(
    idCategorie: number,
    nomCategorie: string,
    idUtilisateur: number
  ): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `UPDATE Categorie
       SET nomCategorie = ?
       WHERE idCategorie = ?
         AND idUtilisateur = ?`,   // on ne peut modifier qu'une catégorie personnelle
      [nomCategorie, idCategorie, idUtilisateur]
    );
    return result.affectedRows > 0;
  }
 
  async delete(idCategorie: number, idUtilisateur: number): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `DELETE FROM Categorie
       WHERE idCategorie = ?
         AND idUtilisateur = ?`,   // on ne peut supprimer qu'une catégorie personnelle
      [idCategorie, idUtilisateur]
    );
    return result.affectedRows > 0;
  }
 
 
}