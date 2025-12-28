-- Library Schema Migration
-- Creates tables for legal library management with practice profiles, storage locations, items, and ingest queue
-- Generated: 2025-12-21

-- Practice Profiles Table
CREATE TABLE IF NOT EXISTS practice_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Jurisdictions
    primary_jurisdiction TEXT NOT NULL,
    additional_jurisdictions JSONB DEFAULT '[]'::jsonb,
    
    -- Practice areas
    practice_areas JSONB DEFAULT '[]'::jsonb,
    
    -- Courts and counties
    counties JSONB DEFAULT '[]'::jsonb,
    courts JSONB DEFAULT '[]'::jsonb,
    
    -- Issue areas/tags
    issue_tags JSONB DEFAULT '[]'::jsonb,
    
    -- Storage and cache preferences
    storage_preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Research provider preferences
    research_provider TEXT,
    
    -- Integration credentials (encrypted)
    integrations JSONB DEFAULT '{}'::jsonb,
    
    -- MAE/LLM provider selection
    llm_provider TEXT,
    llm_provider_tested BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    CONSTRAINT practice_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_practice_profiles_user_id ON practice_profiles(user_id);

-- Library Locations Table
CREATE TABLE IF NOT EXISTS library_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL, -- 'local' | 'onedrive' | 'gdrive' | 's3'
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    credentials JSONB, -- Encrypted storage credentials
    enabled BOOLEAN DEFAULT true NOT NULL,
    last_sync_at TIMESTAMP,
    sync_status TEXT DEFAULT 'idle', -- 'idle' | 'syncing' | 'error'
    sync_error TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    CONSTRAINT library_locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_library_locations_user_id ON library_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_library_locations_type ON library_locations(type);
CREATE INDEX IF NOT EXISTS idx_library_locations_enabled ON library_locations(enabled);

-- Library Items Table
CREATE TABLE IF NOT EXISTS library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    location_id UUID NOT NULL REFERENCES library_locations(id) ON DELETE CASCADE,
    
    -- File information
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    
    -- Document metadata
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL, -- 'rule' | 'standing-order' | 'template' | 'playbook' | 'case-law' | 'statute' | 'other'
    
    -- Jurisdictional metadata
    jurisdiction TEXT,
    county TEXT,
    court TEXT,
    judge_referee TEXT,
    
    -- Content tags
    issue_tags JSONB DEFAULT '[]'::jsonb,
    practice_areas JSONB DEFAULT '[]'::jsonb,
    
    -- Date metadata
    effective_from TIMESTAMP,
    effective_to TIMESTAMP,
    date_created TIMESTAMP,
    date_modified TIMESTAMP,
    
    -- RAG integration
    ingested BOOLEAN DEFAULT false NOT NULL,
    ingested_at TIMESTAMP,
    vector_ids JSONB DEFAULT '[]'::jsonb, -- IDs in vector store
    
    -- Status
    pinned BOOLEAN DEFAULT false NOT NULL,
    superseded BOOLEAN DEFAULT false NOT NULL,
    superseded_by UUID, -- ID of newer version
    
    -- System metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_accessed_at TIMESTAMP,
    
    CONSTRAINT library_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT library_items_location_id_fkey FOREIGN KEY (location_id) REFERENCES library_locations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_library_items_user_id ON library_items(user_id);
CREATE INDEX IF NOT EXISTS idx_library_items_location_id ON library_items(location_id);
CREATE INDEX IF NOT EXISTS idx_library_items_source_type ON library_items(source_type);
CREATE INDEX IF NOT EXISTS idx_library_items_jurisdiction ON library_items(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_library_items_county ON library_items(county);
CREATE INDEX IF NOT EXISTS idx_library_items_court ON library_items(court);
CREATE INDEX IF NOT EXISTS idx_library_items_ingested ON library_items(ingested);
CREATE INDEX IF NOT EXISTS idx_library_items_pinned ON library_items(pinned);
CREATE INDEX IF NOT EXISTS idx_library_items_superseded ON library_items(superseded);

-- Ingest Queue Table
CREATE TABLE IF NOT EXISTS ingest_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_item_id UUID NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    priority TEXT DEFAULT 'normal' NOT NULL, -- 'low' | 'normal' | 'high'
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending' | 'processing' | 'completed' | 'failed'
    attempts INTEGER DEFAULT 0 NOT NULL,
    max_attempts INTEGER DEFAULT 3 NOT NULL,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMP,
    
    CONSTRAINT ingest_queue_library_item_id_fkey FOREIGN KEY (library_item_id) REFERENCES library_items(id) ON DELETE CASCADE,
    CONSTRAINT ingest_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ingest_queue_library_item_id ON ingest_queue(library_item_id);
CREATE INDEX IF NOT EXISTS idx_ingest_queue_user_id ON ingest_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_ingest_queue_status ON ingest_queue(status);
CREATE INDEX IF NOT EXISTS idx_ingest_queue_priority ON ingest_queue(priority);
CREATE INDEX IF NOT EXISTS idx_ingest_queue_created_at ON ingest_queue(created_at);

-- Comments for documentation
COMMENT ON TABLE practice_profiles IS 'Stores user practice profiles with jurisdictions, practice areas, and preferences';
COMMENT ON TABLE library_locations IS 'Stores storage location configurations (local, OneDrive, Google Drive, S3)';
COMMENT ON TABLE library_items IS 'Stores documents, rules, templates, playbooks, and other legal resources';
COMMENT ON TABLE ingest_queue IS 'Tracks documents pending ingestion into RAG';

