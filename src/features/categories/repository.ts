import { Pool } from 'mysql2/promise';

export class CategoriesRepository {
    constructor(private db: Pool) {}

}