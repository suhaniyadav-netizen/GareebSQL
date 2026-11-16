from flask import Blueprint, request
from ..db import execute_query
from ..utils.helpers import success_response, error_response

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/summary', methods=['GET'])
def get_summary():
    """
    Get top-level KPI dashboard metrics for the core banking system.
    """
    try:
        metrics = {}

        # Customers count
        cust = execute_query("""
            SELECT 
                COUNT(*) AS total_customers,
                SUM(CASE WHEN kyc_status = 'VERIFIED' THEN 1 ELSE 0 END) AS verified_customers,
                SUM(CASE WHEN kyc_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_kyc_customers
            FROM customers;
        """, fetchone=True)
        metrics["customers"] = cust

        # Accounts & Deposits
        acc = execute_query("""
            SELECT 
                COUNT(*) AS total_accounts,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_accounts,
                COALESCE(SUM(balance), 0.00) AS total_deposits,
                COALESCE(AVG(balance), 0.00) AS average_balance
            FROM accounts;
        """, fetchone=True)
        metrics["accounts"] = acc

        # Loans & Exposure
        loans = execute_query("""
            SELECT 
                COUNT(*) AS total_loans,
                SUM(CASE WHEN application_status = 'APPROVED' THEN 1 ELSE 0 END) AS active_loans,
                COALESCE(SUM(principal_amount), 0.00) AS total_principal_disbursed,
                COALESCE(SUM(outstanding_balance), 0.00) AS total_outstanding_exposure
            FROM loans;
        """, fetchone=True)
        metrics["loans"] = loans

        # Transactions
        txns = execute_query("""
            SELECT 
                COUNT(*) AS total_transactions,
                COALESCE(SUM(amount), 0.00) AS total_volume
            FROM transactions;
        """, fetchone=True)
        metrics["transactions"] = txns

        return success_response(metrics, "Summary metrics retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch summary metrics", details=e)

@analytics_bp.route('/customer-balances', methods=['GET'])
def get_customer_balances_view():
    """
    Queries View 1: customer_balance_view
    Shows customer total accounts and consolidated balance.
    """
    try:
        data = execute_query("SELECT * FROM customer_balance_view ORDER BY total_balance DESC;", fetchall=True)
        return success_response(data, "Customer balance view retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch customer balance view", details=e)

@analytics_bp.route('/customer-loans', methods=['GET'])
def get_customer_loans_view():
    """
    Queries View 2: customer_loan_view
    Shows customer loan details, branch, amount paid, and remaining balance.
    """
    try:
        data = execute_query("SELECT * FROM customer_loan_view ORDER BY loan_id ASC;", fetchall=True)
        return success_response(data, "Customer loan view retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch customer loan view", details=e)

@analytics_bp.route('/above-average-customers', methods=['GET'])
def get_above_average_customers():
    """
    Query 2a (Subquery): Customers whose total balance is greater than the average bank account balance.
    """
    query = """
        SELECT 
            customer_id,
            full_name,
            total_balance
        FROM customer_balance_view
        WHERE total_balance > (
            SELECT AVG(balance) FROM accounts WHERE status = 'ACTIVE'
        )
        ORDER BY total_balance DESC;
    """
    try:
        data = execute_query(query, fetchall=True)
        return success_response(data, "Above-average balance customers retrieved")
    except Exception as e:
        return error_response("Failed to fetch above-average customers", details=e)

@analytics_bp.route('/monthly-activity', methods=['GET'])
def get_monthly_activity():
    """
    Query 4 (Window Functions & CTE):
    Running net change partitioned by account, plus ranking within each month.
    """
    query = """
        WITH monthly_activity AS (
            SELECT 
                a.account_number,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                DATE_FORMAT(t.txn_timestamp, '%Y-%m') AS month_year,
                SUM(CASE WHEN t.txn_type IN ('DEPOSIT', 'TRANSFER_IN') THEN t.amount ELSE 0 END) AS total_credits,
                SUM(CASE WHEN t.txn_type IN ('WITHDRAWAL', 'TRANSFER_OUT', 'LOAN_EMI') THEN t.amount ELSE 0 END) AS total_debits
            FROM transactions t
            JOIN accounts a ON t.account_id = a.account_id
            JOIN customers c ON a.customer_id = c.customer_id
            GROUP BY a.account_number, customer_name, month_year
        )
        SELECT 
            account_number,
            customer_name,
            month_year,
            total_credits,
            total_debits,
            (total_credits - total_debits) AS net_monthly_change,
            SUM(total_credits - total_debits) OVER (
                PARTITION BY account_number ORDER BY month_year
            ) AS running_net_total,
            RANK() OVER (
                PARTITION BY month_year ORDER BY total_credits DESC
            ) AS monthly_deposit_rank
        FROM monthly_activity
        ORDER BY month_year DESC, monthly_deposit_rank ASC;
    """
    try:
        data = execute_query(query, fetchall=True)
        return success_response(data, "Monthly activity window function metrics retrieved")
    except Exception as e:
        return error_response("Failed to fetch monthly activity metrics", details=e)

@analytics_bp.route('/set-operations', methods=['GET'])
def get_set_operations():
    """
    Query 3: Set operations comparing account holders and loan borrowers
    - Union (either account or loan)
    - Intersect (both account and loan)
    - Except (account but no loan)
    """
    try:
        union_res = execute_query("""
            SELECT c.customer_id, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM customers c
            WHERE c.customer_id IN (
                SELECT customer_id FROM accounts
                UNION
                SELECT customer_id FROM loans
            );
        """, fetchall=True)

        intersect_res = execute_query("""
            SELECT c.customer_id, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM customers c
            WHERE c.customer_id IN (
                SELECT customer_id FROM accounts
                INTERSECT
                SELECT customer_id FROM loans
            );
        """, fetchall=True)

        except_res = execute_query("""
            SELECT c.customer_id, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM customers c
            WHERE c.customer_id IN (
                SELECT customer_id FROM accounts
                EXCEPT
                SELECT customer_id FROM loans
            );
        """, fetchall=True)

        return success_response({
            "union_accounts_or_loans": union_res,
            "intersect_accounts_and_loans": intersect_res,
            "except_accounts_no_loans": except_res
        }, "Set operations analysis retrieved successfully")
    except Exception as e:
        return error_response("Failed to fetch set operations", details=e)
