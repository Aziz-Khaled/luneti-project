CREATE TYPE "FrameAgeGroup" AS ENUM ('ADULTE', 'ENFANT');

ALTER TABLE "stocks"
  ADD COLUMN "frame_age_group" "FrameAgeGroup";
