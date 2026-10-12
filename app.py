import os, sqlite3, uuid, json, re
from urllib.request import Request, urlopen
from datetime import datetime, date, timedelta
from functools import wraps
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory, abort, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

BASE = Path(__file__).resolve().parent
DB_PATH = BASE / "medimate.db"
UPLOAD_DIR = BASE / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED = {"pdf", "png", "jpg", "jpeg"}
MAX_UPLOAD = 10 * 1024 * 1024

app = Flask(__name__)
app.config.update(SECRET_KEY=os.getenv("SECRET_KEY", "dev-only-change-me"), MAX_CONTENT_LENGTH=MAX_UPLOAD,
                  AI_API_KEY=os.getenv("OPENAI_API_KEY", ""),
                  AI_API_URL=os.getenv("AI_API_URL", "https://api.openai.com/v1/chat/completions"),
                  AI_MODEL=os.getenv("AI_MODEL", "gpt-4o-mini"),
                  DEMO_AI=not bool(os.getenv("OPENAI_API_KEY")))

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn

def init_db():
    conn = db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL, privacy_consent INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS health_logs(id INTEGER PRIMARY KEY, user_id INTEGER, log_type TEXT, value TEXT,
      notes TEXT, logged_at TEXT, FOREIGN KEY(user_id) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS reminders(id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, due_at TEXT,
      repeat_rule TEXT, done INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY, user_id INTEGER, filename TEXT, stored_name TEXT,
      extracted_text TEXT, uploaded_at TEXT, FOREIGN KEY(user_id) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS family_contacts(id INTEGER PRIMARY KEY, user_id INTEGER, name TEXT, relation TEXT,
      email TEXT, phone TEXT, FOREIGN KEY(user_id) REFERENCES users(id));
    CREATE INDEX IF NOT EXISTS idx_health_logs_user_date ON health_logs(user_id, logged_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reminders_user_done_due ON reminders(user_id, done, due_at);
    CREATE INDEX IF NOT EXISTS idx_reports_user_date ON reports(user_id, uploaded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_family_contacts_user ON family_contacts(user_id);
    """)
    if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        now = datetime.now().isoformat(timespec="minutes")
        cur = conn.execute("INSERT INTO users(name,email,password_hash,created_at) VALUES(?,?,?,?)",
                           ("Demo Patient", "demo@medimate.local", generate_password_hash("demo1234"), now))
        uid = cur.lastrowid
        conn.executemany("INSERT INTO health_logs(user_id,log_type,value,notes,logged_at) VALUES(?,?,?,?,?)", [
            (uid, "Mood", "Good", "Slept well", (date.today()-timedelta(days=2)).isoformat()),
            (uid, "Weight", "72", "kg", (date.today()-timedelta(days=1)).isoformat()),
            (uid, "Blood pressure", "120/80", "Morning reading", date.today().isoformat())])
        conn.execute("INSERT INTO reminders(user_id,title,due_at,repeat_rule) VALUES(?,?,?,?)",
                     (uid, "Take morning medication", "08:00", "Daily"))
    conn.commit(); conn.close()

def current_user():
    if "current_user" not in g:
        user_id = session.get("user_id")
        if not user_id:
            g.current_user = None
        else:
            with db() as conn:
                g.current_user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    return g.current_user

def login_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if not current_user():
            flash("Please sign in to continue.", "info"); return redirect(url_for("login", next=request.path))
        return fn(*args, **kwargs)
    return wrapped

def generate_ai_answer(question):
    if app.config["DEMO_AI"]:
        text = question.lower()
        emergency_terms = ("chest pain", "difficulty breathing", "can't breathe", "cannot breathe",
                           "fainted", "unconscious", "stroke", "severe bleeding", "suicidal")
        if any(term in text for term in emergency_terms):
            return ("Demo AI · Urgent safety guidance: These symptoms may need immediate medical attention. "
                    "Call your local emergency number now or go to the nearest emergency department. "
                    "Do not drive yourself if you feel faint or unsafe. This is safety guidance, not a diagnosis.")
        if any(term in text for term in ("fever", "temperature", "hot")):
            return ("Demo AI · Fever information: Rest, drink fluids if you can, and note the temperature, "
                    "time, and other symptoms. Seek medical advice promptly for a very high or persistent fever, "
                    "confusion, stiff neck, breathing trouble, dehydration, or concern about a young child or older adult. "
                    "What is the temperature, how long has it lasted, and what other symptoms are present?")
        if any(term in text for term in ("headache", "migraine")):
            return ("Demo AI · Headache information: Consider hydration, regular food, rest, and reducing bright screens. "
                    "Seek urgent care for a sudden severe headache, weakness, confusion, vision loss, fever with a stiff neck, "
                    "or a headache after a head injury. How sudden was it, where is the pain, and how long has it lasted?")
        if any(term in text for term in ("blood pressure", "bp", "hypertension")):
            return ("Demo AI · Blood pressure information: A single reading does not establish a diagnosis. "
                    "Sit quietly for five minutes, use a correctly sized cuff, and record the date, time, and reading. "
                    "Discuss repeated unusual readings with a clinician, and do not change prescribed medicine doses without them. "
                    "What was the reading and was it repeated after resting?")
        if any(term in text for term in ("sleep", "insomnia", "tired", "fatigue")):
            return ("Demo AI · Sleep information: Keep a consistent sleep and wake time, reduce caffeine late in the day, "
                    "and keep the room dark and comfortable. Track sleep duration and daytime symptoms for a week. "
                    "Talk with a clinician if tiredness is persistent, worsening, or affecting safety.")
        if any(term in text for term in ("water", "hydration", "dehydrated")):
            return ("Demo AI · Hydration information: Drink regularly and use thirst and urine colour as general cues, "
                    "unless a clinician has given you fluid restrictions. Seek care for confusion, fainting, inability to keep fluids down, "
                    "or very little urine.")
        if any(term in text for term in ("report", "lab", "blood test", "scan", "result")):
            return ("Demo AI · Report help: I can explain medical terms in plain language when you share the exact wording, "
                    "value, unit, reference range, and report date. I will not diagnose from one result. "
                    "Please remove names or IDs you do not want to share, and confirm results with your clinician.")
        if any(term in text for term in ("medicine", "medication", "tablet", "dose", "prescription")):
            return ("Demo AI · Medication safety: Follow the prescription or clinician-provided instructions. "
                    "I cannot recommend a new medicine or change a dose. A pharmacist or prescribing clinician can check "
                    "interactions, missed doses, and side effects for your specific medicines.")
        if any(term in text for term in ("exercise", "workout", "walking", "fitness")):
            return ("Demo AI · Activity information: Gentle activity such as walking can support general wellbeing when it is safe for you. "
                    "Start gradually, warm up, and stop for chest pain, severe breathlessness, faintness, or unusual symptoms. "
                    "Ask a clinician for personalised advice if you have a medical condition or are returning after illness.")
        if len(text.split()) < 4 or any(term in text for term in ("help", "what should i do", "not feeling well")):
            return ("Demo AI · I need a little more information to help safely. What symptom or health topic are you asking about, "
                    "when did it start, how severe is it, and what age group is the person in? "
                    "If there are emergency symptoms, contact local urgent medical help now.")
        return ("Demo AI · I can provide general health information, but I need more context rather than guessing. "
                "Please share the main symptom or topic, when it started, how severe it is, relevant measurements, "
                "and any clinician instructions. I cannot diagnose or replace professional care.")
    payload = json.dumps({
        "model": app.config["AI_MODEL"],
        "messages": [
            {"role": "system", "content": "Give safe, general health information. Do not diagnose, prescribe, or change doses. Ask clarifying questions when needed and advise urgent care for emergency symptoms."},
            {"role": "user", "content": question},
        ],
        "temperature": 0.2,
    }).encode("utf-8")
    req = Request(app.config["AI_API_URL"], data=payload, headers={
        "Authorization": f"Bearer {app.config['AI_API_KEY']}",
        "Content-Type": "application/json",
    })
    try:
        with urlopen(req, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
        return result["choices"][0]["message"]["content"]
    except (OSError, KeyError, IndexError, json.JSONDecodeError) as exc:
        app.logger.warning("AI provider request failed: %s", exc)
        return "The configured AI service is temporarily unavailable. Please try again later or use general medical guidance from a qualified clinician."

@app.context_processor
def inject():
    return {"user": current_user(), "demo_ai": app.config["DEMO_AI"], "year": date.today().year}

@app.route("/")
def index():
    return redirect(url_for("dashboard")) if current_user() else render_template("landing.html")

@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        name, email, password = request.form.get("name","").strip(), request.form.get("email","").strip().lower(), request.form.get("password","")
        if not name or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) or len(password) < 8:
            flash("Enter a name, valid email, and password of at least 8 characters.", "error")
        else:
            try:
                with db() as conn:
                    conn.execute("INSERT INTO users(name,email,password_hash,created_at) VALUES(?,?,?,?)",
                                 (name,email,generate_password_hash(password),datetime.now().isoformat(timespec="minutes")))
                    conn.commit()
                flash("Account created. Welcome to MediMate!", "success"); return redirect(url_for("login"))
            except sqlite3.IntegrityError: flash("That email is already registered.", "error")
    return render_template("auth.html", mode="register")

@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        with db() as conn: u = conn.execute("SELECT * FROM users WHERE email=?", (request.form.get("email","").lower(),)).fetchone()
        if u and check_password_hash(u["password_hash"], request.form.get("password","")):
            session.clear(); session["user_id"] = u["id"]; return redirect(request.args.get("next") or url_for("dashboard"))
        flash("Email or password not recognised.", "error")
    return render_template("auth.html", mode="login")

@app.post("/logout")
def logout(): session.clear(); flash("You are signed out.", "info"); return redirect(url_for("index"))

@app.route("/dashboard")
@login_required
def dashboard():
    with db() as conn:
        logs = conn.execute("SELECT * FROM health_logs WHERE user_id=? ORDER BY logged_at DESC LIMIT 5",(session["user_id"],)).fetchall()
        reminders = conn.execute("SELECT * FROM reminders WHERE user_id=? AND done=0 ORDER BY due_at LIMIT 5",(session["user_id"],)).fetchall()
        reports = conn.execute("SELECT * FROM reports WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 3",(session["user_id"],)).fetchall()
    return render_template("dashboard.html", logs=logs, reminders=reminders, reports=reports)

@app.route("/assistant", methods=["GET","POST"])
@login_required
def assistant():
    answer = None
    if request.method == "POST":
        q = request.form.get("question","").strip()
        if q:
            answer = generate_ai_answer(q)
    return render_template("assistant.html", answer=answer)

@app.route("/reports", methods=["GET","POST"])
@login_required
def reports():
    if request.method == "POST":
        f = request.files.get("report")
        ext = Path(f.filename).suffix.lower().lstrip(".") if f and f.filename else ""
        header = f.stream.read(12) if f else b""
        f.stream.seek(0) if f else None
        valid_signature = ((ext == "pdf" and header.startswith(b"%PDF")) or
                           (ext in {"jpg", "jpeg"} and header.startswith(b"\xff\xd8\xff")) or
                           (ext == "png" and header.startswith(b"\x89PNG\r\n\x1a\n")))
        if not f or not f.filename or ext not in ALLOWED or not valid_signature:
            flash("Upload a PDF, PNG, JPG, or JPEG file.", "error")
        else:
            original = secure_filename(f.filename); stored = f"{uuid.uuid4().hex}_{original}"
            path = UPLOAD_DIR / stored; f.save(path); text = ""
            if path.suffix.lower() == ".pdf":
                try:
                    import pypdf
                    text = "\n".join((p.extract_text() or "") for p in pypdf.PdfReader(str(path)).pages)[:20000]
                except Exception: text = "PDF saved. Install pypdf for text extraction."
            elif path.suffix.lower() in {".png",".jpg",".jpeg"}:
                try:
                    import pytesseract
                    from PIL import Image
                    text = pytesseract.image_to_string(Image.open(path))[:20000]
                except Exception: text = "Image saved. Optional OCR dependencies are not installed."
            with db() as conn:
                conn.execute("INSERT INTO reports(user_id,filename,stored_name,extracted_text,uploaded_at) VALUES(?,?,?,?,?)",
                             (session["user_id"], original, stored, text, datetime.now().isoformat(timespec="minutes"))); conn.commit()
            flash("Report uploaded securely.", "success"); return redirect(url_for("reports"))
    with db() as conn: rows=conn.execute("SELECT * FROM reports WHERE user_id=? ORDER BY uploaded_at DESC",(session["user_id"],)).fetchall()
    return render_template("reports.html", reports=rows)

@app.route("/reports/<int:report_id>")
@login_required
def report_detail(report_id):
    with db() as conn: r=conn.execute("SELECT * FROM reports WHERE id=? AND user_id=?",(report_id,session["user_id"])).fetchone()
    if not r: abort(404)
    return render_template("report_detail.html", report=r)

@app.post("/reports/<int:report_id>/delete")
@login_required
def delete_report(report_id):
    with db() as conn:
        report = conn.execute("SELECT stored_name FROM reports WHERE id=? AND user_id=?", (report_id, session["user_id"])).fetchone()
        if not report:
            abort(404)
        conn.execute("DELETE FROM reports WHERE id=? AND user_id=?", (report_id, session["user_id"]))
        conn.commit()
    path = UPLOAD_DIR / report["stored_name"]
    if path.exists():
        path.unlink()
    flash("Report deleted.", "success")
    return redirect(url_for("reports"))

@app.route("/health", methods=["GET","POST"])
@login_required
def health():
    if request.method=="POST":
        with db() as conn:
            conn.execute("INSERT INTO health_logs(user_id,log_type,value,notes,logged_at) VALUES(?,?,?,?,?)",
                         (session["user_id"],request.form.get("log_type"),request.form.get("value"),request.form.get("notes"),request.form.get("logged_at") or date.today().isoformat())); conn.commit()
        flash("Health log added.", "success"); return redirect(url_for("health"))
    with db() as conn: logs=conn.execute("SELECT * FROM health_logs WHERE user_id=? ORDER BY logged_at DESC",(session["user_id"],)).fetchall()
    return render_template("health.html", logs=logs)

@app.post("/health/<int:log_id>/delete")
@login_required
def delete_health_log(log_id):
    with db() as conn:
        conn.execute("DELETE FROM health_logs WHERE id=? AND user_id=?", (log_id, session["user_id"]))
        conn.commit()
    flash("Health log deleted.", "success")
    return redirect(url_for("health"))

@app.route("/planner", methods=["GET","POST"])
@login_required
def planner():
    if request.method=="POST":
        with db() as conn: conn.execute("INSERT INTO reminders(user_id,title,due_at,repeat_rule) VALUES(?,?,?,?)",(session["user_id"],request.form.get("title"),request.form.get("due_at"),request.form.get("repeat_rule"))); conn.commit()
        flash("Reminder saved.", "success"); return redirect(url_for("planner"))
    with db() as conn: reminders=conn.execute("SELECT * FROM reminders WHERE user_id=? ORDER BY done,due_at",(session["user_id"],)).fetchall()
    return render_template("planner.html", reminders=reminders)

@app.post("/planner/<int:reminder_id>/done")
@login_required
def reminder_done(reminder_id):
    with db() as conn: conn.execute("UPDATE reminders SET done=1-done WHERE id=? AND user_id=?",(reminder_id,session["user_id"])); conn.commit()
    return redirect(url_for("planner"))

@app.post("/planner/<int:reminder_id>/delete")
@login_required
def delete_reminder(reminder_id):
    with db() as conn:
        conn.execute("DELETE FROM reminders WHERE id=? AND user_id=?", (reminder_id, session["user_id"]))
        conn.commit()
    return redirect(url_for("planner"))

@app.route("/family", methods=["GET","POST"])
@login_required
def family():
    if request.method=="POST":
        with db() as conn: conn.execute("INSERT INTO family_contacts(user_id,name,relation,email,phone) VALUES(?,?,?,?,?)",(session["user_id"],request.form.get("name"),request.form.get("relation"),request.form.get("email"),request.form.get("phone"))); conn.commit()
        flash("Contact added.", "success"); return redirect(url_for("family"))
    with db() as conn: contacts=conn.execute("SELECT * FROM family_contacts WHERE user_id=?",(session["user_id"],)).fetchall()
    return render_template("family.html", contacts=contacts)

@app.get("/summary")
@login_required
def summary():
    with db() as conn:
        logs = conn.execute("SELECT * FROM health_logs WHERE user_id=? ORDER BY logged_at DESC LIMIT 12", (session["user_id"],)).fetchall()
        reports = conn.execute("SELECT filename, uploaded_at FROM reports WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 6", (session["user_id"],)).fetchall()
    return render_template("summary.html", logs=logs, reports=reports)

@app.route("/profile", methods=["GET","POST"])
@login_required
def profile():
    if request.method=="POST":
        with db() as conn: conn.execute("UPDATE users SET name=?,privacy_consent=? WHERE id=?",(request.form.get("name"),1 if request.form.get("privacy_consent") else 0,session["user_id"])); conn.commit()
        flash("Profile updated.", "success"); return redirect(url_for("profile"))
    return render_template("profile.html")

@app.post("/profile/delete-account")
@login_required
def delete_account():
    user_id = session["user_id"]
    with db() as conn:
        report_names = conn.execute("SELECT stored_name FROM reports WHERE user_id=?", (user_id,)).fetchall()
        for table in ("health_logs", "reminders", "reports", "family_contacts"):
            conn.execute(f"DELETE FROM {table} WHERE user_id=?", (user_id,))
        conn.execute("DELETE FROM users WHERE id=?", (user_id,))
        conn.commit()
    for report in report_names:
        path = UPLOAD_DIR / report["stored_name"]
        if path.exists():
            path.unlink()
    session.clear()
    flash("Your account and local data were deleted.", "info")
    return redirect(url_for("index"))

@app.route("/uploads/<path:name>")
@login_required
def protected_upload(name):
    with db() as conn: ok=conn.execute("SELECT 1 FROM reports WHERE user_id=? AND stored_name=?",(session["user_id"],name)).fetchone()
    if not ok: abort(404)
    return send_from_directory(UPLOAD_DIR, name, as_attachment=True)

@app.get("/api/chart-data")
@login_required
def chart_data():
    with db() as conn: rows=conn.execute("SELECT logged_at, value FROM health_logs WHERE user_id=? AND log_type='Weight' ORDER BY logged_at LIMIT 30",(session["user_id"],)).fetchall()
    points = []
    for row in rows:
        try:
            points.append((row["logged_at"], float(row["value"])))
        except (TypeError, ValueError):
            continue
    return jsonify({"labels":[label for label, _ in points],"values":[value for _, value in points]})

with app.app_context(): init_db()

if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG","0")=="1")
