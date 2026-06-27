-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '일반',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastGeneratedAt" DATETIME,
    "scheduledAt" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT
);

-- CreateIndex
CREATE INDEX "Keyword_status_idx" ON "Keyword"("status");

-- CreateIndex
CREATE INDEX "Keyword_scheduledAt_idx" ON "Keyword"("scheduledAt");

-- CreateIndex
CREATE INDEX "Keyword_priority_idx" ON "Keyword"("priority");

-- CreateIndex
CREATE INDEX "Keyword_category_idx" ON "Keyword"("category");
