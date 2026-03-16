-- Migration: Add asado_votes table for in-app voting

CREATE TABLE IF NOT EXISTS asado_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asado_id UUID NOT NULL REFERENCES asados(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asado_votes_asado_id ON asado_votes(asado_id);

ALTER TABLE asado_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on asado_votes"
ON asado_votes FOR ALL USING (true) WITH CHECK (true);
