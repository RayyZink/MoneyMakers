import { Pool } from 'mysql2/promise';

export class SousCategoriesRepository {
    constructor(private db: Pool) {}

}