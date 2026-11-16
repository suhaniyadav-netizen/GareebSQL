import logging
from flask import Flask
from flask_cors import CORS
from .config import Config
from .db import check_db_health
from .utils.helpers import success_response, error_response
from .routes import (
    branches_bp,
    customers_bp,
    accounts_bp,
    transactions_bp,
    loans_bp,
    analytics_bp
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for all routes (allows frontend on any port like 3000, 5173, etc.)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API blueprints
    app.register_blueprint(branches_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(accounts_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(loans_bp)
    app.register_blueprint(analytics_bp)

    @app.route('/')
    def root():
        return success_response({
            "service": "GareebSQL Core Banking API",
            "version": "1.0.0",
            "endpoints": [
                "/api/health",
                "/api/branches",
                "/api/customers",
                "/api/accounts",
                "/api/transactions",
                "/api/loans",
                "/api/analytics"
            ]
        }, "Welcome to GareebSQL Core Banking API")

    @app.route('/api/health')
    def health():
        db_alive = check_db_health()
        if db_alive:
            return success_response({"database": "connected", "status": "healthy"}, "Service is operational")
        return error_response("Database connection unhealthy", status_code=503, details="Failed to ping MySQL")

    @app.errorhandler(404)
    def not_found(e):
        return error_response("Endpoint not found", status_code=404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response("Method not allowed", status_code=405)

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal server error: {e}")
        return error_response("Internal server error occurred", status_code=500, details=e)

    return app
