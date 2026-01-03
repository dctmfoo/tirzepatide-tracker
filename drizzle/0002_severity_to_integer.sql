-- Migration: Convert side_effects.severity from varchar to integer
-- This migration handles existing data by mapping string values to 0-5 scale

-- Step 1: Add a temporary column for the new integer values
ALTER TABLE "side_effects" ADD COLUMN "severity_new" integer;

-- Step 2: Convert existing string values to integers
-- Mapping: 'None'→0, 'Mild'→2, 'Moderate'→3, 'Severe'→5
UPDATE "side_effects" SET "severity_new" = CASE
  WHEN "severity" = 'None' THEN 0
  WHEN "severity" = 'Mild' THEN 2
  WHEN "severity" = 'Moderate' THEN 3
  WHEN "severity" = 'Severe' THEN 5
  ELSE 0
END;

-- Step 3: Drop the old varchar column
ALTER TABLE "side_effects" DROP COLUMN "severity";

-- Step 4: Rename the new column to severity
ALTER TABLE "side_effects" RENAME COLUMN "severity_new" TO "severity";

-- Step 5: Set NOT NULL constraint and default
ALTER TABLE "side_effects" ALTER COLUMN "severity" SET NOT NULL;
ALTER TABLE "side_effects" ALTER COLUMN "severity" SET DEFAULT 0;
