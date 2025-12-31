import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  integer,
  decimal,
  boolean,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// USERS & AUTH
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  preferences: one(userPreferences),
  weightEntries: many(weightEntries),
  injections: many(injections),
  dailyLogs: many(dailyLogs),
  notificationPreferences: many(notificationPreferences),
  emailLogs: many(emailLogs),
}));

// ============================================================================
// PROFILES
// ============================================================================

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  age: integer('age').notNull(),
  gender: varchar('gender', { length: 20 }).notNull(),
  heightCm: decimal('height_cm', { precision: 5, scale: 2 }).notNull(),
  startingWeightKg: decimal('starting_weight_kg', { precision: 5, scale: 2 }).notNull(),
  goalWeightKg: decimal('goal_weight_kg', { precision: 5, scale: 2 }).notNull(),
  treatmentStartDate: date('treatment_start_date').notNull(),
  // Injection preferences
  preferredInjectionDay: integer('preferred_injection_day'), // 0-6, null = no preference
  reminderDaysBefore: integer('reminder_days_before').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// USER PREFERENCES
// ============================================================================

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  weightUnit: varchar('weight_unit', { length: 10 }).default('kg').notNull(), // kg, lbs, stone
  heightUnit: varchar('height_unit', { length: 10 }).default('cm').notNull(), // cm, ft-in
  dateFormat: varchar('date_format', { length: 20 }).default('DD/MM/YYYY').notNull(),
  weekStartsOn: integer('week_starts_on').default(1).notNull(), // 0 = Sunday, 1 = Monday
  theme: varchar('theme', { length: 10 }).default('dark').notNull(), // dark, light
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// WEIGHT ENTRIES
// ============================================================================

export const weightEntries = pgTable(
  'weight_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    weightKg: decimal('weight_kg', { precision: 5, scale: 2 }).notNull(),
    recordedAt: timestamp('recorded_at').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('weight_entries_user_recorded_at').on(table.userId, table.recordedAt)]
);

export const weightEntriesRelations = relations(weightEntries, ({ one }) => ({
  user: one(users, {
    fields: [weightEntries.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// INJECTIONS
// ============================================================================

export const injections = pgTable(
  'injections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    doseMg: decimal('dose_mg', { precision: 4, scale: 2 }).notNull(),
    injectionSite: varchar('injection_site', { length: 50 }).notNull(),
    injectionDate: timestamp('injection_date').notNull(),
    batchNumber: varchar('batch_number', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('injections_user_injection_date').on(table.userId, table.injectionDate)]
);

export const injectionsRelations = relations(injections, ({ one }) => ({
  user: one(users, {
    fields: [injections.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// DAILY LOGS (Parent table)
// ============================================================================

export const dailyLogs = pgTable(
  'daily_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    logDate: date('log_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('daily_logs_user_date').on(table.userId, table.logDate),
    index('daily_logs_user_log_date').on(table.userId, table.logDate),
  ]
);

export const dailyLogsRelations = relations(dailyLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyLogs.userId],
    references: [users.id],
  }),
  sideEffects: many(sideEffects),
  activityLog: one(activityLogs),
  mentalLog: one(mentalLogs),
  dietLog: one(dietLogs),
}));

// ============================================================================
// SIDE EFFECTS
// ============================================================================

export const sideEffects = pgTable(
  'side_effects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dailyLogId: uuid('daily_log_id')
      .references(() => dailyLogs.id, { onDelete: 'cascade' })
      .notNull(),
    effectType: varchar('effect_type', { length: 50 }).notNull(),
    severity: varchar('severity', { length: 20 }).notNull(), // None, Mild, Moderate, Severe
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('side_effects_daily_log_id').on(table.dailyLogId)]
);

export const sideEffectsRelations = relations(sideEffects, ({ one }) => ({
  dailyLog: one(dailyLogs, {
    fields: [sideEffects.dailyLogId],
    references: [dailyLogs.id],
  }),
}));

// ============================================================================
// ACTIVITY LOGS
// ============================================================================

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  dailyLogId: uuid('daily_log_id')
    .references(() => dailyLogs.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  workoutType: varchar('workout_type', { length: 50 }), // Strength training, Cardio, Walking, Rest day, Other
  durationMinutes: integer('duration_minutes'),
  steps: integer('steps'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  dailyLog: one(dailyLogs, {
    fields: [activityLogs.dailyLogId],
    references: [dailyLogs.id],
  }),
}));

// ============================================================================
// MENTAL LOGS
// ============================================================================

export const mentalLogs = pgTable('mental_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  dailyLogId: uuid('daily_log_id')
    .references(() => dailyLogs.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  motivationLevel: varchar('motivation_level', { length: 20 }), // Low, Medium, High
  cravingsLevel: varchar('cravings_level', { length: 20 }), // None, Low, Medium, High, Intense
  moodLevel: varchar('mood_level', { length: 20 }), // Poor, Fair, Good, Great, Excellent
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mentalLogsRelations = relations(mentalLogs, ({ one }) => ({
  dailyLog: one(dailyLogs, {
    fields: [mentalLogs.dailyLogId],
    references: [dailyLogs.id],
  }),
}));

// ============================================================================
// DIET LOGS
// ============================================================================

export const dietLogs = pgTable('diet_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  dailyLogId: uuid('daily_log_id')
    .references(() => dailyLogs.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  hungerLevel: varchar('hunger_level', { length: 20 }), // None, Low, Moderate, High, Intense
  mealsCount: integer('meals_count'),
  proteinGrams: integer('protein_grams'),
  waterLiters: decimal('water_liters', { precision: 3, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dietLogsRelations = relations(dietLogs, ({ one }) => ({
  dailyLog: one(dailyLogs, {
    fields: [dietLogs.dailyLogId],
    references: [dailyLogs.id],
  }),
}));

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    notificationType: varchar('notification_type', { length: 50 }).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('notification_prefs_user_type').on(table.userId, table.notificationType),
    index('notification_prefs_user_id').on(table.userId),
  ]
);

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// PASSWORD RESET TOKENS
// ============================================================================

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// EMAIL LOGS
// ============================================================================

export const emailLogs = pgTable(
  'email_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    notificationType: varchar('notification_type', { length: 50 }).notNull(),
    sentAt: timestamp('sent_at').defaultNow().notNull(),
    resendId: varchar('resend_id', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull(), // sent, failed, delivered, bounced
    errorMessage: text('error_message'),
  },
  (table) => [index('email_logs_user_id').on(table.userId)]
);

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type WeightEntry = typeof weightEntries.$inferSelect;
export type NewWeightEntry = typeof weightEntries.$inferInsert;

export type Injection = typeof injections.$inferSelect;
export type NewInjection = typeof injections.$inferInsert;

export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert;

export type SideEffect = typeof sideEffects.$inferSelect;
export type NewSideEffect = typeof sideEffects.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type MentalLog = typeof mentalLogs.$inferSelect;
export type NewMentalLog = typeof mentalLogs.$inferInsert;

export type DietLog = typeof dietLogs.$inferSelect;
export type NewDietLog = typeof dietLogs.$inferInsert;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
