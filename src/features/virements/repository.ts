import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class VirementsRepository {
    constructor(private db: Pool) {}

    // ----------------------------------------------------------------
    // POST /virements
    // ----------------------------------------------------------------
    async creerVirement(
        idCompteDebit:           number,
        idCompteCredit:          number,
        montant:                 number,
        dateVirement:            string | null,
        commentaire:             string | null,
        idUtilisateurInitiateur: number,
        idCategorie:             number | null,
        idSousCategorie:         number | null,
    ): Promise<number> {
        await this.db.query(
            'CALL creerVirement(?, ?, ?, ?, ?, ?, ?, ?)',
            [
                idCompteDebit,
                idCompteCredit,
                montant,
                dateVirement,
                commentaire,
                idUtilisateurInitiateur,
                idCategorie,
                idSousCategorie,
            ],
        );

        const [rows] = await this.db.query<RowDataPacket[]>(
            'SELECT idVirement FROM Virement ORDER BY idVirement DESC LIMIT 1',
        );
        return (rows[0] as RowDataPacket).idVirement as number;
    }

    // ----------------------------------------------------------------
    // GET /virements/:idVirement
    // ----------------------------------------------------------------
    async findVirementById(idVirement: number): Promise<RowDataPacket | null> {
        const query = `
            SELECT
                idVirement,
                idCompteDebit,
                idCompteCredit,
                montant,
                dateVirement,
                commentaire,
                virementInterUtilisateur
            FROM Virement
            WHERE idVirement = ?
        `;
        const [rows] = await this.db.query<RowDataPacket[]>(query, [idVirement]);
        return rows[0] ?? null;
    }

    // ----------------------------------------------------------------
    // Vérifie qu'un utilisateur est impliqué dans le virement, soit en
    // tant que propriétaire du compte débiteur, soit du compte créditeur.
    // ----------------------------------------------------------------
    async estImpliqueDansVirement(idVirement: number, idUtilisateur: number): Promise<boolean> {
        const query = `
            SELECT v.idVirement
            FROM Virement v
            JOIN Compte cd ON cd.idCompte = v.idCompteDebit
            JOIN Compte cc ON cc.idCompte = v.idCompteCredit
            WHERE v.idVirement = ?
              AND (cd.idUtilisateur = ? OR cc.idUtilisateur = ?)
        `;
        const [rows] = await this.db.query<RowDataPacket[]>(query, [idVirement, idUtilisateur, idUtilisateur]);
        return rows.length > 0;
    }

    // ----------------------------------------------------------------
    // PUT /virements/:idVirement — mise à jour partielle
    // ----------------------------------------------------------------
    async updateVirement(
        idVirement: number,
        champs: {
            montant?:      number;
            dateVirement?: string | null;
            commentaire?:  string | null;
        },
    ): Promise<boolean> {
        const sets:   string[]  = [];
        const params: unknown[] = [];

        if ('montant'      in champs) { sets.push('montant      = ?'); params.push(champs.montant); }
        if ('dateVirement' in champs) { sets.push('dateVirement = COALESCE(?, dateVirement)'); params.push(champs.dateVirement); }
        if ('commentaire'  in champs) { sets.push('commentaire  = ?'); params.push(champs.commentaire); }

        if (sets.length === 0) return true;

        sets.push('dateHeureMAJ = CURRENT_TIMESTAMP()');
        params.push(idVirement);

        const query = `UPDATE Virement SET ${sets.join(', ')} WHERE idVirement = ?`;
        const [result] = await this.db.query<ResultSetHeader>(query, params);
        return result.affectedRows > 0;
    }

    // ----------------------------------------------------------------
    // DELETE /virements/:idVirement
    // ----------------------------------------------------------------
    async deleteVirement(idVirement: number): Promise<boolean> {
        const [result] = await this.db.query<ResultSetHeader>(
            'DELETE FROM Virement WHERE idVirement = ?',
            [idVirement],
        );
        return result.affectedRows > 0;
    }
}
