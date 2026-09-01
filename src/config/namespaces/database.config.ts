import { registerAs } from '@nestjs/config';

// Base de datos PROPIA del producto. No es la base de Innlab Core.
// Ejemplo de uso con TypeORM — ajusta al ORM que use tu equipo.
export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  name: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true',
}));
