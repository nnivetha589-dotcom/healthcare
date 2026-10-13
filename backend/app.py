"""Compatibility entry point for Flask CLI and local development."""

import os

from medimate import create_app


app = create_app()


if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "0") == "1")
