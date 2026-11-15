CREATE DATABASE IF NOT EXISTS sppa_bank_db;
USE sppa_bank_db;


INSERT INTO branches (branch_name, ifsc_code, city) VALUES
('Connaught Place Main', 'NEXB0000101', 'New Delhi'),
('Cyber City Hub', 'NEXB0000102', 'Gurugram'),
('Bandra West Corporate', 'NEXB0000103', 'Mumbai');


INSERT INTO customers (first_name, last_name, email, phone, pan_number, kyc_status, referred_by) VALUES
('Aarav', 'Sharma', 'aarav.sharma@email.com', '9811001101', 'ABCPS1234A', 'VERIFIED', NULL),
('Priya', 'Verma', 'priya.verma@email.com', '9811001102', 'DEFPV5678B', 'VERIFIED', 1),
('Rohan', 'Kapoor', 'rohan.kapoor@email.com', '9811001103', 'GHIPK9012C', 'VERIFIED', 1),
('Ananya', 'Nair', 'ananya.nair@email.com', '9811001104', 'JKLAN3456D', 'VERIFIED', 2),
('Vikram', 'Mehta', 'vikram.mehta@email.com', '9811001105', 'MNOVM7890E', 'PENDING', NULL);


INSERT INTO accounts (account_number, customer_id, branch_id, account_type, balance, interest_rate, status) VALUES
('100100001001', 1, 1, 'SAVINGS', 145000.00, 3.50, 'ACTIVE'),
('100100001002', 1, 1, 'FD', 250000.00, 6.75, 'ACTIVE'),
('100100002001', 2, 2, 'SAVINGS', 82500.00, 3.50, 'ACTIVE'),
('100100003001', 3, 2, 'CURRENT', 310000.00, 0.00, 'ACTIVE'),
('100100004001', 4, 3, 'SAVINGS', 19500.00, 3.50, 'ACTIVE');


INSERT INTO loans (customer_id, branch_id, loan_type, principal_amount, interest_rate, tenure_months, outstanding_balance, application_status) VALUES
(1, 1, 'HOME', 4500000.00, 8.50, 240, 4120000.00, 'APPROVED'),
(2, 2, 'VEHICLE', 800000.00, 9.25, 60, 640000.00, 'APPROVED'),
(3, 2, 'PERSONAL', 300000.00, 11.50, 36, 300000.00, 'APPLIED'),
(4, 3, 'EDUCATION', 1200000.00, 7.80, 84, 0.00, 'CLOSED');


INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description, txn_timestamp) VALUES
('TXN-202609-001', 1, NULL, 'DEPOSIT', 100000.00, 100000.00, 'Initial Salary Credit', '2026-09-05 10:15:00'),
('TXN-202609-002', 1, 3, 'TRANSFER_OUT', 15000.00, 85000.00, 'Rent Split to Priya', '2026-09-12 14:20:00'),
('TXN-202609-003', 3, 1, 'TRANSFER_IN', 15000.00, 65000.00, 'Rent Split from Aarav', '2026-09-12 14:20:00'),
('TXN-202610-001', 1, NULL, 'DEPOSIT', 80000.00, 165000.00, 'October Salary Credit', '2026-10-05 09:45:00'),
('TXN-202610-002', 1, NULL, 'WITHDRAWAL', 20000.00, 145000.00, 'ATM Cash Withdrawal', '2026-10-18 18:10:00'),
('TXN-202610-003', 3, NULL, 'DEPOSIT', 30000.00, 95000.00, 'Freelance Payout', '2026-10-22 11:30:00'),
('TXN-202610-004', 3, NULL, 'LOAN_EMI', 12500.00, 82500.00, 'Vehicle Loan EMI Oct', '2026-10-28 08:00:00'),
('TXN-202611-001', 4, NULL, 'DEPOSIT', 350000.00, 350000.00, 'Client Retainer', '2026-11-02 12:00:00'),
('TXN-202611-002', 4, NULL, 'WITHDRAWAL', 40000.00, 310000.00, 'Vendor Equipment Payment', '2026-11-09 16:40:00'),
('TXN-202611-003', 5, NULL, 'DEPOSIT', 19500.00, 19500.00, 'Scholarship Credit', '2026-11-11 10:05:00');


INSERT INTO loan_repayments (loan_id, transaction_id, emi_amount, payment_date) VALUES
(2, 7, 12500.00, '2026-10-28 08:00:00');