-- CreateTable
CREATE TABLE "campaigns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "started_at" DATETIME,
    "total_leads" INTEGER NOT NULL DEFAULT 0,
    "in_progress" INTEGER NOT NULL DEFAULT 0,
    "pending" INTEGER NOT NULL DEFAULT 0,
    "finished" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "stopped" INTEGER NOT NULL DEFAULT 0,
    "excluded" INTEGER NOT NULL DEFAULT 0,
    "list_name" TEXT,
    "list_id" INTEGER,
    "synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "senders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL,
    "synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "campaign_senders" (
    "campaign_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,

    PRIMARY KEY ("campaign_id", "sender_id"),
    CONSTRAINT "campaign_senders_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campaign_senders_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "senders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaign_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "headline" TEXT,
    "company_name" TEXT,
    "position" TEXT,
    "profile_url" TEXT,
    "location" TEXT,
    "email" TEXT,
    "connection_status" TEXT NOT NULL DEFAULT 'None',
    "message_status" TEXT NOT NULL DEFAULT 'None',
    "campaign_status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" DATETIME NOT NULL,
    "last_action_at" DATETIME,
    "finished_at" DATETIME,
    "synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leads_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "senders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "heyreach_conversation_id" TEXT NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "lead_profile_url" TEXT,
    "lead_name" TEXT,
    "lead_company_name" TEXT,
    "campaign_id" INTEGER,
    "synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "senders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversation_id" INTEGER NOT NULL,
    "is_from_lead" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "sent_at" DATETIME,
    CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stats_daily" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "campaign_id" INTEGER,
    "connection_requests_sent" INTEGER NOT NULL DEFAULT 0,
    "connections_accepted" INTEGER NOT NULL DEFAULT 0,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "inmails_sent" INTEGER NOT NULL DEFAULT 0,
    "inmail_replies" INTEGER NOT NULL DEFAULT 0,
    "synced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "type" TEXT NOT NULL,
    "records_synced" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "details" TEXT
);

-- CreateIndex
CREATE INDEX "leads_campaign_id_idx" ON "leads"("campaign_id");

-- CreateIndex
CREATE INDEX "leads_sender_id_idx" ON "leads"("sender_id");

-- CreateIndex
CREATE INDEX "leads_message_status_idx" ON "leads"("message_status");

-- CreateIndex
CREATE INDEX "leads_connection_status_idx" ON "leads"("connection_status");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_heyreach_conversation_id_sender_id_key" ON "conversations"("heyreach_conversation_id", "sender_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "stats_daily_date_campaign_id_key" ON "stats_daily"("date", "campaign_id");
