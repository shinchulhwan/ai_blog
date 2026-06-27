-- Default project for existing records
-- ProjectStatus: ACTIVE | ARCHIVED

CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "targetAudience" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'ko',
    "country" TEXT NOT NULL DEFAULT 'KR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ProjectPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "systemInstructions" TEXT NOT NULL,
    "userTemplate" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectPrompt_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ProjectKnowledge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectKnowledge_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Project" ("id", "name", "description", "targetAudience", "language", "country", "status", "createdAt", "updatedAt")
VALUES ('proj_default0000000001', '기본 프로젝트', '마이그레이션 기본 프로젝트', '일반 독자', 'ko', 'KR', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_name_idx" ON "Project"("name");
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
CREATE INDEX "ProjectPrompt_projectId_idx" ON "ProjectPrompt"("projectId");
CREATE INDEX "ProjectKnowledge_projectId_idx" ON "ProjectKnowledge"("projectId");

ALTER TABLE "Keyword" ADD COLUMN "projectId" TEXT;
UPDATE "Keyword" SET "projectId" = 'proj_default0000000001' WHERE "projectId" IS NULL;
CREATE INDEX "Keyword_projectId_idx" ON "Keyword"("projectId");

ALTER TABLE "BlogHistory" ADD COLUMN "projectId" TEXT;
UPDATE "BlogHistory" SET "projectId" = 'proj_default0000000001' WHERE "projectId" IS NULL;
CREATE INDEX "BlogHistory_projectId_idx" ON "BlogHistory"("projectId");

ALTER TABLE "GenerationJob" ADD COLUMN "projectId" TEXT;
UPDATE "GenerationJob" SET "projectId" = 'proj_default0000000001' WHERE "projectId" IS NULL;
CREATE INDEX "GenerationJob_projectId_idx" ON "GenerationJob"("projectId");

ALTER TABLE "Decision" ADD COLUMN "projectId" TEXT;
UPDATE "Decision" SET "projectId" = 'proj_default0000000001' WHERE "projectId" IS NULL;
CREATE INDEX "Decision_projectId_idx" ON "Decision"("projectId");

ALTER TABLE "WorkflowRun" ADD COLUMN "projectId" TEXT;
UPDATE "WorkflowRun" SET "projectId" = 'proj_default0000000001' WHERE "projectId" IS NULL;
CREATE INDEX "WorkflowRun_projectId_idx" ON "WorkflowRun"("projectId");

ALTER TABLE "Schedule" ADD COLUMN "projectId" TEXT;
UPDATE "Schedule" SET "projectId" = 'proj_default0000000001' WHERE "projectId" IS NULL;
CREATE INDEX "Schedule_projectId_idx" ON "Schedule"("projectId");

ALTER TABLE "Research" ADD COLUMN "projectId" TEXT;
UPDATE "Research" SET "projectId" = 'proj_default0000000001' WHERE "projectId" IS NULL;
CREATE INDEX "Research_projectId_idx" ON "Research"("projectId");
