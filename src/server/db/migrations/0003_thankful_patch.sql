CREATE TYPE "public"."workspace_record_type" AS ENUM('message', 'meter', 'inventory', 'resident', 'board_card', 'backlog_item', 'sprint', 'time_entry', 'roadmap_item', 'resource', 'risk', 'logbook_entry', 'access_key', 'cabin_info', 'utility', 'berth', 'insight');--> statement-breakpoint
CREATE TABLE "workspace_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "workspace_record_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"details" text,
	"status" varchar(100) DEFAULT 'active' NOT NULL,
	"amount" integer,
	"occurred_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_records" ADD CONSTRAINT "workspace_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_records" ADD CONSTRAINT "workspace_records_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_records_workspace_type_idx" ON "workspace_records" USING btree ("workspace_id","type");--> statement-breakpoint
CREATE INDEX "workspace_records_workspace_status_idx" ON "workspace_records" USING btree ("workspace_id","status");