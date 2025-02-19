import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000 // 5 seconds timeout
});

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export { pool };
export const db = drizzle(pool, { schema });