import { Pool } from 'mysql2/promise';

export class AuthRepository {
    constructor(private db: Pool) {}

}