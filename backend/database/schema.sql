-- ============================================================================
-- PHYSIOTHERAPY CLINIC MANAGEMENT SYSTEM
-- PostgreSQL Database Schema
-- Converted from Odoo 19 module (adx_physiotherapy)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient')),
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Medical Specializations (Orthopedic, Sports, Neurological, etc.)
CREATE TABLE IF NOT EXISTS specializations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Working Time Shifts (Morning, Afternoon, Evening)
CREATE TABLE IF NOT EXISTS time_shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    shift_type VARCHAR(20) DEFAULT 'morning' CHECK (shift_type IN ('morning', 'afternoon', 'evening')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_appointments INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Doctors / Physiotherapists Profile
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    specialization_id INTEGER REFERENCES specializations(id) ON DELETE SET NULL,
    registration_no VARCHAR(50),
    date_of_birth DATE,
    experience_years INTEGER DEFAULT 0,
    consultation_fee NUMERIC(10, 2) DEFAULT 500.00,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctor Shifts Junction Table
CREATE TABLE IF NOT EXISTS doctor_shifts (
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    shift_id INTEGER NOT NULL REFERENCES time_shifts(id) ON DELETE CASCADE,
    PRIMARY KEY (doctor_id, shift_id)
);

-- Doctor Working Days (0=Sunday, 1=Monday, ... 6=Saturday)
CREATE TABLE IF NOT EXISTS doctor_working_days (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    day_name VARCHAR(15) NOT NULL
);

-- 5. Patients
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    patient_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(30) NOT NULL,
    date_of_birth DATE,
    age INTEGER,
    gender VARCHAR(15) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    medical_history TEXT,
    allergies TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Treatment Categories (e.g. Electrotherapy, Exercise Therapy, Manual Therapy)
CREATE TABLE IF NOT EXISTS treatment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Medical Treatments
CREATE TABLE IF NOT EXISTS treatments (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES treatment_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Medicines & Frequency
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100),
    form VARCHAR(50), -- Tablet, Gel, Ointment, Capsule, Syrup
    manufacturer VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicine_frequencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g. "1-0-1 (Morning & Night)", "1-1-1 (Thrice daily)"
    pattern VARCHAR(30) NOT NULL,
    times_per_day INTEGER DEFAULT 1,
    description TEXT
);

-- 9. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    appointment_no VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    shift_id INTEGER REFERENCES time_shifts(id) ON DELETE SET NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_end TIMESTAMP WITH TIME ZONE NOT NULL,
    slot_duration VARCHAR(10) DEFAULT '30', -- 15, 30, 60, 120
    urgency VARCHAR(15) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
    patient_category VARCHAR(15) DEFAULT 'new' CHECK (patient_category IN ('new', 'existing')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'done', 'cancelled')),
    consultation_fee NUMERIC(10, 2) DEFAULT 0.00,
    zoom_meeting_url VARCHAR(255),
    clinical_notes TEXT,
    booking_qr TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointment Treatment Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS appointment_treatments (
    appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    treatment_id INTEGER NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
    PRIMARY KEY (appointment_id, treatment_id)
);

-- 10. Medical Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    sequence_no VARCHAR(50) UNIQUE NOT NULL,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    treatment_id INTEGER REFERENCES treatments(id) ON DELETE SET NULL,
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    diagnosis TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'prescribed', 'invoiced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prescription Medicine Lines
CREATE TABLE IF NOT EXISTS prescription_lines (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100), -- e.g. "1-0-1", "1-0-0"
    days INTEGER DEFAULT 5,
    instructions VARCHAR(200) -- e.g. "After Meals", "Before Bed"
);

-- 11. Invoices & Billing
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_lines (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

-- 12. Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'online', 'bank_transfer')),
    transaction_ref VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 13. Clinic Equipment Management
CREATE TABLE IF NOT EXISTS equipments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    model VARCHAR(100),
    serial_no VARCHAR(100) UNIQUE,
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(30) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_order')),
    maintenance_interval_days INTEGER DEFAULT 90,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. X-Ray & Diagnostic Reports
CREATE TABLE IF NOT EXISTS xray_reports (
    id SERIAL PRIMARY KEY,
    report_no VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    test_type VARCHAR(100) NOT NULL, -- e.g. "Cervical Spine X-Ray", "Lumbar Spine MRI"
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    findings TEXT,
    impression TEXT,
    remarks TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Medical Intake Questionnaire
CREATE TABLE IF NOT EXISTS health_questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    is_required BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS patient_questionnaire_answers (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES health_questions(id) ON DELETE CASCADE,
    answer TEXT
);

-- Indexes for optimal lookup & performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
