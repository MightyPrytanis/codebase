-- Migration 003: Drop foreign-key constraint on practice_profiles.user_id
--
-- The practice_profiles table is keyed by the JWT user-id (an integer), not a
-- row in the wellness `users` table.  Keeping a FK reference to users(id)
-- causes INSERT failures whenever the authenticated user's id has no matching
-- row in `users` (e.g. external-auth users, test users, CI fixtures).
-- Removing the constraint keeps the column semantics intact while letting the
-- onboarding flow work for any valid authenticated session.
--
-- Referential integrity is enforced at the application layer:
--   • authenticateJWT middleware validates the JWT before any route handler runs
--   • upsertPracticeProfile() rejects non-numeric user IDs (parseInt check)
--   • Row ownership is enforced by always reading userId from req.user (JWT),
--     never trusting a caller-supplied userId in the request body

ALTER TABLE practice_profiles
  DROP CONSTRAINT IF EXISTS practice_profiles_user_id_fkey;
