import os
import json
import uuid
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from database import get_db_connection, init_db
from ai_service import ai_service
from extractor import extract_text_from_pdf, extract_text_from_image

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16 MB max limit
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- AUTHENTICATION & USER PROFILE ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    preferred_language = data.get('preferred_language', 'en')
    age = data.get('age')
    gender = data.get('gender', '')
    blood_group = data.get('blood_group', '')
    allergies = data.get('allergies', '')
    chronic_conditions = data.get('chronic_conditions', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'An account with this email already exists'}), 400

    hashed_pw = generate_password_hash(password)
    cursor.execute("""
        INSERT INTO users (name, email, password_hash, preferred_language, age, gender, blood_group, allergies, chronic_conditions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (name, email, hashed_pw, preferred_language, age, gender, blood_group, allergies, chronic_conditions))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Registration successful',
        'user': {
            'id': user_id,
            'name': name,
            'email': email,
            'preferred_language': preferred_language,
            'age': age,
            'gender': gender,
            'blood_group': blood_group,
            'allergies': allergies,
            'chronic_conditions': chronic_conditions
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'preferred_language': user['preferred_language'],
            'age': user['age'],
            'gender': user['gender'],
            'blood_group': user['blood_group'],
            'allergies': user['allergies'],
            'chronic_conditions': user['chronic_conditions']
        }
    })

@app.route('/api/profile/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
def profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute("SELECT id, name, email, preferred_language, age, gender, blood_group, allergies, chronic_conditions, created_at FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(dict(user))

    elif request.method == 'PUT':
        data = request.json or {}
        cursor.execute("""
            UPDATE users SET 
                name = COALESCE(?, name),
                preferred_language = COALESCE(?, preferred_language),
                age = COALESCE(?, age),
                gender = COALESCE(?, gender),
                blood_group = COALESCE(?, blood_group),
                allergies = COALESCE(?, allergies),
                chronic_conditions = COALESCE(?, chronic_conditions)
            WHERE id = ?
        """, (data.get('name'), data.get('preferred_language'), data.get('age'),
              data.get('gender'), data.get('blood_group'), data.get('allergies'),
              data.get('chronic_conditions'), user_id))
        conn.commit()
        cursor.execute("SELECT id, name, email, preferred_language, age, gender, blood_group, allergies, chronic_conditions FROM users WHERE id = ?", (user_id,))
        updated = cursor.fetchone()
        conn.close()
        return jsonify({'message': 'Profile updated successfully', 'user': dict(updated)})

    elif request.method == 'DELETE':
        # Privacy & Account deletion
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        cursor.execute("DELETE FROM reports WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM health_logs WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM chat_messages WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM reminders WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM doctor_summaries WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM family_shares WHERE owner_id = ?", (user_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'All account data permanently deleted'})

# --- FEATURE 1 & 4: AI HEALTH ASSISTANT & VOICE CHAT ---

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    user_id = data.get('user_id', 1)
    message = data.get('message', '').strip()
    language = data.get('language', 'en')
    include_reports = data.get('include_reports', False)

    if not message:
        return jsonify({'error': 'Message content cannot be empty'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    context_reports = ""
    if include_reports:
        cursor.execute("SELECT title, report_date, extracted_text FROM reports WHERE user_id = ? ORDER BY id DESC LIMIT 2", (user_id,))
        reports = cursor.fetchall()
        for r in reports:
            context_reports += f"\nReport: {r['title']} ({r['report_date']})\n{r['extracted_text'][:400]}"

    # Save user message
    cursor.execute("""
        INSERT INTO chat_messages (user_id, sender, language, message, source_indicator, is_urgent_warning)
        VALUES (?, 'user', ?, ?, 'user', 0)
    """, (user_id, language, message))

    # Generate response
    ai_resp = ai_service.generate_chat_response(message, lang=language, context_records=context_reports if include_reports else None)

    # Save AI message
    cursor.execute("""
        INSERT INTO chat_messages (user_id, sender, language, message, source_indicator, is_urgent_warning)
        VALUES (?, 'ai', ?, ?, ?, ?)
    """, (user_id, language, ai_resp['text'], ai_resp['source'], 1 if ai_resp['is_urgent'] else 0))

    conn.commit()
    conn.close()

    return jsonify({
        'reply': ai_resp['text'],
        'source': ai_resp['source'],
        'is_urgent': ai_resp['is_urgent'],
        'is_demo_mode': ai_resp['is_demo_mode']
    })

@app.route('/api/chat/history/<int:user_id>', methods=['GET', 'DELETE'])
def chat_history(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    if request.method == 'GET':
        cursor.execute("SELECT * FROM chat_messages WHERE user_id = ? ORDER BY id ASC", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])
    elif request.method == 'DELETE':
        cursor.execute("DELETE FROM chat_messages WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Chat history cleared'})

# --- FEATURE 2: SMART MEDICAL REPORT CENTRE ---

@app.route('/api/reports/upload', methods=['POST'])
def upload_report():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in upload request'}), 400

    file = request.files['file']
    user_id = request.form.get('user_id', 1)
    title = request.form.get('title', '').strip() or 'Medical Report'
    report_type = request.form.get('report_type', 'Lab Test')
    report_date = request.form.get('report_date', datetime.today().strftime('%Y-%m-%d'))

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only PDF, JPG, and PNG files are accepted.'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    saved_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(saved_path)

    # Text extraction
    extracted_text = ""
    if ext == 'pdf':
        extracted_text = extract_text_from_pdf(saved_path)
    else:
        extracted_text = extract_text_from_image(saved_path)

    # Safe analysis of extracted text without fabrication
    metrics = ai_service.analyze_report_text(extracted_text)
    analysis_data = {
        'metrics': metrics,
        'summary': f"Successfully analyzed report with {len(metrics)} identified parameters."
    }

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reports (user_id, title, report_type, report_date, file_path, file_type, extracted_text, analysis_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, title, report_type, report_date, unique_filename, ext, extracted_text, json.dumps(analysis_data)))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Report uploaded and parsed successfully',
        'report': {
            'id': report_id,
            'title': title,
            'report_type': report_type,
            'report_date': report_date,
            'file_name': unique_filename,
            'file_type': ext,
            'extracted_text': extracted_text,
            'analysis': analysis_data
        }
    }), 201

@app.route('/api/reports/<int:user_id>', methods=['GET'])
def get_reports(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE user_id = ? ORDER BY report_date DESC, id DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()

    reports = []
    for r in rows:
        rep = dict(r)
        if rep['analysis_json']:
            try:
                rep['analysis'] = json.loads(rep['analysis_json'])
            except Exception:
                rep['analysis'] = {}
        reports.append(rep)
    return jsonify(reports)

@app.route('/api/reports/detail/<int:report_id>', methods=['DELETE'])
def delete_report(report_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    if row:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], row['file_path'])
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error removing file: {e}")
        cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        conn.commit()
    conn.close()
    return jsonify({'message': 'Report deleted successfully'})

@app.route('/api/reports/compare', methods=['GET'])
def compare_reports():
    user_id = request.args.get('user_id')
    rep1_id = request.args.get('rep1')
    rep2_id = request.args.get('rep2')

    if not rep1_id or not rep2_id:
        return jsonify({'error': 'Two report IDs are required for comparison'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, report_date, analysis_json FROM reports WHERE id IN (?, ?) AND user_id = ?", (rep1_id, rep2_id, user_id))
    rows = cursor.fetchall()
    conn.close()

    if len(rows) < 2:
        return jsonify({'error': 'Both reports must belong to the user'}), 404

    rep1 = dict(rows[0])
    rep2 = dict(rows[1])
    # Order by date
    if rep1['report_date'] > rep2['report_date']:
        older, newer = rep2, rep1
    else:
        older, newer = rep1, rep2

    older_metrics = {m['name']: m for m in json.loads(older['analysis_json']).get('metrics', [])}
    newer_metrics = {m['name']: m for m in json.loads(newer['analysis_json']).get('metrics', [])}

    comparison = []
    all_keys = set(older_metrics.keys()).union(set(newer_metrics.keys()))

    for key in all_keys:
        old_val = older_metrics.get(key, {}).get('value', 'N/A')
        new_val = newer_metrics.get(key, {}).get('value', 'N/A')
        unit = newer_metrics.get(key, {}).get('unit') or older_metrics.get(key, {}).get('unit', '')
        ref = newer_metrics.get(key, {}).get('reference_range') or older_metrics.get(key, {}).get('reference_range', '')
        
        diff = "No change"
        status = "neutral"
        try:
            if old_val != 'N/A' and new_val != 'N/A':
                diff_num = round(float(new_val) - float(old_val), 2)
                if diff_num > 0:
                    diff = f"+{diff_num} ({unit})"
                    status = "increased"
                elif diff_num < 0:
                    diff = f"{diff_num} ({unit})"
                    status = "decreased"
                else:
                    diff = f"0.0 ({unit})"
                    status = "stable"
        except Exception:
            pass

        comparison.append({
            'name': key,
            'old_value': old_val,
            'new_value': new_val,
            'unit': unit,
            'reference_range': ref,
            'change': diff,
            'status': status,
            'explanation': ai_service.explain_medical_term(key)
        })

    return jsonify({
        'older_report': {'id': older['id'], 'title': older['title'], 'date': older['report_date']},
        'newer_report': {'id': newer['id'], 'title': newer['title'], 'date': newer['report_date']},
        'comparison': comparison
    })

# --- FEATURE 3: PERSONAL AI HEALTH TWIN ---

@app.route('/api/health-logs/<int:user_id>', methods=['GET', 'POST'])
def health_logs(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        data = request.json or {}
        log_date = data.get('log_date', datetime.today().strftime('%Y-%m-%d'))
        symptoms = data.get('symptoms', '')
        severity = data.get('severity', 1)
        sleep_hours = data.get('sleep_hours', 7.0)
        water_liters = data.get('water_liters', 2.0)
        exercise_mins = data.get('exercise_mins', 0)
        wellness_notes = data.get('wellness_notes', '')
        mood = data.get('mood', 'good')

        cursor.execute("""
            INSERT INTO health_logs (user_id, log_date, symptoms, severity, sleep_hours, water_liters, exercise_mins, wellness_notes, mood)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, log_date, symptoms, severity, sleep_hours, water_liters, exercise_mins, wellness_notes, mood))
        log_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'message': 'Health log recorded', 'id': log_id}), 201

    else:
        cursor.execute("SELECT * FROM health_logs WHERE user_id = ? ORDER BY log_date ASC", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        logs = [dict(r) for r in rows]

        # Pattern identification (Distinctly educational, not medical diagnoses)
        symptom_frequency = {}
        total_sleep = 0
        total_water = 0
        for l in logs:
            if l['symptoms']:
                for s in l['symptoms'].split(','):
                    s_clean = s.strip().title()
                    if s_clean:
                        symptom_frequency[s_clean] = symptom_frequency.get(s_clean, 0) + 1
            total_sleep += l['sleep_hours']
            total_water += l['water_liters']

        count = len(logs) if len(logs) > 0 else 1
        avg_sleep = round(total_sleep / count, 1)
        avg_water = round(total_water / count, 1)

        patterns = []
        for sym, freq in symptom_frequency.items():
            if freq >= 2:
                patterns.append(f"Recorded '{sym}' on {freq} occasions across logged days.")

        if avg_sleep < 6.5 and len(logs) >= 3:
            patterns.append(f"Recorded average sleep is {avg_sleep} hrs, which is below the 7-8 hour recommended target.")
        if avg_water < 1.8 and len(logs) >= 3:
            patterns.append(f"Average daily water intake is {avg_water}L. Increasing hydration can support energy levels.")

        return jsonify({
            'logs': logs,
            'summary': {
                'avg_sleep': avg_sleep,
                'avg_water': avg_water,
                'patterns': patterns,
                'disclaimer': 'Observed patterns reflect user-logged lifestyle habits, not a medical conclusion or clinical diagnosis.'
            }
        })

@app.route('/api/health-logs/entry/<int:log_id>', methods=['PUT', 'DELETE'])
def manage_health_log(log_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    if request.method == 'DELETE':
        cursor.execute("DELETE FROM health_logs WHERE id = ?", (log_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Log entry deleted'})
    elif request.method == 'PUT':
        data = request.json or {}
        cursor.execute("""
            UPDATE health_logs SET 
                symptoms = COALESCE(?, symptoms),
                severity = COALESCE(?, severity),
                sleep_hours = COALESCE(?, sleep_hours),
                water_liters = COALESCE(?, water_liters),
                exercise_mins = COALESCE(?, exercise_mins),
                wellness_notes = COALESCE(?, wellness_notes),
                mood = COALESCE(?, mood)
            WHERE id = ?
        """, (data.get('symptoms'), data.get('severity'), data.get('sleep_hours'),
              data.get('water_liters'), data.get('exercise_mins'), data.get('wellness_notes'),
              data.get('mood'), log_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Log updated successfully'})

# --- FEATURE 5: SMART HEALTH PLANNER & REMINDERS ---

@app.route('/api/reminders/<int:user_id>', methods=['GET', 'POST'])
def reminders(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        data = request.json or {}
        title = data.get('title', '').strip()
        category = data.get('category', 'medication')
        dosage_or_target = data.get('dosage_or_target', '')
        time_of_day = data.get('time_of_day', '08:00 AM')
        days_frequency = data.get('days_frequency', 'Daily')

        if not title:
            return jsonify({'error': 'Reminder title is required'}), 400

        cursor.execute("""
            INSERT INTO reminders (user_id, title, category, dosage_or_target, time_of_day, days_frequency, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        """, (user_id, title, category, dosage_or_target, time_of_day, days_frequency))
        rem_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'message': 'Reminder created successfully', 'id': rem_id}), 201

    else:
        cursor.execute("SELECT * FROM reminders WHERE user_id = ? ORDER BY id DESC", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])

@app.route('/api/reminders/status/<int:reminder_id>', methods=['PATCH', 'DELETE'])
def reminder_status(reminder_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'DELETE':
        cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Reminder removed'})

    elif request.method == 'PATCH':
        status = request.json.get('status')
        if status not in ['pending', 'completed', 'skipped']:
            return jsonify({'error': 'Invalid status'}), 400

        cursor.execute("UPDATE reminders SET status = ?, last_updated_date = CURRENT_DATE WHERE id = ?", (status, reminder_id))
        conn.commit()
        conn.close()
        return jsonify({'message': f'Reminder marked as {status}'})

# --- FEATURE 6: FAMILY CARE & DOCTOR VISIT ASSISTANT ---

@app.route('/api/doctor-summaries/<int:user_id>', methods=['GET', 'POST'])
def doctor_summaries(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        data = request.json or {}
        title = data.get('title', 'Doctor Visit Briefing')
        visit_date = data.get('visit_date', datetime.today().strftime('%Y-%m-%d'))
        chief_complaints = data.get('chief_complaints', '')
        selected_symptoms = data.get('symptoms', '')
        selected_reports = data.get('reports', '')
        
        # Build smart questions to ask doctor based on reported conditions
        questions = [
            "Are there any interactions between my current lifestyle habits and these symptoms?",
            "What specific signs should prompt me to follow up sooner?",
            "Do any of my lab values require follow-up testing in 3 to 6 months?"
        ]
        if "fever" in chief_complaints.lower() or "fever" in selected_symptoms.lower():
            questions.append("Is a CBC or viral blood panel recommended to rule out seasonal infection?")
        if "cholesterol" in selected_reports.lower() or "lipid" in selected_reports.lower():
            questions.append("What specific dietary adjustments do you advise for optimizing my lipid profile?")
        if "blood pressure" in selected_reports.lower():
            questions.append("Should I log morning and evening BP readings for the next 2 weeks?")

        lifestyle_summary = f"Generated by MediMate AI to empower your clinician discussion."

        cursor.execute("""
            INSERT INTO doctor_summaries (user_id, title, visit_date, chief_complaints, symptoms_summary, relevant_reports, questions_to_ask, lifestyle_summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, title, visit_date, chief_complaints, selected_symptoms, selected_reports, json.dumps(questions), lifestyle_summary))
        sum_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'message': 'Doctor visit summary compiled', 'id': sum_id}), 201

    else:
        cursor.execute("SELECT * FROM doctor_summaries WHERE user_id = ? ORDER BY id DESC", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        res = []
        for r in rows:
            item = dict(r)
            if item['questions_to_ask']:
                try:
                    item['questions'] = json.loads(item['questions_to_ask'])
                except Exception:
                    item['questions'] = []
            res.append(item)
        return jsonify(res)

@app.route('/api/family-shares/<int:user_id>', methods=['GET', 'POST'])
def family_shares(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        data = request.json or {}
        shared_with_email = data.get('shared_with_email', '').strip().lower()
        relation = data.get('relation', 'Caregiver')
        access_level = data.get('access_level', 'view_summary')

        if not shared_with_email:
            return jsonify({'error': 'Recipient email is required for consent sharing'}), 400

        token = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO family_shares (owner_id, shared_with_email, relation, access_level, consent_granted, share_token)
            VALUES (?, ?, ?, ?, 1, ?)
        """, (user_id, shared_with_email, relation, access_level, token))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Consent granted and family access link generated', 'share_token': token}), 201

    else:
        cursor.execute("SELECT * FROM family_shares WHERE owner_id = ? ORDER BY id DESC", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])

@app.route('/api/family-shares/revoke/<int:share_id>', methods=['DELETE'])
def revoke_family_share(share_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM family_shares WHERE id = ?", (share_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Sharing permission revoked immediately'})

# Public / Family View via Token
@app.route('/api/shared-records/<token>', methods=['GET'])
def get_shared_records(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM family_shares WHERE share_token = ? AND consent_granted = 1", (token,))
    share = cursor.fetchone()
    if not share:
        conn.close()
        return jsonify({'error': 'Shared link invalid or permission revoked'}), 403

    owner_id = share['owner_id']
    cursor.execute("SELECT name, age, gender, blood_group, allergies FROM users WHERE id = ?", (owner_id,))
    owner = cursor.fetchone()

    cursor.execute("SELECT log_date, symptoms, severity, sleep_hours, water_liters, mood FROM health_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 7", (owner_id,))
    logs = [dict(r) for r in cursor.fetchall()]

    reports = []
    if share['access_level'] in ['view_reports', 'full_view']:
        cursor.execute("SELECT id, title, report_date, report_type, analysis_json FROM reports WHERE user_id = ? ORDER BY report_date DESC LIMIT 5", (owner_id,))
        for r in cursor.fetchall():
            rd = dict(r)
            rd['analysis'] = json.loads(rd['analysis_json']) if rd['analysis_json'] else {}
            reports.append(rd)

    conn.close()
    return jsonify({
        'owner': dict(owner),
        'access_level': share['access_level'],
        'relation': share['relation'],
        'logs': logs,
        'reports': reports
    })

# --- SAMPLE DATA INITIALIZATION ---
@app.route('/api/init-sample-data', methods=['POST'])
def init_sample():
    from seed_data import populate_sample_data
    populate_sample_data()
    return jsonify({'message': 'Fictional sample patient data loaded successfully'})

@app.route('/api/health-check', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'MediMate AI API',
        'version': '1.0.0',
        'ai_mode': 'Demo Mode' if ai_service.is_demo_mode else 'Live Gemini API'
    })

if __name__ == '__main__':
    init_db()
    app.run(host='127.0.0.1', port=5005, debug=False)
