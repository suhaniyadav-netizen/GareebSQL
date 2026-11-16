import random
import time
from decimal import Decimal
from flask import Blueprint, request
from ..db import get_db, execute_query
from ..utils.helpers import success_response, error_response

accounts_bp = Blueprint('accounts', __name__, url_prefix='/api/accounts')

def generate_unique_account_number():
    """Generates a pseudo-random unique 12-digit bank account number."""
    prefix = "1001"
    suffix = str(int(time.time()))[-4:] + str(random.randint(1000, 9999))
    return f"{prefix}{suffix}"

@accounts_bp.route('', methods=['GET'])
def get_accounts():
    """
    Get all accounts with associated customer and branch names.
    Filterable by:
      - status: ACTIVE | FROZEN | CLOSED
      - account_type: SAVINGS | CURRENT | FD
      - customer_id: int
    """
    status_filter = request.args.get('status')
    type_filter = request.args.get('account_type')
    cust_id_filter = request.args.get('customer_id')

    conditions = []
    params = []

    if status_filter:
        conditions.append("a.status = %s")
        params.append(status_filter.upper())

    if type_filter:
        conditions.append("a.account_type = %s")
        params.append(type_filter.upper())

    if cust_id_filter:
        conditions.append("a.customer_id = %s")
        params.append(int(cust_id_filter))

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
        SELECT 
            a.account_id,
            a.account_number,
            a.customer_id,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            c.email AS customer_email,
            a.branch_id,
            b.branch_name,
            b.city AS branch_city,
            a.account_type,
            a.balance,
            a.interest_rate,
            a.status,
            a.opened_at
        FROM accounts a
        JOIN customers c ON a.customer_id = c.customer_id
        JOIN branches b ON a.branch_id = b.branch_id
        {where_clause}
        ORDER BY a.account_id ASC;
    """

    try:
        accounts = execute_query(query, tuple(params), fetchall=True)
        return success_response(accounts, "Accounts retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch accounts", details=e)

@accounts_bp.route('/<identifier>', methods=['GET'])
def get_account(identifier):
    """
    Get account details by either account_id or 12-16 digit account_number.
    """
    try:
        if identifier.isdigit() and len(identifier) <= 6:
            clause = "a.account_id = %s"
            param = int(identifier)
        else:
            clause = "a.account_number = %s"
            param = str(identifier)

        query = f"""
            SELECT 
                a.account_id,
                a.account_number,
                a.customer_id,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone,
                a.branch_id,
                b.branch_name,
                b.ifsc_code,
                b.city AS branch_city,
                a.account_type,
                a.balance,
                a.interest_rate,
                a.status,
                a.opened_at
            FROM accounts a
            JOIN customers c ON a.customer_id = c.customer_id
            JOIN branches b ON a.branch_id = b.branch_id
            WHERE {clause};
        """
        account = execute_query(query, (param,), fetchone=True)
        if not account:
            return error_response("Account not found", status_code=404)

        return success_response(account, "Account retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch account", details=e)

@accounts_bp.route('', methods=['POST'])
def open_account():
    """
    Open a new account.
    Payload: {
        "customer_id": int,
        "branch_id": int,
        "account_type": "SAVINGS" | "CURRENT" | "FD",
        "initial_deposit": float (optional, >= 0),
        "interest_rate": float (optional, default 3.50)
    }
    """
    data = request.get_json() or {}
    customer_id = data.get('customer_id')
    branch_id = data.get('branch_id')
    account_type = data.get('account_type', 'SAVINGS').upper()
    initial_deposit = float(data.get('initial_deposit', 0.00))
    interest_rate = float(data.get('interest_rate', 3.50))

    if not customer_id or not branch_id:
        return error_response("customer_id and branch_id are required", status_code=400)

    if account_type not in ('SAVINGS', 'CURRENT', 'FD'):
        return error_response("Invalid account_type. Must be SAVINGS, CURRENT, or FD", status_code=400)

    if initial_deposit < 0:
        return error_response("Initial deposit cannot be negative", status_code=400)

    account_number = data.get('account_number') or generate_unique_account_number()

    try:
        with get_db() as (conn, cursor):
            # Verify customer
            cursor.execute("SELECT customer_id FROM customers WHERE customer_id = %s;", (customer_id,))
            if not cursor.fetchone():
                return error_response("Customer not found", status_code=404)

            # Verify branch
            cursor.execute("SELECT branch_id FROM branches WHERE branch_id = %s;", (branch_id,))
            if not cursor.fetchone():
                return error_response("Branch not found", status_code=404)

            insert_query = """
                INSERT INTO accounts (account_number, customer_id, branch_id, account_type, balance, interest_rate, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE');
            """
            cursor.execute(insert_query, (account_number, customer_id, branch_id, account_type, initial_deposit, interest_rate))
            new_acc_id = cursor.lastrowid

            # If initial deposit > 0, insert an initial deposit transaction
            if initial_deposit > 0:
                ref_no = f"DEP-INIT-{int(time.time())}-{random.randint(100, 999)}"
                txn_query = """
                    INSERT INTO transactions (reference_no, account_id, txn_type, amount, balance_after, description)
                    VALUES (%s, %s, 'DEPOSIT', %s, %s, 'Initial Account Opening Deposit');
                """
                cursor.execute(txn_query, (ref_no, new_acc_id, initial_deposit, initial_deposit))

            cursor.execute("SELECT * FROM accounts WHERE account_id = %s;", (new_acc_id,))
            new_acc = cursor.fetchone()

        return success_response(new_acc, "Account opened successfully", status_code=201)
    except Exception as e:
        return error_response("Failed to open account", details=e)

@accounts_bp.route('/<int:account_id>/status', methods=['PATCH'])
def update_account_status(account_id):
    """
    Change account status: ACTIVE | FROZEN | CLOSED
    Payload: { "status": "ACTIVE" | "FROZEN" | "CLOSED" }
    """
    data = request.get_json() or {}
    new_status = data.get('status', '').upper()

    if new_status not in ('ACTIVE', 'FROZEN', 'CLOSED'):
        return error_response("Invalid status. Must be ACTIVE, FROZEN, or CLOSED", status_code=400)

    try:
        execute_query(
            "UPDATE accounts SET status = %s WHERE account_id = %s;",
            (new_status, account_id),
            commit=True
        )
        updated = execute_query("SELECT * FROM accounts WHERE account_id = %s;", (account_id,), fetchone=True)
        if not updated:
            return error_response("Account not found", status_code=404)
        return success_response(updated, f"Account status updated to {new_status}")
    except Exception as e:
        return error_response("Failed to update account status", details=e)
