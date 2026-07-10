CREATE TYPE "public"."feed_category" AS ENUM('worldcup', 'lol', 'stock', 'ai', 'github', 'hot', 'compute', 'global', 'rust', 'dev', 'security', 'product');--> statement-breakpoint
CREATE TYPE "public"."feed_cover_status" AS ENUM('pending');--> statement-breakpoint
CREATE TYPE "public"."feed_import_status" AS ENUM('succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."feed_kind" AS ENUM('match_result', 'match_schedule', 'match_flow', 'player_spotlight', 'knockout_update', 'worldcup_feed', 'hot_topic', 'market_brief', 'policy_update', 'news', 'breaking', 'insight', 'ai', 'data', 'visual');--> statement-breakpoint
CREATE TYPE "public"."feed_origin" AS ENUM('markdown', 'api', 'mcp');--> statement-breakpoint
CREATE TYPE "public"."feed_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "feed_import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_commit" varchar(64) NOT NULL,
	"source_tree_hash" char(64) NOT NULL,
	"hash_version" varchar(32) NOT NULL,
	"migration_hash" char(64) NOT NULL,
	"database_fingerprint" char(64) NOT NULL,
	"target" varchar(32) NOT NULL,
	"status" "feed_import_status" NOT NULL,
	"total" integer NOT NULL,
	"inserted" integer NOT NULL,
	"updated" integer NOT NULL,
	"unchanged" integer NOT NULL,
	"conflict" integer NOT NULL,
	"invalid" integer NOT NULL,
	"failures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "feed_import_runs_source_tree_hash_check" CHECK ("feed_import_runs"."source_tree_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "feed_import_runs_migration_hash_check" CHECK ("feed_import_runs"."migration_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "feed_import_runs_database_fingerprint_check" CHECK ("feed_import_runs"."database_fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "feed_import_runs_target_check" CHECK ("feed_import_runs"."target" = 'production'),
	CONSTRAINT "feed_import_runs_counts_nonnegative_check" CHECK ("feed_import_runs"."total" >= 0 and "feed_import_runs"."inserted" >= 0 and "feed_import_runs"."updated" >= 0 and "feed_import_runs"."unchanged" >= 0 and "feed_import_runs"."conflict" >= 0 and "feed_import_runs"."invalid" >= 0),
	CONSTRAINT "feed_import_runs_total_check" CHECK ("feed_import_runs"."total" = "feed_import_runs"."inserted" + "feed_import_runs"."updated" + "feed_import_runs"."unchanged" + "feed_import_runs"."conflict" + "feed_import_runs"."invalid"),
	CONSTRAINT "feed_import_runs_success_check" CHECK ("feed_import_runs"."status" <> 'succeeded' or ("feed_import_runs"."conflict" = 0 and "feed_import_runs"."invalid" = 0 and jsonb_array_length("feed_import_runs"."failures") = 0)),
	CONSTRAINT "feed_import_runs_time_check" CHECK ("feed_import_runs"."completed_at" >= "feed_import_runs"."started_at")
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"category" "feed_category" NOT NULL,
	"kind" "feed_kind" NOT NULL,
	"topic" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"event_at" timestamp with time zone NOT NULL,
	"event_key" text NOT NULL,
	"cover" text NOT NULL,
	"cover_status" "feed_cover_status" DEFAULT 'pending' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text NOT NULL,
	"body" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" "feed_status" NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"origin" "feed_origin" DEFAULT 'markdown' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"content_hash" char(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feeds_slug_format_check" CHECK ("feeds"."slug" ~ '^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$'),
	CONSTRAINT "feeds_title_length_check" CHECK (char_length("feeds"."title") between 2 and 300),
	CONSTRAINT "feeds_subtitle_length_check" CHECK (char_length("feeds"."subtitle") between 2 and 500),
	CONSTRAINT "feeds_topic_length_check" CHECK (char_length("feeds"."topic") between 2 and 300),
	CONSTRAINT "feeds_event_key_length_check" CHECK (char_length("feeds"."event_key") between 2 and 700),
	CONSTRAINT "feeds_cover_length_check" CHECK (char_length("feeds"."cover") between 1 and 1200),
	CONSTRAINT "feeds_summary_length_check" CHECK (char_length("feeds"."summary") between 2 and 3000),
	CONSTRAINT "feeds_source_length_check" CHECK (char_length("feeds"."source") between 2 and 300),
	CONSTRAINT "feeds_source_url_length_check" CHECK (char_length("feeds"."source_url") between 8 and 4096),
	CONSTRAINT "feeds_source_url_protocol_check" CHECK ("feeds"."source_url" ~ '^https?://[^[:space:]]+$'),
	CONSTRAINT "feeds_body_length_check" CHECK (char_length("feeds"."body") between 1 and 50000),
	CONSTRAINT "feeds_priority_range_check" CHECK ("feeds"."priority" between -1000 and 1000),
	CONSTRAINT "feeds_version_positive_check" CHECK ("feeds"."version" >= 1),
	CONSTRAINT "feeds_content_hash_check" CHECK ("feeds"."content_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "feeds_tags_array_check" CHECK (jsonb_typeof("feeds"."tags") = 'array'),
	CONSTRAINT "feeds_lifecycle_check" CHECK ((
        ("feeds"."status" = 'draft' and "feeds"."published_at" is null and "feeds"."archived_at" is null)
        or ("feeds"."status" = 'published' and "feeds"."published_at" is not null and "feeds"."archived_at" is null)
        or ("feeds"."status" = 'archived' and "feeds"."published_at" is not null and "feeds"."archived_at" is not null)
      ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "feed_import_runs_source_commit_unique" ON "feed_import_runs" USING btree ("source_commit");--> statement-breakpoint
CREATE INDEX "feed_import_runs_completed_idx" ON "feed_import_runs" USING btree ("completed_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE UNIQUE INDEX "feeds_slug_unique" ON "feeds" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "feeds_event_key_unique" ON "feeds" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "feeds_source_url_idx" ON "feeds" USING btree ("source_url");--> statement-breakpoint
CREATE INDEX "feeds_status_updated_idx" ON "feeds" USING btree ("status","updated_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "feeds_published_event_idx" ON "feeds" USING btree ("event_at" DESC NULLS LAST,"priority" DESC NULLS LAST,"date" DESC NULLS LAST,"id") WHERE "feeds"."status" = 'published';--> statement-breakpoint
CREATE INDEX "feeds_published_category_event_idx" ON "feeds" USING btree ("category","event_at" DESC NULLS LAST,"priority" DESC NULLS LAST,"date" DESC NULLS LAST,"id") WHERE "feeds"."status" = 'published';