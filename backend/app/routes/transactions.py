import time
import random
from decimal import Decimal
from flask import Blueprint, request
from ..db import get_db, execute_query
from ..utils.helpers import success_response, error_response

transactions_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

def generate_ref_no(prefix="TXN"):
    return f"{prefix}-{int(time.time())}-{random.randint(1000, 9999)}"

@transactions_bp.route('', methods=['GET'])
def get_transactions():
    """
    List transactions with rich filtering and pagination.
    Query params:
      - account_id: int
      - txn_type: DEPOSIT | WITHDRAWAL | TRANSFER_IN | TRANSFER_OUT | LOAN_EMI
      - limit: int (default 50)
      - offset: int (default 0)
    """
    account_id = request.args.get('account_id')
    txn_type = request.args.get('txn_type')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))

    conditions = []
    params = []

    if account_id:
        conditions.append("(t.account_id = %s OR t.related_account_id = %s)")
        params.extend([int(account_id), int(account_id)])

    if txn_type:
        conditions.append("t.txn_type = %s")
        params.append(txn_type.upper())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
        SELECT 
            t.transaction_id,
            t.reference_no,
            t.account_id,
            a.account_number,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            t.related_account_id,
            ra.account_number AS related_account_number,
            t.txn_type,
            t.amount,
            t.balance_after,
            t.description,
            t.txn_timestamp
        FROM transactions t
        JOIN accounts a ON t.account_id = a.account_id
        JOIN customers c ON a.customer_id = c.customer_id
        LEFT JOIN accounts ra ON t.related_account_id = ra.account_id
        {where_clause}
        ORDER BY t.txn_timestamp DESC
        LIMIT %s OFFSET %s;
    """
    params.extend([limit, offset])

    try:
        txns = execute_query(query, tuple(params), fetchall=True)
        return success_response(txns, "Transactions retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch transactions", details=e)

@transactions_bp.route('/<reference_no>', methods=['GET'])
def get_transaction_by_ref(reference_no):
    """
    Get detailed information for a specific transaction by reference number.
    """
    query = """
        SELECT 
            t.transaction_id,
            t.reference_no,
            t.account_id,
            a.account_number,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            t.related_account_id,
            ra.account_number AS related_account_number,
            t.txn_type,
            t.amount,
            t.balance_after,
            t.description,
            t.txn_timestamp
        FROM transactions t
        JOIN accounts a ON t.account_id = a.account_id
        JOIN customers c ON a.customer_id = c.customer_id
        LEFT JOIN accounts ra ON t.related_account_id = ra.account_id
        WHERE t.reference_no = %s;
    """
    try:
        txn = execute_query(query, (reference_no,), fetchone=True)
        if not txn:
            return error_response("Transaction not found", status_code=404)
        return success_response(txn, "Transaction retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch transaction", details=e)

@transactions_bp.route('/deposit', methods=['POST'])
def deposit():
    """
    Deposit funds into an account.
    Payload: {
        "account_id": int,
        "amount": float (> 0),
        "description": string (optional)
    }
    """
    data = request.get_json() or {}
    account_id = data.get('account_id')
    amount = float(data.get('amount', 0))
    description = data.get('description', 'Cash/Online Deposit')

    if not account_id or amount <= 0:
        return error_response("Valid account_id and positive amount are required", status_code=400)

    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT account_id, balance, status FROM accounts WHERE account_id = %s FOR UPDATE;", (account_id,))
            account = cursor.fetchone()
            if not account:
                return error_response("Account not found", status_code=404)
            if account['status'] != 'ACTIVE':
                return error_response(f"Cannot deposit into an account with status '{account['status']}'", status_code=400)

            new_balance = float(account['balance']) + amount
            cursor.execute("UPDATE accounts SET balance = %s WHERE account_id = %s;", (new_balance, account_id))

            ref_no = generate_ref_no("DEP")
            cursor.execute("""
                INSERT INTO transactions (reference_no, account_id, txn_type, amount, balance_after, description)
                VALUES (%s, %s, 'DEPOSIT', %s, %s, %s);
            """, (ref_no, account_id, amount, new_balance, description))

            cursor.execute("SELECT * FROM transactions WHERE reference_no = %s;", (ref_no,))
            txn = cursor.fetchone()

        return success_response(txn, "Deposit completed successfully", status_code=201)
    except Exception as e:
        return error_response("Failed to process deposit", details=e)

@transactions_bp.route('/withdraw', methods=['POST'])
def withdraw():
    """
    Withdraw funds from an account.
    Payload: {
        "account_id": int,
        "amount": float (> 0),
        "description": string (optional)
    }
    """
    data = request.get_json() or {}
    account_id = data.get('account_id')
    amount = float(data.get('amount', 0))
    description = data.get('description', 'ATM/Online Withdrawal')

    if not account_id or amount <= 0:
        return error_response("Valid account_id and positive amount are required", status_code=400)

    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT account_id, balance, status FROM accounts WHERE account_id = %s FOR UPDATE;", (account_id,))
            account = cursor.fetchone()
            if not account:
                return error_response("Account not found", status_code=404)
            if account['status'] != 'ACTIVE':
                return error_response(f"Cannot withdraw from an account with status '{account['status']}'", status_code=400)

            current_balance = float(account['balance'])
            if current_balance < amount:
                return error_response("Insufficient funds for withdrawal", status_code=400)

            new_balance = current_balance - amount
            cursor.execute("UPDATE accounts SET balance = %s WHERE account_id = %s;", (new_balance, account_id))

            ref_no = generate_ref_no("WTH")
            cursor.execute("""
                INSERT INTO transactions (reference_no, account_id, txn_type, amount, balance_after, description)
                VALUES (%s, %s, 'WITHDRAWAL', %s, %s, %s);
            """, (ref_no, account_id, amount, new_balance, description))

            cursor.execute("SELECT * FROM transactions WHERE reference_no = %s;", (ref_no,))
            txn = cursor.fetchone()

        return success_response(txn, "Withdrawal completed successfully", status_code=201)
    except Exception as e:
        return error_response("Failed to process withdrawal", details=e)

@transactions_bp.route('/transfer', methods=['POST'])
def transfer():
    """
    Safe TCL-based fund transfer between two accounts.
    Payload: {
        "from_account_id": int,
        "to_account_id": int,
        "amount": float (> 0),
        "description": string (optional)
    }
    """
    data = request.get_json() or {}
    from_acc_id = data.get('from_account_id')
    to_acc_id = data.get('to_account_id')
    amount = float(data.get('amount', 0))
    description = data.get('description', 'Inter-account fund transfer')

    if not from_acc_id or not to_acc_id or amount <= 0:
        return error_response("from_account_id, to_account_id, and positive amount are required", status_code=400)

    if from_acc_id == to_acc_id:
        return error_response("Sender and receiver accounts cannot be the same", status_code=400)

    try:
        with get_db() as (conn, cursor):
            # Lock sender account
            cursor.execute("SELECT account_id, balance, status FROM accounts WHERE account_id = %s FOR UPDATE;", (from_acc_id,))
            sender = cursor.fetchone()
            if not sender:
                return error_response("Sender account not found", status_code=404)
            if sender['status'] != 'ACTIVE':
                return error_response(f"Sender account is not ACTIVE (current status: '{sender['status']}')", status_code=400)

            sender_balance = float(sender['balance'])
            if sender_balance < amount:
                return error_response("Insufficient balance in sender account", status_code=400)

            # Lock receiver account
            cursor.execute("SELECT account_id, balance, status FROM accounts WHERE account_id = %s FOR UPDATE;", (to_acc_id,))
            receiver = cursor.fetchone()
            if not receiver:
                return error_response("Receiver account not found", status_code=404)
            if receiver['status'] != 'ACTIVE':
                return error_response(f"Receiver account is not ACTIVE (current status: '{receiver['status']}')", status_code=400)

            new_sender_bal = sender_balance - amount
            new_receiver_bal = float(receiver['balance']) + amount

            # Update balances
            cursor.execute("UPDATE accounts SET balance = %s WHERE account_id = %s;", (new_sender_bal, from_acc_id))
            cursor.execute("UPDATE accounts SET balance = %s WHERE account_id = %s;", (new_receiver_bal, to_acc_id))

            # Record sender TRANSFER_OUT
            ref_out = generate_ref_no("TRF-OUT")
            cursor.execute("""
                INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description)
                VALUES (%s, %s, %s, 'TRANSFER_OUT', %s, %s, %s);
            """, (ref_out, from_acc_id, to_acc_id, amount, new_sender_bal, description))

            # Record receiver TRANSFER_IN
            ref_in = generate_ref_no("TRF-IN")
            cursor.execute("""
                INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description)
                VALUES (%s, %s, %s, 'TRANSFER_IN', %s, %s, %s);
            """, (ref_in, to_acc_id, from_acc_id, amount, new_receiver_bal, description))

            result = {
                "transfer_out_ref": ref_out,
                "transfer_in_ref": ref_in,
                "amount": amount,
                "from_account_id": from_acc_id,
                "to_account_id": to_acc_id,
                "sender_balance_after": new_sender_bal,
                "receiver_balance_after": new_receiver_bal
            }

        return success_response(result, "Transfer completed successfully", status_code=201)
    except Exception as e:
        return error_response("Failed to execute transfer", details=e)

@transactions_bp.route('/statement/<account_number>', methods=['GET'])
def get_statement(account_number):
    """
    Lookup account statement for an account number.
    Executes the stored procedure `get_account_statement` or falls back to direct query.
    """
    try:
        with get_db() as (conn, cursor):
            try:
                cursor.callproc('get_account_statement', [account_number])
                statement = []
                for result in cursor.stored_results():
                    statement.extend(result.fetchall())
            except Exception:
                # Direct SQL fallback if stored procedure is not loaded in current instance
                sql = """
                    SELECT 
                        t.reference_no,
                        t.txn_timestamp,
                        t.txn_type,
                        t.amount,
                        t.balance_after,
                        t.description
                    FROM transactions t
                    JOIN accounts a ON t.account_id = a.account_id
                    WHERE a.account_number = %s
                    ORDER BY t.txn_timestamp DESC;
                """
                cursor.execute(sql, (account_number,))
                statement = cursor.fetchall()

        return success_response(statement, f"Statement for account {account_number} retrieved")
    except Exception as e:
        return error_response("Failed to fetch account statement", details=e)
