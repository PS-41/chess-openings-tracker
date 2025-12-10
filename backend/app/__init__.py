from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables (like secret keys, database URI)
load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # --- Configuration ---
    # Use SQLite for local development; easy to swap for PostgreSQL/MySQL on GCP later
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///openings.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    # Allow connections from the frontend (Vite/React typically runs on port 5173 or 3000)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

    # Import and register blueprints/routes
    from .routes import api as api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    return app

# Import models here so they are registered with SQLAlchemy
from . import models