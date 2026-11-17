<h1 align="center"> DBMS_Capstone_GareebSQL </h1>

A comprehensive Relational Database Management System (RDBMS) capstone project implementing a production-grade core banking system (`sppa_bank_db`).

---

## ⚡ Single Command Quickstart

You can start both the **Backend API (Flask :5000)** and the **Frontend Web App (Vite :5173)** simultaneously with one single command:

```bash
npm run dev
```

> **Automatic setup included:** The unified launcher automatically checks for missing dependencies (both Node `npm install` and Python `pip install -r requirements.txt`) and boots both services with colored live output!

- **Web Application UI:** `http://localhost:5173`
- **REST API Backend:** `http://localhost:5000`
- **API Health Check:** `http://localhost:5000/api/health`

---

## 📁 Repository Structure

- **[`database/`](./database/README.MD)**: Contains all SQL scripts (DDL, DML, Views, Security, Indexes, Triggers, Procedures) and verified execution screenshots.
  - [Detailed Database Documentation & Execution Proofs](./database/README.MD)
- **[`backend/`](./backend/README.md)**: Python Flask REST API connecting the MySQL database with connection pooling, transactional integrity (TCL), and analytics.
  - [Detailed Backend Documentation & Setup Guide](./backend/README.md)
- **[`frontend/`](./frontend/README.md)**: Minimalist, niche fintech web interface with dual theme mode (Obsidian Dark & Swiss Light), passbook statements, and atomic transfer execution.
  - [Detailed Frontend Documentation & Setup Guide](./frontend/README.md)
- **`docs/`**: Documentation, ER diagrams, normalization steps (1NF, 2NF, 3NF, BCNF), and relational schema specifications.

---

## 🛠️ Manual / Step-by-Step Execution

If you prefer running components separately:

### 1. Database Setup
Load the MySQL schema and sample data:
```bash
mysql -u root -p < database/create_tables.sql
mysql -u root -p < database/insert_sample_data.sql
mysql -u root -p < database/views_and_security.sql
```

### 2. Backend Only
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### 3. Frontend Only
```bash
cd frontend
npm install
npm run dev
```
