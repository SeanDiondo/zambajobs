-- Migration to add categories column to jobs and jobSeekerProfiles tables
-- This migration converts the single category column to an array-based categories system

-- Add categories column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Migrate existing single category values to the new categories array
UPDATE jobs 
SET categories = ARRAY[category] 
WHERE category IS NOT NULL AND category != '';

-- Add categories column to jobSeekerProfiles table
ALTER TABLE jobSeekerProfiles ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Optional: Drop the old category column from jobs table after migration is complete
-- Note: Uncomment this line only after you've verified the migration worked correctly
-- ALTER TABLE jobs DROP COLUMN IF EXISTS category;
