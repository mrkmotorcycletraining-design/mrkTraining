-- Postgres DDL for mrk-bike-training
-- Enums
DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('SUPER_ADMIN','ADMIN','TRAINER','CLIENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE asset_type_enum AS ENUM ('NON_GEARED','CRUISER','SPORTS','GEARED','OWN_ASSET','CLASSROOM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE course_category_enum AS ENUM ('NORMAL','PREMIUM','TRIP','OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE schedule_type_enum AS ENUM ('REGULAR_TRAINING','BUFFER_SESSION','TRIP','MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE schedule_status_enum AS ENUM ('SCHEDULED','CONFIRMED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE enrollment_status_enum AS ENUM ('ACTIVE','PAUSED','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE person_type_enum AS ENUM ('CLIENT','TRAINER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status_enum AS ENUM ('PRESENT','ABSENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE financial_type_enum AS ENUM ('INCOME_ENROLLMENT','EXPENSE_TRAINER_SALARY','EXPENSE_ASSET_MAINTENANCE','EXPENSE_MISC');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Core tables
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email_username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(1024) NOT NULL,
    role role_enum NOT NULL,
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
    preferred_days_of_week TEXT
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
    branch_id VARCHAR(255),
    title VARCHAR(512),
    start_date_time TIMESTAMP,
    end_date_time TIMESTAMP,
    type schedule_type_enum,
    status schedule_status_enum,
    CONSTRAINT fk_slot_enrollment FOREIGN KEY (enrollment_id) REFERENCES client_course_enrollments(id),
    CONSTRAINT fk_slot_trainer FOREIGN KEY (trainer_id) REFERENCES trainer_profiles(id),
    CONSTRAINT fk_slot_client FOREIGN KEY (client_id) REFERENCES client_profiles(id),
    CONSTRAINT fk_slot_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
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

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_schedule_resource ON schedule_slots(resource_id);
CREATE INDEX IF NOT EXISTS idx_schedule_trainer ON schedule_slots(trainer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_client ON schedule_slots(client_id);
