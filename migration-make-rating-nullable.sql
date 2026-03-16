-- Migration: Allow legacy rating to be nullable.
-- New asados rely on in-app votes.

ALTER TABLE asados
ALTER COLUMN rating DROP NOT NULL;
