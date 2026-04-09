-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_senders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "auth_is_valid" BOOLEAN NOT NULL DEFAULT false,
    "profile_url" TEXT,
    "synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_senders" ("full_name", "id", "synced_at") SELECT "full_name", "id", "synced_at" FROM "senders";
DROP TABLE "senders";
ALTER TABLE "new_senders" RENAME TO "senders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
