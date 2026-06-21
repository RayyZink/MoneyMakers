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

    // ----------------------------------------------------------------
    // GET /comptes/:idCompte/mouvements
    // ----------------------------------------------------------------
    async getMouvementsPourCompte(
        idCompte: number,
        filtres: {
            dateDebut?:     string;
            dateFin?:       string;
            typeMouvement?: 'D' | 'C';
            page:           number;
            limit:          number;
        },
    ) {
        const { rows, total } = await this.comptesRepository.findMouvementsByCompteId(
            idCompte,
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
        idCompte: number,
        dto:      MouvementCreationDTO,
    ): Promise<Record<string, unknown>> {
        const idMouvement = await this.comptesRepository.createMouvement(
            idCompte,
            dto.dateMouvement   ?? null,
            dto.idTiers         ?? null,
            dto.idCategorie     ?? null,
            dto.idSousCategorie ?? null,
            dto.montant,
            dto.typeMouvement,
        );

        const row = await this.comptesRepository.findMouvementById(idMouvement);
        if (!row) throw new Error('Mouvement introuvable après création');
        return mapToDetail(row as Record<string, unknown>);
    }

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