import os
from app import create_app
from app.config import Config

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', Config.FLASK_PORT))
    debug = Config.FLASK_DEBUG
    print(f"Starting GareebSQL Banking API server on port {port} (debug={debug})...")
    app.run(host='0.0.0.0', port=port, debug=debug)
