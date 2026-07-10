import type { NeonQueryFunction } from '@neondatabase/serverless';
import { PRODUCTION_RUNTIME_ROLE } from './production-guard';

export type RuntimeGrantPhase = 'read' | 'write';

const PUBLIC_ENUMS = [
  'feed_category',
  'feed_cover_status',
  'feed_import_status',
  'feed_kind',
  'feed_origin',
  'feed_status',
  'feed_audit_action',
  'feed_mutation_operation',
  'feed_mutation_result',
] as const;

const COMMON_REVOKES = [
  `DO $$ BEGIN
    EXECUTE format('REVOKE CREATE, TEMPORARY ON DATABASE %I FROM PUBLIC', current_database());
    EXECUTE format('REVOKE CREATE, TEMPORARY ON DATABASE %I FROM ${PRODUCTION_RUNTIME_ROLE}', current_database());
  END $$`,
  'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC',
  'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC',
  `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${PRODUCTION_RUNTIME_ROLE}`,
  `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ${PRODUCTION_RUNTIME_ROLE}`,
  'REVOKE CREATE ON SCHEMA public FROM PUBLIC',
  `REVOKE CREATE ON SCHEMA public FROM ${PRODUCTION_RUNTIME_ROLE}`,
  `GRANT USAGE ON SCHEMA public TO ${PRODUCTION_RUNTIME_ROLE}`,
  ...PUBLIC_ENUMS.map((name) => `GRANT USAGE ON TYPE public.${name} TO ${PRODUCTION_RUNTIME_ROLE}`),
] as const;

export const RUNTIME_READ_GRANT_STATEMENTS = [
  ...COMMON_REVOKES,
  `GRANT SELECT ON TABLE public.feeds TO ${PRODUCTION_RUNTIME_ROLE}`,
] as const;

export const RUNTIME_WRITE_GRANT_STATEMENTS = [
  ...COMMON_REVOKES,
  `GRANT SELECT, INSERT, UPDATE ON TABLE public.feeds TO ${PRODUCTION_RUNTIME_ROLE}`,
  `GRANT SELECT, INSERT ON TABLE public.feed_revisions TO ${PRODUCTION_RUNTIME_ROLE}`,
  `GRANT SELECT, INSERT ON TABLE public.feed_audit_events TO ${PRODUCTION_RUNTIME_ROLE}`,
  `GRANT SELECT, INSERT ON TABLE public.feed_idempotency_keys TO ${PRODUCTION_RUNTIME_ROLE}`,
] as const;

const TABLE_PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] as const;

const READ_PRIVILEGES = new Set(['feeds:SELECT']);
const WRITE_PRIVILEGES = new Set([
  'feeds:SELECT',
  'feeds:INSERT',
  'feeds:UPDATE',
  'feed_revisions:SELECT',
  'feed_revisions:INSERT',
  'feed_audit_events:SELECT',
  'feed_audit_events:INSERT',
  'feed_idempotency_keys:SELECT',
  'feed_idempotency_keys:INSERT',
]);

export async function applyRuntimeGrants(
  sql: NeonQueryFunction<false, false>,
  phase: RuntimeGrantPhase,
) {
  const statements = phase === 'read' ? RUNTIME_READ_GRANT_STATEMENTS : RUNTIME_WRITE_GRANT_STATEMENTS;
  await sql.transaction(statements.map((statement) => sql.query(statement)), {
    isolationLevel: 'Serializable',
  });
}

export async function assertRuntimeGrants(
  sql: NeonQueryFunction<false, false>,
  phase: RuntimeGrantPhase,
) {
  const roleRows = await sql`
    select
      rolsuper as "superuser",
      rolcreaterole as "createRole",
      rolcreatedb as "createDatabase",
      rolreplication as "replication",
      rolbypassrls as "bypassRls"
    from pg_roles
    where rolname = ${PRODUCTION_RUNTIME_ROLE}
  ` as Array<{
    superuser: boolean;
    createRole: boolean;
    createDatabase: boolean;
    replication: boolean;
    bypassRls: boolean;
  }>;
  if (roleRows.length !== 1 || Object.values(roleRows[0]).some(Boolean)) {
    throw new Error(`${PRODUCTION_RUNTIME_ROLE} must exist without elevated PostgreSQL role attributes`);
  }

  const memberships = await sql`
    select parent.rolname as role
    from pg_auth_members membership
    join pg_roles member on member.oid = membership.member
    join pg_roles parent on parent.oid = membership.roleid
    where member.rolname = ${PRODUCTION_RUNTIME_ROLE}
  ` as Array<{ role: string }>;
  if (memberships.length) {
    throw new Error(`${PRODUCTION_RUNTIME_ROLE} must not inherit privileges from another database role`);
  }

  const ownedObjects = await sql`
    select count(*)::integer as count from (
      select object.oid
      from pg_class object
      join pg_roles owner on owner.oid = object.relowner
      join pg_namespace namespace on namespace.oid = object.relnamespace
      where owner.rolname = ${PRODUCTION_RUNTIME_ROLE}
        and namespace.nspname not like 'pg_%'
        and namespace.nspname <> 'information_schema'
      union all
      select routine.oid
      from pg_proc routine
      join pg_roles owner on owner.oid = routine.proowner
      join pg_namespace namespace on namespace.oid = routine.pronamespace
      where owner.rolname = ${PRODUCTION_RUNTIME_ROLE}
        and namespace.nspname not like 'pg_%'
        and namespace.nspname <> 'information_schema'
      union all
      select data_type.oid
      from pg_type data_type
      join pg_roles owner on owner.oid = data_type.typowner
      join pg_namespace namespace on namespace.oid = data_type.typnamespace
      where owner.rolname = ${PRODUCTION_RUNTIME_ROLE}
        and namespace.nspname not like 'pg_%'
        and namespace.nspname <> 'information_schema'
      union all
      select namespace.oid
      from pg_namespace namespace
      join pg_roles owner on owner.oid = namespace.nspowner
      where owner.rolname = ${PRODUCTION_RUNTIME_ROLE}
        and namespace.nspname not like 'pg_%'
        and namespace.nspname <> 'information_schema'
      union all
      select extension.oid
      from pg_extension extension
      join pg_roles owner on owner.oid = extension.extowner
      where owner.rolname = ${PRODUCTION_RUNTIME_ROLE}
      union all
      select target_database.oid
      from pg_database target_database
      join pg_roles owner on owner.oid = target_database.datdba
      where owner.rolname = ${PRODUCTION_RUNTIME_ROLE}
    ) owned
  ` as Array<{ count: number }>;
  if (ownedObjects[0]?.count !== 0) {
    throw new Error(`${PRODUCTION_RUNTIME_ROLE} must not own database objects`);
  }

  const schemaPrivileges = await sql`
    select
      has_schema_privilege(${PRODUCTION_RUNTIME_ROLE}, 'public', 'USAGE') as usage,
      has_schema_privilege(${PRODUCTION_RUNTIME_ROLE}, 'public', 'CREATE') as create
  ` as Array<{ usage: boolean; create: boolean }>;
  if (schemaPrivileges.length !== 1 || !schemaPrivileges[0].usage || schemaPrivileges[0].create) {
    throw new Error(`${PRODUCTION_RUNTIME_ROLE} must have public schema USAGE without CREATE`);
  }

  const databasePrivileges = await sql`
    select
      has_database_privilege(${PRODUCTION_RUNTIME_ROLE}, current_database(), 'CONNECT') as connect,
      has_database_privilege(${PRODUCTION_RUNTIME_ROLE}, current_database(), 'CREATE') as create,
      has_database_privilege(${PRODUCTION_RUNTIME_ROLE}, current_database(), 'TEMPORARY') as temporary
  ` as Array<{ connect: boolean; create: boolean; temporary: boolean }>;
  if (
    databasePrivileges.length !== 1
    || !databasePrivileges[0].connect
    || databasePrivileges[0].create
    || databasePrivileges[0].temporary
  ) {
    throw new Error(`${PRODUCTION_RUNTIME_ROLE} must have database CONNECT without CREATE or TEMPORARY`);
  }

  const tableRows = await sql`
    select object.relname as table, privilege.name as privilege,
      has_table_privilege(${PRODUCTION_RUNTIME_ROLE}, object.oid, privilege.name) as allowed
    from pg_class object
    join pg_namespace namespace on namespace.oid = object.relnamespace
    cross join (values
      ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
    ) as privilege(name)
    where namespace.nspname = 'public' and object.relkind in ('r', 'p')
    order by object.relname, privilege.name
  ` as Array<{ table: string; privilege: typeof TABLE_PRIVILEGES[number]; allowed: boolean }>;
  const expected = phase === 'read' ? READ_PRIVILEGES : WRITE_PRIVILEGES;
  for (const row of tableRows) {
    const shouldBeAllowed = expected.has(`${row.table}:${row.privilege}`);
    if (row.allowed !== shouldBeAllowed) {
      throw new Error(
        `${PRODUCTION_RUNTIME_ROLE} has unexpected ${row.privilege} privilege state on public.${row.table}`,
      );
    }
  }

  const sequenceRows = await sql`
    select sequence.relname as sequence,
      has_sequence_privilege(${PRODUCTION_RUNTIME_ROLE}, sequence.oid, 'USAGE') as usage,
      has_sequence_privilege(${PRODUCTION_RUNTIME_ROLE}, sequence.oid, 'SELECT') as select,
      has_sequence_privilege(${PRODUCTION_RUNTIME_ROLE}, sequence.oid, 'UPDATE') as update
    from pg_class sequence
    join pg_namespace namespace on namespace.oid = sequence.relnamespace
    where namespace.nspname = 'public' and sequence.relkind = 'S'
  ` as Array<{ sequence: string; usage: boolean; select: boolean; update: boolean }>;
  if (sequenceRows.some((row) => row.usage || row.select || row.update)) {
    throw new Error(`${PRODUCTION_RUNTIME_ROLE} must not have public sequence privileges`);
  }

  return {
    phase,
    role: PRODUCTION_RUNTIME_ROLE,
    expectedTablePrivileges: [...expected].sort(),
  };
}
