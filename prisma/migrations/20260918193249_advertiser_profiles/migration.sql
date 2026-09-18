-- CreateTable
CREATE TABLE "AdvertiserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "pitch" TEXT,
    "website" TEXT,
    "contact" TEXT,
    "logoStoredName" TEXT,
    "logoUrl" TEXT,
    "category" TEXT,
    "serviceAreaZips" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdvertiserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvertiserProfile_userId_key" ON "AdvertiserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertiserProfile_slug_key" ON "AdvertiserProfile"("slug");

-- CreateIndex
CREATE INDEX "AdvertiserProfile_published_idx" ON "AdvertiserProfile"("published");
