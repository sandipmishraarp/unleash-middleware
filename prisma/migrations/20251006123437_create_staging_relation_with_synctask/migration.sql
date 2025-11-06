/*
  Warnings:

  - A unique constraint covering the columns `[stagingId]` on the table `SyncTask` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stagingId` to the `SyncTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SyncTask" ADD COLUMN     "stagingId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SyncTask_stagingId_key" ON "SyncTask"("stagingId");

-- AddForeignKey
ALTER TABLE "SyncTask" ADD CONSTRAINT "SyncTask_stagingId_fkey" FOREIGN KEY ("stagingId") REFERENCES "Staging"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
