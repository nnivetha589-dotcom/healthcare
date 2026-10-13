import json
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from database import get_db_connection, init_db

def populate_sample_data():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create fictional demo user if not exists
    cursor.execute("SELECT id FROM users WHERE email = 'demo@medimate.ai'")
    user = cursor.fetchone()

    if not user:
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, preferred_language, age, gender, blood_group, allergies, chronic_conditions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "Ananya Sundaram",
            "demo@medimate.ai",
            generate_password_hash("medimate123"),
            "en",
            34,
            "Female",
            "O+",
            "Penicillin, Peanuts",
            "Mild Asthma"
        ))
        user_id = cursor.lastrowid
    else:
        user_id = user['id']

    # Sample Reports
    cursor.execute("SELECT COUNT(*) as cnt FROM reports WHERE user_id = ?", (user_id,))
    if cursor.fetchone()['cnt'] == 0:
        # Report 1: 3 months ago (May 2026)
        rep1_analysis = {
            "metrics": [
                {"name": "HbA1c", "value": 6.2, "unit": "%", "reference_range": "4.0 - 5.6%", "explanation": "Average blood sugar levels over past 2-3 months."},
                {"name": "Fasting Blood Sugar", "value": 115, "unit": "mg/dL", "reference_range": "70 - 99 mg/dL", "explanation": "Glucose levels in blood after fasting."},
                {"name": "Total Cholesterol", "value": 218, "unit": "mg/dL", "reference_range": "< 200 mg/dL", "explanation": "Total waxy fat-like substance found in blood."},
                {"name": "HDL Cholesterol", "value": 42, "unit": "mg/dL", "reference_range": "> 40 mg/dL", "explanation": "High-Density Lipoprotein ('good cholesterol')."},
                {"name": "LDL Cholesterol", "value": 142, "unit": "mg/dL", "reference_range": "< 100 mg/dL", "explanation": "Low-Density Lipoprotein ('bad cholesterol')."},
                {"name": "Hemoglobin", "value": 13.5, "unit": "g/dL", "reference_range": "12.0 - 15.5 g/dL", "explanation": "Oxygen-carrying protein in red blood cells."}
            ],
            "summary": "Baseline Comprehensive Metabolic and Lipid Profile."
        }
        cursor.execute("""
            INSERT INTO reports (user_id, title, report_type, report_date, file_path, file_type, extracted_text, analysis_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            "Comprehensive Blood & Lipid Panel - Baseline",
            "Blood Test",
            "2026-05-15",
            "sample_blood_may2026.pdf",
            "pdf",
            "Patient: Ananya Sundaram | Date: 15-May-2026\nHbA1c: 6.2 %\nFasting Blood Sugar: 115 mg/dL\nTotal Cholesterol: 218 mg/dL\nHDL Cholesterol: 42 mg/dL\nLDL Cholesterol: 142 mg/dL\nHemoglobin: 13.5 g/dL\nNotes: Fasting 10 hours.",
            json.dumps(rep1_analysis)
        ))

        # Report 2: Recent Follow-up (August 2026)
        rep2_analysis = {
            "metrics": [
                {"name": "HbA1c", "value": 5.8, "unit": "%", "reference_range": "4.0 - 5.6%", "explanation": "Average blood sugar levels over past 2-3 months."},
                {"name": "Fasting Blood Sugar", "value": 102, "unit": "mg/dL", "reference_range": "70 - 99 mg/dL", "explanation": "Glucose levels in blood after fasting."},
                {"name": "Total Cholesterol", "value": 195, "unit": "mg/dL", "reference_range": "< 200 mg/dL", "explanation": "Total waxy fat-like substance found in blood."},
                {"name": "HDL Cholesterol", "value": 46, "unit": "mg/dL", "reference_range": "> 40 mg/dL", "explanation": "High-Density Lipoprotein ('good cholesterol')."},
                {"name": "LDL Cholesterol", "value": 121, "unit": "mg/dL", "reference_range": "< 100 mg/dL", "explanation": "Low-Density Lipoprotein ('bad cholesterol')."},
                {"name": "Hemoglobin", "value": 13.8, "unit": "g/dL", "reference_range": "12.0 - 15.5 g/dL", "explanation": "Oxygen-carrying protein in red blood cells."}
            ],
            "summary": "Follow-up testing shows improved glycemic and lipid markers."
        }
        cursor.execute("""
            INSERT INTO reports (user_id, title, report_type, report_date, file_path, file_type, extracted_text, analysis_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            "Follow-up Metabolic & Lipid Panel",
            "Blood Test",
            "2026-08-20",
            "sample_blood_aug2026.pdf",
            "pdf",
            "Patient: Ananya Sundaram | Date: 20-Aug-2026\nHbA1c: 5.8 %\nFasting Blood Sugar: 102 mg/dL\nTotal Cholesterol: 195 mg/dL\nHDL Cholesterol: 46 mg/dL\nLDL Cholesterol: 121 mg/dL\nHemoglobin: 13.8 g/dL\nNotes: Follow-up testing.",
            json.dumps(rep2_analysis)
        ))

    # Sample Health Logs (Past 7 days)
    cursor.execute("SELECT COUNT(*) as cnt FROM health_logs WHERE user_id = ?", (user_id,))
    if cursor.fetchone()['cnt'] == 0:
        base_date = datetime.today()
        sample_logs = [
            (-6, "Mild Fatigue", 1, 6.2, 1.8, 20, "Busy work day, felt a bit exhausted in the evening", "tired"),
            (-5, "None", 0, 7.5, 2.4, 35, "Brisk morning walk, feeling refreshed", "good"),
            (-4, "Slight Headache", 2, 6.0, 1.5, 15, "Long screen hours, eye strain", "neutral"),
            (-3, "Mild Fatigue", 1, 6.5, 2.0, 25, "Evening yoga session", "good"),
            (-2, "None", 0, 7.8, 2.6, 40, "Went for a 3km run, hydrated well", "good"),
            (-1, "Slight Headache", 2, 6.2, 1.7, 20, "Work deadlines, missed afternoon water intake", "neutral"),
            (0, "None", 0, 7.2, 2.2, 30, "Good morning, feeling balanced and energetic", "good")
        ]
        for days_ago, sym, sev, sleep, water, ex, notes, mood in sample_logs:
            log_date = (base_date + timedelta(days=days_ago)).strftime('%Y-%m-%d')
            cursor.execute("""
                INSERT INTO health_logs (user_id, log_date, symptoms, severity, sleep_hours, water_liters, exercise_mins, wellness_notes, mood)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, log_date, sym, sev, sleep, water, ex, notes, mood))

    # Sample Reminders
    cursor.execute("SELECT COUNT(*) as cnt FROM reminders WHERE user_id = ?", (user_id,))
    if cursor.fetchone()['cnt'] == 0:
        cursor.execute("""
            INSERT INTO reminders (user_id, title, category, dosage_or_target, time_of_day, days_frequency, status)
            VALUES 
            (?, 'Morning Hydration', 'water', '500 ml warm water', '07:30 AM', 'Daily', 'completed'),
            (?, 'Doctor-Prescribed Multivitamin', 'medication', '1 capsule with breakfast', '08:30 AM', 'Daily', 'pending'),
            (?, 'Evening Brisk Walk', 'exercise', '30 minutes moderate pace', '06:00 PM', 'Daily', 'pending'),
            (?, 'Sleep Wind-down Routine', 'sleep', 'Turn off blue screens & dim lights', '10:30 PM', 'Daily', 'pending')
        """, (user_id, user_id, user_id, user_id))

    # Sample Family Share
    cursor.execute("SELECT COUNT(*) as cnt FROM family_shares WHERE owner_id = ?", (user_id,))
    if cursor.fetchone()['cnt'] == 0:
        cursor.execute("""
            INSERT INTO family_shares (owner_id, shared_with_email, relation, access_level, consent_granted, share_token)
            VALUES (?, 'karthik.sundaram@gmail.com', 'Spouse', 'full_view', 1, 'demo-family-share-token-123')
        """, (user_id,))

    conn.commit()
    conn.close()
    print("Sample data populated successfully for user: demo@medimate.ai")

if __name__ == '__main__':
    populate_sample_data()
