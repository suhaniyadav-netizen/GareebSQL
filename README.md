# GareebSQL

A full-stack Core Banking Relational Database Management System (`sppa_bank_db`) built with MySQL 8.0, Python Flask, and React 19. Designed with strict 3NF/BCNF normalization, ACID transaction controls (TCL) with pessimistic locking, role-based access control, and an interactive dual-theme web interface.

---

## Quickstart

Run both the Backend API (Flask :5000) and Frontend Web App (Vite :5173) with automatic dependency installation:

```bash
npm run dev
```

- Web Interface: `http://localhost:5173`
- REST API: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`

---

## System Architecture

- **Database Tier (MySQL 8.0 / InnoDB):** Relational schema `sppa_bank_db` with domain constraints, foreign key cascades, views, composite B-Tree indexes, stored procedures, triggers, and TCL concurrency controls.
- **Application Tier (Python 3.11 / Flask):** Modular REST API with connection pooling (`mysql-connector-python`), input validation, and unified JSON responses.
- **Presentation Tier (React 19 / Vite 8):** Single-page application featuring Obsidian Dark and Swiss Light themes, live core engine heartbeat, KYC management, atomic transfers, passbook statement generation, and an interactive DBMS analytics playground.

---

## Database Schema (`sppa_bank_db`)

The relational model consists of 6 tables enforcing referential and domain integrity:

| Table | Primary Key | Foreign Keys | Key Constraints & Integrity Rules |
| :--- | :--- | :--- | :--- |
| `branches` | `branch_id` | None | `ifsc_code` UNIQUE (11 chars), `city` NOT NULL |
| `customers` | `customer_id` | `referred_by` -> `customers(customer_id)` | UNIQUE (`email`, `phone`, `pan_number`), `kyc_status` ENUM(`PENDING`, `VERIFIED`, `REJECTED`), `ON DELETE SET NULL` on referral |
| `accounts` | `account_id` | `customer_id` -> `customers`<br>`branch_id` -> `branches` | `account_number` UNIQUE, `CHECK (balance >= 0.00)`, `status` ENUM(`ACTIVE`, `FROZEN`, `CLOSED`), `ON DELETE RESTRICT` |
| `loans` | `loan_id` | `customer_id` -> `customers`<br>`branch_id` -> `branches` | `CHECK (principal_amount > 0)`, `CHECK (outstanding_balance >= 0)`, `status` ENUM(`APPLIED`, `APPROVED`, `REJECTED`, `CLOSED`) |
| `transactions` | `transaction_id` | `account_id` -> `accounts`<br>`related_account_id` -> `accounts` | `reference_no` UNIQUE, `CHECK (amount > 0)`, `txn_type` ENUM(`DEPOSIT`, `WITHDRAWAL`, `TRANSFER_IN`, `TRANSFER_OUT`, `LOAN_EMI`) |
| `loan_repayments` | `repayment_id` | `loan_id` -> `loans`<br>`transaction_id` -> `transactions` | `transaction_id` UNIQUE (1:1 ledger link), `CHECK (emi_amount > 0)`, `ON DELETE RESTRICT` |

---

## Key DBMS Implementations

### Relational Normalization (1NF to BCNF)
- **1NF:** Atomic attribute domains; repeating groups eliminated across transactions and loans.
- **2NF:** No partial dependencies; all non-key attributes depend on whole primary keys.
- **3NF:** No transitive dependencies; balance aggregates and debt calculations are derived dynamically via views.
- **BCNF:** Every determinant is a candidate key with database-level uniqueness enforcement.

### ACID Transaction Control (TCL) & Concurrency
Inter-account transfers execute inside an isolated transaction block with pessimistic locking (`SELECT ... FOR UPDATE`) to prevent race conditions and lost updates:

```sql
START TRANSACTION;

-- Lock sender account and verify balance
SELECT balance FROM accounts WHERE account_id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 2000.00 WHERE account_id = 1 AND balance >= 2000.00;

-- Lock and credit beneficiary account
SELECT balance FROM accounts WHERE account_id = 3 FOR UPDATE;
UPDATE accounts SET balance = balance + 2000.00 WHERE account_id = 3;

-- Record double-entry ledger entries
INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description)
SELECT 'REF-TRANSFER-01', 1, 3, 'TRANSFER_OUT', 2000.00, balance, 'TCL Interbank Transfer' FROM accounts WHERE account_id = 1;

INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description)
SELECT 'REF-TRANSFER-02', 3, 1, 'TRANSFER_IN', 2000.00, balance, 'TCL Interbank Transfer' FROM accounts WHERE account_id = 3;

COMMIT;
```

### Views & Optimizations
- **`customer_balance_view`:** Aggregates active deposit balances across accounts per customer.
- **`customer_loan_view`:** Computes active loan obligations, disbursed principals, and repaid totals.
- **Composite B-Tree Indexes:** `idx_account_lookup` (`customer_id`, `status`), `idx_customer_lookup` (`last_name`, `first_name`), `idx_customer_loans` (`customer_id`, `application_status`), `idx_txn_timestamp` (`account_id`, `txn_timestamp`).
- **Stored Procedure `sp_account_statement`:** Generates chronological statements with running balances over date ranges.
- **Role-Based Security (DCL):** `bank_auditor` (read-only view access), `bank_clerk` (DML operational access), `bank_admin` (full privileges).

### Analytical Query Suite
- **Joins:** Inner join (passbook statements), Left join (unbanked customers), Right join (branch coverage), Self join (referral network hierarchy).
- **Subqueries:** Non-correlated subqueries (depositors with balance above bank average), Correlated subqueries (`EXISTS` / `NOT EXISTS`).
- **Aggregations:** Branch deposit and loan risk concentrations using `GROUP BY` and `HAVING`.
- **Window Functions:** Running net cash flows (`SUM() OVER (ORDER BY ...)`) and branch-wise balance rankings (`DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...)`).
- **Set Operations:** `UNION`, `INTERSECT`, and `EXCEPT` across account holders and borrowers.

---

## REST API Overview

Built with Flask blueprints and connection pooling:

| Resource | Endpoints | Key Operations |
| :--- | :--- | :--- |
| **Health** | `GET /api/health` | Live database connectivity check |
| **Branches** | `GET /api/branches`, `POST /api/branches` | List branches with deposit totals, create branch |
| **Customers**| `GET /api/customers`, `POST /api/customers`, `PUT /api/customers/<id>` | Search directory, register customer, update KYC |
| **Accounts** | `GET /api/accounts`, `POST /api/accounts`, `PATCH /api/accounts/<id>/status` | Open account, freeze/activate, filter by type |
| **Transactions** | `POST /api/transactions/transfer`, `POST /api/transactions/deposit`, `POST /api/transactions/withdraw`, `GET /api/transactions/statement/<acc_no>` | Atomic TCL transfer, cash deposit/withdrawal, statement generation |
| **Loans** | `GET /api/loans`, `POST /api/loans`, `PATCH /api/loans/<id>/status`, `POST /api/loans/<id>/repay` | Originate loan, approve/reject, repay EMI with direct account debit |
| **Analytics** | `GET /api/analytics/summary`, `GET /api/analytics/customer-balances`, `GET /api/analytics/monthly-activity`, `GET /api/analytics/set-operations` | KPI summary, views, window functions, set operations |

---

## Frontend Web Application

- **Dual-Theme Mode:** Obsidian Dark (`#090d16`) and Swiss Light (`#f8fafc`) with persistent local storage.
- **Core Engine Heartbeat:** Proactive polling indicator for MySQL/Flask service status.
- **Executive Dashboard:** Live KPI cards for total deposits, credit book, active accounts, and monthly transaction flow.
- **Account & Customer Directory:** Real-time search, KYC status indicators, and account lifecycle management.
- **Transaction Terminal:** Dedicated UI for cash deposits, cash withdrawals, and atomic multi-account transfers.
- **Passbook Statement Generator:** Interactive statement generation with date filtering and print-ready layout.
- **Credit Desk:** Loan origination, approval workflows, and one-click EMI repayments.
- **DBMS Analytics Playground:** Interactive explorer for database views, subqueries, and relational set operations.

---

## Manual Setup & Step-by-Step Execution

### 1. Database Setup (MySQL 8.0)
```bash
mysql -u root -p < database/create_tables.sql
mysql -u root -p < database/insert_sample_data.sql
mysql -u root -p < database/views_and_security.sql
```

### 2. Backend Setup (Flask API)
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials (DB_PASSWORD)
pip install -r requirements.txt
python run.py
```

Run automated backend tests:
```bash
python test_api.py
```

### 3. Frontend Setup (React 19 / Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## Repository Structure

```text
GareebSQL/
|-- backend/                # Flask REST API, connection pooling, and routes
|-- database/               # SQL scripts (DDL, DML, Views, TCL) & execution screenshots
|-- docs/                   # ER diagram, Normalization proofs, Relational model
|-- frontend/               # React 19 + Vite 8 SPA with dual theme support
|-- dev.js                  # Single-command unified development runner
|-- package.json            # Root scripts configuration
`-- README.md               # Main project documentation
```

---

## Documentation Index

- [Database Walkthrough & Screenshots](./database/README.md)
- [Entity-Relationship Diagram](./docs/ER_Diagram.md)
- [Normalization Analysis (1NF to BCNF)](./docs/Normalization.md)
- [Relational Model & Constraints](./docs/Relational_Model.md)
- [Backend API Documentation](./backend/README.md)
- [Frontend Guide](./frontend/README.md)
