from flask import Blueprint, request
from ..db import get_db, execute_query
from ..utils.helpers import success_response, error_response

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@customers_bp.route('', methods=['GET'])
def get_customers():
    """
    Get all customers with referral information.
    Optional query parameters:
      - kyc_status: PENDING | VERIFIED | REJECTED
      - search: string to match name, email, or pan_number
    """
    kyc_filter = request.args.get('kyc_status')
    search = request.args.get('search')

    conditions = []
    params = []

    if kyc_filter:
        conditions.append("c.kyc_status = %s")
        params.append(kyc_filter.upper())

    if search:
        search_pattern = f"%{search}%"
        conditions.append(
            "(c.first_name LIKE %s OR c.last_name LIKE %s OR c.email LIKE %s OR c.pan_number LIKE %s)"
        )
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
        SELECT 
            c.customer_id,
            c.first_name,
            c.last_name,
            CONCAT(c.first_name, ' ', c.last_name) AS full_name,
            c.email,
            c.phone,
            c.pan_number,
            c.kyc_status,
            c.referred_by,
            CONCAT(r.first_name, ' ', r.last_name) AS referred_by_name,
            c.created_at
        FROM customers c
        LEFT JOIN customers r ON c.referred_by = r.customer_id
        {where_clause}
        ORDER BY c.customer_id ASC;
    """

    try:
        customers = execute_query(query, tuple(params), fetchall=True)
        return success_response(customers, "Customers retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch customers", details=e)

@customers_bp.route('/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """
    Get complete customer profile including their bank accounts and active loans.
    """
    try:
        customer_query = """
            SELECT 
                c.customer_id,
                c.first_name,
                c.last_name,
                CONCAT(c.first_name, ' ', c.last_name) AS full_name,
                c.email,
                c.phone,
                c.pan_number,
                c.kyc_status,
                c.referred_by,
                CONCAT(r.first_name, ' ', r.last_name) AS referred_by_name,
                c.created_at
            FROM customers c
            LEFT JOIN customers r ON c.referred_by = r.customer_id
            WHERE c.customer_id = %s;
        """
        customer = execute_query(customer_query, (customer_id,), fetchone=True)
        if not customer:
            return error_response("Customer not found", status_code=404)

        # Accounts for this customer
        accounts_query = """
            SELECT 
                a.account_id,
                a.account_number,
                a.account_type,
                a.balance,
                a.interest_rate,
                a.status,
                a.opened_at,
                b.branch_name,
                b.ifsc_code
            FROM accounts a
            JOIN branches b ON a.branch_id = b.branch_id
            WHERE a.customer_id = %s
            ORDER BY a.account_id ASC;
        """
        accounts = execute_query(accounts_query, (customer_id,), fetchall=True)

        # Loans for this customer
        loans_query = """
            SELECT 
                l.loan_id,
                l.loan_type,
                l.principal_amount,
                l.interest_rate,
                l.tenure_months,
                l.outstanding_balance,
                l.application_status,
                l.applied_at,
                b.branch_name
            FROM loans l
            JOIN branches b ON l.branch_id = b.branch_id
            WHERE l.customer_id = %s
            ORDER BY l.loan_id ASC;
        """
        loans = execute_query(loans_query, (customer_id,), fetchall=True)

        customer["accounts"] = accounts
        customer["loans"] = loans
        return success_response(customer, "Customer details retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch customer profile", details=e)

@customers_bp.route('', methods=['POST'])
def create_customer():
    """
    Register a new customer.
    Payload: {
        "first_name": "...",
        "last_name": "...",
        "email": "...",
        "phone": "...",
        "pan_number": "...",
        "kyc_status": "PENDING" (optional, default PENDING),
        "referred_by": int (optional)
    }
    """
    data = request.get_json() or {}
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    pan_number = data.get('pan_number', '').strip().upper()
    kyc_status = data.get('kyc_status', 'PENDING').strip().upper()
    referred_by = data.get('referred_by')

    if not all([first_name, last_name, email, phone, pan_number]):
        return error_response("Missing required customer fields (first_name, last_name, email, phone, pan_number)", status_code=400)

    if kyc_status not in ('PENDING', 'VERIFIED', 'REJECTED'):
        return error_response("Invalid kyc_status. Must be PENDING, VERIFIED, or REJECTED", status_code=400)

    try:
        insert_query = """
            INSERT INTO customers (first_name, last_name, email, phone, pan_number, kyc_status, referred_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """
        new_id = execute_query(
            insert_query,
            (first_name, last_name, email, phone, pan_number, kyc_status, referred_by or None),
            commit=True
        )
        created_customer = execute_query("SELECT * FROM customers WHERE customer_id = %s;", (new_id,), fetchone=True)
        return success_response(created_customer, "Customer created successfully", status_code=201)
    except Exception as e:
        return error_response("Failed to create customer", details=e)

@customers_bp.route('/<int:customer_id>', methods=['PUT', 'PATCH'])
def update_customer(customer_id):
    """
    Update customer details (phone, email, kyc_status, referred_by).
    """
    data = request.get_json() or {}
    updatable = ['first_name', 'last_name', 'email', 'phone', 'pan_number', 'kyc_status', 'referred_by']
    updates = []
    params = []

    for field in updatable:
        if field in data:
            val = data[field]
            if field == 'kyc_status' and val not in ('PENDING', 'VERIFIED', 'REJECTED'):
                return error_response("Invalid kyc_status value", status_code=400)
            if field == 'pan_number' and isinstance(val, str):
                val = val.upper()
            updates.append(f"{field} = %s")
            params.append(val)

    if not updates:
        return error_response("No valid fields provided for update", status_code=400)

    params.append(customer_id)
    query = f"UPDATE customers SET {', '.join(updates)} WHERE customer_id = %s;"

    try:
        execute_query(query, tuple(params), commit=True)
        updated_customer = execute_query("SELECT * FROM customers WHERE customer_id = %s;", (customer_id,), fetchone=True)
        return success_response(updated_customer, "Customer updated successfully")
    except Exception as e:
        return error_response("Failed to update customer", details=e)

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """
    Delete a customer if no active foreign key dependencies exist.
    """
    try:
        # Check existing accounts
        acc_cnt = execute_query(
            "SELECT COUNT(*) AS cnt FROM accounts WHERE customer_id = %s;",
            (customer_id,),
            fetchone=True
        )
        if acc_cnt and acc_cnt['cnt'] > 0:
            return error_response("Cannot delete customer with existing bank accounts", status_code=400)

        # Check existing loans
        loan_cnt = execute_query(
            "SELECT COUNT(*) AS cnt FROM loans WHERE customer_id = %s;",
            (customer_id,),
            fetchone=True
        )
        if loan_cnt and loan_cnt['cnt'] > 0:
            return error_response("Cannot delete customer with existing loans", status_code=400)

        execute_query("DELETE FROM customers WHERE customer_id = %s;", (customer_id,), commit=True)
        return success_response(None, f"Customer {customer_id} deleted successfully")
    except Exception as e:
        return error_response("Failed to delete customer", details=e)
