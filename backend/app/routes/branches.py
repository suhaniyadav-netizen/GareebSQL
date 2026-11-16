from flask import Blueprint, request
from ..db import get_db, execute_query
from ..utils.helpers import success_response, error_response

branches_bp = Blueprint('branches', __name__, url_prefix='/api/branches')

@branches_bp.route('', methods=['GET'])
def get_branches():
    """
    Get all bank branches with account summary metrics.
    """
    try:
        query = """
            SELECT 
                b.branch_id,
                b.branch_name,
                b.ifsc_code,
                b.city,
                b.created_at,
                COUNT(a.account_id) AS total_accounts,
                COALESCE(SUM(a.balance), 0.00) AS total_deposits
            FROM branches b
            LEFT JOIN accounts a ON b.branch_id = a.branch_id
            GROUP BY b.branch_id, b.branch_name, b.ifsc_code, b.city, b.created_at
            ORDER BY b.branch_id ASC;
        """
        branches = execute_query(query, fetchall=True)
        return success_response(branches, "Branches retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch branches", details=e)

@branches_bp.route('/<int:branch_id>', methods=['GET'])
def get_branch_by_id(branch_id):
    """
    Get branch details by ID.
    """
    try:
        query = """
            SELECT branch_id, branch_name, ifsc_code, city, created_at
            FROM branches
            WHERE branch_id = %s;
        """
        branch = execute_query(query, (branch_id,), fetchone=True)
        if not branch:
            return error_response("Branch not found", status_code=404)
        return success_response(branch, "Branch retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch branch details", details=e)

@branches_bp.route('', methods=['POST'])
def create_branch():
    """
    Create a new bank branch.
    Expected JSON: { "branch_name": "...", "ifsc_code": "...", "city": "..." }
    """
    data = request.get_json() or {}
    branch_name = data.get('branch_name', '').strip()
    ifsc_code = data.get('ifsc_code', '').strip().upper()
    city = data.get('city', '').strip()

    if not branch_name or not ifsc_code or not city:
        return error_response("Missing required fields: branch_name, ifsc_code, city", status_code=400)

    if len(ifsc_code) != 11:
        return error_response("IFSC code must be exactly 11 characters long", status_code=400)

    try:
        query = """
            INSERT INTO branches (branch_name, ifsc_code, city)
            VALUES (%s, %s, %s);
        """
        branch_id = execute_query(query, (branch_name, ifsc_code, city), commit=True)
        created_branch = execute_query(
            "SELECT * FROM branches WHERE branch_id = %s;",
            (branch_id,),
            fetchone=True
        )
        return success_response(created_branch, "Branch created successfully", status_code=201)
    except Exception as e:
        return error_response("Failed to create branch", details=e)
