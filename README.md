# GareebSQL: Core Banking Relational Database Management System

A comprehensive, production-grade Relational Database Management System (RDBMS) capstone project implementing an enterprise core banking architecture (`sppa_bank_db`). The project features strict relational normalization (3NF/BCNF), ACID-compliant transaction controls with pessimistic concurrency locking, composite B-tree indexing, stored procedures, views, role-based access control (RBAC), a modular Python Flask REST API middleware layer, and a high-performance React 19 single-page application with dual theme support.

---

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Database Schema & Relational Specifications](#database-schema--relational-specifications)
- [Relational Normalization (1NF, 2NF, 3NF, BCNF)](#relational-normalization-1nf-2nf-3nf-bcnf)
- [Advanced SQL & Database Features](#advanced-sql--database-features)
  - [Transaction Control (TCL) & Concurrency](#transaction-control-tcl--concurrency)
  - [Database Views](#database-views)
  - [Composite B-Tree Indexes](#composite-b-tree-indexes)
  - [Stored Procedures](#stored-procedures)
  - [Role-Based Access Control (DCL)](#role-based-access-control-dcl)
- [Analytical Query Engine & Relational Algebra](#analytical-query-engine--relational-algebra)
- [Backend REST API](#backend-rest-api)
- [Frontend Web Application](#frontend-web-application)
- [Repository Structure](#repository-structure)
- [Quickstart & Execution Guide](#quickstart--execution-guide)
  - [Single-Command Unified Launcher](#single-command-unified-launcher)
  - [Manual Step-by-Step Execution](#manual-step-by-step-execution)
- [Verification & Automated Testing](#verification--automated-testing)
- [Documentation Index](#documentation-index)

---

## Project Overview

GareebSQL was engineered to model the core operations, regulatory constraints, and transactional consistency required by modern commercial retail banking institutions. Rather than functioning as a superficial mock database, GareebSQL enforces foundational DBMS theory directly inside the storage engine:

- Strict mathematical schema normalization to eliminate insertion, update, and deletion anomalies.
- Database-level domain integrity via check constraints, composite uniqueness rules, and cascading foreign keys.
- Guaranteed ACID semantics for multi-party money transfers using transaction boundaries and row-level pessimistic locking (`SELECT ... FOR UPDATE`).
- Multi-dimensional analytical reporting utilizing SQL window functions, common table expressions (CTEs), and relational set operations.
- Clean 3-tier separation of concerns across MySQL 8.0 (Database Tier), Python Flask (Application Tier), and React 19 (Presentation Tier).

---

## System Architecture

```text
+-----------------------------------------------------------------------------------+
|                            PRESENTATION TIER (Frontend)                          |
|  React 19 | Vite 8 | Lucide Icons | Dual Theme (Obsidian Dark / Swiss Light)      |
|                                                                                   |
|  [Dashboard & KPIs]   [Customer & KYC]   [TCL Transfers]   [Passbook Statements]  |
|  [Credit & Loans]     [Analytics Hub]    [Core Engine Heartbeat Monitor]         |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JSON)
                                           v
+-----------------------------------------------------------------------------------+
|                            APPLICATION TIER (Backend API)                         |
|  Python 3.11 | Flask REST API | Modular Blueprints | MySQL Connection Pooling     |
|                                                                                   |
|  /api/health       /api/branches    /api/customers   /api/accounts                |
|  /api/transactions /api/loans       /api/analytics                                |
+------------------------------------------+----------------------------------------+
                                           | MySQL Protocol (InnoDB Engine)
                                           v
+-----------------------------------------------------------------------------------+
|                             DATABASE TIER (MySQL 8.0)                            |
|  Database: sppa_bank_db | Strict 3NF/BCNF Schema | ACID Isolation                 |
|                                                                                   |
|  Tables:            branches, customers, accounts, loans, transactions,           |
|                     loan_repayments                                               |
|  TCL & Concurrency: START TRANSACTION, COMMIT, ROLLBACK, SELECT ... FOR UPDATE    |
|  Security & DCL:    bank_admin, bank_clerk, bank_auditor                          |
|  Optimizations:     Composite B-Tree Indexes, Stored Procedures, Views            |
+-----------------------------------------------------------------------------------+
```

---

## Database Schema & Relational Specifications

The core schema `sppa_bank_db` contains 6 relational tables designed with strict referential integrity, domain checks, and foreign key action rules:

| Table | Primary Key | Foreign Keys | Key Constraints & Integrity Rules |
| :--- | :--- | :--- | :--- |
| `branches` | `branch_id` (INT Auto) | None | `ifsc_code` UNIQUE (11 characters), `city` NOT NULL, `branch_name` NOT NULL |
| `customers` | `customer_id` (INT Auto) | `referred_by` references `customers(customer_id)` | UNIQUE (`email`, `phone`, `pan_number`), `kyc_status` ENUM(`PENDING`, `VERIFIED`, `REJECTED`), `ON DELETE SET NULL` on referral |
| `accounts` | `account_id` (INT Auto) | `customer_id` references `customers`<br>`branch_id` references `branches` | `account_number` UNIQUE, `CHECK (balance >= 0.00)`, `status` ENUM(`ACTIVE`, `FROZEN`, `CLOSED`), `ON DELETE RESTRICT` |
| `loans` | `loan_id` (INT Auto) | `customer_id` references `customers`<br>`branch_id` references `branches` | `CHECK (principal_amount > 0)`, `CHECK (tenure_months > 0)`, `CHECK (outstanding_balance >= 0)`, `status` ENUM(`APPLIED`, `APPROVED`, `REJECTED`, `CLOSED`) |
| `transactions` | `transaction_id` (INT Auto) | `account_id` references `accounts`<br>`related_account_id` references `accounts` | `reference_no` UNIQUE, `CHECK (amount > 0)`, `txn_type` ENUM(`DEPOSIT`, `WITHDRAWAL`, `TRANSFER_IN`, `TRANSFER_OUT`, `LOAN_EMI`) |
| `loan_repayments` | `repayment_id` (INT Auto) | `loan_id` references `loans`<br>`transaction_id` references `transactions` | `transaction_id` UNIQUE (1:1 ledger link), `CHECK (emi_amount > 0)`, `ON DELETE RESTRICT` |

---

## Relational Normalization (1NF, 2NF, 3NF, BCNF)

The schema adheres strictly to theoretical normalization principles to guarantee zero update, insertion, or deletion anomalies:

1. **First Normal Form (1NF):**
   - All attribute domains contain strictly atomic values.
   - Repeating groups and multi-valued fields are eliminated (e.g., transactions and loans are broken out into separate relational entities rather than comma-separated lists).
   - Each table possesses an explicit primary key.

2. **Second Normal Form (2NF):**
   - The schema is in 1NF.
   - Zero partial functional dependencies exist. All non-prime attributes are fully functionally dependent on the entire primary key, eliminating composite-key partial dependencies.

3. **Third Normal Form (3NF):**
   - The schema is in 2NF.
   - Zero transitive dependencies exist ($X \to Y$ and $Y \to Z$ where $Z$ is non-prime). Calculated fields such as customer net balances and loan liabilities are projected dynamically through database views (`customer_balance_view`, `customer_loan_view`) rather than stored redundantly.

4. **Boyce-Codd Normal Form (BCNF):**
   - For every non-trivial functional dependency $X \to Y$, $X$ is a superkey.
   - Determinants across unique identifiers (`account_number`, `ifsc_code`, `pan_number`, `reference_no`) are candidate keys protected by database-level unique constraints.

Detailed mathematical proofs, functional dependency matrices, and dependency diagram proofs can be viewed in the [Database Normalization Analysis Documentation](./docs/Normalization.md).

---

## Advanced SQL & Database Features

### Transaction Control (TCL) & Concurrency

Inter-account fund transfers require strict atomicity, consistency, isolation, and durability. GareebSQL prevents lost updates, dirty reads, and non-repeatable reads by utilizing pessimistic concurrency control inside an isolated transaction block:

```sql
START TRANSACTION;

-- 1. Pessimistic lock on sender account
SELECT balance FROM accounts 
WHERE account_id = 1 
FOR UPDATE;

-- 2. Deduct funds with balance integrity safeguard
UPDATE accounts 
SET balance = balance - 2000.00 
WHERE account_id = 1 AND balance >= 2000.00;

-- 3. Pessimistic lock and credit on beneficiary account
SELECT balance FROM accounts 
WHERE account_id = 3 
FOR UPDATE;

UPDATE accounts 
SET balance = balance + 2000.00 
WHERE account_id = 3;

-- 4. Record double-entry transaction ledgers
INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description)
SELECT 'REF-TRANSFER-01', 1, 3, 'TRANSFER_OUT', 2000.00, balance, 'TCL Interbank Transfer' 
FROM accounts WHERE account_id = 1;

INSERT INTO transactions (reference_no, account_id, related_account_id, txn_type, amount, balance_after, description)
SELECT 'REF-TRANSFER-02', 3, 1, 'TRANSFER_IN', 2000.00, balance, 'TCL Interbank Transfer' 
FROM accounts WHERE account_id = 3;

COMMIT;
```

If any condition fails (such as insufficient balance or invalid beneficiary), a `ROLLBACK` is immediately executed, leaving the database state pristine.

### Database Views

- **`customer_balance_view`**: Aggregates total liquid assets per customer across multiple savings and current accounts, counting active deposit facilities without persisting redundant balance columns.
- **`customer_loan_view`**: Computes consolidated customer credit exposure, total disbursed principal, outstanding debt balances, and total repaid capital.

### Composite B-Tree Indexes

Engineered to optimize real-world query execution paths and eliminate full table scans:

- `idx_account_lookup` on `accounts(customer_id, status)`: Accelerates customer account status filtering and join operations.
- `idx_customer_lookup` on `customers(last_name, first_name)`: Optimizes directory search queries.
- `idx_customer_loans` on `loans(customer_id, application_status)`: Accelerates loan lifecycle reviews and underwriting queries.
- `idx_txn_timestamp` on `transactions(account_id, txn_timestamp)`: Optimizes chronological passbook statement generation.

### Stored Procedures

- **`sp_account_statement`**: A stored procedure accepting an account number and optional start/end date range. It returns an audited, ordered chronological ledger with beginning balance, transaction counterparties, and real-time running balances.

### Role-Based Access Control (DCL)

- **`bank_auditor`**: Granted read-only (`SELECT`) permissions on reporting views (`customer_balance_view`, `customer_loan_view`) and audited transaction history. Prohibited from modifying data.
- **`bank_clerk`**: Granted operational DML permissions (`SELECT`, `INSERT`, `UPDATE`) on accounts, customers, and transactions. Restricted from altering schemas or dropping tables.
- **`bank_admin`**: Granted full administrative privileges (`ALL PRIVILEGES`) over the `sppa_bank_db` schema.

---

## Analytical Query Engine & Relational Algebra

The repository includes a comprehensive analytical query suite demonstrating relational operators and advanced SQL constructs:

1. **Complex Multi-Table Joins:**
   - **Inner Join:** 4-table join compiling detailed account statements combining `transactions`, `accounts`, `customers`, and `branches`.
   - **Left Outer Join:** Identifies unbanked or newly registered customers with zero active deposit accounts.
   - **Right Outer Join:** Evaluates branch coverage and accounts mapped to individual physical branch locations.
   - **Self Join:** Traverses recursive customer referral trees (`referred_by`) to display referral attribution networks.

2. **Subquery Architecture:**
   - **Non-Correlated Subqueries:** Identifies high-net-worth customers whose account balance exceeds the global average across all active accounts.
   - **Correlated Subqueries:** Validates customer lending eligibility and verifies account activity using `EXISTS` and `NOT EXISTS`.

3. **Advanced Aggregations & Grouping:**
   - Branch-level deposit concentrations and loan risk distributions utilizing `GROUP BY` and `HAVING` filters.

4. **Window Functions:**
   - **Running Balance Accumulator:** Computes cumulative net transaction flow using `SUM(amount) OVER (ORDER BY txn_timestamp)`.
   - **Branch Deposit Ranking:** Ranks depositors within each branch using `DENSE_RANK() OVER (PARTITION BY branch_id ORDER BY balance DESC)`.

5. **Relational Set Operations:**
   - `UNION`: Identifies all unique individuals engaging with the bank across both deposits and loans.
   - `INTERSECT`: Isolates dual-relationship customers who maintain both an active deposit account and an active loan.
   - `EXCEPT`: Finds pure depositors who hold active savings accounts but have never originated a loan.

---

## Backend REST API

The backend is built with Python Flask and structured using a modular blueprint pattern:

- **Database Connection Pooling:** Managed via `mysql.connector.pooling.MySQLConnectionPool` in `app/db.py` to prevent connection exhaustion and handle concurrent requests efficiently.
- **Custom JSON Serialization:** Automatic conversion of MySQL `Decimal`, `date`, and `datetime` types in `app/utils/helpers.py`.
- **CORS Enabled:** Seamless integration between frontend and backend during development and deployment.

### API Endpoints Reference

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/` | API service metadata and route directory |
| | `GET` | `/api/health` | Live database connectivity and health check |
| **Branches** | `GET` | `/api/branches` | List all branches with total account and deposit rollups |
| | `GET` | `/api/branches/<id>` | Retrieve branch details |
| | `POST` | `/api/branches` | Create a new branch |
| **Customers** | `GET` | `/api/customers` | Query customers with search and KYC status filters |
| | `GET` | `/api/customers/<id>` | Full customer profile with linked accounts and loans |
| | `POST` | `/api/customers` | Register a new customer |
| | `PUT` | `/api/customers/<id>` | Update customer information |
| | `DELETE` | `/api/customers/<id>` | Remove customer (safely constrained) |
| **Accounts** | `GET` | `/api/accounts` | Query accounts with status, type, and customer filters |
| | `GET` | `/api/accounts/<acc_no_or_id>`| Retrieve account details by ID or account number |
| | `POST` | `/api/accounts` | Open a new bank account with initial deposit |
| | `PATCH` | `/api/accounts/<id>/status` | Update status (`ACTIVE`, `FROZEN`, `CLOSED`) |
| **Transactions**| `GET` | `/api/transactions` | Query transaction ledger with pagination |
| | `GET` | `/api/transactions/<ref_no>` | Retrieve transaction by reference number |
| | `POST` | `/api/transactions/deposit` | Deposit funds into an account |
| | `POST` | `/api/transactions/withdraw` | Withdraw funds from an account |
| | `POST` | `/api/transactions/transfer` | Execute atomic inter-account transfer (TCL) |
| | `GET` | `/api/transactions/statement/<acc_no>` | Generate statement via stored procedure |
| **Loans** | `GET` | `/api/loans` | List loans with borrower and branch associations |
| | `GET` | `/api/loans/<id>` | Retrieve loan details and repayment history |
| | `POST` | `/api/loans` | Submit a new loan application |
| | `PATCH` | `/api/loans/<id>/status` | Approve, reject, or close a loan application |
| | `POST` | `/api/loans/<id>/repay` | Process EMI repayment with atomic balance deduction |
| **Analytics** | `GET` | `/api/analytics/summary` | Core banking summary KPI metrics |
| | `GET` | `/api/analytics/customer-balances` | Customer balances via `customer_balance_view` |
| | `GET` | `/api/analytics/customer-loans` | Credit exposure via `customer_loan_view` |
| | `GET` | `/api/analytics/above-average-customers`| Subquery: Depositors above bank average |
| | `GET` | `/api/analytics/monthly-activity` | Window function: Running net flows and rankings |
| | `GET` | `/api/analytics/set-operations` | Set operations (`UNION`, `INTERSECT`, `EXCEPT`) |

---

## Frontend Web Application

The frontend is a single-page application built with React 19, Vite 8, and Lucide Icons:

- **Dual-Theme Design System:** Instant toggle between Obsidian Dark (`#090d16`) and Swiss Light (`#f8fafc`), with automatic local storage persistence.
- **Core Engine Heartbeat:** Proactive polling indicator providing live visual feedback on MySQL and Flask backend health.
- **Executive Dashboard:** Live KPI cards for total deposits, credit book size, active account counts, and transaction throughput.
- **Customer & Account Directory:** Full KYC status badge indicators, customer registration modal, and account freeze/activate actions.
- **Transaction Terminal:** Dedicated interactive interface for cash deposits, withdrawals, and inter-account transfers.
- **Passbook Statement Generator:** Interactive statement generation with date-range filtering, transaction table, and print-ready stylesheet formatting.
- **Credit & Loan Desk:** Loan application submission, loan officer approval/rejection workflows, and one-click EMI repayment.
- **DBMS Analytics Playground:** Interactive interface for executing and inspecting analytical SQL views, subqueries, and set operations.

---

## Repository Structure

```text
GareebSQL/
|-- backend/
|   |-- app/
|   |   |-- routes/
|   |   |   |-- __init__.py         # Blueprints aggregator
|   |   |   |-- accounts.py         # Account lifecycle management
|   |   |   |-- analytics.py        # Views, CTEs, Window functions, Set operations
|   |   |   |-- branches.py         # Branch network management
|   |   |   |-- customers.py        # Customer profile and KYC endpoints
|   |   |   |-- loans.py            # Loan applications and EMI repayments
|   |   |   `-- transactions.py     # Deposits, withdrawals, atomic transfers
|   |   |-- utils/
|   |   |   |-- __init__.py
|   |   |   `-- helpers.py          # Decimal/Date JSON serializer
|   |   |-- config.py               # Environment configuration loader
|   |   |-- db.py                   # MySQL connection pooling and context manager
|   |   `-- __init__.py             # Flask application factory and CORS
|   |-- .env.example                # Template for database credentials
|   |-- .gitignore                  # Git ignore rules for backend
|   |-- README.md                   # Backend documentation
|   |-- requirements.txt            # Python dependencies
|   |-- run.py                      # Flask server entrypoint (port 5000)
|   `-- test_api.py                 # Automated backend test suite
|-- database/
|   |-- screenshots/                # Verified MySQL Workbench execution proofs
|   |-- create_tables.sql           # DDL schema definition with check constraints
|   |-- insert_sample_data.sql      # DML realistic seed data
|   |-- project_queries.sql         # Joins, subqueries, aggregations, window functions
|   |-- views_and_security.sql      # Views, indexes, stored procedure, RBAC, TCL
|   `-- README.md                   # Database documentation and execution proofs
|-- docs/
|   |-- ER_Diagram.md               # Entity-Relationship diagram and architecture
|   |-- Normalization.md            # 1NF, 2NF, 3NF, BCNF normalization proofs
|   `-- Relational_Model.md         # Relational schema and integrity constraints
|-- frontend/
|   |-- public/
|   |   |-- favicon.svg             # Application favicon
|   |   `-- icons.svg               # SVG icons
|   |-- src/
|   |   |-- components/             # Reusable UI widgets and navigation
|   |   |-- api.js                  # Frontend API client with proxy configuration
|   |   |-- App.jsx                 # Main application shell and tab manager
|   |   |-- index.css               # Obsidian Dark / Swiss Light styles
|   |   `-- main.jsx                # React root entrypoint
|   |-- index.html                  # HTML template
|   |-- package.json                # Frontend dependencies and scripts
|   |-- README.md                   # Frontend documentation
|   `-- vite.config.js              # Vite configuration with API proxy
|-- dev.js                          # Cross-platform single-command runner
|-- package.json                    # Root package configuration
`-- README.md                       # Project documentation
```

---

## Quickstart & Execution Guide

### Single-Command Unified Launcher

The project includes an automated development supervisor (`dev.js`) that verifies dependencies, installs missing Node or Python packages, and starts both the Backend API and Frontend Dev Server simultaneously:

```bash
npm run dev
```

Once launched:
- **Web Application UI:** `http://localhost:5173`
- **REST API Backend:** `http://localhost:5000`
- **API Health Check:** `http://localhost:5000/api/health`

### Manual Step-by-Step Execution

#### 1. Database Setup
Ensure MySQL 8.0 is running locally on port 3306. Load the schema, seed data, and stored procedures:

```bash
mysql -u root -p < database/create_tables.sql
mysql -u root -p < database/insert_sample_data.sql
mysql -u root -p < database/views_and_security.sql
```

#### 2. Backend API Setup
Navigate to the `backend/` directory, configure environment variables, install requirements, and run the server:

```bash
cd backend
cp .env.example .env
# Edit .env with your local MySQL password:
# DB_PASSWORD=your_mysql_password
pip install -r requirements.txt
python run.py
```

The Flask server will start at `http://localhost:5000`.

#### 3. Frontend Web Application Setup
In a new terminal window, navigate to `frontend/`, install dependencies, and start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## Verification & Automated Testing

### Automated Backend Test Suite
An automated verification script is provided to validate database connectivity, transaction execution, and API endpoint responses:

```bash
cd backend
python test_api.py
```

### Verified Execution Proofs
Documented execution proofs across MySQL Workbench 8.0 CE are preserved in the `database/screenshots/` directory, validating:
- Table creation and constraint verification (`create_tables.png`).
- Sample data population across all 6 tables (`insert_sample_data.png`).
- Composite B-Tree index compilation (`indexes.png`).
- View projection and atomic TCL transaction execution (`views_and_tcl.png`).
- Analytical query execution across Joins, Subqueries, Window Functions, and Set Operations (`query_q1.png` through `query_triggers.png`).

---

## Documentation Index

Comprehensive documentation for every layer of the system is available in the repository:

- [Database Walkthrough & Execution Proofs](./database/README.md): Step-by-step SQL script guide with query verification screenshots.
- [Entity-Relationship Diagram & Conceptual Schema](./docs/ER_Diagram.md): Complete entity specifications, cardinality mappings, and visual diagrams.
- [Relational Normalization Analysis](./docs/Normalization.md): In-depth decomposition proofs for 1NF, 2NF, 3NF, and BCNF.
- [Relational Data Model & Integrity Constraints](./docs/Relational_Model.md): Formal relational schema notation, candidate keys, and referential actions.
- [Backend REST API Guide](./backend/README.md): Architecture, routing blueprints, connection pooling, and endpoint documentation.
- [Frontend User Interface Guide](./frontend/README.md): Design system, theme specification, and component interactions.

---

## Authors & Academic Integrity

Developed as a Capstone Project for the Relational Database Management Systems (DBMS) curriculum. All database models, SQL scripts, backend API controllers, and frontend interface components were developed to illustrate standard database engineering practices.
