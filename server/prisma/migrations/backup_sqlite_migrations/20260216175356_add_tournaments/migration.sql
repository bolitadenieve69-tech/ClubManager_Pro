-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "club_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "points_per_match" INTEGER NOT NULL DEFAULT 24,
    "price_per_person" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tournament_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TournamentParticipant_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "court_id" TEXT,
    "player1_id" TEXT NOT NULL,
    "player2_id" TEXT NOT NULL,
    "player3_id" TEXT NOT NULL,
    "player4_id" TEXT NOT NULL,
    "score_12" INTEGER,
    "score_34" INTEGER,
    CONSTRAINT "TournamentMatch_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
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
    "tournament_id" TEXT,
    CONSTRAINT "Reservation_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "Court" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("club_id", "court_id", "created_at", "end_time", "id", "invoice_id", "recurring_id", "start_time", "status", "total_price", "user_id") SELECT "club_id", "court_id", "created_at", "end_time", "id", "invoice_id", "recurring_id", "start_time", "status", "total_price", "user_id" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_club_id_idx" ON "Reservation"("club_id");
CREATE INDEX "Reservation_court_id_start_time_end_time_idx" ON "Reservation"("court_id", "start_time", "end_time");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Tournament_club_id_idx" ON "Tournament"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournament_id_user_id_key" ON "TournamentParticipant"("tournament_id", "user_id");
