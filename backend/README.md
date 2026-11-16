# GareebSQL Backend API 🏦

A production-grade Python Flask REST API connecting the core banking relational database (`sppa_bank_db`) with frontend clients. Built with **Flask**, **mysql-connector-python** connection pooling, **flask-cors**, and **python-dotenv**.

---

## 📁 Directory Structure

```text
backend/
├── app/
│   ├── __init__.py           # Flask app factory, CORS, and blueprint registration
│   ├── config.py             # Environment configurations
│   ├── db.py                 # MySQL connection pooling & context manager
│   ├── routes/
│   │   ├── __init__.py       # Blueprints aggregator
│   │   ├── accounts.py       # Bank accounts CRUD & status lifecycle
│   │   ├── analytics.py      # Views, CTEs, Window Functions, and Set operations
│   │   ├── branches.py       # Branch management and deposit rollups
│   │   ├── customers.py      # Customer profile, KYC, and referral queries
│   │   ├── loans.py          # Loan applications, status updates, and EMI repayments
│   │   └── transactions.py   # Atomic deposits, withdrawals, transfers (TCL), statements
│   └── utils/
│       ├── __init__.py
│       └── helpers.py        # Decimal/Datetime JSON serialization and standard responses
├── .env.example              # Environment variables template
├── .gitignore                # Protects secrets (.env) and Python bytecode
├── requirements.txt          # Python dependencies
├── run.py                    # Entrypoint server script
└── test_api.py               # Automated test suite
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Python 3.9+ (tested with Python 3.11)
- MySQL 8.0 running locally on port 3306 with `sppa_bank_db` schema loaded.

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory:
```bash
cp .env.example .env
```
Edit `.env` to match your local database credentials:
```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=sppa_bank_db
DB_PORT=3306
FLASK_PORT=5000
FLASK_DEBUG=True
```

### 4. Run the API Server
```bash
python run.py
```
The server will start at `http://localhost:5000`.

---

## 🧪 Running Automated Tests

Run the test suite to verify database connectivity and all endpoints:
```bash
python test_api.py
```

---

## 📡 API Endpoints Reference

### Health & Root
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API service details and route directory |
| `GET` | `/api/health` | Service health status and MySQL connectivity check |

### Branches
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/branches` | List all branches with total accounts and deposits |
| `GET` | `/api/branches/<branch_id>` | Get branch details by ID |
| `POST` | `/api/branches` | Create a new branch |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/customers` | List customers (supports `?kyc_status=` and `?search=`) |
| `GET` | `/api/customers/<id>` | Full customer profile with active accounts & loans |
| `POST` | `/api/customers` | Register a new customer |
| `PUT` | `/api/customers/<id>` | Update customer information |
| `DELETE` | `/api/customers/<id>` | Delete customer (safely constrained) |

### Accounts
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/accounts` | List accounts (supports `?status=`, `?account_type=`, `?customer_id=`) |
| `GET` | `/api/accounts/<acc_no_or_id>` | Get account details by ID or account number |
| `POST` | `/api/accounts` | Open a new bank account with optional initial deposit |
| `PATCH` | `/api/accounts/<id>/status` | Update account status (`ACTIVE`, `FROZEN`, `CLOSED`) |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | List transactions with pagination and filters |
| `GET` | `/api/transactions/<ref_no>` | Get transaction by reference number |
| `POST` | `/api/transactions/deposit` | Deposit funds into an account |
| `POST` | `/api/transactions/withdraw` | Withdraw funds from an account |
| `POST` | `/api/transactions/transfer` | **TCL atomic transfer** between two accounts |
| `GET` | `/api/transactions/statement/<acc_no>` | Account statement (calls stored procedure) |

### Loans
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/loans` | List loans with borrower & branch details |
| `GET` | `/api/loans/<id>` | Get loan details with repayment breakdown |
| `POST` | `/api/loans` | Apply for a new loan |
| `PATCH` | `/api/loans/<id>/status` | Update loan status (`APPROVED`, `REJECTED`, `CLOSED`) |
| `POST` | `/api/loans/<id>/repay` | Pay loan EMI from an account (atomic update) |

### Analytics & Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | Core banking summary KPI dashboard |
| `GET` | `/api/analytics/customer-balances` | Consolidated balances via `customer_balance_view` |
| `GET` | `/api/analytics/customer-loans` | Loan exposure report via `customer_loan_view` |
| `GET` | `/api/analytics/above-average-customers` | Subquery: Customers with balance above bank average |
| `GET` | `/api/analytics/monthly-activity` | Window function: Running net total & deposit rank |
| `GET` | `/api/analytics/set-operations` | Set operations (`UNION`, `INTERSECT`, `EXCEPT`) |
