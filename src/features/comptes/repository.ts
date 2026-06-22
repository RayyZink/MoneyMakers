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

    async findMouvementById(idMouvement: number, idUtilisateur: number): Promise<RowDataPacket | null> {
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
            WHERE m.idMouvement = ? AND m.idUtilisateur = ?
        `;
        const [rows] = await this.db.query<RowDataPacket[]>(query, [idMouvement, idUtilisateur]);
        return rows[0] ?? null;
    }

    // ----------------------------------------------------------------
    // GET /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async findMouvementsByCompteId(
        idCompte: number,
        idUtilisateur: number,
        filtres: MouvementFiltres,
    ): Promise<{ rows: RowDataPacket[]; total: number }> {
        const { dateDebut, dateFin, typeMouvement, page, limit } = filtres;
        const offset = (page - 1) * limit;

        // Conditions dynamiques
        const conditions: string[] = ['m.idCompte = ?', 'm.idUtilisateur = ?'];
        const params: unknown[]    = [idCompte, idUtilisateur];

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

    async findByUtilisateur(idUtilisateur: number) {
        const [rows] = await this.db.query(
            'SELECT * FROM Compte WHERE idUtilisateur = ?',
            [idUtilisateur]
        );
        return rows;
    }

    async findById(idCompte: number, idUtilisateur: number) {
        const [rows] = await this.db.query(
            'SELECT * FROM Compte WHERE idCompte = ? AND idUtilisateur = ?',
            [idCompte, idUtilisateur]
        );
        return rows;
    }

    async create(idUtilisateur: number, descriptionCompte: string, nomBanque: string, montantInitial: number) {
        const [result] = await this.db.query(
            'INSERT INTO Compte (idUtilisateur, descriptionCompte, nomBanque, montantInitial) VALUES (?, ?, ?, ?)',
            [idUtilisateur, descriptionCompte, nomBanque, montantInitial]
        );
        return result;
    }

    async update(
        idCompte: number,
        idUtilisateur: number,
        champs: { descriptionCompte?: string; nomBanque?: string },
    ) {
        const sets:   string[]  = [];
        const params: unknown[] = [];

        if ('descriptionCompte' in champs) { sets.push('descriptionCompte = ?'); params.push(champs.descriptionCompte); }
        if ('nomBanque'          in champs) { sets.push('nomBanque = ?');          params.push(champs.nomBanque); }

        if (sets.length === 0) return { affectedRows: 0 };

        params.push(idCompte, idUtilisateur);

        const [result] = await this.db.query(
            `UPDATE Compte SET ${sets.join(', ')} WHERE idCompte = ? AND idUtilisateur = ?`,
            params
        );
        return result;
    }

    async delete(idCompte: number, idUtilisateur: number) {
        const [result] = await this.db.query(
            'DELETE FROM Compte WHERE idCompte = ? AND idUtilisateur = ?',
            [idCompte, idUtilisateur]
        );
        return result;
    }

    async getSolde(idCompte: number, idUtilisateur: number, date: string) {
        // On vérifie d'abord que le compte appartient bien à l'utilisateur
        const [comptes] = await this.db.query<RowDataPacket[]>(
            'SELECT idCompte FROM Compte WHERE idCompte = ? AND idUtilisateur = ?',
            [idCompte, idUtilisateur]
        );
        if (comptes.length === 0) return [];

        const [rows] = await this.db.query(
            'SELECT soldeHistorique(?, ?) AS solde',
            [idCompte, date]
        );
        return rows;
    }

}