import { Pool, RowDataPacket } from 'mysql2/promise';

export interface UtilisateurPublicRow extends RowDataPacket {
    idUtilisateur: number;
    nomUtilisateur: string;
    prenomUtilisateur: string;
    login: string;
    ville: string | null;
    codePostal: string | null;
    dateHeureCreation: Date;
}

type UpdatableField = 'nomUtilisateur' | 'prenomUtilisateur' | 'ville' | 'codePostal';

export class UtilisateursRepository {
    constructor(private db: Pool) {}

    async findById(id: number): Promise<UtilisateurPublicRow | null> {
        const [rows] = await this.db.query<UtilisateurPublicRow[]>(
            `SELECT idUtilisateur, nomUtilisateur, prenomUtilisateur, login,
                    ville, codePostal, dateHeureCreation
             FROM Utilisateur WHERE idUtilisateur = ?`,
            [id]
        );
        return rows[0] ?? null;
    }

    // Update partiel : on ne touche qu'aux champs réellement fournis
    async update(id: number, data: Partial<Record<UpdatableField, string | null>>): Promise<void> {
        const fields: string[] = [];
        const values: (string | null)[] = [];

        (['nomUtilisateur', 'prenomUtilisateur', 'ville', 'codePostal'] as UpdatableField[])
            .forEach((key) => {
                if (data[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(data[key] as string | null);
                }
            });

        if (fields.length === 0) return; // rien à mettre à jour

        values.push(String(id));
        await this.db.query(
            `UPDATE Utilisateur SET ${fields.join(', ')} WHERE idUtilisateur = ?`,
            values
        );
    }
}