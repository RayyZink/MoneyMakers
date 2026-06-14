import { Pool } from 'mysql2/promise';

export class ComptesRepository {
    constructor(private db: Pool) {}

}