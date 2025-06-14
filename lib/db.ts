import { neon } from "@neondatabase/serverless";

const isLocal = process.env.USE_LOCAL_DATABASE === "true";

// For local development only
export const getLocalPool = () => {
  if (!isLocal) {
    throw new Error("Local pool is only available in local development");
  }
  const { Pool } = require('pg');
  return new Pool({
    user: process.env.LOCAL_PGUSER,
    host: process.env.LOCAL_PGHOST,
    database: process.env.LOCAL_PGDATABASE,
    password: process.env.LOCAL_PGPASSWORD,
    port: Number(process.env.LOCAL_PGPORT) || 5432,
  });
};

// Neon serverless client - this is the recommended approach for serverless environments
export const getNeonClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  return neon(process.env.DATABASE_URL);
};

export const dbIsLocal = isLocal;

// Graceful shutdown
process.on('SIGINT', async () => {
  const pool = getLocalPool();
  await pool.end();
  process.exit(0);
});

// console.log("isLocal", isLocal);