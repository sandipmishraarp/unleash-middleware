-- CreateTable
CREATE TABLE "Secret" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProbeResult" (
    "id" SERIAL NOT NULL,
    "resource" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "status" INTEGER NOT NULL,
    "message" TEXT,
    "responseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProbeResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncTask" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceGuid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "eventType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staging" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceGuid" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mapping" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "sourceGuid" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Secret_key_key" ON "Secret"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SyncTask_source_sourceGuid_type_key" ON "SyncTask"("source", "sourceGuid", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Staging_sourceGuid_key" ON "Staging"("sourceGuid");

-- CreateIndex
CREATE UNIQUE INDEX "Mapping_sourceGuid_key" ON "Mapping"("sourceGuid");
