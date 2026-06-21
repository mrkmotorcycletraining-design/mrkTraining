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
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS asset_type_config CASCADE;
DROP TABLE IF EXISTS vehicle_type_config CASCADE;
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

-- NOTE: All enum columns use VARCHAR instead of custom Postgres enum types
-- to avoid Hibernate/JPA casting issues. Valid values are enforced at the application layer.

-- Core tables
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
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
    preferred_days VARCHAR(255),
    preferred_time VARCHAR(512),
    preferred_locations TEXT,
    CONSTRAINT fk_trainer_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client_profiles (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    -- allowed_num_of_trainings: Max concurrent active/pending enrollments a client may hold.
    --   Only Admin/SuperAdmin can set or change this value; not visible to client.
    allowed_num_of_trainings INTEGER DEFAULT 1,
    date_of_birth DATE,
    profile_picture TEXT,
    height_ft DOUBLE PRECISION NOT NULL,
    weight_kg INTEGER,
    CONSTRAINT fk_client_user FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    location_address TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_type_config (
    type_id BIGSERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255),
    min_ht_ft DOUBLE PRECISION,
    max_ht_ft DOUBLE PRECISION,
    min_wt INTEGER,
    max_wt INTEGER,
    engine_cc INTEGER,
    is_electric BOOLEAN DEFAULT FALSE,
    mileage INTEGER,
    maintenance_interval_km INTEGER,
    status BOOLEAN DEFAULT TRUE
);

INSERT INTO vehicle_type_config (type, label, min_ht_ft, max_ht_ft, min_wt, max_wt, engine_cc, is_electric, mileage, maintenance_interval_km) VALUES
    ('NON_GEARED', 'Non-Geared (Scooter/Activa)', 4.09, 5.07, 40, 70, 110, FALSE, 50, 5000),
    ('GEARED', 'Geared Motorcycle', 5.01, 6.01, 50, 85, 150, FALSE, 45, 6000),
    ('CRUISER', 'Cruiser', 5.03, 6.05, 55, 125, 220, FALSE, 30, 8000)
ON CONFLICT (type) DO NOTHING;

CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(10) PRIMARY KEY,
    type_id BIGINT NOT NULL,
    name VARCHAR(255),
    color VARCHAR(100),
    next_maintenance_date DATE,
    status VARCHAR(255) DEFAULT 'ACTIVE',
    client_vehicle BOOLEAN DEFAULT FALSE,
    client_vehicle_details VARCHAR(255),
    current_branch_id VARCHAR(255),
    CONSTRAINT fk_vehicle_type FOREIGN KEY (type_id) REFERENCES vehicle_type_config(type_id),
    CONSTRAINT fk_vehicle_branch FOREIGN KEY (current_branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(50),
    hours_per_day INTEGER,
    total_days INTEGER,
    preferred_days_of_week TEXT,
    buffer_days INTEGER DEFAULT 0,
    template_image BYTEA,
    start_date DATE,
    start_time TIME DEFAULT '00:00:00',
    end_date DATE,
    end_time TIME,
    status VARCHAR(50) DEFAULT 'ACTIVE'
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
    status VARCHAR(50),
    buffer_days_allocated INTEGER,
    buffer_days_used INTEGER,
    CONSTRAINT fk_enroll_client FOREIGN KEY (client_id) REFERENCES client_profiles(id),
    CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_enroll_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_enroll_trainer FOREIGN KEY (trainer_id) REFERENCES trainer_profiles(id),
    CONSTRAINT fk_enroll_asset FOREIGN KEY (asset_id) REFERENCES vehicles(id)
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
    type VARCHAR(50),
    status VARCHAR(50),
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
    person_type VARCHAR(50),
    date_time TIMESTAMP,
    status VARCHAR(50),
    CONSTRAINT fk_att_slot FOREIGN KEY (slot_id) REFERENCES schedule_slots(id)
);

CREATE TABLE IF NOT EXISTS financial_ledger (
    id BIGSERIAL PRIMARY KEY,
    branch_id VARCHAR(255),
    asset_id VARCHAR(255),
    trainer_id BIGINT,
    type VARCHAR(100),
    amount NUMERIC(12,2),
    transaction_date DATE,
    CONSTRAINT fk_fin_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_fin_asset FOREIGN KEY (asset_id) REFERENCES vehicles(id),
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
INSERT INTO users (username, password_hash, role, is_active) VALUES
    ('rohan', '40ED3lxolkCp7cHdTJre/+etvk4BletVRVGefxMXpQ0=', 'SUPER_ADMIN', TRUE)
ON CONFLICT (username) DO NOTHING;
