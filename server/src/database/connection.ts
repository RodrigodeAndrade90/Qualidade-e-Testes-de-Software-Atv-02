import { Pool, type QueryResultRow } from "pg";

// Prepara a conexão com PostgreSQL usando as configurações do ambiente.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("error", (error) => {
  console.error("Não foi possível conectar ao PostgreSQL:", error);
});

// O pool implementa esta interface; testes também podem injetar um objeto com query().
export interface Database {
  query<T extends QueryResultRow>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
}
