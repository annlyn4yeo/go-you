-- DD-062: the lifter's own name for a workout. Null (every existing row) = the automatic name, so nothing changes for anyone.
ALTER TABLE "Workout" ADD COLUMN "title" VARCHAR(40);
