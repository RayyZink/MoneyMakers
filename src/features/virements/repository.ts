import { Pool } from 'mysql2/promise';

export class VirementsRepository {
    constructor(private db: Pool) {}

}