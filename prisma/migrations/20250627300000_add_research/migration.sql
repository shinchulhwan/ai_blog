-- CreateTable
CREATE TABLE "Research" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "relatedKeywords" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "outline" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Research_keyword_idx" ON "Research"("keyword");

-- CreateIndex
CREATE INDEX "Research_createdAt_idx" ON "Research"("createdAt");

-- AlterTable
ALTER TABLE "GenerationJob" ADD COLUMN "researchId" TEXT;

-- CreateIndex
CREATE INDEX "GenerationJob_researchId_idx" ON "GenerationJob"("researchId");
