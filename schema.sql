-- PostgreSQL Schema for Tipper Server
-- Migration from MongoDB to PostgreSQL

-- Create course_progress table
CREATE TABLE IF NOT EXISTS course_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    course_id VARCHAR(255) NOT NULL,
    completed_lessons INTEGER[] DEFAULT '{}',
    last_watched INTEGER DEFAULT 0,
    progress NUMERIC(5,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- Create index on user_id and course_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON course_progress(user_id, course_id);

-- Create points table
CREATE TABLE IF NOT EXISTS points (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    points INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);

-- Create droptips table
CREATE TABLE IF NOT EXISTS droptips (
    id SERIAL PRIMARY KEY,
    droptip_id VARCHAR(255) NOT NULL UNIQUE,
    droptip JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on droptip_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_droptips_id ON droptips(droptip_id);

-- Create index on droptip.available for faster queries
CREATE INDEX IF NOT EXISTS idx_droptips_available ON droptips USING gin ((droptip -> 'available'));

-- Create members table (for wallet storage)
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    iv VARCHAR(255) NOT NULL,
    s TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
