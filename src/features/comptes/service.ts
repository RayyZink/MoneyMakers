import { ComptesRepository } from './repository';

export class ComptesService {
    constructor(private repository: ComptesRepository) {}

    async getComptes(idUtilisateur: number) {
        return await this.repository.findByUtilisateur(idUtilisateur);
    }

    async getCompteById(idCompte: number) {
        const comptes: any = await this.repository.findById(idCompte);
        if (comptes.length === 0) {
            return null;
        }
        return comptes[0];
    }

    async createCompte(idUtilisateur: number, descriptionCompte: string, nomBanque: string, montantInitial: number) {
        const result: any = await this.repository.create(idUtilisateur, descriptionCompte, nomBanque, montantInitial);
        return await this.getCompteById(result.insertId);
    }

    async updateCompte(idCompte: number, descriptionCompte: string, nomBanque: string) {
        await this.repository.update(idCompte, descriptionCompte, nomBanque);
        return await this.getCompteById(idCompte);
    }

    async deleteCompte(idCompte: number) {
        await this.repository.delete(idCompte);
    }

    async getSolde(idCompte: number, date: string) {
        const result: any = await this.repository.getSolde(idCompte, date);
        return result[0];
    }

}