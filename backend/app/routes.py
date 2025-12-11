import os
import urllib.parse
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from .models import Opening, TutorialLink, db

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

# --- POST: Add a new opening (Multipart Form Data) ---
@api.route('/openings', methods=['POST'])
def add_opening():
    # 1. Handle Text Data (Form Data)
    name = request.form.get('name')
    side = request.form.get('side')
    moves = request.form.get('moves')
    notes = request.form.get('notes')
    
    # Handle Tutorial Links (Expected as multiple 'tutorials' keys)
    # Frontend will send: tutorials[0], tutorials[1]... or just multiple 'tutorials' fields
    tutorial_links = request.form.getlist('tutorials') 

    if not name or not side or not moves:
        return jsonify({'error': 'Name, Side, and Moves are required'}), 400

    # Check for duplicates before processing
    
    # Check if Name exists (Case insensitive check is often better, but strict is fine too)
    if Opening.query.filter_by(name=name).first():
        return jsonify({'error': f"An opening with the name '{name}' already exists."}), 409

    # Check if PGN/Moves exists
    existing_pgn = Opening.query.filter_by(moves=moves).first()
    if existing_pgn:
        return jsonify({'error': f"This PGN sequence already exists in the opening: '{existing_pgn.name}'"}), 409

    # 2. Generate Lichess Link Automatically
    encoded_pgn = urllib.parse.quote(moves)
    generated_lichess_link = f"https://lichess.org/analysis/pgn/{encoded_pgn}"

    # 3. Handle Image Upload
    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Save in a folder named 'uploads' inside the backend
            upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            
            # Unique name to prevent overwrite: 'opening_name_side.png'
            save_name = f"{secure_filename(name)}_{side}_{filename}"
            file.save(os.path.join(upload_folder, save_name))
            image_filename = save_name

    # 4. Save to Database
    new_opening = Opening(
        name=name,
        side=side,
        moves=moves,
        lichess_link=generated_lichess_link,
        image_filename=image_filename,
        notes=notes
    )
    
    db.session.add(new_opening)
    db.session.commit() # Commit first to get the ID

    # 5. Add Tutorial Links
    for url in tutorial_links:
        if url.strip():
            link = TutorialLink(url=url.strip(), opening_id=new_opening.id)
            db.session.add(link)
    
    db.session.commit()

    return jsonify(new_opening.to_dict()), 201

# --- DELETE: Remove an opening ---
@api.route('/openings/<int:id>', methods=['DELETE'])
def delete_opening(id):
    opening = Opening.query.get_or_404(id)
    # Optional: Delete the image file here if you want to clean up
    db.session.delete(opening)
    db.session.commit()
    return jsonify({'message': 'Opening deleted successfully'})

# --- SERVE IMAGES ---
@api.route('/uploads/<filename>')
def serve_image(filename):
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
    return send_from_directory(upload_folder, filename)
