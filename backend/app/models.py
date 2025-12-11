from . import db

class Opening(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    side = db.Column(db.String(10), nullable=False)
    moves = db.Column(db.String(500), nullable=False) # Now Compulsory
    lichess_link = db.Column(db.String(500), nullable=False) # Auto-generated
    image_filename = db.Column(db.String(200), nullable=True) # Stores filename like 'opening_1.png'
    
    # Relationship: One Opening has Many Tutorial Links
    tutorials = db.relationship('TutorialLink', backref='opening', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'side': self.side,
            'moves': self.moves,
            'lichess_link': self.lichess_link,
            'image_filename': self.image_filename,
            # Return list of tutorial URLs
            'tutorials': [t.url for t in self.tutorials]
        }

class TutorialLink(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    opening_id = db.Column(db.Integer, db.ForeignKey('opening.id'), nullable=False)
