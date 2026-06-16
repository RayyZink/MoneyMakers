import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface UtilisateurRow extends RowDataPacket {
    idUtilisateur: number;
    nomUtilisateur: string;
    prenomUtilisateur: string;
    login: string;
    hashcode: string;          // hash bcrypt stocké en base (colonne "hashcode")
    ville: string | null;
    codePostal: string | null;
    dateHeureCreation: Date;
}

export class AuthRepository {
    constructor(private db: Pool) {}

    async findByLogin(login: string): Promise<UtilisateurRow | null> {
        const [rows] = await this.db.query<UtilisateurRow[]>(
            'SELECT * FROM Utilisateur WHERE login = ?',
            [login]
        );
        return rows[0] ?? null;
    }

    async create(data: {
        nomUtilisateur: string;
        prenomUtilisateur: string;
        login: string;
        motDePasseHash: string;
        ville: string | null;
        codePostal: string | null;
    }): Promise<number> {
        const [result] = await this.db.query<ResultSetHeader>(
            `INSERT INTO Utilisateur
                (nomUtilisateur, prenomUtilisateur, login, hashcode, ville, codePostal)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                data.nomUtilisateur,
                data.prenomUtilisateur,
                data.login,
                data.motDePasseHash,
                data.ville,
                data.codePostal,
            ]
        );
        return result.insertId;
    }
}
