-- CreateTable
CREATE TABLE "PlacementRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertiserId" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "rejectReason" TEXT,
    "note" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlacementRequest_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlacementRequest_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlacementRequest_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlacementRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlacementRequest_status_idx" ON "PlacementRequest"("status");

-- CreateIndex
CREATE INDEX "PlacementRequest_advertiserId_idx" ON "PlacementRequest"("advertiserId");

-- CreateIndex
CREATE INDEX "PlacementRequest_screenId_idx" ON "PlacementRequest"("screenId");

-- CreateIndex
CREATE INDEX "PlacementRequest_creativeId_idx" ON "PlacementRequest"("creativeId");
