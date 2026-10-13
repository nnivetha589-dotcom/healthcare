import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'medimate.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        preferred_language TEXT DEFAULT 'en', -- 'en' or 'ta'
        age INTEGER,
        gender TEXT,
        blood_group TEXT,
        allergies TEXT,
        chronic_conditions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Medical Reports table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        report_type TEXT, -- e.g., 'Blood Test', 'Lipid Profile', 'Prescription', etc.
        report_date TEXT,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL, -- 'pdf', 'jpg', 'png'
        extracted_text TEXT,
        analysis_json TEXT, -- JSON containing extracted metrics, explanations, status
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    ''')

    # Health Twin Logs (Daily metrics & symptoms)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS health_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        log_date DATE NOT NULL,
        symptoms TEXT, -- comma-separated or JSON
        severity INTEGER DEFAULT 1, -- 1 to 5
        sleep_hours REAL DEFAULT 7.0,
        water_liters REAL DEFAULT 2.0,
        exercise_mins INTEGER DEFAULT 0,
        wellness_notes TEXT,
        mood TEXT, -- 'good', 'neutral', 'tired', 'in_pain'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    ''')

    # Chat Messages (AI Assistant)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        sender TEXT NOT NULL, -- 'user' or 'ai'
        language TEXT DEFAULT 'en', -- 'en' or 'ta'
        message TEXT NOT NULL,
        source_indicator TEXT DEFAULT 'general', -- 'report_data', 'general_info', 'insufficient_info'
        is_urgent_warning BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    ''')

    # Reminders / Smart Health Planner
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- 'medication', 'water', 'sleep', 'exercise'
        dosage_or_target TEXT, -- e.g. "500mg after meal", "500ml", "30 mins walk"
        time_of_day TEXT NOT NULL, -- "08:00 AM" or "20:00"
        days_frequency TEXT DEFAULT 'Daily',
        status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'skipped'
        last_updated_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    ''')

    # Family Care and Sharing Permissions
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS family_shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        shared_with_email TEXT NOT NULL,
        relation TEXT, -- 'Parent', 'Spouse', 'Child', 'Doctor', 'Caregiver'
        access_level TEXT DEFAULT 'view_summary', -- 'view_summary', 'view_reports', 'full_view'
        consent_granted BOOLEAN DEFAULT 1,
        share_token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
    )
    ''')

    # Doctor Visit Summaries
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS doctor_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        visit_date TEXT,
        chief_complaints TEXT,
        symptoms_summary TEXT,
        relevant_reports TEXT,
        questions_to_ask TEXT, -- JSON array of questions
        lifestyle_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DB_PATH)
