import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class MouvementsRepository {
    constructor(private db: Pool) {}

    // ----------------------------------------------------------------
    // GET /mouvements/:idMouvement  (vue enrichie V_MOUVEMENT)
    // ----------------------------------------------------------------
    async findMouvementById(idMouvement: number): Promise<RowDataPacket | null> {
        const query = `
            SELECT
                m.idMouvement,
                m.idCompte,
                m.dateMouvement,
                m.idUtilisateur,
                m.descriptionCompte,
                m.nomBanque,
                m.idTiers,
                m.nomTiers,
                m.idCategorie,
                m.nomCategorie,
                m.idSousCategorie,
                m.nomSousCategorie,
                m.montant,
                m.typeMouvement,
                m.idVirement
            FROM V_MOUVEMENT m
            WHERE m.idMouvement = ?
        `;
        const [rows] = await this.db.query<RowDataPacket[]>(query, [idMouvement]);
        return rows[0] ?? null;
    }

    // ----------------------------------------------------------------
    // PUT /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async updateMouvement(
        idMouvement: number,
        champs: {
            dateMouvement?:   string | null;
            idTiers?:         number | null;
            idCategorie?:     number | null;
            idSousCategorie?: number | null;
            montant?:         number;
            typeMouvement?:   'D' | 'C';
        },
    ): Promise<boolean> {
        const sets:   string[]  = [];
        const params: unknown[] = [];

        if ('dateMouvement'   in champs) { sets.push('dateMouvement   = COALESCE(?, dateMouvement)'); params.push(champs.dateMouvement); }
        if ('idTiers'         in champs) { sets.push('idTiers         = ?'); params.push(champs.idTiers); }
        if ('idCategorie'     in champs) { sets.push('idCategorie     = ?'); params.push(champs.idCategorie); }
        if ('idSousCategorie' in champs) { sets.push('idSousCategorie = ?'); params.push(champs.idSousCategorie); }
        if ('montant'         in champs) { sets.push('montant         = ?'); params.push(champs.montant); }
        if ('typeMouvement'   in champs) { sets.push('typeMouvement   = ?'); params.push(champs.typeMouvement); }

        if (sets.length === 0) return true; // rien à modifier

        sets.push('dateHeureMAJ = CURRENT_TIMESTAMP()');
        params.push(idMouvement);

        const query = `UPDATE Mouvement SET ${sets.join(', ')} WHERE idMouvement = ?`;
        const [result] = await this.db.query<ResultSetHeader>(query, params);
        return result.affectedRows > 0;
    }

    // ----------------------------------------------------------------
    // DELETE /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async deleteMouvement(idMouvement: number): Promise<boolean> {
        const query = `
            DELETE FROM Mouvement
            WHERE idMouvement = ?
        `;
        const [result] = await this.db.query<ResultSetHeader>(query, [idMouvement]);
        return result.affectedRows > 0;
    }

    // ----------------------------------------------------------------
    // Utilitaire : vérifier le propriétaire d'un mouvement (contrôle 403)
    // ----------------------------------------------------------------
    async findProprietaireMouvement(
        idMouvement: number,
    ): Promise<{ idCompte: number; idUtilisateur: number } | null> {
        const query = `
            SELECT m.idCompte, c.idUtilisateur
            FROM Mouvement m
            JOIN Compte c ON c.idCompte = m.idCompte
            WHERE m.idMouvement = ?
        `;
        const [rows] = await this.db.query<RowDataPacket[]>(query, [idMouvement]);
        if (!rows[0]) return null;
        return {
            idCompte:       rows[0].idCompte       as number,
            idUtilisateur:  rows[0].idUtilisateur  as number,
        };
    }
}