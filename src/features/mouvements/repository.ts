import { Pool } from 'mysql2/promise';

export class MouvementsRepository {
    constructor(private db: Pool) {}

    async findMouvementsByCompteId(idCompte: number): Promise<any[]> {
        const query = `
      SELECT idMouvement, dateMouvement, descriptionCompte, nomTiers, 
             nomCategorie, nomSousCategorie, montant, typeMouvement
      FROM V_MOUVEMENT
      WHERE idCompte = ?
    `;
        const [rows] = await this.db.query(query, [idCompte]);
        return rows as any[];
    }
}