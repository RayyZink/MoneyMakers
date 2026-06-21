import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface MouvementFiltres {
    dateDebut?:     string;
    dateFin?:       string;
    typeMouvement?: 'D' | 'C';
    page:           number;
    limit:          number;
}

export class ComptesRepository {
    constructor(private db: Pool) {}

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
    // GET /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async findMouvementsByCompteId(
        idCompte: number,
        filtres: MouvementFiltres,
    ): Promise<{ rows: RowDataPacket[]; total: number }> {
        const { dateDebut, dateFin, typeMouvement, page, limit } = filtres;
        const offset = (page - 1) * limit;

        // Conditions dynamiques
        const conditions: string[] = ['m.idCompte = ?'];
        const params: unknown[]    = [idCompte];

        if (dateDebut) {
            conditions.push('m.dateMouvement >= ?');
            params.push(dateDebut);
        }
        if (dateFin) {
            conditions.push('m.dateMouvement <= ?');
            params.push(dateFin);
        }
        if (typeMouvement) {
            conditions.push('m.typeMouvement = ?');
            params.push(typeMouvement);
        }

        const where = conditions.join(' AND ');

        const queryData = `
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
            WHERE ${where}
            ORDER BY m.dateMouvement DESC, m.idMouvement DESC
            LIMIT ? OFFSET ?
        `;
        const queryCount = `
            SELECT COUNT(*) AS total
            FROM V_MOUVEMENT m
            WHERE ${where}
        `;

        const [rows]    = await this.db.query<RowDataPacket[]>(queryData,  [...params, limit, offset]);
        const [totaux]  = await this.db.query<RowDataPacket[]>(queryCount, params);

        return { rows, total: (totaux[0] as RowDataPacket).total as number };
    }

    // ----------------------------------------------------------------
    // POST /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async createMouvement(
        idCompte:       number,
        dateMouvement:  string | null,
        idTiers:        number | null,
        idCategorie:    number | null,
        idSousCategorie: number | null,
        montant:        number,
        typeMouvement:  'D' | 'C',
    ): Promise<number> {
        const query = `
            INSERT INTO Mouvement (
                dateMouvement,
                idCompte,
                idTiers,
                idCategorie,
                idSousCategorie,
                montant,
                typeMouvement
            ) VALUES (
                COALESCE(?, CURDATE()),
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
        `;
        const [result] = await this.db.query<ResultSetHeader>(query, [
            dateMouvement,
            idCompte,
            idTiers,
            idCategorie,
            idSousCategorie,
            montant,
            typeMouvement,
        ]);
        return result.insertId;
    }

}