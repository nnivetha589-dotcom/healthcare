# MediMate AI

**Tagline:** *Your Health Data. Your Language. Your Personal AI Companion.*

A complete, full-stack, responsive healthcare web application built with a React (Vite) frontend, Tailwind CSS, Python Flask REST API backend, and SQLite database. MediMate AI provides bilingual health information assistance (English & Tamil), smart report extraction and comparison, lifestyle tracking, habit scheduling, and doctor-visit consultation preparation.

---

## 🌟 Six Core Features

1. **AI Health Assistant (Feature 1):**
   - Bilingual conversational health inquiries in simple English or Tamil (தமிழ்).
   - Basic symptom checker with clarifying follow-up questions.
   - Clinical boundaries: explicitly states when user-provided information is insufficient.
   - Emergency guidance protocol for critical red-flag indicators (chest pain, stroke, breathlessness).
   - Never provides formal diagnoses or pharmaceutical prescriptions.
   - Safe Demo Mode automatically engaged when no external API key is present.

2. **Smart Medical Report Centre (Feature 2):**
   - Upload laboratory reports and panels in PDF, JPG, and PNG formats with file type/size validation (< 16 MB).
   - Automated text and biomarker extraction (HbA1c, Fasting Blood Sugar, Lipid panels, Hemoglobin, Creatinine, etc.).
   - Interactive user verification pane showing the raw extracted document text.
   - Plain-language explanations of medical terms, units, and standard reference ranges.
   - **Longitudinal Report Comparison:** Compares earlier baseline reports against new follow-up panels, calculating net changes and trajectory.
   - Delete and inspect controls; strictly never invents values or diagnoses.

3. **Personal AI Health Twin (Feature 3):**
   - Daily logs for symptoms, severity, sleep hours, water intake, exercise, and wellness notes.
   - Interactive Recharts visual timeline and metrics dashboard.
   - Automated lifestyle pattern observation (identifies repeated symptoms, sleep deficits, hydration trends).
   - Clear distinction between observed user-recorded patterns and medical conclusions.
   - Full edit and deletion controls for health records.

4. **Tamil and English Voice Assistant (Feature 4):**
   - Bilingual language selector (English / தமிழ்).
   - Browser WebSpeech API speech recognition: converts voice input into editable text before submission.
   - Native browser Text-to-Speech (TTS) engine that reads AI responses aloud in Tamil or English.
   - Direct option to ask questions grounded in uploaded medical reports.
   - Seamless text-chat fallback whenever voice input is unsupported.

5. **Smart Health Planner (Feature 5):**
   - Organizes schedules for clinician-prescribed medications, hydration targets, and physical activity.
   - Daily habit tracking with real-time completion progress percentage.
   - Mark individual reminders as completed, pending, or skipped.
   - Clinical boundary: Never recommends medications or modifies prescribed doses.

6. **Family Care and Doctor Visit Assistant (Feature 6):**
   - **Doctor Visit Briefing:** Compiles selected symptoms, lab changes, and targeted questions to ask your physician into a 1-page consultation brief.
   - **Consent-Protected Family Sharing:** Generates secure, revokable access tokens for family members/caregivers only after explicit affirmative user consent.
   - Backend row-level access permissions and instant revocation controls.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS v3, Recharts, Lucide Icons, Axios
- **Backend:** Python 3.12+ (Flask, Flask-CORS, PyPDF2, Pillow, Werkzeug, python-dotenv)
- **Database:** SQLite3 (`medimate.db`)
- **Speech Engine:** HTML5 Web Speech Recognition & SpeechSynthesis API
- **AI Integration:** Google Gemini API (`gemini-1.5-flash`) with safe, preconfigured offline Demo Mode fallback.

---

## 📁 Project Structure

```text
health/
├── backend/
│   ├── .venv/                     # Python 3.12 virtual environment
│   ├── uploads/                   # Uploaded reports directory
│   ├── app.py                     # Flask REST API endpoints & permissions
│   ├── ai_service.py              # AI service with Gemini & safe Demo Mode
│   ├── database.py                # SQLite schema definition & setup
│   ├── extractor.py               # PDF and Image text extraction parser
│   ├── seed_data.py               # Fictional sample patient data seeder
│   ├── requirements.txt           # Python backend dependencies
│   ├── .env.example               # Environment variables template
│   └── medimate.db                # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.jsx        # Navigation sidebar & user session
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx       # Login & Registration
│   │   │   ├── Dashboard.jsx      # Health overview & metrics
│   │   │   ├── AssistantPage.jsx  # Feature 1: AI Health Assistant
│   │   │   ├── ReportsPage.jsx    # Feature 2: Smart Medical Report Centre
│   │   │   ├── HealthTwinPage.jsx # Feature 3: Personal AI Health Twin
│   │   │   ├── VoicePage.jsx      # Feature 4: Tamil & English Voice Assistant
│   │   │   ├── PlannerPage.jsx    # Feature 5: Smart Health Planner
│   │   │   ├── DoctorFamilyPage.jsx # Feature 6: Doctor Visit & Family Care
│   │   │   ├── EmergencyPage.jsx  # SOS Emergency guidance & red flags
│   │   │   └── SettingsPage.jsx   # Profile & privacy account erasure
│   │   ├── services/
│   │   │   └── api.js             # Centralized Axios API client
│   │   ├── App.jsx                # Root view container & routing
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Tailwind styling
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## 🚀 Setup and Running Instructions

### 1. Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.10+ (managed via `uv` or system Python)

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate virtual environment (already set up in `.venv`):
   ```bash
   # Windows:
   .venv\Scripts\activate
   ```
3. (Optional) Configure Gemini AI API Key:
   Create a `.env` file in `backend/`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Note: If no API key is provided, MediMate AI automatically runs in its clearly labelled, safe Demo Mode.*
4. Initialize the database and populate fictional demo data:
   ```bash
   python seed_data.py
   ```
5. Run the Flask server (runs on port 5005):
   ```bash
   python app.py
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install packages (if not already installed):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at the displayed local URL (typically `http://localhost:5173`).

---

## 👤 Sample Demonstration Account

- **Email:** `demo@medimate.ai`
- **Password:** `medimate123`
- Pre-populated with:
  - Fictional patient *Ananya Sundaram* (Age 34, Female, Blood Group O+).
  - 2 historical lab reports (Baseline May 2026 vs Follow-up August 2026).
  - 7 days of daily health twin lifestyle and symptom logs.
  - Active care reminders and active family consent permissions.

---

## ⏱️ 5-Minute Hackathon Demonstration Workflow

1. **Minute 1: Login & Health Overview (Dashboard)**
   - Sign in using the fictional patient account (`demo@medimate.ai`).
   - Highlight the premium dashboard: Sleep and Hydration averages, active lab panels, today's reminder progress, and identified lifestyle observations.
2. **Minute 2: Feature 1 & 4 — AI Health Assistant & Voice in Tamil/English**
   - Navigate to **AI Health Assistant**. Switch between English and Tamil.
   - Ask: *"What does an HbA1c test result indicate?"* Observe source groundedness tag.
   - Test critical safety protocol: type *"I am feeling severe sudden chest pain"* to demonstrate instant emergency guidance banner.
   - Switch to **Tamil and Voice Assistant**, test browser voice recognition or text-to-speech replay in Tamil.
3. **Minute 3: Feature 2 — Smart Medical Report Centre**
   - Click **Medical Report Centre**.
   - Inspect the extracted biomarkers, plain-language explanations, and raw extracted text verification box.
   - Click **Compare Longitudinal Reports** with May 2026 vs August 2026 to see visual changes (HbA1c decreasing from 6.2% to 5.8%, Total Cholesterol lowering from 218 to 195 mg/dL).
4. **Minute 4: Feature 3 & 5 — AI Health Twin & Smart Planner**
   - Open **AI Health Twin** to view the habit timeline chart and observed non-diagnostic lifestyle patterns.
   - Click "Record Daily Health Log" and add a new entry.
   - Open **Smart Health Planner** and mark today's medication as completed or skipped; watch the adherence progress bar update.
5. **Minute 5: Feature 6 & Privacy — Doctor Visit Brief & Family Sharing**
   - Open **Doctor Visit & Family Care**.
   - Review the compiled Doctor Briefing and high-yield questions for the clinician.
   - Demonstrate the **Family Care Sharing** tab: explain how explicit affirmative consent is enforced before generating revokable access tokens.
   - Visit **Profile & Privacy** to demonstrate the complete account and data erasure control.
