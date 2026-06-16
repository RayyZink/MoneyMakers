import { Pool } from 'mysql2/promise';

export class TiersRepository {
    constructor(private db: Pool) {}

}