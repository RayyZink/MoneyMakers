import { UtilisateursRepository } from './repository';

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export class UtilisateursService {
    constructor(private utilisateursRepository: UtilisateursRepository) {}

    async getById(id: number) {
        const user = await this.utilisateursRepository.findById(id);
        if (!user) throw new HttpError(404, 'Utilisateur non trouvé.');
        return user;
    }

    async update(id: number, data: {
        nomUtilisateur?: string;
        prenomUtilisateur?: string;
        ville?: string | null;
        codePostal?: string | null;
    }) {
        const existing = await this.utilisateursRepository.findById(id);
        if (!existing) throw new HttpError(404, 'Utilisateur non trouvé.');

        await this.utilisateursRepository.update(id, data);
        return this.utilisateursRepository.findById(id);
    }
}