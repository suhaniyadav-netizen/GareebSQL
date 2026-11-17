<h1 align="center"> DBMS_Capstone_GareebSQL </h1>

A comprehensive Relational Database Management System (RDBMS) capstone project implementing a production-grade core banking system (`sppa_bank_db`).

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

## 🚀 Running the Full Stack

### 1. Database
Load the MySQL schema and sample data:
```bash
mysql -u root -p < database/create_tables.sql
mysql -u root -p < database/insert_sample_data.sql
mysql -u root -p < database/views_and_security.sql
```

### 2. Backend API
```bash
cd backend
pip install -r requirements.txt
python run.py
```
Backend API will start at `http://localhost:5000`.

### 3. Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
Frontend client will start at `http://localhost:5173`.
