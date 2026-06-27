-- ScheduleRecurrence: ONCE | DAILY | WEEKLY | MONTHLY | CUSTOM
-- ScheduleStatus: ACTIVE | PAUSED | PROCESSING | COMPLETED | FAILED
-- ScheduleRunStatus: RUNNING | COMPLETED | FAILED

CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "prompt" TEXT NOT NULL DEFAULT '',
    "scheduledAt" DATETIME NOT NULL,
    "recurrence" TEXT NOT NULL DEFAULT 'ONCE',
    "customIntervalMinutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastRunAt" DATETIME,
    "lastJobId" TEXT,
    "lastHistoryId" TEXT,
    "lastError" TEXT,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ScheduleRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "jobId" TEXT,
    "historyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "errorMessage" TEXT,
    CONSTRAINT "ScheduleRun_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Schedule_status_idx" ON "Schedule"("status");
CREATE INDEX "Schedule_scheduledAt_idx" ON "Schedule"("scheduledAt");
CREATE INDEX "Schedule_keyword_idx" ON "Schedule"("keyword");
CREATE INDEX "Schedule_createdAt_idx" ON "Schedule"("createdAt");
CREATE INDEX "ScheduleRun_scheduleId_idx" ON "ScheduleRun"("scheduleId");
CREATE INDEX "ScheduleRun_status_idx" ON "ScheduleRun"("status");
CREATE INDEX "ScheduleRun_startedAt_idx" ON "ScheduleRun"("startedAt");

ALTER TABLE "GenerationJob" ADD COLUMN "scheduleId" TEXT;
CREATE INDEX "GenerationJob_scheduleId_idx" ON "GenerationJob"("scheduleId");
