import sqlite3
from datetime import date, datetime, timedelta

from flask import current_app
from werkzeug.security import generate_password_hash


def db():
    conn = sqlite3.connect(current_app.config["DB_PATH"])
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
        cur = conn.execute(
            "INSERT INTO users(name,email,password_hash,created_at) VALUES(?,?,?,?)",
            ("Demo Patient", "demo@medimate.local", generate_password_hash("demo1234"), now),
        )
        uid = cur.lastrowid
        conn.executemany(
            "INSERT INTO health_logs(user_id,log_type,value,notes,logged_at) VALUES(?,?,?,?,?)",
            [
                (uid, "Mood", "Good", "Slept well", (date.today() - timedelta(days=2)).isoformat()),
                (uid, "Weight", "72", "kg", (date.today() - timedelta(days=1)).isoformat()),
                (uid, "Blood pressure", "120/80", "Morning reading", date.today().isoformat()),
            ],
        )
        conn.execute(
            "INSERT INTO reminders(user_id,title,due_at,repeat_rule) VALUES(?,?,?,?)",
            (uid, "Take morning medication", "08:00", "Daily"),
        )
    conn.commit()
    conn.close()
