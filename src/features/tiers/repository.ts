import { Pool } from 'mysql2/promise';

export class TiersRepository {
  constructor(private db: Pool) {}

  // Récupérer les tiers paginés et filtrés
  async findAndCountAll(
    idUtilisateur: number,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ rows: any[]; total: number }> {
    const offset = (page - 1) * limit;
    let queryArgs: any[] = [idUtilisateur];
    
    let whereClause = 'WHERE idUtilisateur = ?';
    if (search) {
      whereClause += ' AND nomTiers LIKE ?';
      queryArgs.push(`%${search}%`);
    }

    // 1. Compter le total pour la pagination
    const countQuery = `SELECT COUNT(*) as total FROM Tiers ${whereClause}`;
    const [countRows] = await this.db.query(countQuery, queryArgs);
    const total = (countRows as any)[0].total;

    // 2. Récupérer les données réelles
    const dataQuery = `
      SELECT idTiers, nomTiers, idUtilisateur, idSousCategorieDefaut
      FROM Tiers
      ${whereClause}
      ORDER BY nomTiers ASC
      LIMIT ? OFFSET ?
    `;
    
    // MySQL exige des nombres pour LIMIT/OFFSET (l'injection de tableaux peut passer des chaînes)
    const [rows] = await this.db.query(dataQuery, [...queryArgs, limit, offset]);

    return { rows: rows as any[], total };
  }

  async findById(idTiers: number, idUtilisateur: number): Promise<any | null> {
    const query = `
      SELECT idTiers, nomTiers, idUtilisateur, idSousCategorieDefaut
      FROM Tiers
      WHERE idTiers = ? AND idUtilisateur = ?
    `;
    const [rows] = await this.db.query(query, [idTiers, idUtilisateur]);
    const tiers = rows as any[];
    return tiers.length > 0 ? tiers[0] : null;
  }

  async create(nomTiers: string, idSousCategorieDefaut: number | null, idUtilisateur: number): Promise<number> {
    const query = `
      INSERT INTO Tiers (nomTiers, idSousCategorieDefaut, idUtilisateur)
      VALUES (?, ?, ?)
    `;
    const [result] = await this.db.query(query, [nomTiers, idSousCategorieDefaut, idUtilisateur]);
    return (result as any).insertId;
  }

  async update(
    idTiers: number,
    nomTiers: string,
    idSousCategorieDefaut: number | null,
    idUtilisateur: number
  ): Promise<boolean> {
    const query = `
      UPDATE Tiers
      SET nomTiers = ?, idSousCategorieDefaut = ?
      WHERE idTiers = ? AND idUtilisateur = ?
    `;
    const [result] = await this.db.query(query, [nomTiers, idSousCategorieDefaut, idTiers, idUtilisateur]);
    return (result as any).affectedRows > 0;
  }

  async delete(idTiers: number, idUtilisateur: number): Promise<boolean> {
    const query = `
      DELETE FROM Tiers
      WHERE idTiers = ? AND idUtilisateur = ?
    `;
    const [result] = await this.db.query(query, [idTiers, idUtilisateur]);
    return (result as any).affectedRows > 0;
  }
}