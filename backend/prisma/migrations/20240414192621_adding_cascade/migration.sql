-- DropForeignKey
ALTER TABLE "WorkoutLike" DROP CONSTRAINT "WorkoutLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutLike" DROP CONSTRAINT "WorkoutLike_workoutId_fkey";

-- AddForeignKey
ALTER TABLE "WorkoutLike" ADD CONSTRAINT "WorkoutLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLike" ADD CONSTRAINT "WorkoutLike_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
