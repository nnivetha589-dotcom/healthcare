import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


def configure_app(app):
    data_dir = Path(os.getenv("DATA_DIR", str(BASE_DIR / "backend" / "data")))
    data_dir.mkdir(parents=True, exist_ok=True)
    upload_dir = Path(os.getenv("UPLOAD_DIR", str(data_dir / "uploads")))
    upload_dir.mkdir(parents=True, exist_ok=True)

    app.config.from_mapping(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-only-change-me"),
        MAX_CONTENT_LENGTH=10 * 1024 * 1024,
        DB_PATH=Path(os.getenv("DB_PATH", str(data_dir / "medimate.db"))),
        UPLOAD_DIR=upload_dir,
        AI_API_KEY=os.getenv("OPENAI_API_KEY", ""),
        AI_API_URL=os.getenv("AI_API_URL", "https://api.openai.com/v1/chat/completions"),
        AI_MODEL=os.getenv("AI_MODEL", "gpt-4o-mini"),
        DEMO_AI=not bool(os.getenv("OPENAI_API_KEY")),
    )
