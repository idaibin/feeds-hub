export const PRODUCTION_RUNTIME_ROLE = 'feeds_runtime';

function isVercelRuntime(env: NodeJS.ProcessEnv) {
  return env.VERCEL === '1' || Boolean(env.VERCEL_ENV);
}

export function assertRuntimeDatabaseEnvironment(env: NodeJS.ProcessEnv = process.env) {
  if (!isVercelRuntime(env)) return;
  if (env.DATABASE_URL_UNPOOLED) {
    throw new Error('DATABASE_URL_UNPOOLED must not be available to the Vercel build or runtime');
  }
  for (const [key, value] of Object.entries(env)) {
    if (!value || !/^postgres(?:ql)?:\/\//i.test(value)) continue;
    let candidate: URL;
    try {
      candidate = new URL(value);
    } catch {
      if (key === 'DATABASE_URL') throw new Error('DATABASE_URL is invalid');
      continue;
    }
    if (!candidate.hostname.endsWith('.neon.tech')) continue;
    if (
      !candidate.hostname.split('.')[0].endsWith('-pooler')
      || decodeURIComponent(candidate.username) !== PRODUCTION_RUNTIME_ROLE
    ) {
      throw new Error(
        `Vercel database credential ${key} must be pooled and use the fixed ${PRODUCTION_RUNTIME_ROLE} runtime role`,
      );
    }
  }
  if (!env.DATABASE_URL) return;

  let url: URL;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL is invalid');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol)
    || !url.hostname.endsWith('.neon.tech')
    || !url.hostname.split('.')[0].endsWith('-pooler')
  ) {
    throw new Error('Vercel DATABASE_URL must be a pooled Neon PostgreSQL URL');
  }
  if (decodeURIComponent(url.username) !== PRODUCTION_RUNTIME_ROLE) {
    throw new Error(`Vercel DATABASE_URL must use the fixed ${PRODUCTION_RUNTIME_ROLE} runtime role`);
  }
}

export function getRuntimeDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  assertRuntimeDatabaseEnvironment(env);
  const connectionString = env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  return connectionString;
}
