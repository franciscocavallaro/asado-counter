-- Migration: Add location column to asados table
-- Run this in your Supabase SQL Editor

ALTER TABLE asados 
ADD COLUMN location TEXT NOT NULL DEFAULT 'Cavallaro''s Residence';
