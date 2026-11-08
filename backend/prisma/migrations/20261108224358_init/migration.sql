-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'MANAGER', 'OPTICIAN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'BILLING', 'SHIPPING', 'STORE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FRAME', 'LENS', 'CONTACT_LENS', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('WOMEN', 'MEN', 'UNISEX', 'CHILDREN');

-- CreateEnum
CREATE TYPE "LensDesign" AS ENUM ('SINGLE_VISION', 'BIFOCAL', 'PROGRESSIVE', 'READING', 'OTHER');

-- CreateEnum
CREATE TYPE "LensTreatment" AS ENUM ('BLUE_LIGHT', 'PHOTOCHROMIC', 'POLARIZED', 'ANTI_REFLECTIVE', 'SCRATCH_RESISTANT', 'UV_PROTECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactLensReplacement" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'OUT_OF_STOCK', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StockLocationType" AS ENUM ('STORE', 'WAREHOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'DAMAGE', 'RESERVED', 'RELEASED');

-- CreateEnum
CREATE TYPE "EyeSide" AS ENUM ('RIGHT', 'LEFT');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'FLOUCI', 'KONNECT', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'REJECTED');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'STORE_CUSTOMERS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "TryOnStatus" AS ENUM ('CREATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "TryOnAssetType" AS ENUM ('INPUT_IMAGE', 'OUTPUT_IMAGE', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_UPDATE', 'PAYMENT_UPDATE', 'APPOINTMENT_UPDATE', 'NEW_FOLLOWER', 'POST_INTERACTION', 'PROMOTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "phone_verified_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "profile_image_url" VARCHAR(2048),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "last_login_at" TIMESTAMPTZ(6),
    "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'fr',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date_of_birth" DATE,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optician_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "professional_title" VARCHAR(120),
    "professional_number" VARCHAR(100),
    "bio" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "optician_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(2048),
    "cover_image_url" VARCHAR(2048),
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "website_url" VARCHAR(2048),
    "registration_code" VARCHAR(100),
    "status" "StoreStatus" NOT NULL DEFAULT 'DRAFT',
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'Africa/Tunis',
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_memberships" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "store_id" UUID,
    "type" "AddressType" NOT NULL DEFAULT 'OTHER',
    "label" VARCHAR(80),
    "recipient_name" VARCHAR(160),
    "phone" VARCHAR(30),
    "line1" VARCHAR(255) NOT NULL,
    "line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "region" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country_code" CHAR(2) NOT NULL DEFAULT 'TN',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_locations" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40),
    "type" "StockLocationType" NOT NULL DEFAULT 'STORE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "store_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "brand" VARCHAR(120),
    "manufacturer" VARCHAR(120),
    "type" "ProductType" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "Audience" NOT NULL DEFAULT 'UNISEX',
    "category" VARCHAR(100),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_name" VARCHAR(120),
    "global_sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "color" VARCHAR(80),
    "size" VARCHAR(80),
    "material" VARCHAR(100),
    "image_url" VARCHAR(2048),
    "attributes" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frame_specifications" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "frame_shape" VARCHAR(80),
    "frame_type" VARCHAR(80),
    "frame_width_mm" DECIMAL(6,2),
    "lens_width_mm" DECIMAL(6,2),
    "bridge_width_mm" DECIMAL(6,2),
    "temple_length_mm" DECIMAL(6,2),
    "lens_height_mm" DECIMAL(6,2),

    CONSTRAINT "frame_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lens_specifications" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "design" "LensDesign" NOT NULL,
    "material" VARCHAR(100),
    "index_of_refraction" DECIMAL(4,2),
    "treatments" "LensTreatment"[] DEFAULT ARRAY[]::"LensTreatment"[],

    CONSTRAINT "lens_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_lens_specifications" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "replacement" "ContactLensReplacement" NOT NULL,
    "base_curve" DECIMAL(4,2),
    "diameter_mm" DECIMAL(4,2),
    "water_content" DECIMAL(5,2),
    "material" VARCHAR(100),

    CONSTRAINT "contact_lens_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_listings" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_by_id" UUID,
    "title_override" VARCHAR(200),
    "description_override" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "store_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_listing_variants" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "store_sku" VARCHAR(100),
    "store_barcode" VARCHAR(100),
    "price" DECIMAL(12,3) NOT NULL,
    "compare_at_price" DECIMAL(12,3),
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "store_listing_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" UUID NOT NULL,
    "store_listing_variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "actor_id" UUID,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" VARCHAR(120),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL,
    "client_profile_id" UUID NOT NULL,
    "prescribing_store_id" UUID,
    "title" VARCHAR(120),
    "prescribed_at" DATE,
    "expires_at" DATE,
    "notes" TEXT,
    "source_document_key" VARCHAR(1024),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_eyes" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "side" "EyeSide" NOT NULL,
    "sphere" DECIMAL(5,2),
    "cylinder" DECIMAL(5,2),
    "axis" INTEGER,
    "addition" DECIMAL(5,2),
    "prism" DECIMAL(5,2),
    "base" VARCHAR(20),
    "pupillary_distance" DECIMAL(5,2),

    CONSTRAINT "prescription_eyes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "listing_variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(40) NOT NULL,
    "user_id" UUID NOT NULL,
    "client_profile_id" UUID,
    "store_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "subtotal" DECIMAL(12,3) NOT NULL,
    "discount_total" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "shipping_total" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,3) NOT NULL,
    "customer_note" TEXT,
    "billing_address_snapshot" JSONB,
    "shipping_address_snapshot" JSONB,
    "placed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "listing_variant_id" UUID,
    "product_name_snapshot" VARCHAR(200) NOT NULL,
    "variant_snapshot" JSONB,
    "sku_snapshot" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,3) NOT NULL,
    "discount_amount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,3) NOT NULL,
    "prescription_id" UUID,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "changed_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "amount" DECIMAL(12,3) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "provider_payment_id" VARCHAR(180),
    "checkout_url" VARCHAR(2048),
    "idempotency_key" VARCHAR(180),
    "failure_code" VARCHAR(100),
    "failure_message" TEXT,
    "provider_payload" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "provider_refund_id" VARCHAR(180),
    "reason" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_event_id" VARCHAR(200) NOT NULL,
    "event_type" VARCHAR(150) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "processing_error" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "service_type" VARCHAR(100) NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "customer_note" TEXT,
    "internal_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_reviews" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_products" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_stores" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "store_id" UUID,
    "caption" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_media" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "thumbnail_key" VARCHAR(1024),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "followed_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_follows" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_shares" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "try_on_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_variant_id" UUID,
    "status" "TryOnStatus" NOT NULL DEFAULT 'CREATED',
    "metadata" JSONB,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "try_on_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "try_on_assets" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" "TryOnAssetType" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "try_on_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "try_on_consents" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "consent_version" VARCHAR(40) NOT NULL,
    "purpose" VARCHAR(255) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "try_on_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "read_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "store_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" VARCHAR(100),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_user_id_key" ON "client_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "optician_profiles_user_id_key" ON "optician_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "stores_registration_code_key" ON "stores"("registration_code");

-- CreateIndex
CREATE INDEX "stores_status_deleted_at_idx" ON "stores"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "store_memberships_user_id_status_idx" ON "store_memberships"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "store_memberships_store_id_user_id_key" ON "store_memberships"("store_id", "user_id");

-- CreateIndex
CREATE INDEX "addresses_user_id_is_default_idx" ON "addresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "addresses_store_id_idx" ON "addresses"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_locations_store_id_code_key" ON "store_locations"("store_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_type_status_idx" ON "products"("type", "status");

-- CreateIndex
CREATE INDEX "products_brand_category_idx" ON "products"("brand", "category");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_global_sku_key" ON "product_variants"("global_sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE INDEX "product_variants_product_id_is_active_idx" ON "product_variants"("product_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "frame_specifications_variant_id_key" ON "frame_specifications"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lens_specifications_variant_id_key" ON "lens_specifications"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_lens_specifications_variant_id_key" ON "contact_lens_specifications"("variant_id");

-- CreateIndex
CREATE INDEX "store_listings_store_id_status_deleted_at_idx" ON "store_listings"("store_id", "status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "store_listings_store_id_product_id_key" ON "store_listings"("store_id", "product_id");

-- CreateIndex
CREATE INDEX "store_listing_variants_listing_id_is_available_idx" ON "store_listing_variants"("listing_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "store_listing_variants_listing_id_variant_id_key" ON "store_listing_variants"("listing_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_listing_variants_store_sku_key" ON "store_listing_variants"("store_sku");

-- CreateIndex
CREATE UNIQUE INDEX "store_listing_variants_store_barcode_key" ON "store_listing_variants"("store_barcode");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_store_listing_variant_id_location_id_key" ON "inventories"("store_listing_variant_id", "location_id");

-- CreateIndex
CREATE INDEX "stock_movements_inventory_id_created_at_idx" ON "stock_movements"("inventory_id", "created_at");

-- CreateIndex
CREATE INDEX "prescriptions_client_profile_id_prescribed_at_idx" ON "prescriptions"("client_profile_id", "prescribed_at");

-- CreateIndex
CREATE UNIQUE INDEX "prescription_eyes_prescription_id_side_key" ON "prescription_eyes"("prescription_id", "side");

-- CreateIndex
CREATE INDEX "carts_user_id_status_idx" ON "carts"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_listing_variant_id_key" ON "cart_items"("cart_id", "listing_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_store_id_status_created_at_idx" ON "orders"("store_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_order_id_created_at_idx" ON "payments"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_provider_refund_id_key" ON "refunds"("provider_refund_id");

-- CreateIndex
CREATE INDEX "refunds_order_id_status_idx" ON "refunds"("order_id", "status");

-- CreateIndex
CREATE INDEX "payment_webhook_events_processed_at_received_at_idx" ON "payment_webhook_events"("processed_at", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_provider_event_id_key" ON "payment_webhook_events"("provider", "provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_order_id_key" ON "appointments"("order_id");

-- CreateIndex
CREATE INDEX "appointments_store_id_starts_at_status_idx" ON "appointments"("store_id", "starts_at", "status");

-- CreateIndex
CREATE INDEX "appointments_user_id_starts_at_idx" ON "appointments"("user_id", "starts_at");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_status_created_at_idx" ON "product_reviews"("product_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "store_reviews_order_id_key" ON "store_reviews"("order_id");

-- CreateIndex
CREATE INDEX "store_reviews_store_id_status_created_at_idx" ON "store_reviews"("store_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_products_user_id_product_id_key" ON "favorite_products"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_stores_user_id_store_id_key" ON "favorite_stores"("user_id", "store_id");

-- CreateIndex
CREATE INDEX "posts_store_id_is_published_published_at_idx" ON "posts"("store_id", "is_published", "published_at");

-- CreateIndex
CREATE INDEX "posts_author_id_created_at_idx" ON "posts"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "post_media_post_id_position_idx" ON "post_media"("post_id", "position");

-- CreateIndex
CREATE INDEX "post_comments_post_id_created_at_idx" ON "post_comments"("post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_follower_id_followed_id_key" ON "user_follows"("follower_id", "followed_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_follows_user_id_store_id_key" ON "store_follows"("user_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_shares_post_id_user_id_key" ON "post_shares"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "try_on_sessions_user_id_started_at_idx" ON "try_on_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "try_on_sessions_status_expires_at_idx" ON "try_on_sessions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "try_on_assets_session_id_type_idx" ON "try_on_assets"("session_id", "type");

-- CreateIndex
CREATE INDEX "try_on_assets_expires_at_idx" ON "try_on_assets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "try_on_consents_session_id_key" ON "try_on_consents"("session_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_created_at_idx" ON "notifications"("user_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_type_channel_key" ON "notification_preferences"("user_id", "type", "channel");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_store_id_created_at_idx" ON "audit_logs"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optician_profiles" ADD CONSTRAINT "optician_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_memberships" ADD CONSTRAINT "store_memberships_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_memberships" ADD CONSTRAINT "store_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_locations" ADD CONSTRAINT "store_locations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frame_specifications" ADD CONSTRAINT "frame_specifications_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lens_specifications" ADD CONSTRAINT "lens_specifications_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_lens_specifications" ADD CONSTRAINT "contact_lens_specifications_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_listings" ADD CONSTRAINT "store_listings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_listings" ADD CONSTRAINT "store_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_listings" ADD CONSTRAINT "store_listings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_listing_variants" ADD CONSTRAINT "store_listing_variants_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "store_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_listing_variants" ADD CONSTRAINT "store_listing_variants_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_store_listing_variant_id_fkey" FOREIGN KEY ("store_listing_variant_id") REFERENCES "store_listing_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescribing_store_id_fkey" FOREIGN KEY ("prescribing_store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_eyes" ADD CONSTRAINT "prescription_eyes_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "store_listing_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "store_listing_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_products" ADD CONSTRAINT "favorite_products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_products" ADD CONSTRAINT "favorite_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_stores" ADD CONSTRAINT "favorite_stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_stores" ADD CONSTRAINT "favorite_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_sessions" ADD CONSTRAINT "try_on_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_sessions" ADD CONSTRAINT "try_on_sessions_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_assets" ADD CONSTRAINT "try_on_assets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "try_on_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_on_consents" ADD CONSTRAINT "try_on_consents_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "try_on_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
