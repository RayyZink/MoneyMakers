import { Pool } from 'mysql2/promise';

export class MouvementsRepository {
    constructor(private db: Pool) {}

}