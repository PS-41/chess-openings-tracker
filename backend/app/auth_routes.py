from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from .models import db, User
import os

auth = Blueprint('auth', __name__)

@auth.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    login_user(new_user)
    return jsonify({'message': 'Registered successfully', 'user': {'id': new_user.id, 'username': new_user.username}})

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()

    if user and user.check_password(data.get('password')):
        login_user(user)
        return jsonify({'message': 'Login successful', 'user': {'id': user.id, 'username': user.username}})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@auth.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out'})

@auth.route('/me', methods=['GET'])
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'user': {'id': current_user.id, 'username': current_user.username}})
    return jsonify({'authenticated': False})

@auth.route('/profile', methods=['PUT']) 
@login_required
def update_profile():
    data = request.get_json()
    new_username = data.get('username')
    new_password = data.get('newPassword')
    current_password = data.get('currentPassword')

    if not current_password:
        return jsonify({'error': 'Current password is required'}), 400

    user = User.query.get(current_user.id)
    if not user.check_password(current_password):
        return jsonify({'error': 'Incorrect current password'}), 401
    if new_username and new_username != user.username:
        if User.query.filter_by(username=new_username).first():
            return jsonify({'error': 'Username already taken'}), 409
        user.username = new_username
    if new_password:
        user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': {'id': user.id, 'username': user.username}})

@auth.route('/verify-admin', methods=['POST'])
def verify_admin():
    """Verify admin password for Guest mode editing"""
    data = request.get_json()
    password = data.get('password')
    
    admin_pass = os.getenv('ADMIN_PASSWORD')
    
    if password == admin_pass:
        session['is_admin_mode'] = True
        return jsonify({'success': True})
    
    return jsonify({'error': 'Incorrect password'}), 401

@auth.route('/exit-admin', methods=['POST'])
def exit_admin_mode():
    session.pop('is_admin_mode', None)
    return jsonify({'message': 'Exited admin mode'})
