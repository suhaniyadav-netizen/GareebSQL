CREATE TABLE branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL UNIQUE,
    city VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL UNIQUE,
    pan_number VARCHAR(10) NOT NULL UNIQUE,
    kyc_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    referred_by INT NULL, -- Enables Self-Join queries
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_referral FOREIGN KEY (referred_by) 
        REFERENCES customers(customer_id) ON DELETE SET NULL
);


CREATE TABLE accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(16) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    branch_id INT NOT NULL,
    account_type ENUM('SAVINGS', 'CURRENT', 'FD') NOT NULL DEFAULT 'SAVINGS',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    interest_rate DECIMAL(4, 2) NOT NULL DEFAULT 3.50,
    status ENUM('ACTIVE', 'FROZEN', 'CLOSED') DEFAULT 'ACTIVE',
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_balance CHECK (balance >= 0.00),
    CONSTRAINT fk_account_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(branch_id) ON DELETE RESTRICT
);


CREATE TABLE loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    branch_id INT NOT NULL,
    loan_type ENUM('HOME', 'PERSONAL', 'EDUCATION', 'VEHICLE') NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(4, 2) NOT NULL,
    tenure_months INT NOT NULL,
    outstanding_balance DECIMAL(15, 2) NOT NULL,
    application_status ENUM('APPLIED', 'APPROVED', 'REJECTED', 'CLOSED') DEFAULT 'APPLIED',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_loan_principal CHECK (principal_amount > 0),
    CONSTRAINT chk_loan_tenure CHECK (tenure_months > 0),
    CONSTRAINT chk_outstanding CHECK (outstanding_balance >= 0),
    CONSTRAINT fk_loan_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_loan_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(branch_id) ON DELETE RESTRICT
);



CREATE TABLE transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reference_no VARCHAR(36) NOT NULL UNIQUE,
    account_id INT NOT NULL,
    related_account_id INT NULL, -- Populated for peer-to-peer fund transfers
    txn_type ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'LOAN_EMI') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    description VARCHAR(255),
    txn_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_txn_amount CHECK (amount > 0),
    CONSTRAINT fk_txn_account FOREIGN KEY (account_id) 
        REFERENCES accounts(account_id) ON DELETE RESTRICT,
    CONSTRAINT fk_txn_related_account FOREIGN KEY (related_account_id) 
        REFERENCES accounts(account_id) ON DELETE SET NULL
);



CREATE TABLE loan_repayments (
    repayment_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    transaction_id BIGINT NOT NULL UNIQUE,
    emi_amount DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_emi_positive CHECK (emi_amount > 0),
    CONSTRAINT fk_repay_loan FOREIGN KEY (loan_id) 
        REFERENCES loans(loan_id) ON DELETE RESTRICT,
    CONSTRAINT fk_repay_txn FOREIGN KEY (transaction_id) 
        REFERENCES transactions(transaction_id) ON DELETE RESTRICT
);