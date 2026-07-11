export const PRODUCTION_RUNTIME_ROLE = 'feeds_app_runtime';
export const RUNTIME_DATABASE_URL_KEY = 'FEED_RUNTIME_DATABASE_URL';

function isVercelRuntime(env: NodeJS.ProcessEnv) {
  return env.VERCEL === '1' || Boolean(env.VERCEL_ENV);
}

export function assertRuntimeDatabaseEnvironment(env: NodeJS.ProcessEnv = process.env) {
  if (!isVercelRuntime(env)) return;
  const bootstrapEnabled = env.FEED_DB_BOOTSTRAP_ENABLED === 'true';
  if (env.DATABASE_URL_UNPOOLED && !bootstrapEnabled) {
    throw new Error('DATABASE_URL_UNPOOLED must not be available to the Vercel build or runtime');
  }
  if (bootstrapEnabled) return;
  const connectionString = env[RUNTIME_DATABASE_URL_KEY] ?? env.DATABASE_URL;
  if (!connectionString) return;

  for (const [key, value] of Object.entries(env)) {
    if (!value || !/^postgres(?:ql)?:\/\//i.test(value) || key === RUNTIME_DATABASE_URL_KEY) continue;
    if (bootstrapEnabled && key !== RUNTIME_DATABASE_URL_KEY) continue;
    let candidate: URL;
    try {
      candidate = new URL(value);
    } catch {
      throw new Error(`Vercel database credential ${key} is invalid`);
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

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(`${RUNTIME_DATABASE_URL_KEY} is invalid`);
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol)
    || !url.hostname.endsWith('.neon.tech')
    || !url.hostname.split('.')[0].endsWith('-pooler')
  ) {
    throw new Error(`Vercel ${RUNTIME_DATABASE_URL_KEY} must be a pooled Neon PostgreSQL URL`);
  }
  if (decodeURIComponent(url.username) !== PRODUCTION_RUNTIME_ROLE) {
    throw new Error(`Vercel ${RUNTIME_DATABASE_URL_KEY} must use the fixed ${PRODUCTION_RUNTIME_ROLE} runtime role`);
  }
}

export function getRuntimeDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  assertRuntimeDatabaseEnvironment(env);
  const connectionString = env[RUNTIME_DATABASE_URL_KEY] ?? env.DATABASE_URL;
  if (!connectionString) throw new Error(`${RUNTIME_DATABASE_URL_KEY} is not configured`);
  return connectionString;
}
