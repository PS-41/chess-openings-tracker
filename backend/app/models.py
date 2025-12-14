from . import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Opening(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False) # Removed unique=True constraint to allow multiple users to have same opening name
    side = db.Column(db.String(10), nullable=False)
    
    # Foreign Key to User (Nullable for Public/Guest openings)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    variations = db.relationship('Variation', backref='opening', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'side': self.side,
            'user_id': self.user_id,
            'variations': sorted([v.to_dict() for v in self.variations], key=lambda x: x['name'])
        }

class Variation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    opening_id = db.Column(db.Integer, db.ForeignKey('opening.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False, default='Default')
    moves = db.Column(db.String(500), nullable=False)
    lichess_link = db.Column(db.String(500), nullable=False)
    image_filename = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    tutorials = db.relationship('TutorialLink', backref='variation', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'moves': self.moves,
            'lichess_link': self.lichess_link,
            'image_filename': self.image_filename,
            'notes': self.notes,
            'tutorials': [t.url for t in self.tutorials]
        }

class TutorialLink(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    variation_id = db.Column(db.Integer, db.ForeignKey('variation.id'), nullable=False)