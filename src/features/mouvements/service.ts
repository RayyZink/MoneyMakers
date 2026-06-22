import { MouvementsRepository } from './repository';

export interface MouvementUpdateDTO {
    dateMouvement?:   string | null;
    idTiers?:         number | null;
    idCategorie?:     number | null;
    idSousCategorie?: number | null;
    montant?:         number;
    typeMouvement?:   'D' | 'C';
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

    /**
     * Vérifie que le mouvement existe ET appartient à l'utilisateur connecté
     * (via le compte parent). Lève 404 dans les deux cas, pour ne pas révéler
     * l'existence d'un mouvement appartenant à un autre utilisateur.
     */
    private async assertProprietaire(idMouvement: number, idUtilisateur: number): Promise<void> {
        const proprietaire = await this.mouvementsRepository.findProprietaireMouvement(idMouvement);
        if (!proprietaire || proprietaire.idUtilisateur !== idUtilisateur) {
            const err: any = new Error('Mouvement introuvable');
            err.statusCode = 404;
            throw err;
        }
    }

    // ----------------------------------------------------------------
    // GET /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async getMouvementById(idMouvement: number, idUtilisateur: number): Promise<Record<string, unknown>> {
        await this.assertProprietaire(idMouvement, idUtilisateur);

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
        idMouvement:   number,
        idUtilisateur: number,
        dto:           MouvementUpdateDTO,
    ): Promise<Record<string, unknown>> {
        await this.assertProprietaire(idMouvement, idUtilisateur);

        await this.mouvementsRepository.updateMouvement(idMouvement, dto);

        const row = await this.mouvementsRepository.findMouvementById(idMouvement);
        if (!row) throw new Error('Mouvement introuvable après mise à jour');
        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // DELETE /mouvements/:idMouvement
    // ----------------------------------------------------------------
    async deleteMouvement(idMouvement: number, idUtilisateur: number): Promise<void> {
        await this.assertProprietaire(idMouvement, idUtilisateur);

        await this.mouvementsRepository.deleteMouvement(idMouvement);
    }
}
