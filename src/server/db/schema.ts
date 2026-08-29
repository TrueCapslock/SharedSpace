import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const workspaceTypeEnum = pgEnum('workspace_type', [
  'housing_board',
  'cabin',
  'boat',
  'project',
  'agile_project',
  'association',
  'custom',
])

export const membershipStatusEnum = pgEnum('membership_status', [
  'invited',
  'active',
  'suspended',
])

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
])

export const taskStatusEnum = pgEnum('task_status', [
  'todo',
  'in_progress',
  'done',
  'cancelled',
])

export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
])

export const workspaceRecordTypeEnum = pgEnum('workspace_record_type', [
  'message',
  'meter',
  'inventory',
  'resident',
  'board_card',
  'backlog_item',
  'sprint',
  'time_entry',
  'roadmap_item',
  'resource',
  'risk',
  'logbook_entry',
  'access_key',
  'cabin_info',
  'utility',
  'berth',
  'insight',
])

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/**
 * Application-level identity, decoupled from the authentication provider.
 * Clerk user IDs map to this table rather than being used directly as the
 * domain primary key.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique().notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }),
  preferences: jsonb('preferences')
    .$type<Record<string, unknown>>()
    .default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

// ---------------------------------------------------------------------------
// Tenant root
// ---------------------------------------------------------------------------

/** The primary tenant boundary. */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  workspaceType: workspaceTypeEnum('workspace_type')
    .default('custom')
    .notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  createdById: uuid('created_by_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

/** Roles within a workspace. Built-in roles are seeded. */
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

/** Permission catalog. Static set of capabilities. */
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  description: text('description'),
})

/** Many-to-many between roles and permissions. */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    permissionId: uuid('permission_id')
      .references(() => permissions.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index('role_permissions_permission_id_idx').on(table.permissionId),
  ],
)

/** Which capabilities are enabled for a workspace, and their configuration. */
export const workspaceModules = pgTable(
  'workspace_modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('workspace_modules_workspace_key_idx').on(
      table.workspaceId,
      table.key,
    ),
  ],
)

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

export const workspaceMemberships = pgTable(
  'workspace_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: uuid('role_id').references(() => roles.id, {
      onDelete: 'restrict',
    }),
    status: membershipStatusEnum('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('workspace_memberships_user_workspace_idx').on(
      table.userId,
      table.workspaceId,
    ),
    index('workspace_memberships_workspace_idx').on(table.workspaceId),
  ],
)

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    email: varchar('email', { length: 320 }).notNull(),
    roleId: uuid('role_id').references(() => roles.id, {
      onDelete: 'restrict',
    }),
    token: varchar('token', { length: 128 }).unique().notNull(),
    status: invitationStatusEnum('status').default('pending').notNull(),
    invitedById: uuid('invited_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('invitations_workspace_idx').on(table.workspaceId),
    index('invitations_email_idx').on(table.email),
  ],
)

// ---------------------------------------------------------------------------
// Domain modules
// ---------------------------------------------------------------------------

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: taskStatusEnum('status').default('todo').notNull(),
    priority: taskPriorityEnum('priority').default('medium').notNull(),
    assigneeId: uuid('assignee_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdById: uuid('created_by_id')
      .references(() => users.id, { onDelete: 'set null' })
      .notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('tasks_workspace_idx').on(table.workspaceId),
    index('tasks_workspace_status_idx').on(table.workspaceId, table.status),
    index('tasks_assignee_idx').on(table.assigneeId),
  ],
)

/** File bytes live in object storage; metadata lives here. */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    mimeType: varchar('mime_type', { length: 127 }),
    sizeBytes: integer('size_bytes'),
    createdById: uuid('created_by_id')
      .references(() => users.id, { onDelete: 'set null' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('documents_workspace_idx').on(table.workspaceId)],
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body'),
    link: varchar('link', { length: 512 }),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('notifications_user_read_idx').on(table.userId, table.readAt),
    index('notifications_workspace_idx').on(table.workspaceId),
  ],
)

/** Flexible, workspace-scoped records for optional domain modules. */
export const workspaceRecords = pgTable(
  'workspace_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    type: workspaceRecordTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    details: text('details'),
    status: varchar('status', { length: 100 }).default('active').notNull(),
    amount: integer('amount'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdById: uuid('created_by_id')
      .references(() => users.id, { onDelete: 'set null' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('workspace_records_workspace_type_idx').on(
      table.workspaceId,
      table.type,
    ),
    index('workspace_records_workspace_status_idx').on(
      table.workspaceId,
      table.status,
    ),
  ],
)

/** Durable audit trail for important operations. */
export const activityEvents = pgTable(
  'activity_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('activity_events_workspace_idx').on(table.workspaceId),
    index('activity_events_entity_idx').on(table.entityType, table.entityId),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  memberships: many(workspaceMemberships),
  roles: many(roles),
  tasks: many(tasks),
  documents: many(documents),
}))

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMemberships),
}))

export const workspaceMembershipsRelations = relations(
  workspaceMemberships,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMemberships.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMemberships.userId],
      references: [users.id],
    }),
    role: one(roles, {
      fields: [workspaceMemberships.roleId],
      references: [roles.id],
    }),
  }),
)

export const rolesRelations = relations(roles, ({ many, one }) => ({
  workspace: one(workspaces, {
    fields: [roles.workspaceId],
    references: [workspaces.id],
  }),
  rolePermissions: many(rolePermissions),
  memberships: many(workspaceMemberships),
}))

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
)

export const tasksRelations = relations(tasks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [notifications.workspaceId],
    references: [workspaces.id],
  }),
}))
