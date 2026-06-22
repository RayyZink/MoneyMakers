import { ComptesRepository, MouvementFiltres } from './repository';

export interface MouvementCreationDTO {
    dateMouvement?:   string;
    idTiers?:         number | null;
    idCategorie?:     number | null;
    idSousCategorie?: number | null;
    montant:          number;
    typeMouvement:    'D' | 'C';
}

const mapToDetail = (row: Record<string, unknown>) => ({
    idMouvement:       row.idMouvement,
    idCompte:          row.idCompte,
    dateMouvement:     row.dateMouvement,
    descriptionCompte: row.descriptionCompte,
    nomBanque:         row.nomBanque,
    idTiers:           row.idTiers          ?? null,
    nomTiers:          row.nomTiers         ?? null,
    idCategorie:       row.idCategorie      ?? null,
    nomCategorie:      row.nomCategorie     ?? null,
    idSousCategorie:   row.idSousCategorie  ?? null,
    nomSousCategorie:  row.nomSousCategorie ?? null,
    montant:           parseFloat(String(row.montant)),
    typeMouvement:     row.typeMouvement,
    idVirement:        row.idVirement       ?? null,
});

export class ComptesService {
    constructor(private comptesRepository: ComptesRepository) {}

    private async assertProprietaireCompte(idCompte: number, idUtilisateur: number): Promise<void> {
        const comptes: any = await this.comptesRepository.findById(idCompte, idUtilisateur);
        if (comptes.length === 0) {
            const err: any = new Error('Compte introuvable');
            err.statusCode = 404;
            throw err;
        }
    }

    // ----------------------------------------------------------------
    // GET /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async getMouvementsPourCompte(
        idCompte: number,
        idUtilisateur: number,
        filtres: {
            dateDebut?:     string;
            dateFin?:       string;
            typeMouvement?: 'D' | 'C';
            page:           number;
            limit:          number;
        },
    ) {
        await this.assertProprietaireCompte(idCompte, idUtilisateur);

        const { rows, total } = await this.comptesRepository.findMouvementsByCompteId(
            idCompte,
            idUtilisateur,
            filtres as MouvementFiltres,
        );

        const { page, limit } = filtres;

        return {
            data: rows.map(mapToDetail),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ----------------------------------------------------------------
    // POST /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async createMouvement(
        idCompte:      number,
        idUtilisateur: number,
        dto:           MouvementCreationDTO,
    ): Promise<Record<string, unknown>> {
        await this.assertProprietaireCompte(idCompte, idUtilisateur);

        const idMouvement = await this.comptesRepository.createMouvement(
            idCompte,
            dto.dateMouvement   ?? null,
            dto.idTiers         ?? null,
            dto.idCategorie     ?? null,
            dto.idSousCategorie ?? null,
            dto.montant,
            dto.typeMouvement,
        );

        const row = await this.comptesRepository.findMouvementById(idMouvement, idUtilisateur);
        if (!row) throw new Error('Mouvement introuvable après création');
        return mapToDetail(row as Record<string, unknown>);
    }

    async getComptes(idUtilisateur: number) {
        return await this.comptesRepository.findByUtilisateur(idUtilisateur);
    }

    async getCompteById(idCompte: number, idUtilisateur: number) {
        const comptes: any = await this.comptesRepository.findById(idCompte, idUtilisateur);
        if (comptes.length === 0) {
            return null;
        }
        return comptes[0];
    }

    async createCompte(idUtilisateur: number, descriptionCompte: string, nomBanque: string, montantInitial: number) {
        const result: any = await this.comptesRepository.create(idUtilisateur, descriptionCompte, nomBanque, montantInitial);
        return await this.getCompteById(result.insertId, idUtilisateur);
    }

    async updateCompte(
        idCompte: number,
        idUtilisateur: number,
        champs: { descriptionCompte?: string; nomBanque?: string },
    ) {
        await this.assertProprietaireCompte(idCompte, idUtilisateur);
        await this.comptesRepository.update(idCompte, idUtilisateur, champs);
        return await this.getCompteById(idCompte, idUtilisateur);
    }

    async deleteCompte(idCompte: number, idUtilisateur: number) {
        await this.assertProprietaireCompte(idCompte, idUtilisateur);
        await this.comptesRepository.delete(idCompte, idUtilisateur);
    }

    async getSolde(idCompte: number, idUtilisateur: number, date: string) {
        await this.assertProprietaireCompte(idCompte, idUtilisateur);
        const result: any = await this.comptesRepository.getSolde(idCompte, idUtilisateur, date);
        return result[0];
    }

}