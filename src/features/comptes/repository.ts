import { Pool } from 'mysql2/promise';

export class ComptesRepository {
    constructor(private db: Pool) {}

    async findByUtilisateur(idUtilisateur: number) {
        const [rows] = await this.db.query(
            'SELECT * FROM Compte WHERE idUtilisateur = ?',
            [idUtilisateur]
        );
        return rows;
    }

    async findById(idCompte: number) {
        const [rows] = await this.db.query(
            'SELECT * FROM Compte WHERE idCompte = ?',
            [idCompte]
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

    async update(idCompte: number, descriptionCompte: string, nomBanque: string) {
        const [result] = await this.db.query(
            'UPDATE Compte SET descriptionCompte = ?, nomBanque = ? WHERE idCompte = ?',
            [descriptionCompte, nomBanque, idCompte]
        );
        return result;
    }

    async delete(idCompte: number) {
        const [result] = await this.db.query(
            'DELETE FROM Compte WHERE idCompte = ?',
            [idCompte]
        );
        return result;
    }

    async getSolde(idCompte: number, date: string) {
        const [rows] = await this.db.query(
            'SELECT soldeHistorique(?, ?) AS solde',
            [idCompte, date]
        );
        return rows;
    }

}