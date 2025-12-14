from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)

    # Config
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-this')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///openings.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Supports credentials (cookies) for CORS
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=True)

    db.init_app(app)
    login_manager.init_app(app)

    from .routes import api as api_blueprint
    from .auth_routes import auth as auth_blueprint
    
    app.register_blueprint(api_blueprint, url_prefix='/api')
    app.register_blueprint(auth_blueprint, url_prefix='/api/auth')

    return app

from . import models

@login_manager.user_loader
def load_user(id):
    return models.User.query.get(int(id))
