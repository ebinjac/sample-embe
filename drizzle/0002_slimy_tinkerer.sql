CREATE TYPE "public"."component_type" AS ENUM('text', 'heading', 'image', 'button', 'divider', 'spacer', 'list', 'container', 'column');--> statement-breakpoint
CREATE TYPE "public"."email_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('draft', 'queued', 'sending', 'sent', 'failed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."library_visibility" AS ENUM('private', 'team', 'public');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('newsletter', 'promotional', 'transactional', 'onboarding', 'notification', 'announcement', 'custom');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('draft', 'active', 'archived', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."template_visibility" AS ENUM('private', 'team', 'public', 'shared');--> statement-breakpoint
CREATE TYPE "public"."link_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE "email_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_history_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_path" varchar(500),
	"file_url" varchar(500),
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_by" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"config_name" varchar(100) NOT NULL,
	"smtp_host" varchar(255) NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_secure" boolean DEFAULT false NOT NULL,
	"smtp_auth" boolean DEFAULT true NOT NULL,
	"smtp_username" varchar(255),
	"smtp_password" varchar(255),
	"default_from_name" varchar(255),
	"default_from_email" varchar(255) NOT NULL,
	"default_reply_to" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_history_id" uuid NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"recipient_type" varchar(10) NOT NULL,
	"recipient_name" varchar(255),
	"status" "email_status" DEFAULT 'sent' NOT NULL,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"bounce_reason" text,
	"personalization_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_send_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"email_config_id" uuid,
	"team_id" uuid NOT NULL,
	"message_id" varchar(255),
	"subject" varchar(500) NOT NULL,
	"from_name" varchar(255),
	"from_email" varchar(255) NOT NULL,
	"reply_to" varchar(255),
	"to_emails" jsonb NOT NULL,
	"cc_emails" jsonb,
	"bcc_emails" jsonb,
	"html_content" text NOT NULL,
	"text_content" text,
	"status" "email_status" DEFAULT 'draft' NOT NULL,
	"priority" "email_priority" DEFAULT 'normal' NOT NULL,
	"track_opens" boolean DEFAULT false NOT NULL,
	"track_clicks" boolean DEFAULT false NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"send_attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"error_message" text,
	"smtp_response" text,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"sent_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_template_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"component_id" varchar(100) NOT NULL,
	"type" "component_type" NOT NULL,
	"component_data" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"parent_component_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "template_category" DEFAULT 'custom' NOT NULL,
	"team_id" uuid NOT NULL,
	"canvas_settings" jsonb NOT NULL,
	"status" "template_status" DEFAULT 'draft' NOT NULL,
	"visibility" "template_visibility" DEFAULT 'private' NOT NULL,
	"thumbnail_url" varchar(500),
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_template_id" uuid,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_application_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_email_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"email_config_id" uuid,
	"default_subject" varchar(500),
	"default_from_name" varchar(255),
	"default_from_email" varchar(255),
	"default_reply_to" varchar(255),
	"default_to_emails" text,
	"default_cc_emails" text,
	"default_bcc_emails" text,
	"track_opens" boolean DEFAULT false NOT NULL,
	"track_clicks" boolean DEFAULT false NOT NULL,
	"priority" "email_priority" DEFAULT 'normal' NOT NULL,
	"enable_personalization" boolean DEFAULT false NOT NULL,
	"personalization_variables" jsonb,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "template_category" NOT NULL,
	"team_id" uuid,
	"visibility" "library_visibility" DEFAULT 'private' NOT NULL,
	"original_template_id" uuid,
	"canvas_settings" jsonb NOT NULL,
	"thumbnail_url" varchar(500),
	"preview_url" varchar(500),
	"is_component" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) DEFAULT 'system' NOT NULL,
	"updated_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_library_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"library_template_id" uuid NOT NULL,
	"component_id" varchar(100) NOT NULL,
	"type" "component_type" NOT NULL,
	"component_data" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"parent_component_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_sharing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"shared_with_team_id" uuid NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_duplicate" boolean DEFAULT true NOT NULL,
	"shared_by" varchar(255) NOT NULL,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_usage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"library_template_id" uuid,
	"used_by" varchar(255) NOT NULL,
	"team_id" uuid,
	"application_id" uuid,
	"action" varchar(50) NOT NULL,
	"metadata" jsonb,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"team_id" uuid NOT NULL,
	"color" varchar(7),
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "link_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_tags" (
	"link_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"category_id" uuid,
	"visibility" "link_visibility" DEFAULT 'private' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"access_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"team_id" uuid NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_history_id_email_send_history_id_fk" FOREIGN KEY ("email_history_id") REFERENCES "public"."email_send_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_configurations" ADD CONSTRAINT "email_configurations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_email_history_id_email_send_history_id_fk" FOREIGN KEY ("email_history_id") REFERENCES "public"."email_send_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_history" ADD CONSTRAINT "email_send_history_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_history" ADD CONSTRAINT "email_send_history_email_config_id_email_configurations_id_fk" FOREIGN KEY ("email_config_id") REFERENCES "public"."email_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_history" ADD CONSTRAINT "email_send_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template_components" ADD CONSTRAINT "email_template_components_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_parent_template_id_email_templates_id_fk" FOREIGN KEY ("parent_template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_application_tags" ADD CONSTRAINT "template_application_tags_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_application_tags" ADD CONSTRAINT "template_application_tags_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_email_settings" ADD CONSTRAINT "template_email_settings_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_email_settings" ADD CONSTRAINT "template_email_settings_email_config_id_email_configurations_id_fk" FOREIGN KEY ("email_config_id") REFERENCES "public"."email_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_library" ADD CONSTRAINT "template_library_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_library" ADD CONSTRAINT "template_library_original_template_id_email_templates_id_fk" FOREIGN KEY ("original_template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_library_components" ADD CONSTRAINT "template_library_components_library_template_id_template_library_id_fk" FOREIGN KEY ("library_template_id") REFERENCES "public"."template_library"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_sharing" ADD CONSTRAINT "template_sharing_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_sharing" ADD CONSTRAINT "template_sharing_shared_with_team_id_teams_id_fk" FOREIGN KEY ("shared_with_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD CONSTRAINT "template_usage_history_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD CONSTRAINT "template_usage_history_library_template_id_template_library_id_fk" FOREIGN KEY ("library_template_id") REFERENCES "public"."template_library"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD CONSTRAINT "template_usage_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD CONSTRAINT "template_usage_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link_access_log" ADD CONSTRAINT "link_access_log_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link_applications" ADD CONSTRAINT "link_applications_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link_applications" ADD CONSTRAINT "link_applications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "email_attachments_history_idx" ON "email_attachments" USING btree ("email_history_id");--> statement-breakpoint
CREATE INDEX "email_attachments_filename_idx" ON "email_attachments" USING btree ("file_name");--> statement-breakpoint
CREATE INDEX "email_configs_team_id_idx" ON "email_configurations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_configs_is_active_idx" ON "email_configurations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_configs_is_default_idx" ON "email_configurations" USING btree ("team_id","is_default");--> statement-breakpoint
CREATE UNIQUE INDEX "email_configs_team_name_idx" ON "email_configurations" USING btree ("team_id","config_name");--> statement-breakpoint
CREATE INDEX "email_recipients_history_idx" ON "email_recipients" USING btree ("email_history_id");--> statement-breakpoint
CREATE INDEX "email_recipients_email_idx" ON "email_recipients" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX "email_recipients_status_idx" ON "email_recipients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_recipients_type_idx" ON "email_recipients" USING btree ("recipient_type");--> statement-breakpoint
CREATE INDEX "email_send_history_template_idx" ON "email_send_history" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "email_send_history_team_idx" ON "email_send_history" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_send_history_status_idx" ON "email_send_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_send_history_sent_at_idx" ON "email_send_history" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_send_history_message_id_idx" ON "email_send_history" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_send_history_scheduled_at_idx" ON "email_send_history" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "email_send_history_team_status_idx" ON "email_send_history" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "email_template_components_template_id_idx" ON "email_template_components" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "email_template_components_sort_order_idx" ON "email_template_components" USING btree ("template_id","sort_order");--> statement-breakpoint
CREATE INDEX "email_template_components_type_idx" ON "email_template_components" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "email_template_components_template_component_idx" ON "email_template_components" USING btree ("template_id","component_id");--> statement-breakpoint
CREATE INDEX "email_templates_team_id_idx" ON "email_templates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_templates_status_idx" ON "email_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_templates_visibility_idx" ON "email_templates" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "email_templates_category_idx" ON "email_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "email_templates_created_at_idx" ON "email_templates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_templates_usage_count_idx" ON "email_templates" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "email_templates_team_status_idx" ON "email_templates" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "email_templates_visibility_status_idx" ON "email_templates" USING btree ("visibility","status");--> statement-breakpoint
CREATE INDEX "email_templates_category_visibility_idx" ON "email_templates" USING btree ("category","visibility");--> statement-breakpoint
CREATE UNIQUE INDEX "email_templates_team_name_idx" ON "email_templates" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "template_app_tags_template_id_idx" ON "template_application_tags" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_app_tags_application_id_idx" ON "template_application_tags" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "template_app_tags_is_primary_idx" ON "template_application_tags" USING btree ("application_id","is_primary");--> statement-breakpoint
CREATE UNIQUE INDEX "template_app_tags_template_app_idx" ON "template_application_tags" USING btree ("template_id","application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "template_email_settings_template_idx" ON "template_email_settings" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_email_settings_config_idx" ON "template_email_settings" USING btree ("email_config_id");--> statement-breakpoint
CREATE INDEX "template_library_category_idx" ON "template_library" USING btree ("category");--> statement-breakpoint
CREATE INDEX "template_library_is_active_idx" ON "template_library" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "template_library_is_featured_idx" ON "template_library" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "template_library_usage_count_idx" ON "template_library" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "template_library_rating_idx" ON "template_library" USING btree ("rating");--> statement-breakpoint
CREATE UNIQUE INDEX "template_library_name_idx" ON "template_library" USING btree ("name");--> statement-breakpoint
CREATE INDEX "template_library_team_id_idx" ON "template_library" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "template_library_visibility_idx" ON "template_library" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "template_library_team_visibility_idx" ON "template_library" USING btree ("team_id","visibility");--> statement-breakpoint
CREATE INDEX "template_library_is_component_idx" ON "template_library" USING btree ("is_component");--> statement-breakpoint
CREATE INDEX "template_library_original_template_idx" ON "template_library" USING btree ("original_template_id");--> statement-breakpoint
CREATE INDEX "template_library_components_template_id_idx" ON "template_library_components" USING btree ("library_template_id");--> statement-breakpoint
CREATE INDEX "template_library_components_sort_order_idx" ON "template_library_components" USING btree ("library_template_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "template_library_components_template_component_idx" ON "template_library_components" USING btree ("library_template_id","component_id");--> statement-breakpoint
CREATE INDEX "template_sharing_template_id_idx" ON "template_sharing" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_sharing_shared_with_team_idx" ON "template_sharing" USING btree ("shared_with_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "template_sharing_template_team_idx" ON "template_sharing" USING btree ("template_id","shared_with_team_id");--> statement-breakpoint
CREATE INDEX "template_usage_template_id_idx" ON "template_usage_history" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_usage_library_template_id_idx" ON "template_usage_history" USING btree ("library_template_id");--> statement-breakpoint
CREATE INDEX "template_usage_team_id_idx" ON "template_usage_history" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "template_usage_used_at_idx" ON "template_usage_history" USING btree ("used_at");--> statement-breakpoint
CREATE INDEX "template_usage_action_idx" ON "template_usage_history" USING btree ("action");--> statement-breakpoint
CREATE INDEX "template_usage_team_used_at_idx" ON "template_usage_history" USING btree ("team_id","used_at");--> statement-breakpoint
CREATE INDEX "template_usage_action_used_at_idx" ON "template_usage_history" USING btree ("action","used_at");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_team_name_unique" ON "categories" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "categories_team_id_idx" ON "categories" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "link_access_log_link_id_idx" ON "link_access_log" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "link_access_log_user_id_idx" ON "link_access_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "link_access_log_accessed_at_idx" ON "link_access_log" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX "link_access_log_user_accessed_at_idx" ON "link_access_log" USING btree ("user_id","accessed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "link_app_link_app_unique" ON "link_applications" USING btree ("link_id","application_id");--> statement-breakpoint
CREATE INDEX "link_app_link_id_idx" ON "link_applications" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "link_app_application_id_idx" ON "link_applications" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "link_tags_link_tag_pk" ON "link_tags" USING btree ("link_id","tag_id");--> statement-breakpoint
CREATE INDEX "link_tags_link_id_idx" ON "link_tags" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "link_tags_tag_id_idx" ON "link_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "links_team_id_idx" ON "links" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "links_visibility_idx" ON "links" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "links_is_pinned_idx" ON "links" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "links_access_count_idx" ON "links" USING btree ("access_count");--> statement-breakpoint
CREATE INDEX "links_last_accessed_at_idx" ON "links" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE INDEX "links_team_visibility_idx" ON "links" USING btree ("team_id","visibility");--> statement-breakpoint
CREATE INDEX "links_search_idx" ON "links" USING btree ("title","description");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_team_name_unique" ON "tags" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "tags_team_id_idx" ON "tags" USING btree ("team_id");