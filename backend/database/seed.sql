-- ============================================================================
-- PHYSIOTHERAPY CLINIC MANAGEMENT SYSTEM
-- PostgreSQL Seed Data
-- ============================================================================

-- 1. Initial Admin & Staff Users (passwords hashed with bcrypt: "password123")
-- Hash for 'password123': $2a$10$wKz0b9f1sQ6cI9g5rG8Lq.Xk6aYgJ7gU/rN6A1pYQ5w8W0hIqKx2m
INSERT INTO users (name, email, password_hash, role, phone) VALUES
('Clinic Administrator', 'admin@physioclinic.com', '$2a$10$wKz0b9f1sQ6cI9g5rG8Lq.Xk6aYgJ7gU/rN6A1pYQ5w8W0hIqKx2m', 'admin', '+91 99000 11000'),
('Dr. Arvind Nair', 'arvind.nair@physioclinic.com', '$2a$10$wKz0b9f1sQ6cI9g5rG8Lq.Xk6aYgJ7gU/rN6A1pYQ5w8W0hIqKx2m', 'doctor', '+91 91234 56789'),
('Dr. Meena Joshi', 'meena.joshi@physioclinic.com', '$2a$10$wKz0b9f1sQ6cI9g5rG8Lq.Xk6aYgJ7gU/rN6A1pYQ5w8W0hIqKx2m', 'doctor', '+91 91234 56780'),
('Kavita Sharma', 'receptionist@physioclinic.com', '$2a$10$wKz0b9f1sQ6cI9g5rG8Lq.Xk6aYgJ7gU/rN6A1pYQ5w8W0hIqKx2m', 'receptionist', '+91 98980 12345'),
('Rahul Mehta', 'rahul.mehta@email.com', '$2a$10$wKz0b9f1sQ6cI9g5rG8Lq.Xk6aYgJ7gU/rN6A1pYQ5w8W0hIqKx2m', 'patient', '+91 98765 43210')
ON CONFLICT (email) DO NOTHING;

-- 2. Specializations
INSERT INTO specializations (name, code, description) VALUES
('Physiotherapist', 'PHYSIO', 'General musculoskeletal, posture correction and rehabilitation'),
('Orthopedic Specialist', 'ORTHO', 'Joint replacement rehabilitation, spine and bone trauma recovery'),
('Sports Rehabilitation Specialist', 'SPORT', 'Athletic injuries, ligament tears, return-to-sport training'),
('Neurological Physiotherapy', 'NEURO', 'Stroke rehabilitation, Parkinson''s, spinal cord injury recovery'),
('Pediatric Physiotherapy', 'PEDIA', 'Developmental delays, pediatric neurological & physical rehabilitation')
ON CONFLICT (name) DO NOTHING;

-- 3. Working Shifts
INSERT INTO time_shifts (name, shift_type, start_time, end_time, max_appointments) VALUES
('Morning Shift', 'morning', '08:00:00', '12:00:00', 12),
('Afternoon Shift', 'afternoon', '13:00:00', '17:00:00', 12),
('Evening Shift', 'evening', '17:30:00', '21:00:00', 10)
ON CONFLICT DO NOTHING;

-- 4. Doctors
INSERT INTO doctors (user_id, name, email, phone, specialization_id, registration_no, date_of_birth, experience_years, consultation_fee, bio) VALUES
(2, 'Dr. Arvind Nair', 'arvind.nair@physioclinic.com', '+91 91234 56789', 1, 'PHYS-78901', '1978-11-10', 15, 600.00, 'Senior Musculoskeletal & Postural Rehabilitation Physiotherapist with 15+ years experience.'),
(3, 'Dr. Meena Joshi', 'meena.joshi@physioclinic.com', '+91 91234 56780', 2, 'ORTHO-45210', '1982-05-30', 12, 750.00, 'Orthopedic Rehabilitation and Joint Mobility Consultant specializing in spine care.')
ON CONFLICT DO NOTHING;

-- Doctor Shifts (Map Doctors to shifts)
INSERT INTO doctor_shifts (doctor_id, shift_id) VALUES
(1, 1),
(1, 2),
(2, 2),
(2, 3)
ON CONFLICT DO NOTHING;

-- Doctor Working Days (Monday to Saturday)
INSERT INTO doctor_working_days (doctor_id, day_of_week, day_name) VALUES
(1, 1, 'Monday'), (1, 2, 'Tuesday'), (1, 3, 'Wednesday'), (1, 4, 'Thursday'), (1, 5, 'Friday'), (1, 6, 'Saturday'),
(2, 1, 'Monday'), (2, 2, 'Tuesday'), (2, 3, 'Wednesday'), (2, 4, 'Thursday'), (2, 5, 'Friday')
ON CONFLICT DO NOTHING;

-- 5. Patients
INSERT INTO patients (user_id, patient_code, name, email, phone, date_of_birth, age, gender, blood_group, address, emergency_contact_name, emergency_contact_phone, medical_history, allergies) VALUES
(5, 'PAT-001', 'Rahul Mehta', 'rahul.mehta@email.com', '+91 98765 43210', '1990-03-15', 36, 'male', 'O+', '402 Sunrise Heights, Ahmedabad', 'Priya Mehta', '+91 98765 43211', 'Lower back pain since 2023, sedentary desk job, lumbar stiffness', 'None'),
(NULL, 'PAT-002', 'Anjali Desai', 'anjali.desai@email.com', '+91 98765 12345', '1985-08-22', 41, 'female', 'B+', '12 Nilkanth Society, Surat', 'Vikram Desai', '+91 98765 12346', 'Sports injury - left knee ACL strain, post arthroscopy rehab', 'Penicillin'),
(NULL, 'PAT-003', 'Hitesh Patel', 'hitesh.patel@email.com', '+91 98250 88990', '1968-12-05', 57, 'male', 'A+', 'B-14 Shivalik Residency, Vadodara', 'Sneha Patel', '+91 98250 88991', 'Frozen shoulder (Adhesive Capsulitis) right shoulder for 4 months', 'Sulfa drugs'),
(NULL, 'PAT-004', 'Pooja Shah', 'pooja.shah@email.com', '+91 94280 55443', '1998-07-19', 28, 'female', 'AB+', '88 Green Park, Gandhinagar', 'Manish Shah', '+91 94280 55444', 'Cervical spondylosis with radiculopathy and neck spasm', 'None')
ON CONFLICT (patient_code) DO NOTHING;

-- 6. Treatment Categories
INSERT INTO treatment_categories (name, code, description) VALUES
('Restorative Therapy', 'RESTORE', 'Joint mobilization, soft tissue therapy, and movement restoration'),
('Rehabilitative Therapy', 'REHAB', 'Post-operative rehabilitation, gait training, electrotherapy'),
('Preventive Therapy', 'PREVENT', 'Ergonomic training, posture correction, strength conditioning'),
('Advanced Modalities', 'ADVANCE', 'Class IV Laser, Tecar Therapy, Shockwave Therapy')
ON CONFLICT (name) DO NOTHING;

-- 7. Treatments
INSERT INTO treatments (category_id, name, description, cost, duration_minutes) VALUES
(1, 'Manual Therapy & Joint Mobilization', 'Hands-on clinical manual manipulation and spinal adjustment', 800.00, 30),
(2, 'Electrotherapy (IFT / TENS / Ultrasound)', 'Pain relief electrical stimulation and deep tissue heating', 500.00, 30),
(1, 'Therapeutic & Strengthening Exercise', 'Targeted resistance and neuromuscular facilitation exercises', 600.00, 45),
(3, 'Postural Assessment & Ergonomic Correction', 'Complete spine biomechanical assessment and counseling', 700.00, 40),
(2, 'Cervical & Lumbar Traction', 'Decompression traction therapy for herniated discs and sciatica', 450.00, 25),
(4, 'Class IV Laser Therapy', 'High-intensity laser biostimulation for rapid tissue healing', 1200.00, 20)
ON CONFLICT DO NOTHING;

-- 8. Medicines & Frequencies
INSERT INTO medicines (name, dosage, form, manufacturer, notes) VALUES
('Thiocolchicoside + Aceclofenac', '100mg + 4mg', 'Tablet', 'Cipla Health', 'Muscle relaxant and NSAID for acute spasm'),
('Calcium Carbonate + Vitamin D3', '500mg + 250IU', 'Tablet', 'Sun Pharma', 'Bone density and recovery supplement'),
('Diclofenac Diethylamine Gel', '1.16% w/w', 'Gel', 'Novartis', 'Topical analgesic anti-inflammatory gel'),
('Pregabalin + Methylcobalamin', '75mg + 750mcg', 'Capsule', 'Lupin Ltd', 'For nerve pain, sciatica, and radiculopathy'),
('Chondroitin + Glucosamine Complex', '500mg + 750mg', 'Tablet', 'Torrent Pharma', 'Joint cartilage repair support')
ON CONFLICT DO NOTHING;

INSERT INTO medicine_frequencies (name, pattern, times_per_day, description) VALUES
('Once daily - Morning', '1-0-0', 1, 'Take once a day in the morning after breakfast'),
('Twice daily - Morning & Night', '1-0-1', 2, 'Take after food in the morning and after dinner'),
('Thrice daily - Morning, Noon & Night', '1-1-1', 3, 'Take three times a day with meals'),
('Once daily - Night (Bedtime)', '0-0-1', 1, 'Take at bedtime after light meal'),
('As needed (SOS for pain)', 'S-O-S', 1, 'Only when severe pain or spasm occurs')
ON CONFLICT DO NOTHING;

-- 9. Sample Appointments
INSERT INTO appointments (appointment_no, patient_id, doctor_id, shift_id, appointment_date, appointment_end, slot_duration, urgency, patient_category, status, consultation_fee, clinical_notes) VALUES
('APP-2026-001', 1, 1, 1, CURRENT_DATE + INTERVAL '10 hours', CURRENT_DATE + INTERVAL '10 hours 30 minutes', '30', 'normal', 'existing', 'confirmed', 600.00, 'Follow-up for lower back pain. Lumbar range of motion check.'),
('APP-2026-002', 2, 2, 2, CURRENT_DATE + INTERVAL '14 hours', CURRENT_DATE + INTERVAL '14 hours 30 minutes', '30', 'urgent', 'existing', 'in_progress', 750.00, 'Left knee ACL rehabilitation session. Quadriceps lag test.'),
('APP-2026-003', 3, 1, 1, CURRENT_DATE - INTERVAL '1 day' + INTERVAL '11 hours', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '11 hours 30 minutes', '30', 'normal', 'new', 'done', 600.00, 'Right frozen shoulder evaluation. Passive abduction limited to 60 degrees.'),
('APP-2026-004', 4, 2, 2, CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours', CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours 30 minutes', '30', 'normal', 'new', 'draft', 750.00, 'Initial cervical radiculopathy consultation.')
ON CONFLICT (appointment_no) DO NOTHING;

-- 10. Sample Prescription for completed appointment
INSERT INTO prescriptions (sequence_no, appointment_id, patient_id, doctor_id, treatment_id, prescription_date, diagnosis, notes, status) VALUES
('RX-2026-001', 3, 3, 1, 1, CURRENT_DATE - INTERVAL '1 day', 'Right Shoulder Adhesive Capsulitis (Phase 2 - Freezing Stage)', 'Avoid heavy overhead lifting. Perform pendulum exercises 3 times daily.', 'prescribed')
ON CONFLICT (sequence_no) DO NOTHING;

INSERT INTO prescription_lines (prescription_id, medicine_name, dosage, frequency, days, instructions) VALUES
(1, 'Thiocolchicoside + Aceclofenac', '100mg + 4mg', '1-0-1', 7, 'After meals'),
(1, 'Diclofenac Diethylamine Gel', 'Apply gentle layer', '1-0-1', 10, 'Apply on right shoulder without vigorous massage'),
(1, 'Pregabalin + Methylcobalamin', '75mg + 750mcg', '0-0-1', 14, 'At bedtime with water')
ON CONFLICT DO NOTHING;

-- 11. Sample Invoices & Payments
INSERT INTO invoices (invoice_no, appointment_id, prescription_id, patient_id, doctor_id, subtotal, tax, discount, total_amount, paid_amount, status, due_date, notes) VALUES
('INV-2026-001', 3, 1, 3, 1, 1400.00, 70.00, 0.00, 1470.00, 1470.00, 'paid', CURRENT_DATE, 'Consultation fee (600) + Manual Therapy (800) + 5% GST'),
('INV-2026-002', 2, NULL, 2, 2, 750.00, 0.00, 0.00, 750.00, 0.00, 'unpaid', CURRENT_DATE + INTERVAL '7 days', 'Consultation fee for urgent knee rehab session')
ON CONFLICT (invoice_no) DO NOTHING;

INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, total_price) VALUES
(1, 'Consultation Fee - Dr. Arvind Nair', 1, 600.00, 600.00),
(1, 'Manual Therapy & Joint Mobilization', 1, 800.00, 800.00),
(2, 'Consultation Fee - Dr. Meena Joshi', 1, 750.00, 750.00)
ON CONFLICT DO NOTHING;

INSERT INTO payments (payment_no, invoice_id, amount, payment_method, transaction_ref, notes) VALUES
('PAY-2026-001', 1, 1470.00, 'upi', 'UPI-REF-9028127391', 'Paid via GooglePay at clinic desk')
ON CONFLICT (payment_no) DO NOTHING;

-- 12. Clinic Equipment Tracking
INSERT INTO equipments (name, model, serial_no, purchase_date, warranty_expiry, status, maintenance_interval_days, last_maintenance_date, next_maintenance_date, notes) VALUES
('Chattanooga Intelect Legend Ultrasound', 'INT-400-US', 'SN-CHATT-2023-881', '2023-04-10', '2026-04-10', 'available', 90, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 'Dual frequency 1MHz/3MHz transducer head calibrated'),
('Digital Cervical & Lumbar Traction Unit', 'TRAC-ELITE-9', 'SN-TRAC-2022-419', '2022-08-15', '2025-08-15', 'available', 60, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days', 'Safety release cord and harness inspected and working smoothly'),
('4-Channel Combo IFT & TENS Therapy Machine', 'COMBO-PRO-4CH', 'SN-ELECTRO-2024-102', '2024-01-20', '2027-01-20', 'available', 90, CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE + INTERVAL '50 days', 'All 4 cable leads and rubber electrode pads replaced')
ON CONFLICT (serial_no) DO NOTHING;

-- 13. X-Ray & Diagnostic Reports
INSERT INTO xray_reports (report_no, patient_id, doctor_id, test_type, report_date, findings, impression, remarks) VALUES
('XRAY-2026-001', 1, 1, 'Digital X-Ray Lumbar Spine (AP & Lateral)', CURRENT_DATE - INTERVAL '5 days', 'Mild disc space narrowing at L4-L5 and L5-S1. No bony fracture or spondylolisthesis seen. Normal lordosis maintained.', 'Early degenerative disc disease at L4-S1 levels. Suitable for conservative physiotherapy and core strengthening.', 'Correlate with clinical straight-leg raise test.'),
('XRAY-2026-002', 3, 1, 'Right Shoulder AP & Axillary View X-Ray', CURRENT_DATE - INTERVAL '2 days', 'Subacromial space mildly reduced. Mild osteophytic spurring at acromioclavicular joint. Glenohumeral joint alignment is anatomical.', 'Features consistent with subacromial impingement and periarthritis / adhesive capsulitis.', 'Advised ultrasound therapy and mobilization.')
ON CONFLICT (report_no) DO NOTHING;

-- 14. Health Intake Questions
INSERT INTO health_questions (question, category, is_required) VALUES
('Do you experience radiating pain, numbness, or tingling down your arms or legs?', 'Neurological', TRUE),
('Have you had any prior orthopedic surgeries or joint replacements?', 'Surgical History', TRUE),
('Do you have high blood pressure, diabetes, or a cardiac pacemaker?', 'General Medical', TRUE),
('What aggravated your symptoms (e.g. prolonged sitting, bending, walking)?', 'Functional Impairment', FALSE)
ON CONFLICT DO NOTHING;
