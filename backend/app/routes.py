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

# Helper to delete image file
def remove_variation_image(variation):
    if variation.image_filename:
        file_path = os.path.join(current_app.root_path, '..', 'uploads', variation.image_filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error deleting file {file_path}: {e}")

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

    # Check for duplicate PGN within the opening
    existing_pgn = Variation.query.filter_by(opening_id=opening.id, moves=moves).first()
    if existing_pgn:
        return jsonify({'error': f"This moves sequence already exists in '{opening.name}' ({existing_pgn.name})"}), 409

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

# --- PUT: Update Opening Name ---
@api.route('/openings/<int:id>', methods=['PUT'])
def update_opening(id):
    opening = Opening.query.get_or_404(id)
    data = request.get_json()
    new_name = data.get('name')
    
    if not new_name:
        return jsonify({'error': 'Name is required'}), 400
        
    # Check for duplicate name
    existing = Opening.query.filter_by(name=new_name).first()
    if existing and existing.id != id:
        return jsonify({'error': 'Opening with this name already exists'}), 409

    opening.name = new_name
    db.session.commit()
    return jsonify(opening.to_dict())

# --- PUT: Update Variation ---
@api.route('/variations/<int:id>', methods=['PUT'])
def update_variation(id):
    variation = Variation.query.get_or_404(id)
    
    # Form data
    variation_name = request.form.get('variation_name')
    moves = request.form.get('moves')
    notes = request.form.get('notes')
    tutorial_links = request.form.getlist('tutorials')
    
    if not moves:
        return jsonify({'error': 'Moves are required'}), 400

    # Update basics
    if variation_name:
        variation.name = variation_name
    
    variation.moves = moves
    variation.notes = notes
    
    # Update Lichess Link
    encoded_pgn = urllib.parse.quote(moves)
    variation.lichess_link = f"https://lichess.org/analysis/pgn/{encoded_pgn}"

    # Handle Image (Replace if new one uploaded)
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            remove_variation_image(variation)
            opening_name = variation.opening.name
            side = variation.opening.side
            
            # Construct name: 'Opening_Variation_Side_filename'
            # Note: variation.name is used because it was updated in the lines above if a new name was provided
            save_name = f"{secure_filename(opening_name)}_{secure_filename(variation.name)}_{side}_{filename}"            
            file.save(os.path.join(upload_folder, save_name))
            
            variation.image_filename = save_name

    # Handle Tutorials (Replace all)
    # First, delete existing
    TutorialLink.query.filter_by(variation_id=variation.id).delete()
    # Add new
    for url in tutorial_links:
        if url.strip():
            link = TutorialLink(url=url.strip(), variation_id=variation.id)
            db.session.add(link)

    db.session.commit()
    
    # Return the parent opening to refresh state easily
    return jsonify(variation.opening.to_dict())

# --- DELETE: Delete Opening ---
@api.route('/openings/<int:id>', methods=['DELETE'])
def delete_opening(id):
    opening = Opening.query.get_or_404(id)
    # Delete images for all variations in this opening
    for variation in opening.variations:
        remove_variation_image(variation)        
    db.session.delete(opening)
    db.session.commit()
    return jsonify({'message': 'Opening and associated images deleted successfully'})

# --- DELETE: Delete Variation ---
@api.route('/variations/<int:id>', methods=['DELETE'])
def delete_variation(id):
    variation = Variation.query.get_or_404(id)    
    # Delete the image associated with this variation
    remove_variation_image(variation)
    db.session.delete(variation)
    db.session.commit()
    return jsonify({'message': 'Variation and image deleted successfully'})

# --- POST: Batch Delete ---
@api.route('/batch-delete', methods=['POST'])
def batch_delete():
    data = request.get_json()
    opening_ids = data.get('openings', [])
    variation_ids = data.get('variations', [])

    try:
        # 1. Handle explicit variations deletion
        if variation_ids:
            variations_to_delete = Variation.query.filter(Variation.id.in_(variation_ids)).all()
            for v in variations_to_delete:
                remove_variation_image(v)
                db.session.delete(v)
        
        # 2. Handle openings deletion (and their sub-variations)
        if opening_ids:
            openings_to_delete = Opening.query.filter(Opening.id.in_(opening_ids)).all()
            for op in openings_to_delete:
                # Manually clean up images for variations of these openings
                for v in op.variations:
                    remove_variation_image(v)
                db.session.delete(op)
            
        db.session.commit()
        return jsonify({'message': 'Batch delete successful'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# --- SERVE IMAGES ---
@api.route('/uploads/<filename>')
def serve_image(filename):
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
    return send_from_directory(upload_folder, filename)
