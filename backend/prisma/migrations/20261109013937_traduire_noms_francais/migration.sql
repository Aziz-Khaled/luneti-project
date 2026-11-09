/*
  Warnings:

  - You are about to drop the column `created_at` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `addresses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `appointments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cart_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `carts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `client_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contact_lens_specifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `favorite_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `favorite_stores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `frame_specifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lens_specifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `optician_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_status_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_webhook_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_shares` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prescription_eyes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prescriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_variants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refunds` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_movements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store_follows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store_listing_variants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store_listings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store_locations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store_memberships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `try_on_assets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `try_on_consents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `try_on_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_follows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `utilisateur_id` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_store_id_fkey";

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_user_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_store_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cart_id_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_listing_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "client_profiles" DROP CONSTRAINT "client_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contact_lens_specifications" DROP CONSTRAINT "contact_lens_specifications_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "favorite_products" DROP CONSTRAINT "favorite_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "favorite_products" DROP CONSTRAINT "favorite_products_user_id_fkey";

-- DropForeignKey
ALTER TABLE "favorite_stores" DROP CONSTRAINT "favorite_stores_store_id_fkey";

-- DropForeignKey
ALTER TABLE "favorite_stores" DROP CONSTRAINT "favorite_stores_user_id_fkey";

-- DropForeignKey
ALTER TABLE "frame_specifications" DROP CONSTRAINT "frame_specifications_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_location_id_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_store_listing_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "lens_specifications" DROP CONSTRAINT "lens_specifications_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_preferences" DROP CONSTRAINT "notification_preferences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "optician_profiles" DROP CONSTRAINT "optician_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_listing_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_prescription_id_fkey";

-- DropForeignKey
ALTER TABLE "order_status_history" DROP CONSTRAINT "order_status_history_changed_by_id_fkey";

-- DropForeignKey
ALTER TABLE "order_status_history" DROP CONSTRAINT "order_status_history_order_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_client_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_store_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "post_comments" DROP CONSTRAINT "post_comments_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "post_comments" DROP CONSTRAINT "post_comments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "post_comments" DROP CONSTRAINT "post_comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_post_id_fkey";

-- DropForeignKey
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "post_media" DROP CONSTRAINT "post_media_post_id_fkey";

-- DropForeignKey
ALTER TABLE "post_shares" DROP CONSTRAINT "post_shares_post_id_fkey";

-- DropForeignKey
ALTER TABLE "post_shares" DROP CONSTRAINT "post_shares_user_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_store_id_fkey";

-- DropForeignKey
ALTER TABLE "prescription_eyes" DROP CONSTRAINT "prescription_eyes_prescription_id_fkey";

-- DropForeignKey
ALTER TABLE "prescriptions" DROP CONSTRAINT "prescriptions_client_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "prescriptions" DROP CONSTRAINT "prescriptions_prescribing_store_id_fkey";

-- DropForeignKey
ALTER TABLE "product_reviews" DROP CONSTRAINT "product_reviews_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_reviews" DROP CONSTRAINT "product_reviews_user_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_product_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_order_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_inventory_id_fkey";

-- DropForeignKey
ALTER TABLE "store_follows" DROP CONSTRAINT "store_follows_store_id_fkey";

-- DropForeignKey
ALTER TABLE "store_follows" DROP CONSTRAINT "store_follows_user_id_fkey";

-- DropForeignKey
ALTER TABLE "store_listing_variants" DROP CONSTRAINT "store_listing_variants_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "store_listing_variants" DROP CONSTRAINT "store_listing_variants_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "store_listings" DROP CONSTRAINT "store_listings_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "store_listings" DROP CONSTRAINT "store_listings_product_id_fkey";

-- DropForeignKey
ALTER TABLE "store_listings" DROP CONSTRAINT "store_listings_store_id_fkey";

-- DropForeignKey
ALTER TABLE "store_locations" DROP CONSTRAINT "store_locations_store_id_fkey";

-- DropForeignKey
ALTER TABLE "store_memberships" DROP CONSTRAINT "store_memberships_store_id_fkey";

-- DropForeignKey
ALTER TABLE "store_memberships" DROP CONSTRAINT "store_memberships_user_id_fkey";

-- DropForeignKey
ALTER TABLE "store_reviews" DROP CONSTRAINT "store_reviews_order_id_fkey";

-- DropForeignKey
ALTER TABLE "store_reviews" DROP CONSTRAINT "store_reviews_store_id_fkey";

-- DropForeignKey
ALTER TABLE "store_reviews" DROP CONSTRAINT "store_reviews_user_id_fkey";

-- DropForeignKey
ALTER TABLE "try_on_assets" DROP CONSTRAINT "try_on_assets_session_id_fkey";

-- DropForeignKey
ALTER TABLE "try_on_consents" DROP CONSTRAINT "try_on_consents_session_id_fkey";

-- DropForeignKey
ALTER TABLE "try_on_sessions" DROP CONSTRAINT "try_on_sessions_product_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "try_on_sessions" DROP CONSTRAINT "try_on_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_follows" DROP CONSTRAINT "user_follows_followed_id_fkey";

-- DropForeignKey
ALTER TABLE "user_follows" DROP CONSTRAINT "user_follows_follower_id_fkey";

-- DropIndex
DROP INDEX "notifications_user_id_status_created_at_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "created_at",
DROP COLUMN "user_id",
ADD COLUMN     "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "utilisateur_id" UUID NOT NULL;

-- DropTable
DROP TABLE "addresses";

-- DropTable
DROP TABLE "appointments";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "cart_items";

-- DropTable
DROP TABLE "carts";

-- DropTable
DROP TABLE "client_profiles";

-- DropTable
DROP TABLE "contact_lens_specifications";

-- DropTable
DROP TABLE "favorite_products";

-- DropTable
DROP TABLE "favorite_stores";

-- DropTable
DROP TABLE "frame_specifications";

-- DropTable
DROP TABLE "inventories";

-- DropTable
DROP TABLE "lens_specifications";

-- DropTable
DROP TABLE "notification_preferences";

-- DropTable
DROP TABLE "optician_profiles";

-- DropTable
DROP TABLE "order_items";

-- DropTable
DROP TABLE "order_status_history";

-- DropTable
DROP TABLE "orders";

-- DropTable
DROP TABLE "payment_webhook_events";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "post_comments";

-- DropTable
DROP TABLE "post_likes";

-- DropTable
DROP TABLE "post_media";

-- DropTable
DROP TABLE "post_shares";

-- DropTable
DROP TABLE "posts";

-- DropTable
DROP TABLE "prescription_eyes";

-- DropTable
DROP TABLE "prescriptions";

-- DropTable
DROP TABLE "product_reviews";

-- DropTable
DROP TABLE "product_variants";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "refunds";

-- DropTable
DROP TABLE "stock_movements";

-- DropTable
DROP TABLE "store_follows";

-- DropTable
DROP TABLE "store_listing_variants";

-- DropTable
DROP TABLE "store_listings";

-- DropTable
DROP TABLE "store_locations";

-- DropTable
DROP TABLE "store_memberships";

-- DropTable
DROP TABLE "store_reviews";

-- DropTable
DROP TABLE "stores";

-- DropTable
DROP TABLE "try_on_assets";

-- DropTable
DROP TABLE "try_on_consents";

-- DropTable
DROP TABLE "try_on_sessions";

-- DropTable
DROP TABLE "user_follows";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" UUID NOT NULL,
    "role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "prenom" VARCHAR(100) NOT NULL,
    "nom_famille" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "empreinte_mot_de_passe" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "phone_verified_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "profile_image_url" VARCHAR(2048),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "last_login_at" TIMESTAMPTZ(6),
    "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'fr',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils_clients" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "date_naissance" DATE,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profils_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils_opticiens" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "professional_title" VARCHAR(120),
    "professional_number" VARCHAR(100),
    "bio" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profils_opticiens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magasins" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(160) NOT NULL,
    "identifiant_url" VARCHAR(180) NOT NULL,
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
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adhesions_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adhesions_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adresses" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID,
    "magasin_id" UUID,
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
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emplacements_stock" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "nom" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40),
    "type" "StockLocationType" NOT NULL DEFAULT 'STORE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "emplacements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "identifiant_url" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "brand" VARCHAR(120),
    "manufacturer" VARCHAR(120),
    "type" "ProductType" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "Audience" NOT NULL DEFAULT 'UNISEX',
    "category" VARCHAR(100),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes" JSONB,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes_produits" (
    "id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "variant_name" VARCHAR(120),
    "global_sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "color" VARCHAR(80),
    "size" VARCHAR(80),
    "material" VARCHAR(100),
    "image_url" VARCHAR(2048),
    "attributes" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variantes_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specifications_montures" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "frame_shape" VARCHAR(80),
    "frame_type" VARCHAR(80),
    "frame_width_mm" DECIMAL(6,2),
    "lens_width_mm" DECIMAL(6,2),
    "bridge_width_mm" DECIMAL(6,2),
    "temple_length_mm" DECIMAL(6,2),
    "lens_height_mm" DECIMAL(6,2),

    CONSTRAINT "specifications_montures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specifications_verres" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "design" "LensDesign" NOT NULL,
    "material" VARCHAR(100),
    "index_of_refraction" DECIMAL(4,2),
    "treatments" "LensTreatment"[] DEFAULT ARRAY[]::"LensTreatment"[],

    CONSTRAINT "specifications_verres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specifications_lentilles_contact" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "replacement" "ContactLensReplacement" NOT NULL,
    "base_curve" DECIMAL(4,2),
    "diameter_mm" DECIMAL(4,2),
    "water_content" DECIMAL(5,2),
    "material" VARCHAR(100),

    CONSTRAINT "specifications_lentilles_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "created_by_id" UUID,
    "title_override" VARCHAR(200),
    "description_override" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "annonces_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes_annonces" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "store_sku" VARCHAR(100),
    "store_barcode" VARCHAR(100),
    "price" DECIMAL(12,3) NOT NULL,
    "compare_at_price" DECIMAL(12,3),
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variantes_annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" UUID NOT NULL,
    "store_listing_variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_stock" (
    "id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "actor_id" UUID,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" VARCHAR(120),
    "note" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordonnances" (
    "id" UUID NOT NULL,
    "client_profile_id" UUID NOT NULL,
    "prescribing_store_id" UUID,
    "title" VARCHAR(120),
    "prescribed_at" DATE,
    "expires_at" DATE,
    "notes" TEXT,
    "source_document_key" VARCHAR(1024),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ordonnances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "details_yeux_ordonnance" (
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

    CONSTRAINT "details_yeux_ordonnance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paniers" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paniers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_panier" (
    "id" UUID NOT NULL,
    "panier_id" UUID NOT NULL,
    "listing_variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_panier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(40) NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "client_profile_id" UUID,
    "magasin_id" UUID NOT NULL,
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
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_commande" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "listing_variant_id" UUID,
    "instantane_nom_produit" VARCHAR(200) NOT NULL,
    "variant_snapshot" JSONB,
    "sku_snapshot" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,3) NOT NULL,
    "discount_amount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,3) NOT NULL,
    "prescription_id" UUID,

    CONSTRAINT "articles_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_statuts_commande" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "changed_by_id" UUID,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historique_statuts_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
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
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remboursements" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'TND',
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "provider_refund_id" VARCHAR(180),
    "reason" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remboursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements_webhook_paiement" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_event_id" VARCHAR(200) NOT NULL,
    "event_type" VARCHAR(150) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "processing_error" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_webhook_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "order_id" UUID,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "service_type" VARCHAR(100) NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "customer_note" TEXT,
    "internal_note" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_produits" (
    "id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "avis_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_magasins" (
    "id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(160),
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits_favoris" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produits_favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magasins_favoris" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magasins_favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "magasin_id" UUID,
    "caption" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ(6),
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "supprime_le" TIMESTAMPTZ(6),

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medias_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "thumbnail_key" VARCHAR(1024),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "medias_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentaires_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "parent_id" UUID,
    "body" TEXT NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "commentaires_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentions_j_aime_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_j_aime_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements_utilisateurs" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "followed_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements_magasins" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "magasin_id" UUID NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partages_publication" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "caption" TEXT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partages_publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_essayage" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "variante_id" UUID,
    "status" "TryOnStatus" NOT NULL DEFAULT 'CREATED',
    "metadata" JSONB,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichiers_essayage" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" "TryOnAssetType" NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "fichiers_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentements_essayage" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "consent_version" VARCHAR(40) NOT NULL,
    "purpose" VARCHAR(255) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "consentements_essayage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences_notifications" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preferences_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journaux_audit" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "magasin_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" VARCHAR(100),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "metadata" JSONB,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journaux_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_username_key" ON "utilisateurs"("username");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_status_supprime_le_idx" ON "utilisateurs"("status", "supprime_le");

-- CreateIndex
CREATE UNIQUE INDEX "profils_clients_utilisateur_id_key" ON "profils_clients"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "profils_opticiens_utilisateur_id_key" ON "profils_opticiens"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_identifiant_url_key" ON "magasins"("identifiant_url");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_registration_code_key" ON "magasins"("registration_code");

-- CreateIndex
CREATE INDEX "magasins_status_supprime_le_idx" ON "magasins"("status", "supprime_le");

-- CreateIndex
CREATE INDEX "adhesions_magasins_utilisateur_id_status_idx" ON "adhesions_magasins"("utilisateur_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "adhesions_magasins_magasin_id_utilisateur_id_key" ON "adhesions_magasins"("magasin_id", "utilisateur_id");

-- CreateIndex
CREATE INDEX "adresses_utilisateur_id_is_default_idx" ON "adresses"("utilisateur_id", "is_default");

-- CreateIndex
CREATE INDEX "adresses_magasin_id_idx" ON "adresses"("magasin_id");

-- CreateIndex
CREATE UNIQUE INDEX "emplacements_stock_magasin_id_code_key" ON "emplacements_stock"("magasin_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "produits_identifiant_url_key" ON "produits"("identifiant_url");

-- CreateIndex
CREATE INDEX "produits_type_status_idx" ON "produits"("type", "status");

-- CreateIndex
CREATE INDEX "produits_brand_category_idx" ON "produits"("brand", "category");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_global_sku_key" ON "variantes_produits"("global_sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_produits_barcode_key" ON "variantes_produits"("barcode");

-- CreateIndex
CREATE INDEX "variantes_produits_produit_id_is_active_idx" ON "variantes_produits"("produit_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "specifications_montures_variante_id_key" ON "specifications_montures"("variante_id");

-- CreateIndex
CREATE UNIQUE INDEX "specifications_verres_variante_id_key" ON "specifications_verres"("variante_id");

-- CreateIndex
CREATE UNIQUE INDEX "specifications_lentilles_contact_variante_id_key" ON "specifications_lentilles_contact"("variante_id");

-- CreateIndex
CREATE INDEX "annonces_magasins_magasin_id_status_supprime_le_idx" ON "annonces_magasins"("magasin_id", "status", "supprime_le");

-- CreateIndex
CREATE UNIQUE INDEX "annonces_magasins_magasin_id_produit_id_key" ON "annonces_magasins"("magasin_id", "produit_id");

-- CreateIndex
CREATE INDEX "variantes_annonces_listing_id_is_available_idx" ON "variantes_annonces"("listing_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_listing_id_variante_id_key" ON "variantes_annonces"("listing_id", "variante_id");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_store_sku_key" ON "variantes_annonces"("store_sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_annonces_store_barcode_key" ON "variantes_annonces"("store_barcode");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_store_listing_variant_id_location_id_key" ON "stocks"("store_listing_variant_id", "location_id");

-- CreateIndex
CREATE INDEX "mouvements_stock_inventory_id_cree_le_idx" ON "mouvements_stock"("inventory_id", "cree_le");

-- CreateIndex
CREATE INDEX "ordonnances_client_profile_id_prescribed_at_idx" ON "ordonnances"("client_profile_id", "prescribed_at");

-- CreateIndex
CREATE UNIQUE INDEX "details_yeux_ordonnance_prescription_id_side_key" ON "details_yeux_ordonnance"("prescription_id", "side");

-- CreateIndex
CREATE INDEX "paniers_utilisateur_id_status_idx" ON "paniers"("utilisateur_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "articles_panier_panier_id_listing_variant_id_key" ON "articles_panier"("panier_id", "listing_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_order_number_key" ON "commandes"("order_number");

-- CreateIndex
CREATE INDEX "commandes_utilisateur_id_cree_le_idx" ON "commandes"("utilisateur_id", "cree_le");

-- CreateIndex
CREATE INDEX "commandes_magasin_id_status_cree_le_idx" ON "commandes"("magasin_id", "status", "cree_le");

-- CreateIndex
CREATE INDEX "articles_commande_order_id_idx" ON "articles_commande"("order_id");

-- CreateIndex
CREATE INDEX "historique_statuts_commande_order_id_cree_le_idx" ON "historique_statuts_commande"("order_id", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_provider_payment_id_key" ON "paiements"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_idempotency_key_key" ON "paiements"("idempotency_key");

-- CreateIndex
CREATE INDEX "paiements_order_id_cree_le_idx" ON "paiements"("order_id", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "remboursements_provider_refund_id_key" ON "remboursements"("provider_refund_id");

-- CreateIndex
CREATE INDEX "remboursements_order_id_status_idx" ON "remboursements"("order_id", "status");

-- CreateIndex
CREATE INDEX "evenements_webhook_paiement_processed_at_received_at_idx" ON "evenements_webhook_paiement"("processed_at", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "evenements_webhook_paiement_provider_provider_event_id_key" ON "evenements_webhook_paiement"("provider", "provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "rendez_vous_order_id_key" ON "rendez_vous"("order_id");

-- CreateIndex
CREATE INDEX "rendez_vous_magasin_id_starts_at_status_idx" ON "rendez_vous"("magasin_id", "starts_at", "status");

-- CreateIndex
CREATE INDEX "rendez_vous_utilisateur_id_starts_at_idx" ON "rendez_vous"("utilisateur_id", "starts_at");

-- CreateIndex
CREATE INDEX "avis_produits_produit_id_status_cree_le_idx" ON "avis_produits"("produit_id", "status", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "avis_magasins_order_id_key" ON "avis_magasins"("order_id");

-- CreateIndex
CREATE INDEX "avis_magasins_magasin_id_status_cree_le_idx" ON "avis_magasins"("magasin_id", "status", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "produits_favoris_utilisateur_id_produit_id_key" ON "produits_favoris"("utilisateur_id", "produit_id");

-- CreateIndex
CREATE UNIQUE INDEX "magasins_favoris_utilisateur_id_magasin_id_key" ON "magasins_favoris"("utilisateur_id", "magasin_id");

-- CreateIndex
CREATE INDEX "publications_magasin_id_is_published_published_at_idx" ON "publications"("magasin_id", "is_published", "published_at");

-- CreateIndex
CREATE INDEX "publications_author_id_cree_le_idx" ON "publications"("author_id", "cree_le");

-- CreateIndex
CREATE INDEX "medias_publication_post_id_position_idx" ON "medias_publication"("post_id", "position");

-- CreateIndex
CREATE INDEX "commentaires_publication_post_id_cree_le_idx" ON "commentaires_publication"("post_id", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "mentions_j_aime_publication_post_id_utilisateur_id_key" ON "mentions_j_aime_publication"("post_id", "utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_utilisateurs_follower_id_followed_id_key" ON "abonnements_utilisateurs"("follower_id", "followed_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_magasins_utilisateur_id_magasin_id_key" ON "abonnements_magasins"("utilisateur_id", "magasin_id");

-- CreateIndex
CREATE UNIQUE INDEX "partages_publication_post_id_utilisateur_id_key" ON "partages_publication"("post_id", "utilisateur_id");

-- CreateIndex
CREATE INDEX "sessions_essayage_utilisateur_id_started_at_idx" ON "sessions_essayage"("utilisateur_id", "started_at");

-- CreateIndex
CREATE INDEX "sessions_essayage_status_expires_at_idx" ON "sessions_essayage"("status", "expires_at");

-- CreateIndex
CREATE INDEX "fichiers_essayage_session_id_type_idx" ON "fichiers_essayage"("session_id", "type");

-- CreateIndex
CREATE INDEX "fichiers_essayage_expires_at_idx" ON "fichiers_essayage"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "consentements_essayage_session_id_key" ON "consentements_essayage"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_notifications_utilisateur_id_type_channel_key" ON "preferences_notifications"("utilisateur_id", "type", "channel");

-- CreateIndex
CREATE INDEX "journaux_audit_actor_id_cree_le_idx" ON "journaux_audit"("actor_id", "cree_le");

-- CreateIndex
CREATE INDEX "journaux_audit_magasin_id_cree_le_idx" ON "journaux_audit"("magasin_id", "cree_le");

-- CreateIndex
CREATE INDEX "journaux_audit_entity_type_entity_id_idx" ON "journaux_audit"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_utilisateur_id_status_cree_le_idx" ON "notifications"("utilisateur_id", "status", "cree_le");

-- AddForeignKey
ALTER TABLE "profils_clients" ADD CONSTRAINT "profils_clients_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils_opticiens" ADD CONSTRAINT "profils_opticiens_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhesions_magasins" ADD CONSTRAINT "adhesions_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adhesions_magasins" ADD CONSTRAINT "adhesions_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplacements_stock" ADD CONSTRAINT "emplacements_stock_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_produits" ADD CONSTRAINT "variantes_produits_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications_montures" ADD CONSTRAINT "specifications_montures_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications_verres" ADD CONSTRAINT "specifications_verres_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications_lentilles_contact" ADD CONSTRAINT "specifications_lentilles_contact_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_magasins" ADD CONSTRAINT "annonces_magasins_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_annonces" ADD CONSTRAINT "variantes_annonces_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "annonces_magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_annonces" ADD CONSTRAINT "variantes_annonces_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_store_listing_variant_id_fkey" FOREIGN KEY ("store_listing_variant_id") REFERENCES "variantes_annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "emplacements_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnances" ADD CONSTRAINT "ordonnances_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "profils_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnances" ADD CONSTRAINT "ordonnances_prescribing_store_id_fkey" FOREIGN KEY ("prescribing_store_id") REFERENCES "magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "details_yeux_ordonnance" ADD CONSTRAINT "details_yeux_ordonnance_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "ordonnances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paniers" ADD CONSTRAINT "paniers_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_panier" ADD CONSTRAINT "articles_panier_panier_id_fkey" FOREIGN KEY ("panier_id") REFERENCES "paniers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_panier" ADD CONSTRAINT "articles_panier_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "variantes_annonces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "profils_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commande" ADD CONSTRAINT "articles_commande_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commande" ADD CONSTRAINT "articles_commande_listing_variant_id_fkey" FOREIGN KEY ("listing_variant_id") REFERENCES "variantes_annonces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_commande" ADD CONSTRAINT "articles_commande_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "ordonnances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts_commande" ADD CONSTRAINT "historique_statuts_commande_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statuts_commande" ADD CONSTRAINT "historique_statuts_commande_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remboursements" ADD CONSTRAINT "remboursements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remboursements" ADD CONSTRAINT "remboursements_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "paiements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_produits" ADD CONSTRAINT "avis_produits_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_produits" ADD CONSTRAINT "avis_produits_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_magasins" ADD CONSTRAINT "avis_magasins_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_favoris" ADD CONSTRAINT "produits_favoris_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_favoris" ADD CONSTRAINT "produits_favoris_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magasins_favoris" ADD CONSTRAINT "magasins_favoris_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magasins_favoris" ADD CONSTRAINT "magasins_favoris_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medias_publication" ADD CONSTRAINT "medias_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publication" ADD CONSTRAINT "commentaires_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publication" ADD CONSTRAINT "commentaires_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publication" ADD CONSTRAINT "commentaires_publication_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "commentaires_publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions_j_aime_publication" ADD CONSTRAINT "mentions_j_aime_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions_j_aime_publication" ADD CONSTRAINT "mentions_j_aime_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_utilisateurs" ADD CONSTRAINT "abonnements_utilisateurs_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_utilisateurs" ADD CONSTRAINT "abonnements_utilisateurs_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_magasins" ADD CONSTRAINT "abonnements_magasins_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_magasins" ADD CONSTRAINT "abonnements_magasins_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partages_publication" ADD CONSTRAINT "partages_publication_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partages_publication" ADD CONSTRAINT "partages_publication_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_essayage" ADD CONSTRAINT "sessions_essayage_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_essayage" ADD CONSTRAINT "sessions_essayage_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichiers_essayage" ADD CONSTRAINT "fichiers_essayage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions_essayage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentements_essayage" ADD CONSTRAINT "consentements_essayage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions_essayage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences_notifications" ADD CONSTRAINT "preferences_notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journaux_audit" ADD CONSTRAINT "journaux_audit_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
