from app import create_app, db

# Create the application instance
app = create_app()

@app.cli.command('init-db')
def init_db_command():
    """Initializes and populates the database."""
    with app.app_context():
        db.create_all()
        # Add initial data here for testing
        print('Initialized the database.')

if __name__ == '__main__':
    # Add this to ensure the database file is created when you run it
    with app.app_context():
        db.create_all()
    app.run(debug=True)