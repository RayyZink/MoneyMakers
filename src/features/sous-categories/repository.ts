import { Pool } from 'mysql2/promise';

export class SousCategoriesRepository {
  constructor(private db: Pool) {}

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
    // La sécurité anti-fraude (vérifier que la catégorie appartient bien à l'utilisateur) 
    // est gérée par le trigger SQL 45000 défini dans votre base de données.
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
    // Le JOIN assure qu'on ne modifie que si la catégorie parente appartient à l'utilisateur connecté
    const query = `
      UPDATE SousCategorie sc
      JOIN Categorie c ON sc.idCategorie = c.idCategorie
      SET sc.nomSousCategorie = ?, sc.montant_base = ?, sc.periode = ?
      WHERE sc.idSousCategorie = ? AND c.idUtilisateur = ?
    `;
    const [result] = await this.db.query(query, [nomSousCategorie, montantBase, periode, idSousCategorie, idUtilisateur]);
    return (result as any).affectedRows > 0;
  }

  async delete(idSousCategorie: number, idUtilisateur: number): Promise<boolean> {
    // Suppression sécurisée par le JOIN
    const query = `
      DELETE sc FROM SousCategorie sc
      JOIN Categorie c ON sc.idCategorie = c.idCategorie
      WHERE sc.idSousCategorie = ? AND c.idUtilisateur = ?
    `;
    const [result] = await this.db.query(query, [idSousCategorie, idUtilisateur]);
    return (result as any).affectedRows > 0;
  }
}