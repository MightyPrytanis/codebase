-- Convert practice_profiles.user_id to bigint so we can store large auth identifiers
ALTER TABLE practice_profiles
  ALTER COLUMN user_id TYPE bigint;
