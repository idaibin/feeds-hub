CREATE TYPE "public"."feed_audit_action" AS ENUM('draft_created', 'draft_updated', 'published', 'published_updated', 'archived');--> statement-breakpoint
CREATE TYPE "public"."feed_mutation_operation" AS ENUM('save_draft', 'publish', 'update_published', 'archive');--> statement-breakpoint
CREATE TYPE "public"."feed_mutation_result" AS ENUM('created', 'published', 'updated', 'archived');--> statement-breakpoint
CREATE TABLE "feed_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid NOT NULL,
	"resulting_version" integer NOT NULL,
	"actor" varchar(200) NOT NULL,
	"action" "feed_audit_action" NOT NULL,
	"reason" varchar(500) NOT NULL,
	"origin" "feed_origin" NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"request_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_audit_events_version_positive_check" CHECK ("feed_audit_events"."resulting_version" >= 1),
	CONSTRAINT "feed_audit_events_actor_length_check" CHECK (char_length("feed_audit_events"."actor") between 3 and 200),
	CONSTRAINT "feed_audit_events_reason_length_check" CHECK (char_length("feed_audit_events"."reason") between 1 and 500),
	CONSTRAINT "feed_audit_events_origin_check" CHECK ("feed_audit_events"."origin" in ('api', 'mcp')),
	CONSTRAINT "feed_audit_events_idempotency_key_length_check" CHECK (char_length("feed_audit_events"."idempotency_key") between 16 and 200),
	CONSTRAINT "feed_audit_events_metadata_object_check" CHECK (jsonb_typeof("feed_audit_events"."request_metadata") = 'object')
);
--> statement-breakpoint
CREATE TABLE "feed_idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" varchar(200) NOT NULL,
	"operation" "feed_mutation_operation" NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"request_hash" char(64) NOT NULL,
	"feed_id" uuid NOT NULL,
	"result_version" integer NOT NULL,
	"result_action" "feed_mutation_result" NOT NULL,
	"revision_id" uuid NOT NULL,
	"audit_event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_idempotency_actor_length_check" CHECK (char_length("feed_idempotency_keys"."actor") between 3 and 200),
	CONSTRAINT "feed_idempotency_key_length_check" CHECK (char_length("feed_idempotency_keys"."idempotency_key") between 16 and 200),
	CONSTRAINT "feed_idempotency_request_hash_check" CHECK ("feed_idempotency_keys"."request_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "feed_idempotency_result_version_positive_check" CHECK ("feed_idempotency_keys"."result_version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "feed_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_revisions_version_positive_check" CHECK ("feed_revisions"."version" >= 1),
	CONSTRAINT "feed_revisions_snapshot_object_check" CHECK (jsonb_typeof("feed_revisions"."snapshot") = 'object')
);
--> statement-breakpoint
ALTER TABLE "feed_audit_events" ADD CONSTRAINT "feed_audit_events_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_idempotency_keys" ADD CONSTRAINT "feed_idempotency_keys_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_idempotency_keys" ADD CONSTRAINT "feed_idempotency_keys_revision_id_feed_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."feed_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_idempotency_keys" ADD CONSTRAINT "feed_idempotency_keys_audit_event_id_feed_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."feed_audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_revisions" ADD CONSTRAINT "feed_revisions_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feed_audit_events_feed_created_idx" ON "feed_audit_events" USING btree ("feed_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "feed_audit_events_actor_created_idx" ON "feed_audit_events" USING btree ("actor","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE UNIQUE INDEX "feed_idempotency_scope_unique" ON "feed_idempotency_keys" USING btree ("actor","operation","idempotency_key");--> statement-breakpoint
CREATE INDEX "feed_idempotency_feed_created_idx" ON "feed_idempotency_keys" USING btree ("feed_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE UNIQUE INDEX "feed_revisions_feed_version_unique" ON "feed_revisions" USING btree ("feed_id","version");--> statement-breakpoint
CREATE INDEX "feed_revisions_feed_created_idx" ON "feed_revisions" USING btree ("feed_id","created_at" DESC NULLS LAST,"id");
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
--> statement-breakpoint
CREATE INDEX "feeds_title_trgm_idx" ON "feeds" USING gin (lower(regexp_replace("title", '\s+', ' ', 'g')) gin_trgm_ops);
--> statement-breakpoint
CREATE FUNCTION "reject_feed_physical_delete"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'physical feed deletion is prohibited' USING ERRCODE = '55000';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "feeds_reject_delete"
BEFORE DELETE ON "feeds"
FOR EACH ROW EXECUTE FUNCTION "reject_feed_physical_delete"();
--> statement-breakpoint
CREATE FUNCTION "reject_feed_history_mutation"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'feed history is append-only' USING ERRCODE = '55000';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "feed_revisions_reject_mutation"
BEFORE UPDATE OR DELETE ON "feed_revisions"
FOR EACH ROW EXECUTE FUNCTION "reject_feed_history_mutation"();
--> statement-breakpoint
CREATE TRIGGER "feed_audit_events_reject_mutation"
BEFORE UPDATE OR DELETE ON "feed_audit_events"
FOR EACH ROW EXECUTE FUNCTION "reject_feed_history_mutation"();
--> statement-breakpoint
CREATE TRIGGER "feed_idempotency_keys_reject_mutation"
BEFORE UPDATE OR DELETE ON "feed_idempotency_keys"
FOR EACH ROW EXECUTE FUNCTION "reject_feed_history_mutation"();
