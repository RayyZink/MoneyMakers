import { Pool } from 'mysql2/promise';

export class UtilisateursRepository {
    constructor(private db: Pool) {}

}