USE sppa_bank_db;

-- 1a. INNER JOIN: Account Statement showing customer & branch details
SELECT 
    t.reference_no,
    t.txn_timestamp,
    a.account_number,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    b.branch_name,
    t.txn_type,
    t.amount,
    t.balance_after,
    t.description
FROM transactions t
INNER JOIN accounts a ON t.account_id = a.account_id
INNER JOIN customers c ON a.customer_id = c.customer_id
INNER JOIN branches b ON a.branch_id = b.branch_id
WHERE a.account_number = '100100001001'
ORDER BY t.txn_timestamp DESC;


-- 1b. LEFT OUTER JOIN: All customers (even those without an account yet)
SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.kyc_status,
    a.account_number,
    COALESCE(a.balance, 0.00) AS balance
FROM customers c
LEFT JOIN accounts a ON c.customer_id = a.customer_id;


-- 1c. RIGHT OUTER JOIN: All branches and their active accounts
SELECT 
    b.branch_name,
    b.city,
    a.account_number,
    a.account_type,
    a.balance
FROM accounts a
RIGHT JOIN branches b ON a.branch_id = b.branch_id;


-- 1d. SELF JOIN: Customer referral list (who referred whom)
SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    CONCAT(r.first_name, ' ', r.last_name) AS referred_by_name
FROM customers c
LEFT JOIN customers r ON c.referred_by = r.customer_id;


-- 2a. NON-CORRELATED SUBQUERY: Customers with total balance above bank average
SELECT 
    customer_id,
    full_name,
    total_balance
FROM customer_balance_view
WHERE total_balance > (
    SELECT AVG(balance) FROM accounts WHERE status = 'ACTIVE'
);


-- 2b. CORRELATED SUBQUERY: Most recent transaction for each account
SELECT 
    a.account_number,
    t.reference_no,
    t.txn_type,
    t.amount,
    t.txn_timestamp
FROM accounts a
JOIN transactions t ON a.account_id = t.account_id
WHERE t.txn_timestamp = (
    SELECT MAX(t2.txn_timestamp)
    FROM transactions t2
    WHERE t2.account_id = a.account_id
);


-- 3a. UNION: Customers who have EITHER a bank account OR a loan
SELECT customer_id FROM accounts
UNION
SELECT customer_id FROM loans;


-- 3b. INTERSECT: Customers who have BOTH a bank account AND a loan
SELECT customer_id FROM accounts
INTERSECT
SELECT customer_id FROM loans;


-- 3c. EXCEPT (MINUS): Customers who have a bank account but NO loan
SELECT customer_id FROM accounts
EXCEPT
SELECT customer_id FROM loans;

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

EXPLAIN SELECT * FROM transactions WHERE account_id = 1 ORDER BY txn_timestamp DESC;

-- 6a. TRIGGER: Block transactions on FROZEN or CLOSED accounts
DELIMITER //
CREATE TRIGGER check_account_active_before_txn
BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE acc_status VARCHAR(20);
    SELECT status INTO acc_status FROM accounts WHERE account_id = NEW.account_id;
    IF acc_status <> 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transaction blocked: Account is not ACTIVE';
    END IF;
END//
DELIMITER ;


-- 6b. STORED PROCEDURE: Quick Account Statement Lookup
DELIMITER //
CREATE PROCEDURE get_account_statement(IN input_account_no VARCHAR(16))
BEGIN
    SELECT 
        t.reference_no,
        t.txn_timestamp,
        t.txn_type,
        t.amount,
        t.balance_after,
        t.description
    FROM transactions t
    JOIN accounts a ON t.account_id = a.account_id
    WHERE a.account_number = input_account_no
    ORDER BY t.txn_timestamp DESC;
END//
DELIMITER ;


-- Test the Stored Procedure
CALL get_account_statement('100100001001');