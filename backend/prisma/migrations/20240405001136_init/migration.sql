/*
  Warnings:

  - You are about to drop the column `set_order` on the `DefaultSet` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('scheduled', 'inProgress', 'complete', 'incomplete', 'skipped');

-- AlterTable
ALTER TABLE "DefaultSet" DROP COLUMN "set_order";

-- CreateTable
CREATE TABLE "ScheduledWorkout" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "user_id" INTEGER NOT NULL,
    "workout_id" INTEGER,
    "completion" "CompletionStatus" NOT NULL DEFAULT 'scheduled',
    "name" VARCHAR(255) NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ScheduledWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledRoutine" (
    "id" SERIAL NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "rest" INTEGER NOT NULL DEFAULT 60,
    "workout_id" INTEGER NOT NULL,

    CONSTRAINT "ScheduledRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledSet" (
    "id" SERIAL NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "weight_lbs" INTEGER NOT NULL,
    "routine_id" INTEGER NOT NULL,

    CONSTRAINT "ScheduledSet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledWorkout" ADD CONSTRAINT "ScheduledWorkout_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledWorkout" ADD CONSTRAINT "ScheduledWorkout_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledRoutine" ADD CONSTRAINT "ScheduledRoutine_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "ScheduledWorkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledRoutine" ADD CONSTRAINT "ScheduledRoutine_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledSet" ADD CONSTRAINT "ScheduledSet_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "ScheduledRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
