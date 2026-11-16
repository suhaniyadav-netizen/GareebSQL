import time
import random
from decimal import Decimal
from flask import Blueprint, request
from ..db import get_db, execute_query
from ..utils.helpers import success_response, error_response

loans_bp = Blueprint('loans', __name__, url_prefix='/api/loans')

@loans_bp.route('', methods=['GET'])
def get_loans():
    """
    List all loans with customer, branch, and repayment progress.
    Optional query params:
      - status: APPLIED | APPROVED | REJECTED | CLOSED
      - loan_type: HOME | PERSONAL | EDUCATION | VEHICLE
      - customer_id: int
    """
    status_filter = request.args.get('status')
    type_filter = request.args.get('loan_type')
    cust_id = request.args.get('customer_id')

    conditions = []
    params = []

    if status_filter:
        conditions.append("l.application_status = %s")
        params.append(status_filter.upper())

    if type_filter:
        conditions.append("l.loan_type = %s")
        params.append(type_filter.upper())

    if cust_id:
        conditions.append("l.customer_id = %s")
        params.append(int(cust_id))

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = f"""
        SELECT 
            l.loan_id,
            l.customer_id,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            c.email AS customer_email,
            l.branch_id,
            b.branch_name,
            l.loan_type,
            l.principal_amount,
            l.interest_rate,
            l.tenure_months,
            l.outstanding_balance,
            (l.principal_amount - l.outstanding_balance) AS total_repaid,
            l.application_status,
            l.applied_at
        FROM loans l
        JOIN customers c ON l.customer_id = c.customer_id
        JOIN branches b ON l.branch_id = b.branch_id
        {where_clause}
        ORDER BY l.loan_id ASC;
    """

    try:
        loans = execute_query(query, tuple(params), fetchall=True)
        return success_response(loans, "Loans retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch loans", details=e)

@loans_bp.route('/<int:loan_id>', methods=['GET'])
def get_loan(loan_id):
    """
    Get full loan details and its repayment history.
    """
    try:
        loan_query = """
            SELECT 
                l.loan_id,
                l.customer_id,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email AS customer_email,
                l.branch_id,
                b.branch_name,
                l.loan_type,
                l.principal_amount,
                l.interest_rate,
                l.tenure_months,
                l.outstanding_balance,
                (l.principal_amount - l.outstanding_balance) AS total_repaid,
                l.application_status,
                l.applied_at
            FROM loans l
            JOIN customers c ON l.customer_id = c.customer_id
            JOIN branches b ON l.branch_id = b.branch_id
            WHERE l.loan_id = %s;
        """
        loan = execute_query(loan_query, (loan_id,), fetchone=True)
        if not loan:
            return error_response("Loan not found", status_code=404)

        repayments_query = """
            SELECT 
                lr.repayment_id,
                lr.transaction_id,
                t.reference_no,
                lr.emi_amount,
                lr.payment_date,
                t.balance_after AS account_balance_after
            FROM loan_repayments lr
            JOIN transactions t ON lr.transaction_id = t.transaction_id
            WHERE lr.loan_id = %s
            ORDER BY lr.payment_date DESC;
        """
        repayments = execute_query(repayments_query, (loan_id,), fetchall=True)
        loan["repayments"] = repayments

        return success_response(loan, "Loan details retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch loan details", details=e)

@loans_bp.route('', methods=['POST'])
def apply_loan():
    """
    Apply for a new loan.
    Payload: {
        "customer_id": int,
        "branch_id": int,
        "loan_type": "HOME" | "PERSONAL" | "EDUCATION" | "VEHICLE",
        "principal_amount": float (> 0),
        "interest_rate": float (> 0),
        "tenure_months": int (> 0)
    }
    """
    data = request.get_json() or {}
    customer_id = data.get('customer_id')
    branch_id = data.get('branch_id')
    loan_type = data.get('loan_type', '').upper()
    principal_amount = float(data.get('principal_amount', 0))
    interest_rate = float(data.get('interest_rate', 0))
    tenure_months = int(data.get('tenure_months', 0))

    if not customer_id or not branch_id:
        return error_response("customer_id and branch_id are required", status_code=400)

    if loan_type not in ('HOME', 'PERSONAL', 'EDUCATION', 'VEHICLE'):
        return error_response("Invalid loan_type. Must be HOME, PERSONAL, EDUCATION, or VEHICLE", status_code=400)

    if principal_amount <= 0 or interest_rate <= 0 or tenure_months <= 0:
        return error_response("principal_amount, interest_rate, and tenure_months must be positive numbers", status_code=400)

    try:
        with get_db() as (conn, cursor):
            # Verify customer
            cursor.execute("SELECT customer_id, kyc_status FROM customers WHERE customer_id = %s;", (customer_id,))
            customer = cursor.fetchone()
            if not customer:
                return error_response("Customer not found", status_code=404)

            # Verify branch
            cursor.execute("SELECT branch_id FROM branches WHERE branch_id = %s;", (branch_id,))
            if not cursor.fetchone():
                return error_response("Branch not found", status_code=404)

            insert_query = """
                INSERT INTO loans (
                    customer_id, branch_id, loan_type, principal_amount,
                    interest_rate, tenure_months, outstanding_balance, application_status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'APPLIED');
            """
            cursor.execute(
                insert_query,
                (customer_id, branch_id, loan_type, principal_amount, interest_rate, tenure_months, principal_amount)
            )
            loan_id = cursor.lastrowid
            cursor.execute("SELECT * FROM loans WHERE loan_id = %s;", (loan_id,))
            created_loan = cursor.fetchone()

        return success_response(created_loan, "Loan application submitted successfully", status_code=201)
    except Exception as e:
        return error_response("Failed to submit loan application", details=e)

@loans_bp.route('/<int:loan_id>/status', methods=['PATCH'])
def update_loan_status(loan_id):
    """
    Update loan status: APPROVED | REJECTED | CLOSED
    Payload: { "status": "APPROVED" | "REJECTED" | "CLOSED" }
    """
    data = request.get_json() or {}
    new_status = data.get('status', '').upper()

    if new_status not in ('APPLIED', 'APPROVED', 'REJECTED', 'CLOSED'):
        return error_response("Invalid status value", status_code=400)

    try:
        execute_query(
            "UPDATE loans SET application_status = %s WHERE loan_id = %s;",
            (new_status, loan_id),
            commit=True
        )
        updated = execute_query("SELECT * FROM loans WHERE loan_id = %s;", (loan_id,), fetchone=True)
        if not updated:
            return error_response("Loan not found", status_code=404)
        return success_response(updated, f"Loan application status set to {new_status}")
    except Exception as e:
        return error_response("Failed to update loan status", details=e)

@loans_bp.route('/<int:loan_id>/repay', methods=['POST'])
def repay_loan(loan_id):
    """
    Make an EMI / loan repayment from an account.
    Payload: {
        "account_id": int,
        "emi_amount": float (> 0)
    }
    """
    data = request.get_json() or {}
    account_id = data.get('account_id')
    emi_amount = float(data.get('emi_amount', 0))

    if not account_id or emi_amount <= 0:
        return error_response("Valid account_id and positive emi_amount are required", status_code=400)

    try:
        with get_db() as (conn, cursor):
            # Lock loan record
            cursor.execute("SELECT * FROM loans WHERE loan_id = %s FOR UPDATE;", (loan_id,))
            loan = cursor.fetchone()
            if not loan:
                return error_response("Loan not found", status_code=404)

            if loan['application_status'] != 'APPROVED':
                return error_response(f"Cannot repay loan in status '{loan['application_status']}'", status_code=400)

            outstanding = float(loan['outstanding_balance'])
            if outstanding <= 0:
                return error_response("Loan has already been fully paid off", status_code=400)

            if emi_amount > outstanding:
                emi_amount = outstanding  # Cap payment to remaining balance

            # Lock account
            cursor.execute("SELECT account_id, balance, status FROM accounts WHERE account_id = %s FOR UPDATE;", (account_id,))
            account = cursor.fetchone()
            if not account:
                return error_response("Payment account not found", status_code=404)
            if account['status'] != 'ACTIVE':
                return error_response(f"Payment account is '{account['status']}'", status_code=400)

            acc_balance = float(account['balance'])
            if acc_balance < emi_amount:
                return error_response("Insufficient balance in account to pay EMI", status_code=400)

            new_acc_balance = acc_balance - emi_amount
            new_outstanding = outstanding - emi_amount

            # 1. Update account balance
            cursor.execute("UPDATE accounts SET balance = %s WHERE account_id = %s;", (new_acc_balance, account_id))

            # 2. Insert LOAN_EMI transaction
            ref_no = f"EMI-{int(time.time())}-{random.randint(100, 999)}"
            cursor.execute("""
                INSERT INTO transactions (reference_no, account_id, txn_type, amount, balance_after, description)
                VALUES (%s, %s, 'LOAN_EMI', %s, %s, %s);
            """, (ref_no, account_id, emi_amount, new_acc_balance, f"EMI Repayment for Loan #{loan_id}"))
            txn_id = cursor.lastrowid

            # 3. Insert into loan_repayments
            cursor.execute("""
                INSERT INTO loan_repayments (loan_id, transaction_id, emi_amount)
                VALUES (%s, %s, %s);
            """, (loan_id, txn_id, emi_amount))

            # 4. Update loan outstanding balance & status if fully settled
            new_status = 'CLOSED' if new_outstanding <= 0 else 'APPROVED'
            cursor.execute("""
                UPDATE loans 
                SET outstanding_balance = %s, application_status = %s 
                WHERE loan_id = %s;
            """, (new_outstanding, new_status, loan_id))

            result = {
                "loan_id": loan_id,
                "amount_paid": emi_amount,
                "remaining_outstanding": new_outstanding,
                "loan_status": new_status,
                "transaction_reference": ref_no,
                "account_balance_after": new_acc_balance
            }

        return success_response(result, "Loan repayment recorded successfully", status_code=201)
    except Exception as e:
        return error_response("Failed to process loan repayment", details=e)
