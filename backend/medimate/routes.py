import re
import sqlite3
import uuid
from datetime import date, datetime
from functools import wraps
from pathlib import Path

from flask import (
    abort, current_app, flash, g, jsonify, redirect, render_template, request,
    send_from_directory, session, url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from .db import db
from .services.ai import generate_ai_answer
from .services.reports import extract_report_text


ALLOWED = {"pdf", "png", "jpg", "jpeg"}


def current_user():
    if "current_user" not in g:
        user_id = session.get("user_id")
        if not user_id:
            g.current_user = None
        else:
            with db() as conn:
                g.current_user = conn.execute(
                    "SELECT * FROM users WHERE id=?", (user_id,)
                ).fetchone()
    return g.current_user


def login_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if not current_user():
            flash("Please sign in to continue.", "info")
            return redirect(url_for("login", next=request.path))
        return fn(*args, **kwargs)

    return wrapped


def register_routes(app):
    @app.context_processor
    def inject():
        return {
            "user": current_user(),
            "demo_ai": current_app.config["DEMO_AI"],
            "year": date.today().year,
        }

    @app.route("/")
    def index():
        return redirect(url_for("dashboard")) if current_user() else render_template("landing.html")

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            email = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")
            if not name or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) or len(password) < 8:
                flash("Enter a name, valid email, and password of at least 8 characters.", "error")
            else:
                try:
                    with db() as conn:
                        conn.execute(
                            "INSERT INTO users(name,email,password_hash,created_at) VALUES(?,?,?,?)",
                            (name, email, generate_password_hash(password), datetime.now().isoformat(timespec="minutes")),
                        )
                        conn.commit()
                    flash("Account created. Welcome to MediMate!", "success")
                    return redirect(url_for("login"))
                except sqlite3.IntegrityError:
                    flash("That email is already registered.", "error")
        return render_template("auth.html", mode="register")

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            with db() as conn:
                user = conn.execute(
                    "SELECT * FROM users WHERE email=?", (request.form.get("email", "").lower(),)
                ).fetchone()
            if user and check_password_hash(user["password_hash"], request.form.get("password", "")):
                session.clear()
                session["user_id"] = user["id"]
                return redirect(request.args.get("next") or url_for("dashboard"))
            flash("Email or password not recognised.", "error")
        return render_template("auth.html", mode="login")

    @app.post("/logout")
    def logout():
        session.clear()
        flash("You are signed out.", "info")
        return redirect(url_for("index"))

    @app.route("/dashboard")
    @login_required
    def dashboard():
        with db() as conn:
            logs = conn.execute("SELECT * FROM health_logs WHERE user_id=? ORDER BY logged_at DESC LIMIT 5", (session["user_id"],)).fetchall()
            reminders = conn.execute("SELECT * FROM reminders WHERE user_id=? AND done=0 ORDER BY due_at LIMIT 5", (session["user_id"],)).fetchall()
            reports = conn.execute("SELECT * FROM reports WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 3", (session["user_id"],)).fetchall()
        return render_template("dashboard.html", logs=logs, reminders=reminders, reports=reports)

    @app.route("/assistant", methods=["GET", "POST"])
    @login_required
    def assistant():
        answer = None
        if request.method == "POST":
            question = request.form.get("question", "").strip()
            if question:
                answer = generate_ai_answer(current_app, question)
        return render_template("assistant.html", answer=answer)

    @app.route("/reports", methods=["GET", "POST"])
    @login_required
    def reports():
        if request.method == "POST":
            upload = request.files.get("report")
            extension = Path(upload.filename).suffix.lower().lstrip(".") if upload and upload.filename else ""
            header = upload.stream.read(12) if upload else b""
            if upload:
                upload.stream.seek(0)
            valid_signature = (
                (extension == "pdf" and header.startswith(b"%PDF"))
                or (extension in {"jpg", "jpeg"} and header.startswith(b"\xff\xd8\xff"))
                or (extension == "png" and header.startswith(b"\x89PNG\r\n\x1a\n"))
            )
            if not upload or not upload.filename or extension not in ALLOWED or not valid_signature:
                flash("Upload a PDF, PNG, JPG, or JPEG file.", "error")
            else:
                original = secure_filename(upload.filename)
                stored = f"{uuid.uuid4().hex}_{original}"
                path = current_app.config["UPLOAD_DIR"] / stored
                upload.save(path)
                text = extract_report_text(path)
                with db() as conn:
                    conn.execute(
                        "INSERT INTO reports(user_id,filename,stored_name,extracted_text,uploaded_at) VALUES(?,?,?,?,?)",
                        (session["user_id"], original, stored, text, datetime.now().isoformat(timespec="minutes")),
                    )
                    conn.commit()
                flash("Report uploaded securely.", "success")
                return redirect(url_for("reports"))
        with db() as conn:
            rows = conn.execute("SELECT * FROM reports WHERE user_id=? ORDER BY uploaded_at DESC", (session["user_id"],)).fetchall()
        return render_template("reports.html", reports=rows)

    @app.route("/reports/<int:report_id>")
    @login_required
    def report_detail(report_id):
        with db() as conn:
            report = conn.execute("SELECT * FROM reports WHERE id=? AND user_id=?", (report_id, session["user_id"])).fetchone()
        if not report:
            abort(404)
        return render_template("report_detail.html", report=report)

    @app.post("/reports/<int:report_id>/delete")
    @login_required
    def delete_report(report_id):
        with db() as conn:
            report = conn.execute("SELECT stored_name FROM reports WHERE id=? AND user_id=?", (report_id, session["user_id"])).fetchone()
            if not report:
                abort(404)
            conn.execute("DELETE FROM reports WHERE id=? AND user_id=?", (report_id, session["user_id"]))
            conn.commit()
        path = current_app.config["UPLOAD_DIR"] / report["stored_name"]
        if path.exists():
            path.unlink()
        flash("Report deleted.", "success")
        return redirect(url_for("reports"))

    @app.route("/health", methods=["GET", "POST"])
    @login_required
    def health():
        if request.method == "POST":
            with db() as conn:
                conn.execute(
                    "INSERT INTO health_logs(user_id,log_type,value,notes,logged_at) VALUES(?,?,?,?,?)",
                    (session["user_id"], request.form.get("log_type"), request.form.get("value"), request.form.get("notes"), request.form.get("logged_at") or date.today().isoformat()),
                )
                conn.commit()
            flash("Health log added.", "success")
            return redirect(url_for("health"))
        with db() as conn:
            logs = conn.execute("SELECT * FROM health_logs WHERE user_id=? ORDER BY logged_at DESC", (session["user_id"],)).fetchall()
        return render_template("health.html", logs=logs)

    @app.post("/health/<int:log_id>/delete")
    @login_required
    def delete_health_log(log_id):
        with db() as conn:
            conn.execute("DELETE FROM health_logs WHERE id=? AND user_id=?", (log_id, session["user_id"]))
            conn.commit()
        flash("Health log deleted.", "success")
        return redirect(url_for("health"))

    @app.route("/planner", methods=["GET", "POST"])
    @login_required
    def planner():
        if request.method == "POST":
            with db() as conn:
                conn.execute("INSERT INTO reminders(user_id,title,due_at,repeat_rule) VALUES(?,?,?,?)", (session["user_id"], request.form.get("title"), request.form.get("due_at"), request.form.get("repeat_rule")))
                conn.commit()
            flash("Reminder saved.", "success")
            return redirect(url_for("planner"))
        with db() as conn:
            reminders = conn.execute("SELECT * FROM reminders WHERE user_id=? ORDER BY done,due_at", (session["user_id"],)).fetchall()
        return render_template("planner.html", reminders=reminders)

    @app.post("/planner/<int:reminder_id>/done")
    @login_required
    def reminder_done(reminder_id):
        with db() as conn:
            conn.execute("UPDATE reminders SET done=1-done WHERE id=? AND user_id=?", (reminder_id, session["user_id"]))
            conn.commit()
        return redirect(url_for("planner"))

    @app.post("/planner/<int:reminder_id>/delete")
    @login_required
    def delete_reminder(reminder_id):
        with db() as conn:
            conn.execute("DELETE FROM reminders WHERE id=? AND user_id=?", (reminder_id, session["user_id"]))
            conn.commit()
        return redirect(url_for("planner"))

    @app.route("/family", methods=["GET", "POST"])
    @login_required
    def family():
        if request.method == "POST":
            with db() as conn:
                conn.execute("INSERT INTO family_contacts(user_id,name,relation,email,phone) VALUES(?,?,?,?,?)", (session["user_id"], request.form.get("name"), request.form.get("relation"), request.form.get("email"), request.form.get("phone")))
                conn.commit()
            flash("Contact added.", "success")
            return redirect(url_for("family"))
        with db() as conn:
            contacts = conn.execute("SELECT * FROM family_contacts WHERE user_id=?", (session["user_id"],)).fetchall()
        return render_template("family.html", contacts=contacts)

    @app.get("/summary")
    @login_required
    def summary():
        with db() as conn:
            logs = conn.execute("SELECT * FROM health_logs WHERE user_id=? ORDER BY logged_at DESC LIMIT 12", (session["user_id"],)).fetchall()
            reports = conn.execute("SELECT filename, uploaded_at FROM reports WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 6", (session["user_id"],)).fetchall()
        return render_template("summary.html", logs=logs, reports=reports)

    @app.route("/profile", methods=["GET", "POST"])
    @login_required
    def profile():
        if request.method == "POST":
            with db() as conn:
                conn.execute("UPDATE users SET name=?,privacy_consent=? WHERE id=?", (request.form.get("name"), 1 if request.form.get("privacy_consent") else 0, session["user_id"]))
                conn.commit()
            flash("Profile updated.", "success")
            return redirect(url_for("profile"))
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
            path = current_app.config["UPLOAD_DIR"] / report["stored_name"]
            if path.exists():
                path.unlink()
        session.clear()
        flash("Your account and local data were deleted.", "info")
        return redirect(url_for("index"))

    @app.route("/uploads/<path:name>")
    @login_required
    def protected_upload(name):
        with db() as conn:
            owned = conn.execute("SELECT 1 FROM reports WHERE user_id=? AND stored_name=?", (session["user_id"], name)).fetchone()
        if not owned:
            abort(404)
        return send_from_directory(current_app.config["UPLOAD_DIR"], name, as_attachment=True)

    @app.get("/api/chart-data")
    @login_required
    def chart_data():
        with db() as conn:
            rows = conn.execute("SELECT logged_at, value FROM health_logs WHERE user_id=? AND log_type='Weight' ORDER BY logged_at LIMIT 30", (session["user_id"],)).fetchall()
        points = []
        for row in rows:
            try:
                points.append((row["logged_at"], float(row["value"])))
            except (TypeError, ValueError):
                continue
        return jsonify({"labels": [label for label, _ in points], "values": [value for _, value in points]})
