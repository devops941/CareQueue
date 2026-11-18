# 🏥 CareQueue — Clinic Patient Waiting-Time Intelligence & Service Flow Analysis

> **ARRIVAL → QUEUE → SERVICE → INSIGHT**  
> An enterprise-grade clinic operations intelligence and queue simulation platform that transforms raw clinical outpatient timestamps into trustworthy waiting-time measures, pinpoints operational bottlenecks, and enables healthcare managers to evaluate staffing and arrival policies via discrete-event simulation.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Core Problem & Project Objectives](#-core-problem--project-objectives)
3. [System Architecture & Operational Lifecycle](#-system-architecture--operational-lifecycle)
4. [Exhaustive Module Breakdown](#-exhaustive-module-breakdown)
5. [Mathematical & Queue Analytics Engine](#-mathematical--queue-analytics-engine)
6. [SimPy Discrete-Event Simulation Workbench](#-simpy-discrete-event-simulation-workbench)
7. [Technology Stack](#-technology-stack)
8. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
9. [Step-by-Step Installation & Run Guide](#-step-by-step-installation--run-guide)
10. [Database Management & Utility Scripts](#-database-management--utility-scripts)
11. [Sample Datasets & Ingestion Testing](#-sample-datasets--ingestion-testing)
12. [Default Credentials & Role-Based Access Control](#-default-credentials--role-based-access-control)

---

## 🌟 Project Overview

Modern outpatient clinics and hospital ambulatory departments frequently suffer from **unpredictable patient surges, extended queue delays, and staff burnout**. Traditional electronic health record (EHR) systems store timestamps but fail to convert them into actionable operational intelligence.

**CareQueue** bridges this critical healthcare gap by providing:
- **Mathematical Waiting-Time Decomposition:** Splits patient stay into precise milestones ($\text{Arrival} \to \text{Registration} \to \text{Queue Wait} \to \text{Consultation} \to \text{Departure}$).
- **24-Hour Time-Slot Congestion Heatmaps:** Identifies recurring weekly bottleneck hours with pressure index scoring.
- **Monte Carlo Queue Simulation (SimPy):** Enables stochastic "What-if?" capacity planning before deploying costly clinical resources.
- **Batch Dataset Importer:** Intelligent fuzzy column auto-mapping and chronological schema ingestion for historical HMS exports.
- **Executive Operations Dashboard:** Real-time KPI command strips, Triage Donut/Pie charts, Departmental Consultation SLA comparisons, and recent patient flow tokens.

---

## 🎯 Core Problem & Project Objectives

### The Outpatient Problem:
1. **Hidden Waiting Delays:** Clinics only track total arrival to departure, hiding whether delays occur at registration, the consultation queue, or diagnostic delays.
2. **Stochastic Arrival Clustering:** Patients do not arrive uniformly; unmanaged morning surges overwhelm consultation capacity.
3. **Mismatched Staff Rostering:** Specializations operate with static shifts that fail to align with empirical peak demand windows.
4. **Trial-and-Error Staffing:** Adding doctors or nurses without predictive modeling is costly and often shifts bottlenecks rather than resolving them.

### Project Objectives:
* ✅ **Standardize Waiting-Time Metrics:** Compute validated mean, median, P90 percentile wait times, and SLA compliance across clinical departments.
* ✅ **Pinpoint Exact Bottleneck Windows:** Detect peak load windows (e.g., *Wednesdays at 11:00 AM*) using 24h heatmaps.
* ✅ **Simulate Alternative Staffing Policies:** Use SimPy discrete-event simulation with 95% Confidence Intervals to quantify the exact queue reduction of adding $+1$ doctor.
* ✅ **Provide Resilient Data Ingestion:** Auto-detect and ingest raw hospital CSV/Excel files while enforcing chronological timestamp validation.
* ✅ **Ensure Compliance & Security:** Maintain an immutable append-only audit trail tracking every staff login, patient token, and simulation run.

---

## 🔄 System Architecture & Operational Lifecycle

The system operates across a 5-stage closed-loop operational pipeline:

```mermaid
flowchart TD
    subgraph Stage 1: Facility Infrastructure
        A["Clinic Profile & Settings<br/>(Hours, Shifts, Timezone)"] --> B["Specializations & Departments<br/>(GEN, CARD, PED, ORTHO)"]
        B --> C["Doctors Roster<br/>(Duty Shifts & Target SLAs)"]
    end

    subgraph Stage 2: Patient Flow Ingestion
        C --> D["Data Ingestion Hub"]
        D -->|Batch HMS Export| E["Batch Dataset Importer<br/>(.csv, .xlsx Auto-Mapping)"]
        D -->|Live Reception Desk| F["Visit Records & Token Queue<br/>(+ Record Patient Visit)"]
    end

    subgraph Stage 3: Operational Analytics Engine
        E --> G["MongoDB Atlas Cloud<br/>(ISODate Unified Store)"]
        F --> G
        G --> H["Mathematical Waiting-Time Engine<br/>(Reg Wait, Queue Wait, Service Duration)"]
        H --> I["Historical Trends & Percentiles<br/>(Mean, Median, P90 SLA)"]
        H --> J["24h Time-Slot Heatmap<br/>(Weekly Service Demand Matrix)"]
    end

    subgraph Stage 4: Stochastic Simulation
        J --> K["SimPy Queue Simulation Workbench<br/>(Monte Carlo Discrete-Event Engine)"]
        K --> L["Capacity Scenario Analysis<br/>(Doctor Scaling & 95% CI)"]
    end

    subgraph Stage 5: Executive Intelligence
        I --> M["Executive Operations Dashboard<br/>(Donut Pie, SLA Bar, Area Flow)"]
        J --> M
        L --> M
        M --> N["Executive SLA Reports & Compliance Exports<br/>(Formal PDF / CSV Audits)"]
    end
```

---

## 📦 Exhaustive Module Breakdown

### 1. First-Time Hospital Onboarding Wizard (`/onboarding`)
* **Purpose:** First-time facility configuration for new clinic tenants.
* **5-Step Setup:**
  1. *Facility Profile:* Hospital name, address, contact phone/email, shift operating hours ($08:00\text{ to }18:00$), and time zone routing (`Asia/Kolkata`).
  2. *Clinical Departments:* Interactive selection of active departments with target SLA durations.
  3. *Lead Consulting Doctor:* Registration of head medical consultant, room number, license number, and shift timings.
  4. *Data Initialization:* Selection between Clean Production Queue (recommended) or Demo initialization.
  5. *Review & Facility Launch:* Summary verification and single-click activation.
* **Route Protection:** Un-onboarded clinic accounts are automatically intercepted and routed here before dashboard access.

---

### 2. Executive Operations Dashboard (`/dashboard`)
* **Purpose:** Central intelligence hub for clinic executives and medical superintendents.
* **Key Visualizations:**
  - **Executive KPI Strip:** Total Patient Visits, Average Queue Wait (with trend percentage), P90 Maximum Wait, and Data Completeness Score.
  - **Hourly Patient Flow & Queue Duration Trend (Recharts Area Chart):** Dual-gradient visualization comparing hourly patient arrival volumes against average queue delays across operating hours ($08:00\text{ to }17:00$).
  - **Patient Intake Categories (Recharts Donut/Pie Chart):** Real-time triage breakdown across Walk-in (`#0ea5e9`), Follow-up (`#6366f1`), New Registration (`#10b981`), and Emergency (`#f43f5e`) with center count and interactive color legend.
  - **Departmental Wait Times vs Consultation SLA (Recharts Dual-Bar Chart):** Side-by-side comparison of actual queue delays against target consultation duration across all departments.
  - **Peak Bottleneck Callout:** Real-time pulse indicator highlighting the highest pressure slot identified by the 24h heatmap algorithm.
  - **SimPy Predictive Model Preview:** Live summary of projected queue wait and 95% Confidence Interval for alternative staffing models.
  - **Recent Patient Flow Feed:** Live table showing latest registered tokens (`CQ-101`, `CQ-102`), current stage status, wait duration, and direct timeline link.
  - **Operational Command Hub:** Rapid 1-click navigation buttons to record visits, launch simulations, or export audit reports.

---

### 3. Historical Waiting-Time Analytics (`/analytics/historical`)
* **Purpose:** Long-term statistical analysis and compliance reporting.
* **Capabilities:**
  - Parametric date interval filtering ($7\text{ Days}, 30\text{ Days}, 90\text{ Days}$, or Custom Date Range).
  - Primary Metric Selector: Queue Wait (Arrival to Call), Total Clinic Stay, Consultation Time, Registration Delay.
  - Group Aggregation: By Clinical Department or Individual Doctor.
  - Statistical Computations: Mean, Median ($P_{50}$), $P_{90}$ Percentile delay, Standard Deviation ($\sigma$), and Interquartile Range ($IQR$).
  - Visual Breakdown: Bar charts of departmental wait times and distribution trends.

---

### 4. 24-Hour Time-Slot Congestion Heatmap (`/analytics/time-slot`)
* **Purpose:** Visual identification of patient surge patterns and clinic bottleneck hours.
* **Capabilities:**
  - **Weekly Service Demand Matrix:** $7\text{ Days } \times 14\text{ Hourly Slots } (07:00 - 20:00)$ color-coded grid.
  - **Color Density Mapping:** Slate/Empty $\to$ Soft Sky Blue $\to$ Oceanic Blue $\to$ Rose Red (Peak Bottleneck).
  - **Automated Surge Detection:** Identifies the top pressure window (e.g., *Wednesdays at 11:00 AM*) and advises operational triage staggering.
  - **Interactive Cell Inspection:** Click any cell to inspect exact arrival counts, mean wait duration, and bottleneck categorization.

---

### 5. SimPy Queue Simulation Workbench (`/simulation`)
* **Purpose:** Discrete-event stochastic simulation for clinic capacity and doctor staffing planning.
* **Simulation Mechanics:**
  - Models outpatient patient arrival as an inhomogeneous Poisson process ($\lambda(t)$).
  - Consultation service duration modeled as Log-Normal / Exponential distribution ($\mu, \sigma$).
  - Doctor consultation capacity modeled as a multi-server resource queue ($c$ parallel servers).
* **Pre-Configured Scenarios:**
  - *Standard OPD Baseline:* 2 Doctors, normal patient arrival rate.
  - *Monday Morning Surge:* 2 Doctors under heavy rush ($1.1\text{ arrivals/min}$).
  - *Add +1 Doctor Capacity:* 3 Doctors under expanded parallel consultation flow.
* **Monte Carlo Engine Output:**
  - Mean Projected Queue Wait (minutes).
  - 95% Confidence Interval ($[\text{CI}_{\text{lower}}, \text{CI}_{\text{upper}}]$) across $N=10$ replications.
  - Doctor Resource Utilization Percentage.
  - Hourly simulated queue depth histogram.

---

### 6. Visit Records & Patient Flow (`/data/visits`)
* **Purpose:** Live outpatient department reception desk and token queue manager.
* **Capabilities:**
  - **Live Reception Table:** Displays Patient Token, Visit Date, Category Badge, Arrival Time, Queue Wait, Service Time, Total Stay, and Details.
  - **Search & Filtering:** Real-time token search (e.g., `CQ-101`) and category filter pills (`All`, `Walk-in`, `Follow-up`, `New`, `Emergency`).
  - **+ Record Patient Visit Modal:** Form to issue new patient tokens, select department, assign doctor, and log notes.
  - **Patient Milestone Journey Drawer:** Slide-over drawer providing an interactive chronological timeline:
    $$\text{Arrival} \longrightarrow \text{Registration} \longrightarrow \text{Triage} \longrightarrow \text{Doctor Call} \longrightarrow \text{Consultation Start} \longrightarrow \text{Consultation End} \longrightarrow \text{Departure}$$
  - **Direct CSV Export:** Single-click client-side generation of patient records as `.csv`.
  - **Sample Data Link:** In-app download link for today's live reception flow dataset.

---

### 7. Batch Dataset Importer (`/data/import`)
* **Purpose:** Bulk ingestion of historical outpatient clinic logs exported from external HMS/EMR software.
* **3-Step Ingestion Pipeline:**
  1. *Upload Dataset File:* Drag-and-drop or browse `.csv`, `.xlsx`, or `.xls` files. File hash is computed using SHA-256 for idempotency.
  2. *Map Timestamp Columns:* **Intelligent Auto-Mapping Engine** automatically inspects file headers and pre-maps matching columns (`patient_token`, `arrival_time`, `registration_time`, `called_time`, `service_start_time`, `service_end_time`, `departure_time`, `department_id`, `visit_type`).
  3. *Validate & Ingest:* Rigorous chronological validation verifies that timestamps follow physical logic ($T_{\text{arrival}} \le T_{\text{registration}} \le T_{\text{called}} \le T_{\text{service\_start}} \le T_{\text{service\_end}} \le T_{\text{departure}}$). Displays total rows, valid rows, and invalid rows.
* **Direct Sample Link:** In-app button to download pre-formatted 50-record historical clinic dataset.

---

### 8. Data Quality & Integrity (`/data/quality`)
* **Purpose:** Data health auditing for hospital timestamp records.
* **Auditing Parameters:**
  - Chronological consistency score.
  - Percentage of visits with complete milestone timestamps.
  - Missing service duration detection.
  - Outlier detection (consultations $< 1\text{ min}$ or $> 120\text{ mins}$).

---

### 9. Reports & SLA Compliance Exports (`/reports`)
* **Purpose:** Formal executive governance and audit reporting.
* **Capabilities:**
  - Date-filtered summary generation.
  - SLA breach breakdown (percentage of patients waiting $> 30\text{ mins}$).
  - Departmental compliance rankings.
  - Export formats: Formatted `.csv` and executive printable summaries.

---

### 10. Clinical Specializations (`/settings/specializations`)
* **Purpose:** Departmental routing configuration.
* **Features:**
  - Management of clinical departments (General Medicine, Pediatrics, Cardiology, Orthopedics, Dermatology, Pathology).
  - Target SLA consultation duration setting (e.g., $15\text{ mins}$).
  - Maximum concurrent patient capacity configuration.

---

### 11. Doctors Staff Roster (`/settings/doctors`)
* **Purpose:** Medical practitioner duty and consultation schedule manager.
* **Features:**
  - Physician profile: Full name, qualifications, NMC license number, cabin/room number, and contact details.
  - Departmental linkage.
  - Shift timing configurations (e.g., `09:00 AM – 01:00 PM`) and working day checkboxes (`Mon – Sat`).
  - Average consultation duration target.

---

### 12. Security & Compliance Audit Trail (`/settings/audit`)
* **Purpose:** Immutable compliance ledger tracking system activity.
* **Logged Events:**
  - User Authentication (`auth.login`, `auth.logout`).
  - Facility Setup (`clinic.onboarded`, `clinic.configured`).
  - Patient Visit Operations (`visit.created`, `visit.updated`, `visit.deleted`).
  - Dataset Operations (`dataset.imported`).
  - Simulation Runs (`simulation.executed`).
* **Ledger Details:** Precise IST timestamp, event trigger badge, authenticated actor email, target entity ID, and structured JSON metadata.

---

## 📐 Mathematical & Queue Analytics Engine

CareQueue implements rigorous clinical operations mathematics:

### 1. Waiting-Time Milestone Decomposition
For every patient visit $i$:
$$\Delta T_{\text{reg}, i} = T_{\text{registration}, i} - T_{\text{arrival}, i}$$
$$\Delta T_{\text{queue}, i} = T_{\text{called}, i} - T_{\text{registration}, i}$$
$$\Delta T_{\text{service}, i} = T_{\text{service\_end}, i} - T_{\text{service\_start}, i}$$
$$\Delta T_{\text{total}, i} = T_{\text{departure}, i} - T_{\text{arrival}, i}$$

### 2. Statistical Metrics
For a sample of $N$ visits:
* **Empirical Mean:**
  $$\bar{W} = \frac{1}{N} \sum_{i=1}^{N} \Delta T_{\text{queue}, i}$$
* **P90 Percentile Delay:**
  $$P_{90} = \text{Value at index } \lceil 0.90 \times N \rceil \text{ in sorted queue wait array}$$
* **SLA Compliance Rate:**
  $$\text{Compliance } (\%) = \left( \frac{\sum_{i=1}^N \mathbf{1}_{(\Delta T_{\text{queue}, i} \le \text{SLA}_{\text{dept}})}}{N} \right) \times 100$$

### 3. Heatmap Bottleneck Index
For each day-of-week $d \in \{1 \dots 7\}$ and hour slot $h \in \{07:00 \dots 20:00\}$:
$$\text{Congestion Index}(d, h) = \frac{\text{Arrival Volume}(d, h)}{\text{Average Service Capacity}(d, h)}$$
If $\text{Congestion Index} > \text{Threshold}$, the cell is flagged with `High Pressure (Peak Bottleneck)`.

---

## 🧪 SimPy Discrete-Event Simulation Workbench

CareQueue utilizes **SimPy** (Python discrete-event simulation framework) to simulate stochastic clinic queues:

1. **Patient Arrival Process:** Patients arrive according to a Poisson arrival process where inter-arrival times follow an exponential distribution:
   $$P(\text{Inter-arrival} \le t) = 1 - e^{-\lambda t}$$
2. **Consultation Service Process:** Consultation durations are modeled using a log-normal distribution parameterized by the department's empirical mean and variance:
   $$T_{\text{service}} \sim \text{LogNormal}(\mu, \sigma^2)$$
3. **Queue Discipline:** First-Come, First-Served ($FCFS$) across $c$ parallel doctor consultation rooms represented as `simpy.Resource(env, capacity=c)`.
4. **Replication & Confidence Intervals:** $K=10$ Monte Carlo replications are executed with independent random seeds. The 95% Confidence Interval for mean waiting time is computed as:
   $$\bar{X} \pm t_{K-1, 0.975} \times \frac{S}{\sqrt{K}}$$

---

## 💻 Technology Stack

### Backend
* **Language & Framework:** Python 3.12, FastAPI (ASGI async architecture)
* **Database Driver:** Motor (AsyncIO driver for MongoDB)
* **Data Validation & Schemas:** Pydantic v2
* **Analytics & Modeling:** Pandas, NumPy, SciPy
* **Simulation Framework:** SimPy (Discrete-event simulation)
* **Security & Auth:** BCrypt password hashing, PyJWT for session tokens
* **Timezone Routing:** PyTZ (`Asia/Kolkata` standard)

### Frontend
* **UI Framework:** React 18, TypeScript, Vite build tool
* **Styling & Design System:** Tailwind CSS, PostCSS, Radix UI primitives
* **Data Visualizations:** Recharts (Area, Bar, Donut/Pie charts)
* **State & Server Cache:** TanStack React Query v5
* **HTTP Client:** Axios with JWT bearer interceptors
* **Icons & Notifications:** Lucide React, React Hot Toast

### Database
* **Database Engine:** MongoDB Atlas (Cloud Cluster) / MongoDB Community 7.0+
* **Collections:** `clinics`, `departments`, `doctors`, `users`, `visits`, `datasets`, `dataset_rows`, `simulation_configs`, `simulation_results`, `audit_logs`, `clinic_settings`.

---

## ⚙️ Prerequisites & System Requirements

Before running the application, ensure the following software is installed on your operating system (Windows / macOS / Linux):
* **Python**: Version `3.10` or higher (`3.12` recommended)
* **Node.js**: Version `18.0.0` or higher (`20.x` or `22.x` recommended)
* **Package Managers**: `pip` (Python) and `npm` (Node)
* **Git**: Optional (for version management)

---

## 🚀 Step-by-Step Installation & Run Guide

Open **two separate terminal windows** (PowerShell or Command Prompt on Windows):

### 🖥️ Terminal 1: Backend Server (FastAPI)

1. Navigate into the `backend` directory:
   ```powershell
   cd backend
   ```

2. *(Optional but Recommended)* Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Verify your `.env` configuration file exists in `backend/.env`:
   ```ini
   MONGODB_URL=mongodb+srv://user_gokul:Lfg0bsxrzs3njKeA@cluster0.uurxkmz.mongodb.net/carequeue
   DB_NAME=carequeue
   SECRET_KEY=carequeue-dev-secret-key-change-in-production-32chars
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   ENVIRONMENT=development
   HOST=0.0.0.0
   PORT=8000
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:80
   ```

5. Launch the FastAPI server with live reloading:
   ```powershell
   python -m uvicorn app.main:app --reload --port 8000
   ```
   > **Verification:** Look for: `Uvicorn running on http://127.0.0.1:8000`  
   > **Interactive API Docs:** Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

---

### 🌐 Terminal 2: Frontend Client (React + Vite)

1. Open a new terminal and navigate into the `frontend` directory:
   ```powershell
   cd frontend
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```

3. Launch the Vite local development server:
   ```powershell
   npm run dev
   ```
   > **Verification:** Look for: `VITE v5.4.21 ready in ... ms` → `Local: http://localhost:5173/`

4. Open your browser and navigate to:
   👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Database Management & Utility Scripts

CareQueue includes dedicated administrative scripts located in the root and `backend/` directories:

### 1. Reset Database Cleanly (`backend/clear_db.py`)
Clears all operational visits, datasets, simulations, departments, and doctors while initializing an un-onboarded Super Admin ready for first-time login testing:
```powershell
python backend/clear_db.py
```

### 2. Seed Specializations & Doctors Master Data (`backend/seed_clinic_master_data.py`)
Populates the 4 clinical departments (General Medicine, Pediatrics, Cardiology, Orthopedics) and the medical doctors roster with cabin assignments and shifts:
```powershell
python backend/seed_clinic_master_data.py
```

### 3. Reset Super Admin Password (`backend/reset_admin.py`)
Resets the default `admin@gmail.com` password to `Admin@123`:
```powershell
python backend/reset_admin.py
```

---

## 📂 Sample Datasets & Ingestion Testing

Pre-configured sample datasets are stored in `sample_datasets/` and accessible for immediate testing via the **Batch Importer** (`/data/import`):

| File Path | Description | Patient Volume | Clinical Scenario |
| :--- | :--- | :---: | :--- |
| `sample_datasets/1_standard_weekday_baseline.csv` | Standard Weekday Baseline | 25 Patients | Smooth OPD flow, low wait times (8–20m), high SLA compliance. |
| `sample_datasets/2_monday_morning_congestion_surge.csv` | Peak Bottleneck Surge | 35 Patients | Heavy cluster arrivals (9:30–11:30 AM), high wait times (35–55m) that trigger Red Alerts. |
| `sample_datasets/3_multispecialty_weekend_intake.csv` | Multi-Specialty Triage Mix | 30 Patients | Mix of Emergency, Cardiology, Pediatrics, and Walk-in consults. |
| `sample_datasets/historical_dataset_for_import_module.csv` | 30-Day Multi-Week Log | 50 Patients | Populates full 24h Heatmap weekly matrix and Historical Analytics. |
| `sample_datasets/todays_reception_for_visit_records_module.csv` | Today's Live Reception Queue | 20 Patients | Current day visits across Waiting, In-Consultation, and Completed states. |

### In-App Download:
Both the **Import Dataset** page (`/data/import`) and **Visit Records** page (`/data/visits`) contain direct single-click links to download these sample files directly from your browser.

---

## 🔐 Default Credentials & Role-Based Access Control

CareQueue implements multi-tenant, role-based access control (RBAC):

### Default Super Administrator Credentials:
* **Login URL:** [http://localhost:5173/login](http://localhost:5173/login)
* **Email:** `admin@gmail.com`
* **Password:** `Admin@123`
* **Role:** `super_admin` (Full administrative privileges across clinic settings, staff rosters, analytics, and audit logs)

### Supported Roles:
* `super_admin`: Full facility management, user creation, data deletion, and audit ledger access.
* `clinic_admin`: Facility profile editing, doctor rostering, and dataset imports.
* `analyst`: Access to analytics, heatmap, simulation workbench, and report exports.
* `viewer`: Read-only access to dashboard and live patient token flow.

---

## 📄 License
CareQueue is developed as an academic and healthcare research intelligence project for clinic patient waiting-time intelligence and service flow analysis.
All rights reserved © 2026.
