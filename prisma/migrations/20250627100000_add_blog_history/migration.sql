-- CreateTable
CREATE TABLE "BlogHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "selectedTitle" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "faq" TEXT NOT NULL,
    "imagePrompt" TEXT NOT NULL,
    "seoScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "naverPostId" TEXT,
    "publishUrl" TEXT,
    "publishError" TEXT
);

-- CreateIndex
CREATE INDEX "BlogHistory_keyword_idx" ON "BlogHistory"("keyword");

-- CreateIndex
CREATE INDEX "BlogHistory_status_idx" ON "BlogHistory"("status");

-- CreateIndex
CREATE INDEX "BlogHistory_createdAt_idx" ON "BlogHistory"("createdAt");

-- CreateIndex
CREATE INDEX "BlogHistory_selectedTitle_idx" ON "BlogHistory"("selectedTitle");
