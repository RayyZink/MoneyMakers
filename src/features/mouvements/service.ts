import { MouvementsRepository } from './repository';

export class MouvementsService {
    constructor(private mouvementsRepository: MouvementsRepository) {}

    async getMouvementsPourCompte(idCompte: number) {
        const lignesDonnees = await this.mouvementsRepository.findMouvementsByCompteId(idCompte);

        return lignesDonnees.map(row => ({
            idMouvement:      row.idMouvement,
            dateMouvement:    row.dateMouvement,
            descriptionCompte: row.descriptionCompte,
            nomTiers:         row.nomTiers         || null,
            nomCategorie:     row.nomCategorie     || null,
            nomSousCategorie: row.nomSousCategorie || null,
            montant:          parseFloat(row.montant),
            typeMouvement:    row.typeMouvement,
        }));
    }
}