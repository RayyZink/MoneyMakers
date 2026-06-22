import { VirementsRepository } from './repository';

export interface VirementCreationDTO {
    idCompteDebit:    number;
    idCompteCredit:   number;
    montant:          number;
    dateVirement?:    string;
    commentaire?:     string | null;
    idCategorie?:     number | null;
    idSousCategorie?: number | null;
}

export interface VirementUpdateDTO {
    montant?:      number;
    dateVirement?: string | null;
    commentaire?:  string | null;
}

const mapToDetail = (row: Record<string, unknown>) => ({
    idVirement:               row.idVirement,
    idCompteDebit:            row.idCompteDebit,
    idCompteCredit:           row.idCompteCredit,
    montant:                  parseFloat(String(row.montant)),
    dateVirement:             row.dateVirement,
    commentaire:              row.commentaire ?? null,
    virementInterUtilisateur: Boolean(row.virementInterUtilisateur),
});

export class VirementsService {
    constructor(private virementsRepository: VirementsRepository) {}

    /**
     * Vérifie que l'utilisateur est impliqué dans le virement (compte
     * débiteur ou créditeur). Lève 404 si le virement n'existe pas ou
     * si l'utilisateur n'y est pas impliqué (pour ne pas révéler l'existence
     * d'un virement appartenant à quelqu'un d'autre).
     */
    private async assertImplique(idVirement: number, idUtilisateur: number): Promise<void> {
        const implique = await this.virementsRepository.estImpliqueDansVirement(idVirement, idUtilisateur);
        if (!implique) {
            const err: any = new Error('Virement introuvable');
            err.statusCode = 404;
            throw err;
        }
    }

    // ----------------------------------------------------------------
    // POST /virements
    // ----------------------------------------------------------------
    async createVirement(dto: VirementCreationDTO, idUtilisateur: number): Promise<Record<string, unknown>> {
        if (dto.idCompteDebit === dto.idCompteCredit) {
            const err: any = new Error('Le compte débiteur et le compte créditeur doivent être différents');
            err.statusCode = 422;
            throw err;
        }

        // La procédure stockée creerVirement vérifie en base que idUtilisateur
        // possède bien idCompteDebit (SIGNAL SQLSTATE 45000 sinon -> 422 via errorMiddleware).
        const idVirement = await this.virementsRepository.creerVirement(
            dto.idCompteDebit,
            dto.idCompteCredit,
            dto.montant,
            dto.dateVirement    ?? null,
            dto.commentaire     ?? null,
            idUtilisateur,
            dto.idCategorie     ?? null,
            dto.idSousCategorie ?? null,
        );

        const row = await this.virementsRepository.findVirementById(idVirement);
        if (!row) throw new Error('Virement introuvable après création');
        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // GET /virements/:idVirement
    // ----------------------------------------------------------------
    async getVirementById(idVirement: number, idUtilisateur: number): Promise<Record<string, unknown>> {
        await this.assertImplique(idVirement, idUtilisateur);

        const row = await this.virementsRepository.findVirementById(idVirement);
        if (!row) {
            const err: any = new Error('Virement introuvable'); err.statusCode = 404; throw err;
        }
        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // PUT /virements/:idVirement
    // ----------------------------------------------------------------
    async updateVirement(idVirement: number, idUtilisateur: number, dto: VirementUpdateDTO): Promise<Record<string, unknown>> {
        await this.assertImplique(idVirement, idUtilisateur);

        await this.virementsRepository.updateVirement(idVirement, dto);

        const row = await this.virementsRepository.findVirementById(idVirement);
        if (!row) throw new Error('Virement introuvable après mise à jour');
        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // DELETE /virements/:idVirement
    // ----------------------------------------------------------------
    async deleteVirement(idVirement: number, idUtilisateur: number): Promise<void> {
        await this.assertImplique(idVirement, idUtilisateur);
        await this.virementsRepository.deleteVirement(idVirement);
    }
}
