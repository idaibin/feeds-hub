import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getRuntimeDatabaseUrl } from './runtime-environment';

export type FeedDatabase = NeonHttpDatabase<typeof schema>;

let cachedDatabase: FeedDatabase | undefined;

export function createNeonQuery(connectionString: string): NeonQueryFunction<false, false> {
  if (!connectionString) throw new Error('Database connection is not configured');
  return neon(connectionString);
}

export function createDatabase(connectionString: string): FeedDatabase {
  return drizzle(createNeonQuery(connectionString), { schema });
}

export function getDatabase(): FeedDatabase {
  if (cachedDatabase) return cachedDatabase;

  cachedDatabase = createDatabase(getRuntimeDatabaseUrl());
  return cachedDatabase;
}
