from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    # 1. Update Flask to point to the React build folder
    # This assumes the structure: /backend/app/ and /frontend/client/dist/
    app = Flask(__name__, 
                static_folder='../../frontend/client/dist/assets', 
                static_url_path='/assets')

    # Config
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-this')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///openings.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # CORS (Optional now since we are serving from same origin, but good to keep)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=True)

    db.init_app(app)
    login_manager.init_app(app)

    from .routes import api as api_blueprint
    from .auth_routes import auth as auth_blueprint
    
    app.register_blueprint(api_blueprint, url_prefix='/api')
    app.register_blueprint(auth_blueprint, url_prefix='/api/auth')
    
    from . import models

    @login_manager.user_loader
    def load_user(id):
        return models.User.query.get(int(id))

    # 2. Add a route to serve the React Frontend
    @app.route('/')
    @app.route('/<path:path>')
    def serve_react_app(path=None):
        # If the path starts with /api, let Flask handle it (it will 404 if not found above)
        if path and path.startswith('api/'):
            return {"error": "Not found"}, 404
            
        # Otherwise, serve the React index.html
        # We look for index.html in the dist folder
        return send_from_directory('../../frontend/client/dist', 'index.html')

    return app