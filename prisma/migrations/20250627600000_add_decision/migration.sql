-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "jobId" TEXT,
    "researchId" TEXT,
    "verdict" TEXT NOT NULL,
    "verdictReason" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Decision_keyword_idx" ON "Decision"("keyword");
CREATE INDEX "Decision_jobId_idx" ON "Decision"("jobId");
CREATE INDEX "Decision_verdict_idx" ON "Decision"("verdict");
CREATE INDEX "Decision_createdAt_idx" ON "Decision"("createdAt");
