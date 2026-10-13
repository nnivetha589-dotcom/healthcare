# MediMate AI

MediMate is a runnable Flask MVP for organising personal health information. It includes secure registration/login, a dashboard, demo AI assistant, protected report uploads with best-effort PDF/OCR extraction, health logs and charts, reminders, care-circle contacts, and privacy settings.

The application is organized as a single Flask service:

- `backend/` contains the Flask application, configuration, database setup, services, and route registration.
- `frontend/templates/` contains the server-rendered frontend.
- `frontend/static/` contains CSS and browser JavaScript.
- `backend/wsgi.py` is the production WSGI entry point.

The frontend and backend are separated by responsibility, but they run as one
Flask service. Flask renders the frontend and serves its static assets while
the same process handles the application routes and APIs. There is no second
frontend development server or second port.

## Run locally

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
copy .env.example .env
flask --app backend/app.py run --debug
```

The local server uses one port: http://127.0.0.1:5000.

Open http://127.0.0.1:5000. A demo account is seeded: `demo@medimate.local` / `demo1234`.

The app uses **Demo AI mode** when `OPENAI_API_KEY` is empty; it is clearly labelled and intentionally gives safe, general guidance. No API integration is required to run the MVP. For optional report extraction, install `pypdf`, `Pillow`, and (where available) `pytesseract` plus a local Tesseract installation.

## Privacy and safety

Passwords are hashed with Werkzeug. Uploaded files are stored in the non-public `uploads/` directory and served only after an authenticated ownership check. SQLite and uploads are ignored by git. This is educational software, not medical advice or an emergency service.

## Deploy on Render

This repository includes [`render.yaml`](./render.yaml) for a Render web service.

1. Push the project to a GitHub repository.
2. In Render, choose **New → Blueprint** and select the repository.
3. Select the free plan if Render asks for a plan.
4. Keep the generated `SECRET_KEY` value. Do not commit a real secret to `.env` or source control.
5. Leave `OPENAI_API_KEY` empty to use the safe demo assistant, or add the key in Render's environment settings.
6. Deploy the service.

Render reads the Blueprint from the repository root. It installs
`backend/requirements.txt` and starts the WSGI app from `backend/`; the
frontend is still served by that same Flask process and does not need a
separate Render service or port.

The production command is:

```text
gunicorn --chdir backend --bind 0.0.0.0:$PORT wsgi:app
```

### Free-tier storage limitation

The free Render web-service filesystem is ephemeral. This MVP stores SQLite data and uploaded reports locally, so accounts, health logs, and reports can be lost after a restart, redeploy, or spin-down. Use demo data only. Persistent production hosting requires a managed database and object storage, which will be a separate implementation phase.

## GitHub and VS Code

This folder is connected to the GitHub repository:

```text
https://github.com/nnivetha589-dotcom/healthcare
```

Open the project in VS Code with:

```powershell
code C:\Users\mrpra\OneDrive\Desktop\healthcare
```

Use the **Source Control** panel to review changes, create commits, and sync
the `demo` branch with GitHub. Git must be installed and available to VS Code.
Never commit `.env`, local SQLite databases, uploads, virtual environments, or
frontend `node_modules`; these paths are ignored by `.gitignore`.
