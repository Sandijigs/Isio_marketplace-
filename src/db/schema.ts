import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import type { StructuredBrief } from '@/types/shared';
import { LISTING_CATEGORIES } from '@/types/shared';

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

// ── Enums (mirror src/types/shared.ts) ────────────────────────────────────────

export const userRole = pgEnum('user_role', ['BUYER', 'CREATIVE']);
export const listingKind = pgEnum('listing_kind', ['PRODUCT', 'SERVICE']);
export const listingStatus = pgEnum('listing_status', ['DRAFT', 'ACTIVE', 'SOLD_OUT', 'ARCHIVED']);
export const listingCategory = pgEnum('listing_category', LISTING_CATEGORIES);
export const orderStatus = pgEnum('order_status', [
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);
export const commissionStatus = pgEnum('commission_status', [
  'REQUESTED',
  'QUOTED',
  'DEPOSIT_PAID',
  'IN_PROGRESS',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
]);

// ── Tables ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  role: userRole('role').notNull().default('BUYER'),
  createdAt: createdAt(),
});

export const creativeProfiles = pgTable('creative_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name').notNull(),
  craft: text('craft').notNull(),
  story: text('story'),
  location: text('location'),
  country: text('country').notNull().default('NG'),
  avatarUrl: text('avatar_url'),
  /** Buyers pay this PayPal account directly. Isio never holds the money. */
  paypalEmail: text('paypal_email'),
  createdAt: createdAt(),
});

export const listings = pgTable('listings', {
  id: id(),
  creativeId: text('creative_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  kind: listingKind('kind').notNull().default('PRODUCT'),
  status: listingStatus('status').notNull().default('DRAFT'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  story: text('story'),
  category: listingCategory('category').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  shippingCents: integer('shipping_cents').notNull().default(0),
  stock: integer('stock'),
  turnaroundDays: integer('turnaround_days'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  aiDrafted: boolean('ai_drafted').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: id(),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id),
  creativeId: text('creative_id')
    .notNull()
    .references(() => users.id),
  listingId: text('listing_id')
    .notNull()
    .references(() => listings.id),
  quantity: integer('quantity').notNull().default(1),
  subtotalCents: integer('subtotal_cents').notNull(),
  shippingCents: integer('shipping_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: orderStatus('status').notNull().default('PENDING'),
  paypalOrderId: text('paypal_order_id').unique(),
  paypalCaptureId: text('paypal_capture_id'),
  shippingAddress: jsonb('shipping_address').$type<Record<string, string>>(),
  trackingNumber: text('tracking_number'),
  carrier: text('carrier'),
  createdAt: createdAt(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
});

export const commissions = pgTable('commissions', {
  id: id(),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id),
  creativeId: text('creative_id')
    .notNull()
    .references(() => users.id),
  listingId: text('listing_id').references(() => listings.id),
  brief: text('brief').notNull(),
  structuredBrief: jsonb('structured_brief').$type<StructuredBrief>(),
  quoteCents: integer('quote_cents'),
  depositCents: integer('deposit_cents'),
  currency: text('currency').notNull().default('USD'),
  status: commissionStatus('status').notNull().default('REQUESTED'),
  depositPaypalOrderId: text('deposit_paypal_order_id'),
  balancePaypalOrderId: text('balance_paypal_order_id'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Every AI call is logged: what went in, what came out, which model.
 * Lets creatives (and judges) see exactly what the AI drafted.
 */
export const aiRuns = pgTable('ai_runs', {
  id: id(),
  kind: text('kind').notNull(), // 'listing_draft' | 'commission_brief' | 'shopping' | 'copilot'
  userId: text('user_id').references(() => users.id),
  model: text('model').notNull(),
  input: jsonb('input').notNull(),
  output: jsonb('output'),
  error: text('error'),
  latencyMs: integer('latency_ms'),
  createdAt: createdAt(),
});
