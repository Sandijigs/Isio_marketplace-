CREATE TYPE "public"."commission_status" AS ENUM('REQUESTED', 'QUOTED', 'DEPOSIT_PAID', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."listing_category" AS ENUM('painting', 'sculpture', 'textiles', 'fashion', 'beadwork', 'jewelry', 'leather', 'pottery', 'woodwork', 'photography', 'illustration', 'other');--> statement-breakpoint
CREATE TYPE "public"."listing_kind" AS ENUM('PRODUCT', 'SERVICE');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('DRAFT', 'ACTIVE', 'SOLD_OUT', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('BUYER', 'CREATIVE');--> statement-breakpoint
CREATE TABLE "ai_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"user_id" text,
	"model" text NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"error" text,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"buyer_id" text NOT NULL,
	"creative_id" text NOT NULL,
	"listing_id" text,
	"brief" text NOT NULL,
	"structured_brief" jsonb,
	"quote_cents" integer,
	"deposit_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "commission_status" DEFAULT 'REQUESTED' NOT NULL,
	"deposit_paypal_order_id" text,
	"balance_paypal_order_id" text,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"craft" text NOT NULL,
	"story" text,
	"location" text,
	"country" text DEFAULT 'NG' NOT NULL,
	"avatar_url" text,
	"paypal_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creative_profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_id" text NOT NULL,
	"kind" "listing_kind" DEFAULT 'PRODUCT' NOT NULL,
	"status" "listing_status" DEFAULT 'DRAFT' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"story" text,
	"category" "listing_category" NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"stock" integer,
	"turnaround_days" integer,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_drafted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"buyer_id" text NOT NULL,
	"creative_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"paypal_order_id" text,
	"paypal_capture_id" text,
	"shipping_address" jsonb,
	"tracking_number" text,
	"carrier" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	CONSTRAINT "orders_paypal_order_id_unique" UNIQUE("paypal_order_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'BUYER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_creative_id_users_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_profiles" ADD CONSTRAINT "creative_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_creative_id_users_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_creative_id_users_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;