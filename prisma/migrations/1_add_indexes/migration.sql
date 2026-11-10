-- CreateIndex
CREATE INDEX "Workout_userId_startedAt_idx" ON "Workout"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ExerciseInstance_workoutId_idx" ON "ExerciseInstance"("workoutId");

-- CreateIndex
CREATE INDEX "SetEntry_exerciseInstanceId_idx" ON "SetEntry"("exerciseInstanceId");

