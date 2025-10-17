// db/schema/bluemailer.ts

import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    pgEnum,
    integer,
    boolean,
    index,
    uniqueIndex,
    jsonb,
    type AnyPgColumn
} from "drizzle-orm/pg-core";
import { relations, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { teams, applications } from "./teams";

// Define enums for BlueMailer
export const templateStatus = pgEnum('template_status', [
    'draft',
    'active',
    'archived',
    'deprecated'
]);

export const templateVisibility = pgEnum('template_visibility', [
    'private',
    'team',
    'public',
    'shared'
]);

export const templateCategory = pgEnum('template_category', [
    'newsletter',
    'promotional',
    'transactional',
    'onboarding',
    'notification',
    'announcement',
    'custom'
]);

export const componentType = pgEnum('component_type', [
    'text',
    'heading',
    'image',
    'button',
    'divider',
    'spacer',
    'list',
    'container',
    'column'
]);

export const libraryVisibility = pgEnum('library_visibility', [
    'private',  // Only visible to the creating team
    'team',     // Visible to team members
    'public'    // Visible to all teams
]);

export const emailStatus = pgEnum('email_status', [
    'draft',
    'queued', 
    'sending',
    'sent',
    'failed',
    'bounced'
]);

export const emailPriority = pgEnum('email_priority', [
    'low',
    'normal', 
    'high',
    'urgent'
]);


// Email Templates - Core template information
export const emailTemplates = pgTable("email_templates", {
    id: uuid("id").defaultRandom().primaryKey(),

    // Template metadata
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: templateCategory("category").notNull().default('custom'),

    // Team ownership
    teamId: uuid("team_id")
        .notNull()
        .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    // Template configuration
    canvasSettings: jsonb("canvas_settings").$type<{
        backgroundColor: string;
        contentBackgroundColor: string;
        contentWidth: string;
        maxWidth: string;
        padding: string;
        fontFamily: string;
        fontSize: string;
        lineHeight: string;
        color: string;
    }>().notNull(),

    // Template properties
    status: templateStatus("status").notNull().default('draft'),
    visibility: templateVisibility("visibility").notNull().default('private'),

    // Thumbnail for template library
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),

    // Usage tracking
    usageCount: integer("usage_count").notNull().default(0),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),

    // Version control
    version: integer("version").notNull().default(1),
    parentTemplateId: uuid("parent_template_id").references((): AnyPgColumn => emailTemplates.id, { onDelete: 'set null' }),

    // Audit fields
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: varchar("updated_by", { length: 255 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    // Indexes for performance
    teamIdIdx: index('email_templates_team_id_idx').on(table.teamId),
    statusIdx: index('email_templates_status_idx').on(table.status),
    visibilityIdx: index('email_templates_visibility_idx').on(table.visibility),
    categoryIdx: index('email_templates_category_idx').on(table.category),
    createdAtIdx: index('email_templates_created_at_idx').on(table.createdAt),
    usageCountIdx: index('email_templates_usage_count_idx').on(table.usageCount),

    // Composite indexes for common queries
    teamStatusIdx: index('email_templates_team_status_idx').on(table.teamId, table.status),
    visibilityStatusIdx: index('email_templates_visibility_status_idx').on(table.visibility, table.status),
    categoryVisibilityIdx: index('email_templates_category_visibility_idx').on(table.category, table.visibility),

    // Unique constraint for template names within a team
    teamNameIdx: uniqueIndex('email_templates_team_name_idx').on(table.teamId, table.name),
}));

// Email Template Components
export const emailTemplateComponents = pgTable("email_template_components", {
    id: uuid("id").defaultRandom().primaryKey(),

    templateId: uuid("template_id")
        .notNull()
        .references(() => emailTemplates.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    componentId: varchar("component_id", { length: 100 }).notNull(),
    type: componentType("type").notNull(),

    componentData: jsonb("component_data").$type<{
        id: string;
        type: string;
        content?: string;
        src?: string;
        alt?: string;
        text?: string;
        href?: string;
        level?: string;
        height?: string;
        listType?: string;
        items?: string[];
        columnWidths?: string[];
        children?: any[];
        styles?: Record<string, any>;
    }>().notNull(),

    sortOrder: integer("sort_order").notNull().default(0),
    parentComponentId: varchar("parent_component_id", { length: 100 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    templateIdIdx: index('email_template_components_template_id_idx').on(table.templateId),
    sortOrderIdx: index('email_template_components_sort_order_idx').on(table.templateId, table.sortOrder),
    typeIdx: index('email_template_components_type_idx').on(table.type),
    templateComponentIdx: uniqueIndex('email_template_components_template_component_idx')
        .on(table.templateId, table.componentId),
}));

// Template Application Tags
export const templateApplicationTags = pgTable("template_application_tags", {
    id: uuid("id").defaultRandom().primaryKey(),

    templateId: uuid("template_id")
        .notNull()
        .references(() => emailTemplates.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    applicationId: uuid("application_id")
        .notNull()
        .references(() => applications.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    isPrimary: boolean("is_primary").notNull().default(false),

    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    templateIdIdx: index('template_app_tags_template_id_idx').on(table.templateId),
    applicationIdIdx: index('template_app_tags_application_id_idx').on(table.applicationId),
    isPrimaryIdx: index('template_app_tags_is_primary_idx').on(table.applicationId, table.isPrimary),
    templateAppIdx: uniqueIndex('template_app_tags_template_app_idx')
        .on(table.templateId, table.applicationId),
}));

// Template Sharing
export const templateSharing = pgTable("template_sharing", {
    id: uuid("id").defaultRandom().primaryKey(),

    templateId: uuid("template_id")
        .notNull()
        .references(() => emailTemplates.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    sharedWithTeamId: uuid("shared_with_team_id")
        .notNull()
        .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    canEdit: boolean("can_edit").notNull().default(false),
    canDuplicate: boolean("can_duplicate").notNull().default(true),

    sharedBy: varchar("shared_by", { length: 255 }).notNull(),
    sharedAt: timestamp("shared_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    templateIdIdx: index('template_sharing_template_id_idx').on(table.templateId),
    sharedWithTeamIdx: index('template_sharing_shared_with_team_idx').on(table.sharedWithTeamId),
    templateTeamIdx: uniqueIndex('template_sharing_template_team_idx')
        .on(table.templateId, table.sharedWithTeamId),
}));

// Template Library
export const templateLibrary = pgTable("template_library", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"), // Also make this nullable for optional descriptions
    category: templateCategory("category").notNull(),
    
    // Team ownership for team-specific libraries
    teamId: uuid("team_id").references(() => teams.id, { 
      onDelete: 'cascade', 
      onUpdate: 'cascade' 
    }), // Nullable - null means global/system template
    
    // Visibility control
    visibility: libraryVisibility("visibility").notNull().default('private'),
    
    // Reference to original template if created from existing one
    originalTemplateId: uuid("original_template_id").references(() => emailTemplates.id, { 
      onDelete: 'set null' 
    }),
    
    canvasSettings: jsonb("canvas_settings").$type<{
      backgroundColor: string;
      contentBackgroundColor: string;
      contentWidth: string;
      maxWidth: string;
      padding: string;
      fontFamily: string;
      fontSize: string;
      lineHeight: string;
      color: string;
    }>().notNull(),
    
    // FIX: Make thumbnailUrl nullable
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }), // Removed .notNull()
    previewUrl: varchar("preview_url", { length: 500 }),
    
    // Add isComponent flag to distinguish between templates and components
    isComponent: boolean("is_component").notNull().default(false),
    
    usageCount: integer("usage_count").notNull().default(0),
    rating: integer("rating").default(0),
    
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    
    createdBy: varchar("created_by", { length: 255 }).notNull().default('system'),
    updatedBy: varchar("updated_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }, (table) => ({
    // Your existing indexes...
    categoryIdx: index('template_library_category_idx').on(table.category),
    isActiveIdx: index('template_library_is_active_idx').on(table.isActive),
    isFeaturedIdx: index('template_library_is_featured_idx').on(table.isFeatured),
    usageCountIdx: index('template_library_usage_count_idx').on(table.usageCount),
    ratingIdx: index('template_library_rating_idx').on(table.rating),
    nameIdx: uniqueIndex('template_library_name_idx').on(table.name),
    teamIdIdx: index('template_library_team_id_idx').on(table.teamId),
    visibilityIdx: index('template_library_visibility_idx').on(table.visibility),
    teamVisibilityIdx: index('template_library_team_visibility_idx').on(table.teamId, table.visibility),
    isComponentIdx: index('template_library_is_component_idx').on(table.isComponent),
    originalTemplateIdx: index('template_library_original_template_idx').on(table.originalTemplateId),
  }));

// Template Library Components
export const templateLibraryComponents = pgTable("template_library_components", {
    id: uuid("id").defaultRandom().primaryKey(),

    libraryTemplateId: uuid("library_template_id")
        .notNull()
        .references(() => templateLibrary.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    componentId: varchar("component_id", { length: 100 }).notNull(),
    type: componentType("type").notNull(),
    componentData: jsonb("component_data").$type<{
        id: string;
        type: string;
        content?: string;
        src?: string;
        alt?: string;
        text?: string;
        href?: string;
        level?: string;
        height?: string;
        listType?: string;
        items?: string[];
        columnWidths?: string[];
        children?: any[];
        styles?: Record<string, any>;
    }>().notNull(),

    sortOrder: integer("sort_order").notNull().default(0),
    parentComponentId: varchar("parent_component_id", { length: 100 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    libraryTemplateIdIdx: index('template_library_components_template_id_idx').on(table.libraryTemplateId),
    sortOrderIdx: index('template_library_components_sort_order_idx').on(table.libraryTemplateId, table.sortOrder),
    templateComponentIdx: uniqueIndex('template_library_components_template_component_idx')
        .on(table.libraryTemplateId, table.componentId),
}));

// Template Usage History
// Update templateUsageHistory to better track library template usage
export const templateUsageHistory = pgTable("template_usage_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    templateId: uuid("template_id").references(() => emailTemplates.id, { onDelete: 'set null' }),
    libraryTemplateId: uuid("library_template_id").references(() => templateLibrary.id, { onDelete: 'set null' }),
    
    usedBy: varchar("used_by", { length: 255 }).notNull(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: 'set null' }),
    applicationId: uuid("application_id").references(() => applications.id, { onDelete: 'set null' }),
    
    action: varchar("action", { length: 50 }).notNull(),
    
    // NEW: Add metadata for better tracking
    metadata: jsonb("metadata").$type<{
      sourceType?: string;
      originalVisibility?: string;
      duplicatedFromTeam?: string;
      [key: string]: any;
    }>(),
    
    usedAt: timestamp("used_at", { withTimezone: true }).defaultNow().notNull(),
  }, (table) => ({
    templateIdIdx: index('template_usage_template_id_idx').on(table.templateId),
    libraryTemplateIdIdx: index('template_usage_library_template_id_idx').on(table.libraryTemplateId),
    teamIdIdx: index('template_usage_team_id_idx').on(table.teamId),
    usedAtIdx: index('template_usage_used_at_idx').on(table.usedAt),
    actionIdx: index('template_usage_action_idx').on(table.action),
    teamUsedAtIdx: index('template_usage_team_used_at_idx').on(table.teamId, table.usedAt),
    actionUsedAtIdx: index('template_usage_action_used_at_idx').on(table.action, table.usedAt),
  }));

  // Email Configurations - Store SMTP settings per team
export const emailConfigurations = pgTable("email_configurations", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    teamId: uuid("team_id")
        .notNull()
        .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    // SMTP Configuration
    configName: varchar("config_name", { length: 100 }).notNull(),
    smtpHost: varchar("smtp_host", { length: 255 }).notNull(),
    smtpPort: integer("smtp_port").notNull().default(587),
    smtpSecure: boolean("smtp_secure").notNull().default(false), // true for 465, false for other ports
    smtpAuth: boolean("smtp_auth").notNull().default(true),
    smtpUsername: varchar("smtp_username", { length: 255 }),
    smtpPassword: varchar("smtp_password", { length: 255 }), // Should be encrypted in production
    
    // Default sender information
    defaultFromName: varchar("default_from_name", { length: 255 }),
    defaultFromEmail: varchar("default_from_email", { length: 255 }).notNull(),
    defaultReplyTo: varchar("default_reply_to", { length: 255 }),
    
    // Configuration status
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    
    // Audit fields
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: varchar("updated_by", { length: 255 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    teamIdIdx: index('email_configs_team_id_idx').on(table.teamId),
    isActiveIdx: index('email_configs_is_active_idx').on(table.isActive),
    isDefaultIdx: index('email_configs_is_default_idx').on(table.teamId, table.isDefault),
    teamConfigNameIdx: uniqueIndex('email_configs_team_name_idx').on(table.teamId, table.configName),
}));

// Template Email Settings - Default email settings per template
export const templateEmailSettings = pgTable("template_email_settings", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    templateId: uuid("template_id")
        .notNull()
        .references(() => emailTemplates.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    // Email configuration reference
    emailConfigId: uuid("email_config_id")
        .references(() => emailConfigurations.id, { onDelete: 'set null' }),
    
    // Default email parameters
    defaultSubject: varchar("default_subject", { length: 500 }),
    defaultFromName: varchar("default_from_name", { length: 255 }),
    defaultFromEmail: varchar("default_from_email", { length: 255 }),
    defaultReplyTo: varchar("default_reply_to", { length: 255 }),
    defaultToEmails: text("default_to_emails"), // JSON array of default recipients
    defaultCcEmails: text("default_cc_emails"), // JSON array
    defaultBccEmails: text("default_bcc_emails"), // JSON array
    
    // Email options
    trackOpens: boolean("track_opens").notNull().default(false),
    trackClicks: boolean("track_clicks").notNull().default(false),
    priority: emailPriority("priority").notNull().default('normal'),
    
    // Personalization settings
    enablePersonalization: boolean("enable_personalization").notNull().default(false),
    personalizationVariables: jsonb("personalization_variables").$type<{
        [key: string]: {
            name: string;
            defaultValue?: string;
            required: boolean;
            description?: string;
        };
    }>(),
    
    // Audit fields
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: varchar("updated_by", { length: 255 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    templateIdIdx: uniqueIndex('template_email_settings_template_idx').on(table.templateId),
    emailConfigIdIdx: index('template_email_settings_config_idx').on(table.emailConfigId),
}));

// Email Send History - Track all sent emails
export const emailSendHistory = pgTable("email_send_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    // References
    templateId: uuid("template_id")
        .references(() => emailTemplates.id, { onDelete: 'set null' }),
    emailConfigId: uuid("email_config_id")
        .references(() => emailConfigurations.id, { onDelete: 'set null' }),
    teamId: uuid("team_id")
        .notNull()
        .references(() => teams.id, { onDelete: 'cascade' }),
    
    // Email details
    messageId: varchar("message_id", { length: 255 }), // SMTP message ID
    subject: varchar("subject", { length: 500 }).notNull(),
    fromName: varchar("from_name", { length: 255 }),
    fromEmail: varchar("from_email", { length: 255 }).notNull(),
    replyTo: varchar("reply_to", { length: 255 }),
    
    // Recipients (stored as JSON arrays)
    toEmails: jsonb("to_emails").$type<string[]>().notNull(),
    ccEmails: jsonb("cc_emails").$type<string[]>(),
    bccEmails: jsonb("bcc_emails").$type<string[]>(),
    
    // Email content
    htmlContent: text("html_content").notNull(),
    textContent: text("text_content"),
    
    // Email metadata
    status: emailStatus("status").notNull().default('draft'),
    priority: emailPriority("priority").notNull().default('normal'),
    
    // Tracking
    trackOpens: boolean("track_opens").notNull().default(false),
    trackClicks: boolean("track_clicks").notNull().default(false),
    openCount: integer("open_count").notNull().default(0),
    clickCount: integer("click_count").notNull().default(0),
    
    // Send attempts and errors
    sendAttempts: integer("send_attempts").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    smtpResponse: text("smtp_response"),
    
    // Scheduling
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    
    // Audit fields
    sentBy: varchar("sent_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    templateIdIdx: index('email_send_history_template_idx').on(table.templateId),
    teamIdIdx: index('email_send_history_team_idx').on(table.teamId),
    statusIdx: index('email_send_history_status_idx').on(table.status),
    sentAtIdx: index('email_send_history_sent_at_idx').on(table.sentAt),
    messageIdIdx: index('email_send_history_message_id_idx').on(table.messageId),
    scheduledAtIdx: index('email_send_history_scheduled_at_idx').on(table.scheduledAt),
    teamStatusIdx: index('email_send_history_team_status_idx').on(table.teamId, table.status),
}));

// Email Recipients - For tracking individual recipient status
export const emailRecipients = pgTable("email_recipients", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    emailHistoryId: uuid("email_history_id")
        .notNull()
        .references(() => emailSendHistory.id, { onDelete: 'cascade' }),
    
    emailAddress: varchar("email_address", { length: 255 }).notNull(),
    recipientType: varchar("recipient_type", { length: 10 }).notNull(), // 'to', 'cc', 'bcc'
    recipientName: varchar("recipient_name", { length: 255 }),
    
    // Individual tracking
    status: emailStatus("status").notNull().default('sent'),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    bouncedAt: timestamp("bounced_at", { withTimezone: true }),
    bounceReason: text("bounce_reason"),
    
    // Personalization data used for this recipient
    personalizationData: jsonb("personalization_data").$type<Record<string, any>>(),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    emailHistoryIdIdx: index('email_recipients_history_idx').on(table.emailHistoryId),
    emailAddressIdx: index('email_recipients_email_idx').on(table.emailAddress),
    statusIdx: index('email_recipients_status_idx').on(table.status),
    recipientTypeIdx: index('email_recipients_type_idx').on(table.recipientType),
}));

export const emailAttachments = pgTable("email_attachments", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    emailHistoryId: uuid("email_history_id")
      .notNull()
      .references(() => emailSendHistory.id, { onDelete: 'cascade' }),
    
    // File information
    fileName: varchar("file_name", { length: 255 }).notNull(),
    originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
    fileSize: integer("file_size").notNull(), // in bytes
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    
    // Storage information
    filePath: varchar("file_path", { length: 500 }), // Local file path or cloud URL
    fileUrl: varchar("file_url", { length: 500 }), // Public URL if needed
    
    // Metadata
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
    uploadedBy: varchar("uploaded_by", { length: 255 }).notNull(),
  }, (table) => ({
    emailHistoryIdIdx: index('email_attachments_history_idx').on(table.emailHistoryId),
    fileNameIdx: index('email_attachments_filename_idx').on(table.fileName),
  }));
  

// Define relations
export const emailTemplatesRelations = relations(emailTemplates, ({ one, many }) => ({
    team: one(teams, {
        fields: [emailTemplates.teamId],
        references: [teams.id],
    }),
    components: many(emailTemplateComponents),
    applicationTags: many(templateApplicationTags),
    sharing: many(templateSharing),
    usageHistory: many(templateUsageHistory),
    parentTemplate: one(emailTemplates, {
        fields: [emailTemplates.parentTemplateId],
        references: [emailTemplates.id],
        relationName: "template_versions"
    }),
    childTemplates: many(emailTemplates, {
        relationName: "template_versions"
    }),
    emailSettings: one(templateEmailSettings),
    sendHistory: many(emailSendHistory),
}));

export const emailTemplateComponentsRelations = relations(emailTemplateComponents, ({ one }) => ({
    template: one(emailTemplates, {
        fields: [emailTemplateComponents.templateId],
        references: [emailTemplates.id],
    }),
}));

export const templateApplicationTagsRelations = relations(templateApplicationTags, ({ one }) => ({
    template: one(emailTemplates, {
        fields: [templateApplicationTags.templateId],
        references: [emailTemplates.id],
    }),
    application: one(applications, {
        fields: [templateApplicationTags.applicationId],
        references: [applications.id],
    }),
}));

export const templateSharingRelations = relations(templateSharing, ({ one }) => ({
    template: one(emailTemplates, {
        fields: [templateSharing.templateId],
        references: [emailTemplates.id],
    }),
    sharedWithTeam: one(teams, {
        fields: [templateSharing.sharedWithTeamId],
        references: [teams.id],
    }),
}));

// Update the existing templateLibraryRelations to include team relationship
export const templateLibraryRelations = relations(templateLibrary, ({ one, many }) => ({
    // NEW: Team relationship
    team: one(teams, {
        fields: [templateLibrary.teamId],
        references: [teams.id],
    }),

    // NEW: Original template relationship
    originalTemplate: one(emailTemplates, {
        fields: [templateLibrary.originalTemplateId],
        references: [emailTemplates.id],
    }),

    // Existing relations
    components: many(templateLibraryComponents),
    usageHistory: many(templateUsageHistory),
}));

// Add reverse relation from teams to template library
export const teamsRelations = relations(teams, ({ many }) => ({
    // Existing relations...
    applications: many(applications),
    emailTemplates: many(emailTemplates),

    // NEW: Team library templates
    libraryTemplates: many(templateLibrary),
}));

export const templateLibraryComponentsRelations = relations(templateLibraryComponents, ({ one }) => ({
    libraryTemplate: one(templateLibrary, {
        fields: [templateLibraryComponents.libraryTemplateId],
        references: [templateLibrary.id],
    }),
}));

export const templateUsageHistoryRelations = relations(templateUsageHistory, ({ one }) => ({
    template: one(emailTemplates, {
        fields: [templateUsageHistory.templateId],
        references: [emailTemplates.id],
    }),
    libraryTemplate: one(templateLibrary, {
        fields: [templateUsageHistory.libraryTemplateId],
        references: [templateLibrary.id],
    }),
    team: one(teams, {
        fields: [templateUsageHistory.teamId],
        references: [teams.id],
    }),
    application: one(applications, {
        fields: [templateUsageHistory.applicationId],
        references: [applications.id],
    }),
}));


export const emailConfigurationsRelations = relations(emailConfigurations, ({ one, many }) => ({
    team: one(teams, {
        fields: [emailConfigurations.teamId],
        references: [teams.id],
    }),
    templateSettings: many(templateEmailSettings),
    sendHistory: many(emailSendHistory),
}));

export const templateEmailSettingsRelations = relations(templateEmailSettings, ({ one }) => ({
    template: one(emailTemplates, {
        fields: [templateEmailSettings.templateId],
        references: [emailTemplates.id],
    }),
    emailConfig: one(emailConfigurations, {
        fields: [templateEmailSettings.emailConfigId],
        references: [emailConfigurations.id],
    }),
}));

export const emailSendHistoryRelations = relations(emailSendHistory, ({ one, many }) => ({
    template: one(emailTemplates, {
        fields: [emailSendHistory.templateId],
        references: [emailTemplates.id],
    }),
    emailConfig: one(emailConfigurations, {
        fields: [emailSendHistory.emailConfigId],
        references: [emailConfigurations.id],
    }),
    team: one(teams, {
        fields: [emailSendHistory.teamId],
        references: [teams.id],
    }),
    recipients: many(emailRecipients),
    attachments: many(emailAttachments),
}));

export const emailRecipientsRelations = relations(emailRecipients, ({ one }) => ({
    emailHistory: one(emailSendHistory, {
        fields: [emailRecipients.emailHistoryId],
        references: [emailSendHistory.id],
    }),
}));

export const emailAttachmentsRelations = relations(emailAttachments, ({ one }) => ({
    emailHistory: one(emailSendHistory, {
      fields: [emailAttachments.emailHistoryId],
      references: [emailSendHistory.id],
    }),
  }));
  


// Type exports for use in your application
export type EmailTemplate = InferSelectModel<typeof emailTemplates>;
export type NewEmailTemplate = InferInsertModel<typeof emailTemplates>;
export type EmailTemplateComponent = InferSelectModel<typeof emailTemplateComponents>;
export type NewEmailTemplateComponent = InferInsertModel<typeof emailTemplateComponents>;
export type TemplateApplicationTag = InferSelectModel<typeof templateApplicationTags>;
export type NewTemplateApplicationTag = InferInsertModel<typeof templateApplicationTags>;
export type TemplateSharing = InferSelectModel<typeof templateSharing>;
export type NewTemplateSharing = InferInsertModel<typeof templateSharing>;
export type TemplateLibraryComponent = InferSelectModel<typeof templateLibraryComponents>;
export type NewTemplateLibraryComponent = InferInsertModel<typeof templateLibraryComponents>;

// Enum type exports
export type TemplateStatus = typeof templateStatus.enumValues[number];
export type TemplateVisibility = typeof templateVisibility.enumValues[number];
export type TemplateCategory = typeof templateCategory.enumValues[number];
export type ComponentType = typeof componentType.enumValues[number];


// Add new type exports for the updated schema
export type TemplateLibrary = InferSelectModel<typeof templateLibrary>;
export type NewTemplateLibrary = InferInsertModel<typeof templateLibrary>;
export type LibraryVisibility = typeof libraryVisibility.enumValues[number];

// Updated usage history type
export type TemplateUsageHistory = InferSelectModel<typeof templateUsageHistory>;
export type NewTemplateUsageHistory = InferInsertModel<typeof templateUsageHistory>;
