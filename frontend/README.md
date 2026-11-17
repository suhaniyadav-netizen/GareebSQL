# GareebSQL Frontend 💻

A minimalist, high-aesthetic web application for the GareebSQL Core Banking System (`sppa_bank_db`). Built with **React 19**, **Vite 8**, **Lucide React**, and a custom-crafted dual theme mode (Obsidian Dark & Swiss Light).

---

## ✨ Features

- **Dual Theme Mode:** Seamless switching between Obsidian Dark (`#090d16`) and Swiss Light (`#f8fafc`), with preferences persisted in `localStorage`.
- **Live Core Engine Heartbeat:** Proactive ping indicator for MySQL/Flask backend status (`/api/health`).
- **Dashboard & KPIs:** Total vault deposits, active accounts, credit book, transacted volume, and SQL window function monthly flow.
- **Account & KYC Directory:** Search, filter, and open accounts, register new customers, and freeze/activate accounts.
- **TCL Atomic Transfers:** Multi-account money transfers with pessimistic concurrency locking (`SELECT ... FOR UPDATE`), plus cash deposit and withdrawal modules.
- **Passbook Statement Generator:** Interactive statement viewer executing the backend stored procedure (`sp_account_statement`) with one-click print support.
- **Credit & Loans:** Loan application submission, loan officer approval/rejection workflows, and EMI repayments with direct account debit.
- **DBMS Analytics Playground:** Visualizations for `customer_balance_view`, above-average depositors subqueries, and relational set operations (UNION, INTERSECT, EXCEPT).

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The app will run locally at `http://localhost:5173`. Requests to `/api/*` are automatically proxied to the Flask backend running on port `5000`.

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle in the `dist/` directory.
