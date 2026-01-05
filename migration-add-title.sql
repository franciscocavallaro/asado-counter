-- Migration: Add title column to asados table
-- Run this in your Supabase SQL Editor if you already have an existing database

ALTER TABLE asados 
ADD COLUMN IF NOT EXISTS title TEXT;


