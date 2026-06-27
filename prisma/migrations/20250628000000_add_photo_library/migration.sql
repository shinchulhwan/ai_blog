-- CreateTable
CREATE TABLE "PhotoLibrary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Photo Library',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoAsset" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoLibrary_projectId_key" ON "PhotoLibrary"("projectId");

-- CreateIndex
CREATE INDEX "PhotoLibrary_projectId_idx" ON "PhotoLibrary"("projectId");

-- CreateIndex
CREATE INDEX "PhotoAsset_libraryId_idx" ON "PhotoAsset"("libraryId");

-- CreateIndex
CREATE INDEX "PhotoAsset_projectId_idx" ON "PhotoAsset"("projectId");

-- CreateIndex
CREATE INDEX "PhotoAsset_sortOrder_idx" ON "PhotoAsset"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoAsset_libraryId_storedName_key" ON "PhotoAsset"("libraryId", "storedName");

-- AddForeignKey
ALTER TABLE "PhotoLibrary" ADD CONSTRAINT "PhotoLibrary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoAsset" ADD CONSTRAINT "PhotoAsset_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "PhotoLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
