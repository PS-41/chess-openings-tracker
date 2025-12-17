import os
import shutil
import urllib.parse
import uuid
import zipfile
import io
from flask import Blueprint, request, jsonify, current_app, send_from_directory, session, send_file
from flask_login import current_user
from werkzeug.utils import secure_filename
from .models import Opening, Variation, TutorialLink, db
from sqlalchemy import func

api = Blueprint('api', __name__)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def has_edit_permission(opening=None):
    """
    Check if the requester can edit this resource.
    1. Logged in user owns it.
    2. It's public (user_id is None) AND session has 'is_admin_mode'.
    """
    if opening:
        # Resource exists check
        if opening.user_id is None:
            # Public resource
            return session.get('is_admin_mode', False)
        else:
            # Private resource
            return current_user.is_authenticated and opening.user_id == current_user.id
    else:
        # Creating new resource check
        if current_user.is_authenticated:
            return True # Users can always create
        return session.get('is_admin_mode', False) # Guests need admin mode

def remove_variation_image(variation):
    # Only delete file if no other variation uses it (simple check)
    if variation.image_filename:
        # Check if any other variation uses this file
        count = Variation.query.filter_by(image_filename=variation.image_filename).count()
        if count <= 1:
            file_path = os.path.join(current_app.root_path, '..', 'uploads', variation.image_filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error deleting file {file_path}: {e}")

# --- GET: Fetch openings (Public vs Private) ---
@api.route('/openings', methods=['GET'])
def get_openings():
    mode = request.args.get('mode', 'public') # 'public' or 'private'
    only_favorites = request.args.get('favorites') == 'true'
    
    query = Opening.query
    
    if mode == 'private' and current_user.is_authenticated:
        query = query.filter_by(user_id=current_user.id)
    else:
        # Guest mode / Public view
        query = query.filter_by(user_id=None)
        
    if only_favorites:
        query = query.filter_by(is_favorite=True)

    # Sort per-side by position (white/black independent order)
    query = query.order_by(Opening.side.asc(), Opening.position.asc())

    openings = query.all()
        
    return jsonify([o.to_dict() for o in openings])

# --- POST: Reorder Openings ---
@api.route('/openings/reorder', methods=['POST'])
def reorder_openings():
    # Only allow if logged in or admin
    if not current_user.is_authenticated and not session.get('is_admin_mode', False):
        return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json()
    ordered_ids = data.get('ids', [])

    if not ordered_ids:
        return jsonify({'status': 'success'})

    openings = Opening.query.filter(Opening.id.in_(ordered_ids)).all()
    opening_map = {op.id: op for op in openings}

    # Enforce per-side reorder: all IDs must be same side and same ownership context
    first = opening_map.get(ordered_ids[0])
    if not first:
        return jsonify({'error': 'Invalid opening ids'}), 400

    target_side = first.side
    target_user_id = first.user_id

    for op_id in ordered_ids:
        op = opening_map.get(op_id)
        if not op:
            return jsonify({'error': 'Invalid opening ids'}), 400
        if op.side != target_side or op.user_id != target_user_id:
            return jsonify({'error': 'Openings must be from the same side and same mode'}), 400
        if not has_edit_permission(op):
            return jsonify({'error': 'Permission denied'}), 403

    for index, op_id in enumerate(ordered_ids):
        opening_map[op_id].position = index
    
    db.session.commit()
    return jsonify({'status': 'success'})

# --- POST: Reorder Variations ---
@api.route('/variations/reorder', methods=['POST'])
def reorder_variations():
    # Only allow if logged in or admin
    if not current_user.is_authenticated and not session.get('is_admin_mode', False):
        return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json()
    ordered_ids = data.get('ids', [])

    if not ordered_ids:
        return jsonify({'status': 'success'})

    variations = Variation.query.filter(Variation.id.in_(ordered_ids)).all()
    variation_map = {v.id: v for v in variations}

    first = variation_map.get(ordered_ids[0])
    if not first:
        return jsonify({'error': 'Invalid variation ids'}), 400

    target_opening_id = first.opening_id

    for var_id in ordered_ids:
        var = variation_map.get(var_id)
        if not var:
            return jsonify({'error': 'Invalid variation ids'}), 400
        if var.opening_id != target_opening_id:
            return jsonify({'error': 'Variations must belong to the same opening'}), 400
        if not has_edit_permission(var.opening):
            return jsonify({'error': 'Permission denied'}), 403

    for index, var_id in enumerate(ordered_ids):
        variation_map[var_id].position = index
    
    db.session.commit()
    return jsonify({'status': 'success'})

# --- POST: Toggle Favorite ---
@api.route('/openings/<int:id>/favorite', methods=['POST'])
def toggle_favorite(id):
    opening = Opening.query.get_or_404(id)
    if not has_edit_permission(opening):
        return jsonify({'error': 'Permission denied'}), 403
    
    opening.is_favorite = not opening.is_favorite
    db.session.commit()
    return jsonify(opening.to_dict())

# --- POST: Import Openings ---
@api.route('/import', methods=['POST'])
def import_openings():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Must be logged in to import'}), 401
        
    data = request.get_json()
    opening_ids = data.get('opening_ids', []) # List of public opening IDs
    
    public_openings = Opening.query.filter(
        Opening.id.in_(opening_ids),
        Opening.user_id == None
    ).order_by(Opening.position.asc(), Opening.id.asc()).all()
    
    count = 0
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    # Determine next available position PER SIDE (so white/black don't collide)
    next_pos_by_side = {}
    for side in ['white', 'black']:
        max_pos = db.session.query(func.max(Opening.position)).filter_by(user_id=current_user.id, side=side).scalar()
        next_pos_by_side[side] = (max_pos + 1) if max_pos is not None else 0

    for pub_op in public_openings:
        # Create Opening Copy
        existing_user_op = Opening.query.filter_by(
            user_id=current_user.id,
            name=pub_op.name,
            side=pub_op.side
        ).first()

        if existing_user_op:
            continue
            
        new_op = Opening(
            name=pub_op.name, 
            side=pub_op.side, 
            user_id=current_user.id,
            position=next_pos_by_side.get(pub_op.side, 0) # Set position per side
        )
        next_pos_by_side[pub_op.side] = next_pos_by_side.get(pub_op.side, 0) + 1

        db.session.add(new_op)
        db.session.commit() # Commit to get ID
        
        pub_vars_sorted = sorted(pub_op.variations, key=lambda v: (v.position or 0, v.id))
        for i, pub_var in enumerate(pub_vars_sorted):
            # Handle Image Copying (to avoid deleting shared images later)
            new_image_filename = None
            if pub_var.image_filename:
                # Generate new unique name for the user's copy
                ext = pub_var.image_filename.split('.')[-1]
                unique_name = f"img_{uuid.uuid4().hex}.{ext}"
                # Use same 'u' prefix convention as regular uploads
                new_image_filename = f"u{current_user.id}_{unique_name}"
                
                src_path = os.path.join(upload_folder, pub_var.image_filename)
                dst_path = os.path.join(upload_folder, new_image_filename)
                
                if os.path.exists(src_path):
                    shutil.copy2(src_path, dst_path)
            
            new_var = Variation(
                opening_id=new_op.id,
                name=pub_var.name,
                moves=pub_var.moves,
                lichess_link=pub_var.lichess_link,
                image_filename=new_image_filename,
                notes=pub_var.notes,
                position=i # Maintain relative order
            )
            db.session.add(new_var)
            db.session.commit()
            
            # Copy Tutorials
            for pub_tut in pub_var.tutorials:
                new_tut = TutorialLink(url=pub_tut.url, variation_id=new_var.id)
                db.session.add(new_tut)
        
        count += 1
    
    db.session.commit()
    return jsonify({'message': f'Successfully imported {count} openings'})

# --- POST: Add Opening ---
@api.route('/openings', methods=['POST'])
def add_opening():
    if not has_edit_permission():
        return jsonify({'error': 'Permission denied. Login or enter admin password.'}), 403

    # Determine Owner: Current User OR None (Public)
    owner_id = current_user.id if current_user.is_authenticated else None

    name = request.form.get('name')
    side = request.form.get('side')
    moves = request.form.get('moves')
    notes = request.form.get('notes')
    variation_name = request.form.get('variation_name') or 'Default'
    tutorial_links = request.form.getlist('tutorials') 

    if not name or not side or not moves:
        return jsonify({'error': 'Name, Side, and Moves are required'}), 400

    # Logic to find or create Parent Opening FOR THIS USER context
    # Improved: Filter by side as well to allow same opening name for different sides
    opening = Opening.query.filter_by(name=name, side=side, user_id=owner_id).first()

    if opening:
        # Opening exists, check for duplicate variation/moves
        existing_variation = Variation.query.filter_by(opening_id=opening.id, name=variation_name).first()
        if existing_variation:
            return jsonify({'error': f"Variation '{variation_name}' already exists."}), 409

        existing_pgn = Variation.query.filter_by(opening_id=opening.id, moves=moves).first()
        if existing_pgn:
            return jsonify({'error': f"This moves sequence already exists in '{opening.name}' ({existing_pgn.name})"}), 409
    else:
        # Calculate new position (per side)
        max_pos = db.session.query(func.max(Opening.position)).filter_by(user_id=owner_id, side=side).scalar()
        new_pos = (max_pos + 1) if max_pos is not None else 0
        
        opening = Opening(name=name, side=side, user_id=owner_id, position=new_pos)
        db.session.add(opening)
        db.session.commit()

    encoded_pgn = urllib.parse.quote(moves)
    generated_lichess_link = f"https://lichess.org/analysis/pgn/{encoded_pgn}"

    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            unique_name = f"img_{uuid.uuid4().hex}.{ext}"
            
            upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            # Add user_id prefix to filename to avoid collisions between users
            prefix = f"u{owner_id}_" if owner_id else "public_"
            save_name = f"{prefix}{unique_name}"
            file.save(os.path.join(upload_folder, save_name))
            image_filename = save_name

    # Calculate variation position
    max_var_pos = db.session.query(func.max(Variation.position)).filter_by(opening_id=opening.id).scalar()
    new_var_pos = (max_var_pos + 1) if max_var_pos is not None else 0

    new_variation = Variation(
        opening_id=opening.id,
        name=variation_name,
        moves=moves,
        lichess_link=generated_lichess_link,
        image_filename=image_filename,
        notes=notes,
        position=new_var_pos
    )
    
    db.session.add(new_variation)
    db.session.commit()

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
    if not has_edit_permission(opening):
        return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json()
    new_name = data.get('name')
    if not new_name: return jsonify({'error': 'Name is required'}), 400
    
    # Check duplicate name for THIS user, respecting the side
    owner_id = opening.user_id
    existing = Opening.query.filter_by(name=new_name, side=opening.side, user_id=owner_id).first()
    if existing and existing.id != id:
        return jsonify({'error': 'Opening with this name already exists'}), 409

    opening.name = new_name
    db.session.commit()
    return jsonify(opening.to_dict())

# --- PUT: Update Variation ---
@api.route('/variations/<int:id>', methods=['PUT'])
def update_variation(id):
    variation = Variation.query.get_or_404(id)
    if not has_edit_permission(variation.opening):
        return jsonify({'error': 'Permission denied'}), 403
    
    variation_name = request.form.get('variation_name')
    moves = request.form.get('moves')
    notes = request.form.get('notes')
    tutorial_links = request.form.getlist('tutorials')
    delete_image_flag = request.form.get('delete_image') == 'true'
    
    if not moves: return jsonify({'error': 'Moves are required'}), 400

    if variation_name:
        existing = Variation.query.filter_by(opening_id=variation.opening_id, name=variation_name).first()
        if existing and existing.id != variation.id:
            return jsonify({'error': f"Variation '{variation_name}' already exists."}), 409
    existing_pgn = Variation.query.filter_by(opening_id=variation.opening_id, moves=moves).first()
    if existing_pgn and existing_pgn.id != variation.id:
        return jsonify({'error': f"This moves sequence already exists in '{variation.opening.name}' ({existing_pgn.name})"}), 409

    if variation_name: variation.name = variation_name
    variation.moves = moves
    variation.notes = notes
    encoded_pgn = urllib.parse.quote(moves)
    variation.lichess_link = f"https://lichess.org/analysis/pgn/{encoded_pgn}"

    upload_folder = os.path.join(current_app.root_path, '..', 'uploads')

    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            remove_variation_image(variation)
            
            ext = file.filename.rsplit('.', 1)[1].lower()
            unique_name = f"img_{uuid.uuid4().hex}.{ext}"
            
            os.makedirs(upload_folder, exist_ok=True)
            
            owner_id = variation.opening.user_id
            prefix = f"u{owner_id}_" if owner_id else "public_"
            
            save_name = f"{prefix}{unique_name}"
            file.save(os.path.join(upload_folder, save_name))
            variation.image_filename = save_name
    elif delete_image_flag:
        remove_variation_image(variation)
        variation.image_filename = None

    TutorialLink.query.filter_by(variation_id=variation.id).delete()
    for url in tutorial_links:
        if url.strip():
            db.session.add(TutorialLink(url=url.strip(), variation_id=variation.id))

    db.session.commit()
    return jsonify(variation.opening.to_dict())

# --- DELETE Operations ---
@api.route('/openings/<int:id>', methods=['DELETE'])
def delete_opening(id):
    opening = Opening.query.get_or_404(id)
    if not has_edit_permission(opening):
        return jsonify({'error': 'Permission denied'}), 403
        
    for variation in opening.variations:
        remove_variation_image(variation)        
    db.session.delete(opening)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

@api.route('/variations/<int:id>', methods=['DELETE'])
def delete_variation(id):
    variation = Variation.query.get_or_404(id)
    if not has_edit_permission(variation.opening):
        return jsonify({'error': 'Permission denied'}), 403

    remove_variation_image(variation)
    db.session.delete(variation)
    db.session.commit()
    return jsonify({'message': 'Deleted successfully'})

@api.route('/batch-delete', methods=['POST'])
def batch_delete():
    data = request.get_json()
    opening_ids = data.get('openings', [])
    variation_ids = data.get('variations', [])

    # Filter permissions
    try:
        if variation_ids:
            variations = Variation.query.filter(Variation.id.in_(variation_ids)).all()
            for v in variations:
                if has_edit_permission(v.opening):
                    remove_variation_image(v)
                    db.session.delete(v)
        
        if opening_ids:
            openings = Opening.query.filter(Opening.id.in_(opening_ids)).all()
            for op in openings:
                if has_edit_permission(op):
                    for v in op.variations:
                        remove_variation_image(v)
                    db.session.delete(op)
            
        db.session.commit()
        return jsonify({'message': 'Batch delete successful'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/uploads/<filename>')
def serve_image(filename):
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
    return send_from_directory(upload_folder, filename)

# --- GET: Admin Export Backup ---
@api.route('/admin/export-backup', methods=['GET'])
def export_backup():
    # Only allow if in Admin Mode (guest + admin pass)
    if not session.get('is_admin_mode', False):
        return jsonify({'error': 'Permission denied'}), 403

    # Paths
    # current_app.root_path usually points to .../backend/app
    backend_dir = os.path.dirname(current_app.root_path) # Points to .../backend
    
    # Priority: Check for instance/openings.db first (User verified location), then fallback to backend/openings.db
    possible_paths = [
        os.path.join(backend_dir, 'instance', 'openings.db'),
        os.path.join(backend_dir, 'openings.db')
    ]
    
    db_path = None
    for path in possible_paths:
        if os.path.exists(path):
            db_path = path
            break
            
    uploads_dir = os.path.join(backend_dir, 'uploads')

    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        # 1. Add Database
        if db_path and os.path.exists(db_path):
            zf.write(db_path, 'openings.db')
        
        # 2. Add Uploads Folder
        if os.path.exists(uploads_dir):
            for root, dirs, files in os.walk(uploads_dir):
                for file in files:
                    abs_path = os.path.join(root, file)
                    # We want the path inside zip to be uploads/filename.png
                    rel_path = os.path.relpath(abs_path, backend_dir)
                    zf.write(abs_path, rel_path)
    
    memory_file.seek(0)
    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name='chess_backup.zip'
    )
