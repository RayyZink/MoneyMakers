import { MouvementsRepository, MouvementFiltres } from './repository';

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

export class MouvementsService {
    constructor(private mouvementsRepository: MouvementsRepository) {}

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
        const { rows, total } = await this.mouvementsRepository.findMouvementsByCompteId(
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
        const idMouvement = await this.mouvementsRepository.createMouvement(
            idCompte,
            dto.dateMouvement   ?? null,
            dto.idTiers         ?? null,
            dto.idCategorie     ?? null,
            dto.idSousCategorie ?? null,
            dto.montant,
            dto.typeMouvement,
        );

        const row = await this.mouvementsRepository.findMouvementById(idMouvement);
        if (!row) throw new Error('Mouvement introuvable après création');
        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // GET /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async getMouvementById(idMouvement: number): Promise<Record<string, unknown>> {
        const row = await this.mouvementsRepository.findMouvementById(idMouvement);

        if (!row) {
            const err: any = new Error('Mouvement introuvable');
            err.statusCode = 404;
            throw err;
        }

        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // PUT /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async updateMouvement(
        idMouvement: number,
        dto:         MouvementCreationDTO,
    ): Promise<Record<string, unknown>> {
        const proprietaire = await this.mouvementsRepository.findProprietaireMouvement(idMouvement);
        if (!proprietaire) {
            const err: any = new Error('Mouvement introuvable');
            err.statusCode = 404;
            throw err;
        }

        await this.mouvementsRepository.updateMouvement(
            idMouvement,
            dto.dateMouvement   ?? null,
            dto.idTiers         ?? null,
            dto.idCategorie     ?? null,
            dto.idSousCategorie ?? null,
            dto.montant,
            dto.typeMouvement,
        );

        const row = await this.mouvementsRepository.findMouvementById(idMouvement);
        if (!row) throw new Error('Mouvement introuvable après mise à jour');
        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // DELETE /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async deleteMouvement(idMouvement: number): Promise<void> {
        const proprietaire = await this.mouvementsRepository.findProprietaireMouvement(idMouvement);
        if (!proprietaire) {
            const err: any = new Error('Mouvement introuvable');
            err.statusCode = 404;
            throw err;
        }

        await this.mouvementsRepository.deleteMouvement(idMouvement);
    }
}
