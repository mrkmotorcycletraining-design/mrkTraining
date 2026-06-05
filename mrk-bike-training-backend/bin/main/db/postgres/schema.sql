-- Postgres DDL for mrk-bike-training
-- Drop tables first (in reverse dependency order)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS trainer_availability CASCADE;
DROP TABLE IF EXISTS financial_ledger CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS schedule_slots CASCADE;
DROP TABLE IF EXISTS client_course_enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS asset_type_config CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;
DROP TABLE IF EXISTS trainer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types (without CASCADE since tables are already dropped)
DROP TYPE IF EXISTS role_enum;
DROP TYPE IF EXISTS asset_type_enum;
DROP TYPE IF EXISTS course_category_enum;
DROP TYPE IF EXISTS schedule_type_enum;
DROP TYPE IF EXISTS schedule_status_enum;
DROP TYPE IF EXISTS enrollment_status_enum;
DROP TYPE IF EXISTS person_type_enum;
DROP TYPE IF EXISTS attendance_status_enum;
DROP TYPE IF EXISTS financial_type_enum;

-- Create types
CREATE TYPE role_enum AS ENUM ('SUPER_ADMIN','ADMIN','TRAINER','CLIENT');
CREATE TYPE asset_type_enum AS ENUM ('NON_GEARED','CRUISER','SPORTS','GEARED','OWN_ASSET','CLASSROOM');
CREATE TYPE course_category_enum AS ENUM ('NORMAL','PREMIUM','TRIP','OTHER');
CREATE TYPE schedule_type_enum AS ENUM ('REGULAR_TRAINING','BUFFER_SESSION','TRIP','MAINTENANCE');
-- PENDING:   client submitted a training request, awaiting Admin/SuperAdmin approval
-- ACTIVE:    Admin/SuperAdmin approved the slot (unified term; replaces old SCHEDULED/CONFIRMED)
-- CANCELLED: slot was rejected by admin or cancelled by client/trainer
CREATE TYPE schedule_status_enum AS ENUM ('PENDING','ACTIVE','CANCELLED');
CREATE TYPE enrollment_status_enum AS ENUM ('ACTIVE','PAUSED','COMPLETED','CANCELLED');
CREATE TYPE person_type_enum AS ENUM ('CLIENT','TRAINER');
CREATE TYPE attendance_status_enum AS ENUM ('PRESENT','ABSENT');
CREATE TYPE financial_type_enum AS ENUM ('INCOME_ENROLLMENT','EXPENSE_TRAINER_SALARY','EXPENSE_ASSET_MAINTENANCE','EXPENSE_MISC');

-- Core tables
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email_username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(1024) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS trainer_profiles (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    start_date DATE,
    salary NUMERIC(12,2),
    is_available BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_trainer_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client_profiles (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    -- unique_id: Admin-defined identifier (can be email or any custom string). Must be unique.
    unique_id VARCHAR(255) UNIQUE,
    -- allowed_num_of_trainings: Max concurrent active/pending enrollments a client may hold.
    --   Only Admin/SuperAdmin can set or change this value; not visible to client.
    allowed_num_of_trainings INTEGER DEFAULT 1,
    date_of_birth DATE,
    profile_picture TEXT,
    height_cm INTEGER,
    weight_kg INTEGER,
    CONSTRAINT fk_client_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    location_address TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_type_config (
    type VARCHAR(255) PRIMARY KEY,
    min_height_req INTEGER,
    max_weight_req INTEGER,
    description VARCHAR(255)
);

INSERT INTO asset_type_config (type, min_height_req, max_weight_req, description) VALUES
    ('ACTIVA', 150, 70, '4.11-5.4 feet, 45-70kg'),
    ('Geared', 161, 85, '5.3-5.10 feet, 55-85kg'),
    ('CruiserAvenger', 150, 100, '4.11 feet onward, 50-100kg'),
    ('Cruiser', 170, 125, '5.6-7 feet, 60-125kg')
ON CONFLICT (type) DO NOTHING;

CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    cc INTEGER,
    color VARCHAR(100),
    next_maintenance_date DATE,
    min_height_req INTEGER,
    min_weight_req INTEGER,
    client_vehicle BOOLEAN DEFAULT FALSE,
    client_vehicle_details VARCHAR(255),
    current_branch_id VARCHAR(255),
    CONSTRAINT fk_asset_branch FOREIGN KEY (current_branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    category course_category_enum,
    hours_per_day INTEGER,
    total_days INTEGER,
    preferred_days_of_week TEXT,
    buffer_days INTEGER DEFAULT 0,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS client_course_enrollments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT,
    course_id VARCHAR(255),
    branch_id VARCHAR(255),
    trainer_id BIGINT,
    asset_id VARCHAR(255),
    total_amount_paid NUMERIC(12,2),
    enrollment_date DATE,
    status enrollment_status_enum,
    buffer_days_allocated INTEGER,
    buffer_days_used INTEGER,
    CONSTRAINT fk_enroll_client FOREIGN KEY (client_id) REFERENCES client_profiles(id),
    CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_enroll_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_enroll_trainer FOREIGN KEY (trainer_id) REFERENCES trainer_profiles(id),
    CONSTRAINT fk_enroll_asset FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE IF NOT EXISTS schedule_slots (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT,
    resource_id VARCHAR(255),
    trainer_id BIGINT,
    client_id BIGINT,
    -- branch_id is intentionally stored as plain text (no FK) because:
    --   • Regular courses  → branches.id (e.g. "400001_MumbaiFort")
    --   • Premium courses  → client's location pincode (e.g. "400050")
    --   • Trip courses     → a Trip ID string
    -- Referential integrity for the Regular-branch case is enforced at the
    -- application layer, not the DB layer, to avoid inserting dummy branch rows.
    branch_id VARCHAR(255),
    title VARCHAR(512),
    start_date_time TIMESTAMP,
    end_date_time TIMESTAMP,
    type schedule_type_enum,
    status schedule_status_enum,
    -- rejection_reason: populated by Admin/SuperAdmin when status is set to CANCELLED
    rejection_reason TEXT,
    CONSTRAINT fk_slot_enrollment FOREIGN KEY (enrollment_id) REFERENCES client_course_enrollments(id),
    CONSTRAINT fk_slot_trainer FOREIGN KEY (trainer_id) REFERENCES trainer_profiles(id),
    CONSTRAINT fk_slot_client FOREIGN KEY (client_id) REFERENCES client_profiles(id)
    -- NOTE: fk_slot_branch intentionally removed; see branch_id comment above
);

CREATE TABLE IF NOT EXISTS attendance_logs (
    id BIGSERIAL PRIMARY KEY,
    slot_id BIGINT,
    person_id VARCHAR(255),
    person_type person_type_enum,
    date_time TIMESTAMP,
    status attendance_status_enum,
    CONSTRAINT fk_att_slot FOREIGN KEY (slot_id) REFERENCES schedule_slots(id)
);

CREATE TABLE IF NOT EXISTS financial_ledger (
    id BIGSERIAL PRIMARY KEY,
    branch_id VARCHAR(255),
    asset_id VARCHAR(255),
    trainer_id BIGINT,
    type financial_type_enum,
    amount NUMERIC(12,2),
    transaction_date DATE,
    CONSTRAINT fk_fin_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_fin_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT fk_fin_trainer FOREIGN KEY (trainer_id) REFERENCES trainer_profiles(id)
);

CREATE TABLE IF NOT EXISTS trainer_availability (
    id                  BIGSERIAL PRIMARY KEY,
    trainer_id          BIGINT NOT NULL,
    branch_id           VARCHAR(255) NOT NULL,
    available_days      VARCHAR(50) NOT NULL,
    slot_start_time     TIME NOT NULL,
    slot_end_time       TIME NOT NULL,
    effective_from      DATE NOT NULL,
    effective_to        DATE,
    is_active           BOOLEAN DEFAULT TRUE,
    audit_start_date_time TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_avail_trainer FOREIGN KEY (trainer_id)
        REFERENCES trainer_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_avail_trainer_branch
    ON trainer_availability(trainer_id, branch_id, is_active);

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread
    ON notifications(user_id, is_read, created_at DESC);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_schedule_resource ON schedule_slots(resource_id);
CREATE INDEX IF NOT EXISTS idx_schedule_trainer ON schedule_slots(trainer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_client ON schedule_slots(client_id);

-- Insert super admin user
-- Password: rohan0202 (hashed using HMAC-SHA256 with app.password.secret)
INSERT INTO users (email_username, password_hash, role, is_active) VALUES
    ('rohan', '40ED3lxolkCp7cHdTJre/+etvk4BletVRVGefxMXpQ0=', 'SUPER_ADMIN', TRUE)
ON CONFLICT (email_username) DO NOTHING;
