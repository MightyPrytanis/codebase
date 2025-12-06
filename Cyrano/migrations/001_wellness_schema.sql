-- Wellness Schema Migration
-- Creates tables for wellness journaling with HIPAA-compliant encryption and audit logging
-- Generated: 2025-01-07

-- Wellness Journal Entries Table
CREATE TABLE IF NOT EXISTS wellness_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Entry content (encrypted)
    content_encrypted TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text',
    
    -- Emotional/metadata (encrypted)
    mood TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Voice recording (if applicable)
    voice_audio_path TEXT,
    transcription_encrypted TEXT,
    
    -- AI analysis
    sentiment_score REAL,
    stress_indicators JSONB,
    burnout_signals JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP, -- Soft delete for HIPAA retention
    
    -- Indexes for performance
    CONSTRAINT wellness_journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_wellness_journal_entries_user_id ON wellness_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_journal_entries_created_at ON wellness_journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_wellness_journal_entries_deleted_at ON wellness_journal_entries(deleted_at) WHERE deleted_at IS NULL;

-- Wellness Feedback Table
CREATE TABLE IF NOT EXISTS wellness_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES wellness_journal_entries(id) ON DELETE CASCADE,
    
    -- Feedback content (encrypted)
    insights_encrypted JSONB NOT NULL,
    patterns_encrypted JSONB DEFAULT '[]'::jsonb,
    suggestions_encrypted JSONB DEFAULT '[]'::jsonb,
    encouragement_encrypted TEXT,
    
    -- Wellness recommendations (encrypted)
    wellness_recommendations_encrypted JSONB,
    
    -- Burnout/stress alerts (encrypted)
    alerts_encrypted JSONB,
    
    -- Hume emotion data (encrypted)
    hume_emotion_data_encrypted JSONB,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wellness_feedback_entry_id ON wellness_feedback(entry_id);

-- Wellness Trends Table
CREATE TABLE IF NOT EXISTS wellness_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Time period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    period_type TEXT NOT NULL,
    
    -- Aggregated metrics
    avg_sentiment REAL,
    stress_level TEXT,
    burnout_risk TEXT,
    
    -- Patterns detected (encrypted)
    common_themes_encrypted JSONB,
    mood_trends_encrypted JSONB,
    
    -- AI-generated insights (encrypted)
    insights_encrypted JSONB,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wellness_trends_user_id ON wellness_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_trends_period ON wellness_trends(period_start, period_end);

-- Wellness Access Logs Table (HIPAA Compliance)
CREATE TABLE IF NOT EXISTS wellness_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    entry_id UUID,
    
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wellness_access_logs_user_id ON wellness_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_access_logs_entry_id ON wellness_access_logs(entry_id);
CREATE INDEX IF NOT EXISTS idx_wellness_access_logs_timestamp ON wellness_access_logs(timestamp);

-- Wellness Audit Trail Table (HIPAA Compliance)
CREATE TABLE IF NOT EXISTS wellness_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    entry_id UUID NOT NULL,
    
    operation TEXT NOT NULL,
    before_state_hash TEXT,
    after_state_hash TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wellness_audit_trail_user_id ON wellness_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_audit_trail_entry_id ON wellness_audit_trail(entry_id);
CREATE INDEX IF NOT EXISTS idx_wellness_audit_trail_timestamp ON wellness_audit_trail(timestamp);

-- Comments for documentation
COMMENT ON TABLE wellness_journal_entries IS 'Stores encrypted wellness journal entries (text and voice) with metadata';
COMMENT ON TABLE wellness_feedback IS 'Stores AI-generated feedback and insights for journal entries';
COMMENT ON TABLE wellness_trends IS 'Aggregated wellness trends and patterns over time';
COMMENT ON TABLE wellness_access_logs IS 'HIPAA-compliant access logging for all wellness data access';
COMMENT ON TABLE wellness_audit_trail IS 'Complete audit trail of all CRUD operations on wellness data';


