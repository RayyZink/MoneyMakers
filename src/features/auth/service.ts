import bcrypt from 'bcryptjs';
import { AuthRepository, UtilisateurRow } from './repository';
import { signToken } from '../../utils/jwt';

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

function toPublic(u: UtilisateurRow) {
    const { hashcode, ...rest } = u;
    return rest;
}

interface RegisterInput {
    nomUtilisateur: string;
    prenomUtilisateur: string;
    login: string;
    motDePasse: string;
    ville?: string | null;
    codePostal?: string | null;
}

export class AuthService {
    constructor(private authRepository: AuthRepository) {}

    async register(input: RegisterInput) {
        const existing = await this.authRepository.findByLogin(input.login);
        if (existing) {
            throw new HttpError(409, 'Ce login est déjà utilisé.');
        }

        const motDePasseHash = await bcrypt.hash(input.motDePasse, 10);

        await this.authRepository.create({
            nomUtilisateur: input.nomUtilisateur,
            prenomUtilisateur: input.prenomUtilisateur,
            login: input.login,
            motDePasseHash,
            ville: input.ville ?? null,
            codePostal: input.codePostal ?? null,
        });

        const created = await this.authRepository.findByLogin(input.login);
        return toPublic(created!);
    }

    async login(login: string, motDePasse: string) {
        const user = await this.authRepository.findByLogin(login);
        if (!user) {
            throw new HttpError(401, 'Identifiants invalides.');
        }

        const ok = await bcrypt.compare(motDePasse, user.hashcode);
        if (!ok) {
            throw new HttpError(401, 'Identifiants invalides.');
        }

        const token = signToken({ idUtilisateur: user.idUtilisateur, login: user.login });
        return { token, utilisateur: toPublic(user) };
    }
}
