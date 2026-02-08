-- Asado Counter Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cuts table (stores unique meat cut names)
CREATE TABLE cuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guests table (stores unique guest names)
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asados table (main asado events)
CREATE TABLE asados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    title TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    location TEXT NOT NULL DEFAULT 'Cavallaro''s Residence',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asado cuts junction table (which cuts were used in each asado with weight)
CREATE TABLE asado_cuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asado_id UUID NOT NULL REFERENCES asados(id) ON DELETE CASCADE,
    cut_id UUID NOT NULL REFERENCES cuts(id) ON DELETE CASCADE,
    weight_kg DECIMAL(10, 2) NOT NULL CHECK (weight_kg > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asado guests junction table (which guests attended each asado)
CREATE TABLE asado_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asado_id UUID NOT NULL REFERENCES asados(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(asado_id, guest_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_asado_cuts_asado_id ON asado_cuts(asado_id);
CREATE INDEX idx_asado_cuts_cut_id ON asado_cuts(cut_id);
CREATE INDEX idx_asado_guests_asado_id ON asado_guests(asado_id);
CREATE INDEX idx_asado_guests_guest_id ON asado_guests(guest_id);
CREATE INDEX idx_asados_date ON asados(date);

-- Disable RLS for simplicity (no auth)
ALTER TABLE cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE asados ENABLE ROW LEVEL SECURITY;
ALTER TABLE asado_cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asado_guests ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (no auth)
CREATE POLICY "Allow all operations on cuts" ON cuts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guests" ON guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on asados" ON asados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on asado_cuts" ON asado_cuts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on asado_guests" ON asado_guests FOR ALL USING (true) WITH CHECK (true);

