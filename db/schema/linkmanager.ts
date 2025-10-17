// db/schema/linkmanager.ts

import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { teams } from "./teams";
import { applications } from "./teams";

/**
 * Enum for link visibility status
 * @readonly
 * @enum {string}
 */
export const linkVisibility = pgEnum('link_visibility', ['private', 'public']);

/**
 * Links table storing all link information
 * 
 * This table stores comprehensive information about links including
 * visibility, application associations, and access tracking.
 * 
 * @table links
 */
export const links = pgTable("links", {
  /**
   * Unique identifier for the link
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Title of the link
   * @type {string} Max 255 characters
   * @required
   */
  title: varchar("title", { length: 255 }).notNull(),
  
  /**
   * URL of the link
   * @type {string} Text (unlimited length)
   * @required
   */
  url: text("url").notNull(),
  
  /**
   * Description of the link
   * @type {string} Free text
   * @optional
   */
  description: text("description"),
  
  /**
   * Reference to the associated category
   * @type {string} UUID v4
   * @optional
   * @references categories.id
   */
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: 'set null' }),
  
  /**
   * Visibility status of the link
   * @type {'private' | 'public'}
   * @required
   * @default 'private'
   */
  visibility: linkVisibility("visibility").notNull().default('private'),
  
  /**
   * Flag indicating if the link is pinned for quick access
   * @type {boolean}
   * @required
   * @default false
   */
  isPinned: boolean("is_pinned").notNull().default(false),
  
  /**
   * Number of times the link has been accessed
   * @type {number} Integer
   * @required
   * @default 0
   */
  accessCount: integer("access_count").notNull().default(0),
  
  /**
   * Timestamp when the link was last accessed
   * @type {Date} With timezone
   * @optional
   */
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  
  /**
   * Reference to the associated team
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Identifier of the user who created this link
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the link record was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * Identifier of the user who last updated this link record
   * @type {string} Max 255 characters
   * @optional
   */
  updatedBy: varchar("updated_by", { length: 255 }),
  
  /**
   * Timestamp when the link record was last updated
   * @type {Date} With timezone
   * @optional
   */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('links_team_id_idx').on(table.teamId),
  
  /**
   * Index on visibility for filtering by visibility
   */
  visibilityIdx: index('links_visibility_idx').on(table.visibility),
  
  /**
   * Index on pinned status for quick access to pinned links
   */
  isPinnedIdx: index('links_is_pinned_idx').on(table.isPinned),
  
  /**
   * Index on access count for popular links
   */
  accessCountIdx: index('links_access_count_idx').on(table.accessCount),
  
  /**
   * Index on last accessed timestamp for recently accessed links
   */
  lastAccessedAtIdx: index('links_last_accessed_at_idx').on(table.lastAccessedAt),
  
  /**
   * Composite index on team and visibility for team-specific visibility queries
   */
  teamVisibilityIdx: index('links_team_visibility_idx').on(table.teamId, table.visibility),
  
  /**
   * Full-text search index on title and description
   */
  searchIdx: index('links_search_idx').on(table.title, table.description),
  
  /**
   * Check constraint to validate URL format
   */
  urlCheck: sql`url ~* '^https?://.+'`,
}));

/**
 * Link Applications junction table for many-to-many relationship
 * 
 * This table manages the relationship between links and applications,
 * allowing links to be associated with multiple applications.
 * 
 * @table link_applications
 */
export const linkApplications = pgTable("link_applications", {
  /**
   * Unique identifier for the link-application relationship
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the associated link
   * @type {string} UUID v4
   * @required
   * @references links.id
   */
  linkId: uuid("link_id")
    .notNull()
    .references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Reference to the associated application
   * @type {string} UUID v4
   * @required
   * @references applications.id
   */
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Timestamp when the association was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Unique constraint on link and application combination
   */
  linkApplicationUnique: uniqueIndex('link_app_link_app_unique').on(table.linkId, table.applicationId),
  
  /**
   * Index on link identifier for finding applications by link
   */
  linkIdIdx: index('link_app_link_id_idx').on(table.linkId),
  
  /**
   * Index on application identifier for finding links by application
   */
  applicationIdIdx: index('link_app_application_id_idx').on(table.applicationId),
}));

/**
 * Categories table for organizing links
 * 
 * This table stores categories that can be used to organize links
 * within teams.
 * 
 * @table categories
 */
export const categories = pgTable("categories", {
  /**
   * Unique identifier for the category
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Name of the category
   * @type {string} Max 100 characters
   * @required
   */
  name: varchar("name", { length: 100 }).notNull(),
  
  /**
   * Description of the category
   * @type {string} Free text
   * @optional
   */
  description: text("description"),
  
  /**
   * Reference to the associated team
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Color code for the category (hex color)
   * @type {string} Max 7 characters
   * @optional
   */
  color: varchar("color", { length: 7 }),
  
  /**
   * Identifier of the user who created this category
   * @type {string} Max 255 characters
   * @required
   */
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the category record was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Unique constraint on team and name combination
   */
  teamNameUnique: uniqueIndex('categories_team_name_unique').on(table.teamId, table.name),
  
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('categories_team_id_idx').on(table.teamId),
  
  /**
   * Check constraint to validate color format
   */
  colorCheck: sql`color ~* '^#[0-9A-Fa-f]{6}$' OR color IS NULL`,
}));

/**
 * Tags table for flexible link tagging
 * 
 * This table stores tags that can be applied to links for
 * flexible categorization and search.
 * 
 * @table tags
 */
export const tags = pgTable("tags", {
  /**
   * Unique identifier for the tag
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Name of the tag
   * @type {string} Max 50 characters
   * @required
   */
  name: varchar("name", { length: 50 }).notNull(),
  
  /**
   * Reference to the associated team
   * @type {string} UUID v4
   * @required
   * @references teams.id
   */
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Timestamp when the tag record was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Unique constraint on team and name combination
   */
  teamNameUnique: uniqueIndex('tags_team_name_unique').on(table.teamId, table.name),
  
  /**
   * Index on team identifier for team-based queries
   */
  teamIdIdx: index('tags_team_id_idx').on(table.teamId),
}));

/**
 * Link Tags junction table for many-to-many relationship
 * 
 * This table manages the relationship between links and tags,
 * allowing links to have multiple tags.
 * 
 * @table link_tags
 */
export const linkTags = pgTable("link_tags", {
  /**
   * Reference to the associated link
   * @type {string} UUID v4
   * @required
   * @references links.id
   */
  linkId: uuid("link_id")
    .notNull()
    .references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Reference to the associated tag
   * @type {string} UUID v4
   * @required
   * @references tags.id
   */
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Timestamp when the association was created
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  /**
   * Primary key on link and tag combination
   */
  linkTagPk: index('link_tags_link_tag_pk').on(table.linkId, table.tagId),
  
  /**
   * Index on link identifier for finding tags by link
   */
  linkIdIdx: index('link_tags_link_id_idx').on(table.linkId),
  
  /**
   * Index on tag identifier for finding links by tag
   */
  tagIdIdx: index('link_tags_tag_id_idx').on(table.tagId),
}));

/**
 * Link Access Log table for tracking link usage
 * 
 * This table logs all access to links for analytics and
 * recently accessed features.
 * 
 * @table link_access_log
 */
export const linkAccessLog = pgTable("link_access_log", {
  /**
   * Unique identifier for the access log entry
   * @type {string} UUID v4
   * @primarykey
   * @default random()
   */
  id: uuid("id").defaultRandom().primaryKey(),
  
  /**
   * Reference to the accessed link
   * @type {string} UUID v4
   * @required
   * @references links.id
   */
  linkId: uuid("link_id")
    .notNull()
    .references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  /**
   * Identifier of the user who accessed the link
   * @type {string} Max 255 characters
   * @required
   */
  userId: varchar("user_id", { length: 255 }).notNull(),
  
  /**
   * Timestamp when the link was accessed
   * @type {Date} With timezone
   * @required
   * @default now()
   */
  accessedAt: timestamp("accessed_at", { withTimezone: true }).defaultNow().notNull(),
  
  /**
   * User agent string of the accessing client
   * @type {string} Free text
   * @optional
   */
  userAgent: text("user_agent"),
  
  /**
   * IP address of the accessing client
   * @type {string} INET format
   * @optional
   */
  ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => ({
  /**
   * Index on link identifier for finding access logs by link
   */
  linkIdIdx: index('link_access_log_link_id_idx').on(table.linkId),
  
  /**
   * Index on user identifier for finding access logs by user
   */
  userIdIdx: index('link_access_log_user_id_idx').on(table.userId),
  
  /**
   * Index on access timestamp for chronological queries
   */
  accessedAtIdx: index('link_access_log_accessed_at_idx').on(table.accessedAt),
  
  /**
   * Composite index on user and access timestamp for recent access queries
   */
  userAccessedAtIdx: index('link_access_log_user_accessed_at_idx').on(table.userId, table.accessedAt),
}));