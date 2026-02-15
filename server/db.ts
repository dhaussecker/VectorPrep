import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  ...(connStr
    ? { connectionString: connStr }
    : {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DATABASE,
        port: 5432,
      }),
  max: 1,
  ssl: process.env.POSTGRES_HOST ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
