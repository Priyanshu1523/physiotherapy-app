# PhysioCare — Full-Stack Physiotherapy Clinic Management System & Healthcare ERP

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0.1-646C9A?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

> **PhysioCare** is an enterprise-grade Physiotherapy Clinic Management System and Healthcare ERP. Migrated and re-engineered from the **Odoo 19 `sp_physiotherapy`** Python module by **Supriya Technology** into a modern, lightning-fast **PERN (PostgreSQL, Express, React, Node.js)** full-stack architecture.

---

## 📑 Table of Contents

- [Key Highlights](#-key-highlights)
- [System Architecture](#-system-architecture)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Clinical Modules & Workflows](#-clinical-modules--workflows)
- [Public Patient Portal & Website](#-public-patient-portal--website)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start (Single Command)](#quick-start-single-command)
  - [Running Backend & Frontend Separately](#running-backend--frontend-separately)
- [PostgreSQL Database Setup](#-postgresql-database-setup)
- [Pre-configured Demo Accounts](#-pre-configured-demo-accounts)
- [Odoo 19 to PERN Feature Parity Matrix](#-odoo-19-to-pern-feature-parity-matrix)
- [REST API Reference](#-rest-api-reference)
- [Print Engine & Slips](#-print-engine--slips)
- [License](#-license)

---

## 🌟 Key Highlights

- **Complete Odoo 19 Parity**: Fully translates Odoo's clinical data models, business rules, shift booking logic, prescription maker, and tax invoicing to modern JavaScript and SQL.
- **Modern Public Website**: Premium clinic showcase featuring therapy services, verified patient reviews, interactive treatment catalogs, and a dynamic shift-based appointment reservation engine.
- **Strict Role-Based Security (RBAC)**: Unauthenticated visitor wall with role-tailored dashboards for **Administrator**, **Doctor (Physiotherapist)**, **Receptionist**, and **Patient**.
- **Contactless QR Workflows**: Mobile appointment booking QR codes and high-speed reception QR check-in simulator.
- **Resilient Dual-Mode Data Layer**: Built-in reactive fallback store guarantees seamless operation out of the box, with full persistence when connected to PostgreSQL.
- **Browser-Native Clinical Printing**: Pixel-perfect printable Appointment Slips, Official Rx Letterheads, and itemized GST Tax Invoices.

---

## 🏗 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / BROWSER TIER                           │
│  ┌─────────────────────────────┐    ┌────────────────────────────────┐ │
│  │   Public Clinic Website     │    │   PhysioCare ERP Admin Portal  │ │
│  │   - Treatment Showcase      │    │   - Clinical Dashboard (KPIs)  │ │
│  │   - Dynamic Slot Booking    │    │   - Role-Based Module Access   │ │
│  │   - Mobile Booking QR Modal │    │   - Real-time Patient Queue    │ │
│  └─────────────────────────────┘    └────────────────────────────────┘ │
│                  React 18 + Vite + Lucide Icons + CSS                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON API (REST)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API & BACKEND TIER                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Express 5 REST API Server (Port :5000)                          │  │
│  │  ├── /api/auth          ├── /api/prescriptions                   │  │
│  │  ├── /api/dashboard     ├── /api/treatments & medicines          │  │
│  │  ├── /api/doctors       ├── /api/billing                         │  │
│  │  ├── /api/patients      ├── /api/equipments                      │  │
│  │  ├── /api/appointments  ├── /api/xray-reports & shifts           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Connection Pool & Resilient Fallback Store           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQL (node-postgres)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATABASE TIER                                   │
│  PostgreSQL 14+ Relational Database (schema.sql & seed.sql)            │
│  [users, doctors, patients, appointments, prescriptions, invoices, ...]│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Role-Based Access Control (RBAC)

The application enforces strict role segregation aligned with Odoo's security groups (`sp_physiotherapy/security/physiotherapy_groups.xml`):

| Role | Accessible Modules | Core Responsibilities |
| :--- | :--- | :--- |
| 🛡️ **Administrator** | All Modules (`Dashboard`, `Appointments`, `Patients`, `Doctors`, `Prescriptions`, `Treatments`, `Medicines`, `Billing`, `Equipments`, `X-Ray`, `Users & Roles`) | System governance, role assignments, financial audit, staff onboarding, clinic configuration. |
| 🩺 **Doctor (Physiotherapist)** | `Dashboard`, `Appointments`, `Patients`, `Prescriptions (Rx)`, `Treatments`, `Medicines`, `Equipments`, `X-Ray Reports` | Patient evaluations, medical intake review, treatment execution, issuing prescriptions, viewing radiology. |
| 📋 **Receptionist** | `Dashboard`, `Appointments`, `Patients`, `Billing & Invoices`, `Doctors & Staff`, `Equipments` | Patient registration, shift-based appointment scheduling, QR code check-in, invoice cashiering. |
| 👤 **Patient** | `Public Portal`, `My Bookings`, `My Medical History`, `Invoices & Receipts` | Online slot booking, personal consultation history, downloading Rx slips and payment receipts. |

---

## 🏥 Clinical Modules & Workflows

### 1. Dynamic Appointment & Shift Scheduling Engine
- Implements Odoo's `appointment_booking.py` time calculation.
- Automatically calculates 30-minute available slots based on doctor working days and assigned shifts (`Morning: 09:00 - 13:00`, `Evening: 16:00 - 20:00`).
- Prevents overlapping bookings and double-allocations.
- Full clinical lifecycle state machine:
  $$\text{Draft} \longrightarrow \text{Confirmed} \longrightarrow \text{In Progress} \longrightarrow \text{Done} \longrightarrow \text{Invoiced}$$

### 2. Patient Directory & Medical Intake Questionnaire
- Replaces Odoo's `medical.questionnaire` and `res.partner` patient extensions.
- Captures primary complaints, pain intensity scale ($1-10$), symptom duration, surgical history, trauma incidents, ongoing medications, and blood group.

### 3. Prescription (Rx) Studio & Medication Regimen
- Multi-line medication prescription matching `medical.prescription` and `medical.prescription.line`.
- Structured dosages (e.g., `1-0-1`, `0-1-0`), administration timing (Before/After meals), duration in days, and doctor's lifestyle advice.
- Direct 1-click bridge from Prescriptions to Accounts for instant billing.

### 4. Medicines Catalog (`medical.medicine`)
- Comprehensive pharmacy catalog with dosage forms (Tablet, Capsule, Topical Gel, Spray, Syrup).
- Tracks dosage strength, manufacturer, therapeutic category, and unit retail price.

### 5. Physiotherapy Treatments & Modalities
- Modality catalog featuring Cryotherapy, Therapeutic Ultrasound, Interferential Therapy (IFT), Cervical/Lumbar Traction, Class IV Laser, and Post-Operative Kinesiotherapy.
- Standard session durations, contraindication warnings, and unit pricing.

### 6. Billing, GST Invoicing & Payment Collection
- Automated invoice creation upon appointment completion (`account.move` parity).
- Calculates CGST ($9\%$) and SGST ($9\%$), handles partial/full payments via Cash, Card, or UPI, and generates official tax receipts.

### 7. Therapy Equipment & Calibration Tracking
- Monitors physical therapy devices (Shortwave Diathermy, Traction tables, TENS units).
- Tracks calibration dates, operating status, maintenance history, and serial numbers.

### 8. Radiology & X-Ray Reports
- Digital storage of radiology evaluations with clinical diagnosis, radiologist details, scan dates, and findings.

---

## 🌐 Public Patient Portal & Website

Designed for clinic patients and online visitors:
- **Hero & Trust Indicators**: High-resolution clinical imagery, verified patient satisfaction metrics, emergency helpline, and clinic location.
- **Clinical Pillars**: Targeted recovery programs for Sports Injury, Post-Surgical Rehab, Spine & Joint Care, and Neuro Rehabilitation.
- **Online Booking Engine**: Instant 3-step appointment scheduling with real-time doctor availability.
- **Mobile QR Booking Modal**: Generate dynamic QR codes for mobile browser reservations.
- **Patient Verification & Intake**: Seamless new patient onboarding with instant account provisioning.

---

## 📁 Project Directory Structure

```text
Physiotherapy_app/
│
├── backend/                             # Node.js + Express + PostgreSQL REST API
│   ├── database/
│   │   ├── schema.sql                   # Complete PostgreSQL DDL (Tables, Indexes, Constraints)
│   │   ├── seed.sql                     # Production-grade clinical seed data from Odoo 19
│   │   └── initDb.js                    # Automated DB migration and seeding script
│   ├── src/
│   │   ├── db.js                        # Resilient PostgreSQL connection pool & memory fallback
│   │   ├── server.js                    # Express app configuration & middleware
│   │   └── routes/
│   │       ├── auth.js                  # Login, registration, RBAC, user management
│   │       ├── dashboard.js             # Clinical KPI metrics & revenue aggregation
│   │       ├── doctors.js               # Doctors directory & dynamic slot calculation
│   │       ├── patients.js              # Patient records & medical intake questionnaires
│   │       ├── appointments.js          # Appointment lifecycle & status transitions
│   │       ├── prescriptions.js         # Prescription maker (Rx) & medication regimens
│   │       ├── treatments.js            # Modalities, procedures & medicines catalog
│   │       ├── billing.js               # GST invoices, cashiering & payment tracking
│   │       ├── equipments.js            # Clinic machinery maintenance & calibration
│   │       ├── xrayReports.js           # Radiological imaging reports & diagnostics
│   │       └── shifts.js                # Doctor morning/evening clinical shifts
│   ├── .env                             # Environment variables & DB credentials
│   └── package.json
│
├── frontend/                            # React 18 + Vite Client Application
│   ├── src/
│   │   ├── api.js                       # Centralized HTTP client with reactive fallback state
│   │   ├── components/
│   │   │   ├── Sidebar.jsx              # Role-filtered ERP navigation sidebar
│   │   │   └── Header.jsx               # Role switcher, user status, quick links
│   │   ├── views/
│   │   │   ├── WebsiteView.jsx          # Public Clinic Website & Patient Portal
│   │   │   ├── DashboardView.jsx        # Clinical overview, quick actions, today's queue
│   │   │   ├── AppointmentsView.jsx     # Shift-based slot booking & appointment slips
│   │   │   ├── PatientsView.jsx         # Patient directory & medical intake charts
│   │   │   ├── DoctorsView.jsx          # Doctor profiles, consulting fees & shift roster
│   │   │   ├── PrescriptionsView.jsx    # Rx studio, dosage regimens & printable letterheads
│   │   │   ├── MedicinesView.jsx        # Pharmacy catalog (medical.medicine)
│   │   │   ├── TreatmentsView.jsx       # Physical therapy treatment modalities
│   │   │   ├── BillingView.jsx          # GST tax invoices & official thermal receipts
│   │   │   ├── EquipmentsView.jsx       # Equipment readiness & maintenance logger
│   │   │   ├── XrayReportsView.jsx      # Diagnostic X-ray records & findings
│   │   │   └── UsersRolesView.jsx       # Administrator RBAC control console
│   │   ├── App.jsx                      # App root, authentication gate & view router
│   │   ├── index.css                    # Modern UI styles, animations & print formatting
│   │   └── main.jsx
│   ├── vite.config.js                   # Vite config with backend proxy (:5000)
│   └── package.json
│
├── Physiotherapy_app/                   # Original Odoo 19 module (preserved for reference)
├── README.md                            # Project documentation
└── package.json                         # Root orchestration package scripts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- *(Optional)* [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

> **Note**: PhysioCare contains an automatic **in-memory fallback store**. You can start exploring the frontend and backend immediately, even before configuring PostgreSQL!

---

### Quick Start (Single Command)

From the project root directory, install all dependencies and launch both servers simultaneously:

```bash
# 1. Install root, backend, and frontend dependencies
npm run install:all

# 2. Launch both Backend (:5000) and Frontend (:3000) concurrently
npm run dev
```

Open your browser at **`http://localhost:3000`** to access the clinic system.

---

### Running Backend & Frontend Separately

If you prefer running the servers in separate terminal tabs:

#### Terminal 1 — Backend API
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`.*

#### Terminal 2 — Frontend UI
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🐘 PostgreSQL Database Setup

To connect the application to a local or cloud PostgreSQL database:

### 1. Configure Environment Variables
Edit `backend/.env` with your database credentials:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL Database Configuration
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=physiotherapy_db

# Security
JWT_SECRET=supersecret_physiocare_jwt_token_2026
```

### 2. Run Database Migration & Seeding
Execute the automated database initializer from the root directory:

```bash
npm run db:init
```

This will automatically:
1. Connect to PostgreSQL and create the `physiotherapy_db` database if it doesn't exist.
2. Execute `backend/database/schema.sql` to generate all relational tables, primary/foreign keys, and performance indexes.
3. Execute `backend/database/seed.sql` to populate comprehensive demo doctors, patients, shifts, treatments, medicines, appointments, and invoices.

---

## 👥 Pre-configured Demo Accounts

Use any of these seeded credentials to test different system roles:

| Role | Full Name | Email Address | Password | Accessible Views |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | System Admin | `admin@physioclinic.com` | `password123` | Full ERP Access, RBAC Console, Audit Reports |
| **Doctor** | Dr. Arvind Nair | `arvind.nair@physioclinic.com` | `password123` | Appointments, Clinical Intake, Rx Maker, Radiology |
| **Doctor** | Dr. Meena Joshi | `meena.joshi@physioclinic.com` | `password123` | Appointments, Clinical Intake, Rx Maker, Radiology |
| **Receptionist** | Reception Desk | `receptionist@physioclinic.com` | `password123` | Booking Roster, Check-In, Patient Entry, Invoices |
| **Patient** | Rahul Mehta | `rahul.mehta@email.com` | `password123` | Public Website, My Bookings, My Invoices, My Rx |

> **Pro-Tip**: Within the ERP top navigation bar, you can also use the **Active Role dropdown** to instantly switch roles without re-logging in during testing and presentations!

---

## 🔄 Odoo 19 to PERN Feature Parity Matrix

| Odoo 19 Model (`sp_physiotherapy`) | Node.js Backend Route | PostgreSQL Table | React 18 View Component | Status |
| :--- | :--- | :--- | :--- | :---: |
| `physiotherapy.appointment` | `/api/appointments` | `appointments` | `AppointmentsView.jsx` | ✅ Completed |
| `medical.physiotherapist` | `/api/doctors` | `doctors` | `DoctorsView.jsx` | ✅ Completed |
| `res.partner` (Patients) | `/api/patients` | `patients` | `PatientsView.jsx` | ✅ Completed |
| `medical.questionnaire` | `/api/patients/:id` | `patients.questionnaire` | `PatientsView.jsx` (Intake Modal) | ✅ Completed |
| `medical.prescription` | `/api/prescriptions` | `prescriptions` | `PrescriptionsView.jsx` | ✅ Completed |
| `medical.prescription.line` | `/api/prescriptions` | `prescription_lines` | `PrescriptionsView.jsx` (Table) | ✅ Completed |
| `medical.medicine` | `/api/treatments/medicines` | `medicines` | `MedicinesView.jsx` | ✅ Completed |
| `treatment.treatment` | `/api/treatments` | `treatments` | `TreatmentsView.jsx` | ✅ Completed |
| `account.move` (Invoicing) | `/api/billing` | `invoices`, `payments` | `BillingView.jsx` | ✅ Completed |
| `medical.equipment` | `/api/equipments` | `equipments` | `EquipmentsView.jsx` | ✅ Completed |
| `medical.xray` | `/api/xray-reports` | `xray_reports` | `XrayReportsView.jsx` | ✅ Completed |
| `physiotherapy.shift` | `/api/shifts` | `shifts` | `AppointmentsView.jsx` | ✅ Completed |
| Website Online Booking | `/api/appointments/portal` | `appointments` | `WebsiteView.jsx` | ✅ Completed |

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | No |
| `POST` | `/api/auth/register` | Patient registration & onboarding | No |
| `GET` | `/api/auth/users` | List all system users & assignable roles | Yes (Admin) |
| `GET` | `/api/dashboard/stats` | Aggregate clinic KPIs, today's queue & revenue | Yes |
| `GET` | `/api/doctors` | Retrieve doctor directory with shifts & fees | No |
| `GET` | `/api/doctors/:id/available-slots` | Calculate dynamic 30-min available slots | No |
| `GET` | `/api/patients` | Query patient directory with medical history | Yes |
| `POST` | `/api/patients` | Register new patient with intake questionnaire | Yes |
| `GET` | `/api/appointments` | List appointments filtered by date/doctor/status | Yes |
| `POST` | `/api/appointments` | Create appointment & reserve slot | Yes |
| `PUT` | `/api/appointments/:id/status` | Transition status (`confirmed`, `in_progress`, `done`) | Yes |
| `GET` | `/api/prescriptions` | List patient prescriptions with medicine lines | Yes |
| `POST` | `/api/prescriptions` | Generate medical prescription with dosages | Yes (Doctor) |
| `GET` | `/api/treatments/medicines` | List pharmacy medicines catalog | Yes |
| `POST` | `/api/treatments/medicines` | Add new medicine to inventory | Yes (Admin/Doctor) |
| `GET` | `/api/billing/invoices` | List invoices with GST breakdowns & payments | Yes |
| `POST` | `/api/billing/invoices` | Generate new tax invoice | Yes |
| `POST` | `/api/billing/invoices/:id/pay` | Record payment against invoice | Yes |
| `GET` | `/api/payment/config` | Retrieve merchant UPI VPA & gateway keys | No |
| `POST` | `/api/payment/create-order` | Generate dynamic UPI payment QR code & order ID | No |
| `POST` | `/api/payment/verify` | Verify UPI / Card / NetBanking payment & issue receipt | No |
| `GET` | `/api/equipments` | List therapy devices & maintenance alerts | Yes |
| `GET` | `/api/xray-reports` | List radiological imaging assessments | Yes |

---

## 💳 Payment Gateway & Cashiering System

PhysioCare incorporates an omnichannel healthcare payment engine supporting both online self-checkout and reception desk cashiering:
1. **Dynamic Scannable UPI QR Codes**: Generates real-time, order-specific UPI deep-links scannable by Google Pay, PhonePe, Paytm, and BHIM with 15-minute expiration timers and auto-verification.
2. **Credit & Debit Cards**: 256-Bit SSL encrypted card terminal simulation compatible with Razorpay and Stripe schemas with auto-formatting card number inputs and visual card previews.
3. **Net Banking**: Instant integration with leading Indian retail banks (HDFC, ICICI, SBI, Axis, Kotak, PNB).
4. **Reception Cash Desk**: Change return calculator, cashier notes, and immediate thermal receipt printing.
5. **Configurable Environment Variables**: Easily swap test credentials with live production merchant keys via `backend/.env` and `frontend/.env`.

---

## 🖨 Print Engine & Slips

PhysioCare incorporates clean, print-media CSS layouts tailored for clinic stationery:
1. **Appointment Check-in Slips**: Compact thermal/A5 layout containing appointment ID, assigned physiotherapist, scheduled shift, and verification QR code.
2. **Official Rx Prescription Slips**: Clinic letterhead header, doctor's registration number, patient vital stats, structured medicine tables (`Frequency`, `Timing`, `Duration`), therapy advice, and signature line.
3. **GST Tax Invoices**: Itemized charges for doctor consultations and therapy modalities, CGST + SGST tax breakdown, and paid/balance status.

---

## 📄 License

This project is licensed under the **ISC License**. Developed as an enterprise conversion of the Odoo 19 `sp_physiotherapy` module by Supriya Technology into a full-stack PERN application.
