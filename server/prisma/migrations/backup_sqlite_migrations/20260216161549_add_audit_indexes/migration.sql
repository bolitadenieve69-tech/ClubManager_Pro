-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legal_name" TEXT,
    "tax_id" TEXT,
    "fiscal_address" TEXT,
    "default_vat" REAL,
    "currency" TEXT,
    "invoice_prefix" TEXT,
    "invoice_counter" INTEGER NOT NULL DEFAULT 1,
    "default_hourly_rate" INTEGER,
    "segment_minutes" INTEGER NOT NULL DEFAULT 30,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Court" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surface_type" TEXT,
    "lighting" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Court_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rate_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "court_id" TEXT,
    "hourly_rate" INTEGER NOT NULL,
    "valid_days" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Price_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Price_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "Court" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "recurring_id" TEXT,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "total_price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "Court" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceItem_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CloseoutPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "from" DATETIME NOT NULL,
    "to" DATETIME NOT NULL,
    "total_revenue" REAL NOT NULL,
    "total_hours" REAL NOT NULL,
    "reservation_count" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "CloseoutPeriod_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "concept" TEXT NOT NULL,
    "category" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movement_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Court_club_id_idx" ON "Court"("club_id");

-- CreateIndex
CREATE INDEX "Rate_club_id_idx" ON "Rate"("club_id");

-- CreateIndex
CREATE INDEX "Price_club_id_idx" ON "Price"("club_id");

-- CreateIndex
CREATE INDEX "Price_court_id_idx" ON "Price"("court_id");

-- CreateIndex
CREATE INDEX "Reservation_club_id_idx" ON "Reservation"("club_id");

-- CreateIndex
CREATE INDEX "Reservation_court_id_start_time_end_time_idx" ON "Reservation"("court_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "Invoice_club_id_idx" ON "Invoice"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_club_id_number_key" ON "Invoice"("club_id", "number");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoice_id_idx" ON "InvoiceItem"("invoice_id");

-- CreateIndex
CREATE INDEX "CloseoutPeriod_club_id_idx" ON "CloseoutPeriod"("club_id");

-- CreateIndex
CREATE INDEX "Movement_club_id_date_idx" ON "Movement"("club_id", "date");
