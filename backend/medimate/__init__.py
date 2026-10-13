from flask import Flask

from .config import BASE_DIR, configure_app
from .db import init_db
from .routes import register_routes


def create_app() -> Flask:
    app = Flask(
        __name__,
        instance_relative_config=True,
        template_folder=str(BASE_DIR / "frontend" / "templates"),
        static_folder=str(BASE_DIR / "frontend" / "static"),
    )
    configure_app(app)
    register_routes(app)

    with app.app_context():
        init_db()

    return app
