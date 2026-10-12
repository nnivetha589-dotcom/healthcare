# MediMate AI

MediMate is a runnable Flask MVP for organising personal health information. It includes secure registration/login, a dashboard, demo AI assistant, protected report uploads with best-effort PDF/OCR extraction, health logs and charts, reminders, care-circle contacts, and privacy settings.

## Run locally

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
flask --app app run --debug
```

Open http://127.0.0.1:5000. A demo account is seeded: `demo@medimate.local` / `demo1234`.

The app uses **Demo AI mode** when `OPENAI_API_KEY` is empty; it is clearly labelled and intentionally gives safe, general guidance. No API integration is required to run the MVP. For optional report extraction, install `pypdf`, `Pillow`, and (where available) `pytesseract` plus a local Tesseract installation.

## Privacy and safety

Passwords are hashed with Werkzeug. Uploaded files are stored in the non-public `uploads/` directory and served only after an authenticated ownership check. SQLite and uploads are ignored by git. This is educational software, not medical advice or an emergency service.
