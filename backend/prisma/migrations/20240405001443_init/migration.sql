/*
  Warnings:

  - Added the required column `completed` to the `ScheduledSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rpe` to the `ScheduledSet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScheduledSet" ADD COLUMN     "completed" BOOLEAN NOT NULL,
ADD COLUMN     "rpe" INTEGER NOT NULL;
