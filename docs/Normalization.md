# Database Normalization Analysis (1NF to BCNF)
> **SPPA Core Banking System (`sppa_bank_db`)**

---

## 1. Overview & Objectives

Normalization is the systematic process of organizing data in a relational database to reduce data redundancy, eliminate anomalies during update operations (Insert, Update, Delete), and ensure data dependencies make logical sense.

In a financial system like **SPPA Core Banking**, normalization is critical:
* **Prevent Inconsistent Balances:** Eliminating duplicate storage of customer balances across branches.
* **Prevent Update Anomalies:** Updating a customer's contact info or KYC status in one place without risk of stale copies.
* **Preserve Audit Trails:** Ensuring transactions and loans remain immutably anchored to normalized keys.

---

## 2. Functional Dependencies (FD Analysis)

A functional dependency $X \rightarrow Y$ signifies that the value of attribute set $X$ uniquely determines the value of attribute set $Y$.

### 2.1 `BRANCHES`
* **Candidate Keys:** `{branch_id}`, `{ifsc_code}`
* **Primary Key:** `branch_id`
* **Dependencies:**
  * $FD_1$: `branch_id` $\rightarrow$ `{branch_name, ifsc_code, city, created_at}`
  * $FD_2$: `ifsc_code` $\rightarrow$ `{branch_id, branch_name, city, created_at}`

### 2.2 `CUSTOMERS`
* **Candidate Keys:** `{customer_id}`, `{email}`, `{phone}`, `{pan_number}`
* **Primary Key:** `customer_id`
* **Dependencies:**
  * $FD_1$: `customer_id` $\rightarrow$ `{first_name, last_name, email, phone, pan_number, kyc_status, referred_by, created_at}`
  * $FD_2$: `email` $\rightarrow$ `{customer_id, first_name, last_name, phone, pan_number, ...}`
  * $FD_3$: `phone` $\rightarrow$ `{customer_id, first_name, last_name, email, pan_number, ...}`
  * $FD_4$: `pan_number` $\rightarrow$ `{customer_id, first_name, last_name, email, phone, ...}`

### 2.3 `ACCOUNTS`
* **Candidate Keys:** `{account_id}`, `{account_number}`
* **Primary Key:** `account_id`
* **Dependencies:**
  * $FD_1$: `account_id` $\rightarrow$ `{account_number, customer_id, branch_id, account_type, balance, interest_rate, status, opened_at}`
  * $FD_2$: `account_number` $\rightarrow$ `{account_id, customer_id, branch_id, account_type, balance, interest_rate, status, opened_at}`

### 2.4 `LOANS`
* **Candidate Key & Primary Key:** `{loan_id}`
* **Dependencies:**
  * $FD_1$: `loan_id` $\rightarrow$ `{customer_id, branch_id, loan_type, principal_amount, interest_rate, tenure_months, outstanding_balance, application_status, applied_at}`

### 2.5 `TRANSACTIONS`
* **Candidate Keys:** `{transaction_id}`, `{reference_no}`
* **Primary Key:** `transaction_id`
* **Dependencies:**
  * $FD_1$: `transaction_id` $\rightarrow$ `{reference_no, account_id, related_account_id, txn_type, amount, balance_after, description, txn_timestamp}`
  * $FD_2$: `reference_no` $\rightarrow$ `{transaction_id, account_id, related_account_id, txn_type, amount, balance_after, description, txn_timestamp}`

### 2.6 `LOAN_REPAYMENTS`
* **Candidate Keys:** `{repayment_id}`, `{transaction_id}`
* **Primary Key:** `repayment_id`
* **Dependencies:**
  * $FD_1$: `repayment_id` $\rightarrow$ `{loan_id, transaction_id, emi_amount, payment_date}`
  * $FD_2$: `transaction_id` $\rightarrow$ `{repayment_id, loan_id, emi_amount, payment_date}`

---

## 3. Step-by-Step Normalization Journey

### 3.1 Unnormalized Form (UNF)
An unnormalized banking spreadsheet typically lumps customer identity, branch details, multiple account balances, and transaction histories into a single massive record with repeating groups:

$$\text{UNF}(\underline{\text{CustID}}, \text{CustName}, \text{Email}, \text{BranchName}, \text{City}, \{\text{AccNo}, \text{AccType}, \text{Bal}, \{\text{TxnRef}, \text{TxnAmt}, \text{Date}\}\})$$

* **Anomalies in UNF:**
  * **Insertion Anomaly:** A new bank branch cannot be entered until an account is opened there.
  * **Deletion Anomaly:** Deleting a customer deletes historical transaction records and branch branch records.
  * **Update Anomaly:** If a customer changes their phone number, every past transaction row must be updated.

---

### 3.2 First Normal Form (1NF)
> **Definition:** A relation $R$ is in 1NF if and only if all underlying domains contain only atomic (indivisible) values, and there are no repeating groups.

* **Transformations Applied:**
  1. Flattened repeating groups of accounts and transactions into separate records.
  2. Multi-valued fields (e.g., combining first and last names) were separated into atomic attributes (`first_name`, `last_name`).
  3. Defined explicit Primary Keys for all entities (`customer_id`, `branch_id`, `account_id`, `transaction_id`, `loan_id`).

---

### 3.3 Second Normal Form (2NF)
> **Definition:** A relation $R$ is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on every candidate key (no partial dependencies).

* **Analysis:**
  * In a composite primary key like $\{\text{account\_id}, \text{transaction\_id}\}$, attributes like `account_type` or `branch_id` depend only on `account_id` (partial dependency).
  * **Resolution:** Separated tables so that:
    * `accounts` uses single-attribute primary key `account_id`.
    * `transactions` uses single-attribute primary key `transaction_id`.
  * Because all tables in `sppa_bank_db` utilize single-attribute candidate keys (`INT AUTO_INCREMENT`), **partial functional dependency is mathematically impossible**.
  * **Conclusion:** All relations are strictly in 2NF.

---

### 3.4 Third Normal Form (3NF)
> **Definition:** A relation $R$ is in 3NF if it is in 2NF and for every functional dependency $X \rightarrow Y$, either:
> 1. $X$ is a superkey, OR
> 2. $Y$ is a prime attribute (part of a candidate key).
>
> *(Equivalently: No non-prime attribute is transitively dependent on any candidate key).*

* **Analysis & Decomposition:**
  * Suppose `accounts` stored: `(account_id, branch_name, branch_city, ifsc_code)`.
    * Transitive dependency: `account_id` $\rightarrow$ `branch_id` $\rightarrow$ `city`.
    * This would cause update anomalies if a branch changes city.
  * **Resolution in `sppa_bank_db`:**
    * Branch information is segregated into `branches(branch_id, branch_name, ifsc_code, city)`.
    * `accounts` only holds foreign key `branch_id`.
  * Suppose `loans` stored borrower PAN or borrower email:
    * Transitive dependency: `loan_id` $\rightarrow$ `customer_id` $\rightarrow$ `pan_number`.
    * **Resolution:** Customer KYC attributes are stored strictly in `customers`.
  * **Conclusion:** Zero transitive dependencies exist. All tables satisfy 3NF.

---

### 3.5 Boyce-Codd Normal Form (BCNF)
> **Definition:** A relation $R$ is in BCNF if and only if for every non-trivial functional dependency $X \rightarrow Y$, the determinant $X$ is a superkey.

* **Analysis across all relations:**
  * In `branches`: Determinants are `branch_id` and `ifsc_code` — both are candidate keys (superkeys).
  * In `customers`: Determinants are `customer_id`, `email`, `phone`, `pan_number` — all are unique candidate keys (superkeys).
  * In `accounts`: Determinants are `account_id` and `account_number` — both are candidate keys.
  * In `loans`: Determinant is `loan_id` — candidate key.
  * In `transactions`: Determinants are `transaction_id` and `reference_no` — both are candidate keys.
  * In `loan_repayments`: Determinants are `repayment_id` and `transaction_id` — both are candidate keys.

**Conclusion:** Since the left-hand side (determinant) of every functional dependency in every relation is a superkey, the entire schema is in **Boyce-Codd Normal Form (BCNF)**.

---

## 4. Normalization Summary Matrix

| Table Name | 1NF Compliance | 2NF Compliance | 3NF Compliance | BCNF Compliance | Determinant Verification |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`branches`** | [Pass] Atomic | [Pass] No partial FDs | [Pass] No transitive FDs | [Pass] Superkey | `branch_id`, `ifsc_code` |
| **`customers`** | [Pass] Atomic | [Pass] No partial FDs | [Pass] No transitive FDs | [Pass] Superkey | `customer_id`, `email`, `phone`, `pan_number` |
| **`accounts`** | [Pass] Atomic | [Pass] No partial FDs | [Pass] No transitive FDs | [Pass] Superkey | `account_id`, `account_number` |
| **`loans`** | [Pass] Atomic | [Pass] No partial FDs | [Pass] No transitive FDs | [Pass] Superkey | `loan_id` |
| **`transactions`**| [Pass] Atomic | [Pass] No partial FDs | [Pass] No transitive FDs | [Pass] Superkey | `transaction_id`, `reference_no` |
| **`loan_repayments`** | [Pass] Atomic | [Pass] No partial FDs | [Pass] No transitive FDs | [Pass] Superkey | `repayment_id`, `transaction_id` |

---

## 5. Controlled De-normalization via Views

To avoid the query latency of multi-table joins during read-heavy reporting while retaining strict BCNF at the storage layer, virtual SQL Views were established:
* **`customer_balance_view`**: Aggregates customer totals without denormalizing raw tables.
* **`customer_loan_view`**: Joins loans with branches and calculates amortized amounts on demand.
