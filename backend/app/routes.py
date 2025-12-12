import os
import urllib.parse
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from .models import Opening, Variation, TutorialLink, db

api = Blueprint('api', __name__)

# Allowed image extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- GET: Fetch all openings ---
@api.route('/openings', methods=['GET'])
def get_openings():
    openings = Opening.query.all()
    return jsonify([o.to_dict() for o in openings])

# --- POST: Add a new opening or variation ---
@api.route('/openings', methods=['POST'])
def add_opening():
    # 1. Handle Text Data (Form Data)
    name = request.form.get('name')
    side = request.form.get('side')
    moves = request.form.get('moves')
    notes = request.form.get('notes')
    variation_name = request.form.get('variation_name') or 'Default'
    
    # Handle Tutorial Links
    tutorial_links = request.form.getlist('tutorials') 

    if not name or not side or not moves:
        return jsonify({'error': 'Name, Side, and Moves are required'}), 400

    # 2. Logic to find or create Parent Opening
    opening = Opening.query.filter_by(name=name).first()

    if opening:
        # Check if side matches existing opening
        if opening.side != side:
            return jsonify({'error': f"Opening '{name}' already exists as {opening.side}. You cannot add a {side} variation to it."}), 409
        
        # Check if Variation Name already exists for this opening
        existing_variation = Variation.query.filter_by(opening_id=opening.id, name=variation_name).first()
        if existing_variation:
            return jsonify({'error': f"Variation '{variation_name}' already exists for opening '{name}'."}), 409
    else:
        # Create new Opening
        opening = Opening(name=name, side=side)
        db.session.add(opening)
        db.session.commit() # Commit to generate ID

    # Check globally for duplicate PGN (optional, keeping consistent with previous logic)
    # Note: Previous logic checked global PGN uniqueness. 
    # If you want to allow same moves in different variations (e.g. transpositions), you might remove this.
    # We will keep it but maybe check against Variation table now.
    existing_pgn = Variation.query.filter_by(moves=moves).first()
    if existing_pgn:
        # Fetch parent name for error message
        parent = Opening.query.get(existing_pgn.opening_id)
        return jsonify({'error': f"This moves sequence already exists in '{parent.name}' ({existing_pgn.name})"}), 409

    # 3. Generate Lichess Link
    encoded_pgn = urllib.parse.quote(moves)
    generated_lichess_link = f"https://lichess.org/analysis/pgn/{encoded_pgn}"

    # 4. Handle Image Upload
    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            
            # Unique name: 'Opening_Variation_Side_filename'
            save_name = f"{secure_filename(name)}_{secure_filename(variation_name)}_{side}_{filename}"
            file.save(os.path.join(upload_folder, save_name))
            image_filename = save_name

    # 5. Create Variation
    new_variation = Variation(
        opening_id=opening.id,
        name=variation_name,
        moves=moves,
        lichess_link=generated_lichess_link,
        image_filename=image_filename,
        notes=notes
    )
    
    db.session.add(new_variation)
    db.session.commit()

    # 6. Add Tutorial Links
    for url in tutorial_links:
        if url.strip():
            link = TutorialLink(url=url.strip(), variation_id=new_variation.id)
            db.session.add(link)
    
    db.session.commit()

    return jsonify(opening.to_dict()), 201

# --- DELETE: Remove an opening or variation? ---
# Current logic deletes entire opening. We might want to delete specific variation.
# For simplicity, let's keep it deleting the whole opening by ID, 
# or add a new route for deleting variation.
# Let's assume the frontend passes the Opening ID to delete the whole thing for now, 
# OR we update this to delete variations if we want granular control.
# Given the prompt, I'll stick to basic cleanup. 
# If 'id' refers to Opening ID, it cascades deletes variations.
@api.route('/openings/<int:id>', methods=['DELETE'])
def delete_opening(id):
    opening = Opening.query.get_or_404(id)
    db.session.delete(opening)
    db.session.commit()
    return jsonify({'message': 'Opening deleted successfully'})

# --- SERVE IMAGES ---
@api.route('/uploads/<filename>')
def serve_image(filename):
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
    return send_from_directory(upload_folder, filename)
