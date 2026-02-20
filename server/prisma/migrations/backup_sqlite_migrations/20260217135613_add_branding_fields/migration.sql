/*
  Warnings:

  - You are about to drop the `Reservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `default_hourly_rate` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `segment_minutes` on the `Club` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Reservation_court_id_start_time_end_time_idx";

-- DropIndex
DROP INDEX "Reservation_club_id_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "full_name" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Reservation";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "whatsapp_phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "user_id" TEXT,
    CONSTRAINT "Member_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "tournament_id" TEXT,
    "recurring_id" TEXT,
    "start_at" DATETIME NOT NULL,
    "end_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "strategy" TEXT NOT NULL DEFAULT 'SPLIT',
    "price_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "Court" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "proof_note" TEXT,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentShare_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "start_at" DATETIME NOT NULL,
    "end_at" DATETIME NOT NULL,
    "reason" TEXT,
    CONSTRAINT "Block_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "start_at" DATETIME NOT NULL,
    "end_at" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "ClassEvent_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_number" TEXT,
    "attachment_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierInvoice_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legal_name" TEXT,
    "tax_id" TEXT,
    "fiscal_address" TEXT,
    "default_vat" REAL,
    "currency" TEXT,
    "invoice_prefix" TEXT,
    "invoice_counter" INTEGER NOT NULL DEFAULT 1,
    "phone_whatsapp" TEXT,
    "bizum_payee" TEXT,
    "price_per_player_cents" INTEGER NOT NULL DEFAULT 500,
    "slot_minutes" INTEGER NOT NULL DEFAULT 30,
    "buffer_minutes" INTEGER NOT NULL DEFAULT 0,
    "min_advance_minutes" INTEGER NOT NULL DEFAULT 60,
    "max_advance_days" INTEGER NOT NULL DEFAULT 14,
    "open_hours" TEXT NOT NULL DEFAULT '{}',
    "display_name" TEXT,
    "logo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Club" ("created_at", "currency", "default_vat", "fiscal_address", "id", "invoice_counter", "invoice_prefix", "legal_name", "tax_id") SELECT "created_at", "currency", "default_vat", "fiscal_address", "id", "invoice_counter", "invoice_prefix", "legal_name", "tax_id" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "points_per_match" INTEGER NOT NULL DEFAULT 24,
    "duration_minutes" INTEGER NOT NULL DEFAULT 180,
    "match_duration_minutes" INTEGER NOT NULL DEFAULT 21,
    "price_per_person" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tournament_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("club_id", "created_at", "date", "id", "name", "points_per_match", "price_per_person", "status") SELECT "club_id", "created_at", "date", "id", "name", "points_per_match", "price_per_person", "status" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE INDEX "Tournament_club_id_idx" ON "Tournament"("club_id");
CREATE TABLE "new_TournamentParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TournamentParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentParticipant_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TournamentParticipant" ("id", "total_points", "tournament_id", "user_id") SELECT "id", "total_points", "tournament_id", "user_id" FROM "TournamentParticipant";
DROP TABLE "TournamentParticipant";
ALTER TABLE "new_TournamentParticipant" RENAME TO "TournamentParticipant";
CREATE UNIQUE INDEX "TournamentParticipant_tournament_id_user_id_key" ON "TournamentParticipant"("tournament_id", "user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Member_club_id_idx" ON "Member"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "Member_club_id_whatsapp_phone_key" ON "Member"("club_id", "whatsapp_phone");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_club_id_idx" ON "Invitation"("club_id");

-- CreateIndex
CREATE INDEX "Booking_club_id_idx" ON "Booking"("club_id");

-- CreateIndex
CREATE INDEX "Booking_court_id_start_at_end_at_idx" ON "Booking"("court_id", "start_at", "end_at");

-- CreateIndex
CREATE INDEX "PaymentShare_booking_id_idx" ON "PaymentShare"("booking_id");

-- CreateIndex
CREATE INDEX "Block_club_id_idx" ON "Block"("club_id");

-- CreateIndex
CREATE INDEX "ClassEvent_club_id_idx" ON "ClassEvent"("club_id");

-- CreateIndex
CREATE INDEX "SupplierInvoice_club_id_idx" ON "SupplierInvoice"("club_id");

-- CreateIndex
CREATE INDEX "SupplierInvoice_date_idx" ON "SupplierInvoice"("date");
