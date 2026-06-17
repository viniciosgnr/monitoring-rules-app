import {
  pgTable, serial, text, boolean, timestamp,
  integer, jsonb, varchar,
} from 'drizzle-orm/pg-core';

export const fpsos = pgTable('fpsos', {
  id:   serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: text('name').notNull(),
});

export const equipment = pgTable('equipment', {
  id:     serial('id').primaryKey(),
  fpsoId: integer('fpso_id').notNull().references(() => fpsos.id),
  code:   varchar('code', { length: 50 }).notNull(),
  name:   text('name').notNull(),
});

export const monitoringRules = pgTable('monitoring_rules', {
  id:              serial('id').primaryKey(),
  name:            varchar('name', { length: 100 }).notNull(),
  description:     text('description'),
  processingSteps: jsonb('processing_steps'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
});

export const ruleInstances = pgTable('rule_instances', {
  id:          serial('id').primaryKey(),
  ruleId:      integer('rule_id').notNull().references(() => monitoringRules.id),
  equipmentId: integer('equipment_id').notNull().references(() => equipment.id),
  timeseries:  text('timeseries').notNull(),
  schedule:    varchar('schedule', { length: 20 }).notNull().default('Daily'),
  enabled:     boolean('enabled').notNull().default(true),
  lastRunAt:   timestamp('last_run_at'),
  nextRunAt:   timestamp('next_run_at'),
});

export const alerts = pgTable('alerts', {
  id:          serial('id').primaryKey(),
  instanceId:  integer('instance_id').notNull().references(() => ruleInstances.id),
  type:        text('type').notNull(),
  endDate:     timestamp('end_date').notNull(),
  triggeredAt: timestamp('triggered_at').notNull(),
  reviewedAt:  timestamp('reviewed_at'),
  reviewedBy:  text('reviewed_by'),
  status:      varchar('status', { length: 20 }).notNull().default('pending'),
});

export const auditLog = pgTable('audit_log', {
  id:          serial('id').primaryKey(),
  instanceId:  integer('instance_id').notNull().references(() => ruleInstances.id),
  userEmail:   text('user_email').notNull(),
  description: text('description').notNull(),
  beforeState: jsonb('before_state'),
  afterState:  jsonb('after_state'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});
