USE sppa_bank_db;

-- 1. INDEXES (Makes searching faster)
CREATE INDEX idx_account_transactions ON transactions(account_id, txn_timestamp DESC);
CREATE INDEX idx_customer_status ON customers(kyc_status);
CREATE INDEX idx_customer_loans ON loans(customer_id, application_status);

-- 2. VIEWS (Virtual tables for quick reporting)

-- View 1: Shows each customer's total accounts and total balance
CREATE OR REPLACE VIEW customer_balance_view AS
SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS full_name,
    c.email,
    c.kyc_status,
    COUNT(a.account_id) AS total_accounts,
    COALESCE(SUM(a.balance), 0.00) AS total_balance
FROM customers c
LEFT JOIN accounts a ON c.customer_id = a.customer_id AND a.status = 'ACTIVE'
GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.kyc_status;


-- View 2: Shows each customer's loan details and how much is paid vs remaining
CREATE OR REPLACE VIEW customer_loan_view AS
SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS full_name,
    l.loan_id,
    l.loan_type,
    b.branch_name,
    l.principal_amount,
    l.interest_rate,
    l.tenure_months,
    l.outstanding_balance,
    (l.principal_amount - l.outstanding_balance) AS amount_paid,
    l.application_status
FROM loans l
JOIN customers c ON l.customer_id = c.customer_id
JOIN branches b ON l.branch_id = b.branch_id;


-- 3. DCL (User Permissions: Create a read-only auditor user)
CREATE USER IF NOT EXISTS 'bank_auditor'@'localhost' IDENTIFIED BY 'Audit@2026!';
GRANT SELECT ON sppa_bank_db.customer_balance_view TO 'bank_auditor'@'localhost';
GRANT SELECT ON sppa_bank_db.customer_loan_view TO 'bank_auditor'@'localhost';
GRANT SELECT ON sppa_bank_db.transactions TO 'bank_auditor'@'localhost';


-- Demonstrate GRANT followed by REVOKE cleanly
GRANT INSERT ON sppa_bank_db.transactions TO 'bank_auditor'@'localhost';
REVOKE INSERT ON sppa_bank_db.transactions FROM 'bank_auditor'@'localhost';
FLUSH PRIVILEGES;


-- 4. TCL (Safe Money Transfer using Transaction Control)
START TRANSACTION;

UPDATE accounts SET balance = balance - 2000.00 WHERE account_id = 1 AND balance >= 2000.00;
UPDATE accounts SET balance = balance + 2000.00 WHERE account_id = 3;

INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description)
SELECT 'REF-TRANSFER-01', 1, 3, 'TRANSFER_OUT', 2000.00, balance, 'Safe TCL Transfer'
FROM accounts WHERE account_id = 1;

INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description)
SELECT 'REF-TRANSFER-02', 3, 1, 'TRANSFER_IN', 2000.00, balance, 'Safe TCL Transfer'
FROM accounts WHERE account_id = 3;

COMMIT;