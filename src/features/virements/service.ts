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

const ID_UTILISATEUR_PAR_DEFAUT = 1;

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

    // ----------------------------------------------------------------
    // POST /virements
    // ----------------------------------------------------------------
    async createVirement(dto: VirementCreationDTO): Promise<Record<string, unknown>> {
        if (dto.idCompteDebit === dto.idCompteCredit) {
            const err: any = new Error('Le compte débiteur et le compte créditeur doivent être différents');
            err.statusCode = 422;
            throw err;
        }

        const idVirement = await this.virementsRepository.creerVirement(
            dto.idCompteDebit,
            dto.idCompteCredit,
            dto.montant,
            dto.dateVirement    ?? null,
            dto.commentaire     ?? null,
            ID_UTILISATEUR_PAR_DEFAUT,
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
    async getVirementById(idVirement: number): Promise<Record<string, unknown>> {
        const row = await this.virementsRepository.findVirementById(idVirement);
        if (!row) {
            const err: any = new Error('Virement introuvable'); err.statusCode = 404; throw err;
        }
        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // PUT /virements/:idVirement
    // ----------------------------------------------------------------
    async updateVirement(idVirement: number, dto: VirementUpdateDTO): Promise<Record<string, unknown>> {
        const existe = await this.virementsRepository.findVirementById(idVirement);
        if (!existe) {
            const err: any = new Error('Virement introuvable'); err.statusCode = 404; throw err;
        }

        await this.virementsRepository.updateVirement(idVirement, dto);

        const row = await this.virementsRepository.findVirementById(idVirement);
        if (!row) throw new Error('Virement introuvable après mise à jour');
        return mapToDetail(row as Record<string, unknown>);
    }

    // ----------------------------------------------------------------
    // DELETE /virements/:idVirement
    // ----------------------------------------------------------------
    async deleteVirement(idVirement: number): Promise<void> {
        const existe = await this.virementsRepository.findVirementById(idVirement);
        if (!existe) {
            const err: any = new Error('Virement introuvable'); err.statusCode = 404; throw err;
        }
        await this.virementsRepository.deleteVirement(idVirement);
    }
}
