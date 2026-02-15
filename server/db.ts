import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (connStr) {
  const masked = connStr.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log("DB connecting to:", masked);
} else {
  console.log("WARNING: No DATABASE_URL or POSTGRES_URL set");
}

const pool = new Pool({
  connectionString: connStr,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
