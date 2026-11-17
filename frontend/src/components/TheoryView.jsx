import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Lock, 
  Database,
  HelpCircle,
  FileText,
  CheckCircle2
} from 'lucide-react';

export default function TheoryView() {
  const [viewMode, setViewMode] = useState('viva'); 
  // 'viva' (5-minute teacher presentation) | 'reference' (detailed syllabus modules)
  
  const [activeReferenceTab, setActiveReferenceTab] = useState('normalization');

  const vivaQuestions = [
    {
      q: '1. What is this project and what are the core entities?',
      a: 'GareebSQL is a production-grade Core Banking Relational Database (sppa_bank_db). It models real-world retail banking with 6 primary relations:',
      bullets: [
        'BRANCHES: Physical branch locations and unique IFSC codes.',
        'CUSTOMERS: KYC profiles, PAN numbers, Aadhaar, and referral links.',
        'ACCOUNTS: Savings, Current, and FD accounts with live balances.',
        'LOANS: Multi-category credit facilities (Personal, Home, Vehicle, Education).',
        'TRANSACTIONS: Immutable double-entry ledger for deposits, withdrawals, and transfers.',
        'LOAN_REPAYMENTS: Atomic EMI payments linked directly to transactions.'
      ]
    },
    {
      q: '2. What Normal Form is your database in?',
      a: 'All 6 relations are strictly normalized to Boyce-Codd Normal Form (BCNF) and Third Normal Form (3NF):',
      bullets: [
        '1NF: Every attribute holds atomic, indivisible values (no multi-valued lists).',
        '2NF: Zero partial dependencies; all primary keys are single attributes.',
        '3NF: Zero transitive dependencies (e.g. branch city is factored into BRANCHES table rather than repeated in ACCOUNTS).',
        'BCNF: For every functional dependency X → Y, X is strictly a candidate superkey.'
      ]
    },
    {
      q: '3. How does the database guarantee Integrity Constraints?',
      a: 'Enforced at the relational engine level in MySQL 8.0:',
      bullets: [
        'Entity Integrity: Every relation has an auto-increment Primary Key (PK) that cannot be NULL.',
        'Referential Integrity: Foreign Keys (FK) use ON DELETE RESTRICT to prevent deleting a customer who has active accounts or unpaid loans.',
        'Domain Constraints: ENUM constraints on kyc_status, account_type, and status; DECIMAL(15,2) for exact monetary precision.',
        'Key Constraints: UNIQUE constraints on PAN, IFSC, account numbers, and transaction reference numbers.'
      ]
    },
    {
      q: '4. How do you handle Transactions and ACID Properties?',
      a: 'Fund transfers between accounts use strict Transaction Control Language (TCL):',
      bullets: [
        'Atomicity: Wrapped in START TRANSACTION and COMMIT. If sender debit succeeds but receiver credit fails, the entire transaction rolls back.',
        'Consistency: Total vault balance is invariant during transfers; balance >= 0 is enforced.',
        'Isolation: Row-level pessimistic locking (SELECT ... FOR UPDATE) prevents Lost Updates and Dirty Reads under concurrent access.',
        'Durability: MySQL InnoDB Write-Ahead Logging (WAL) and Redo Logs guarantee persistence once committed.'
      ]
    },
    {
      q: '5. What Views, Joins, and Advanced Queries are implemented?',
      a: 'The system implements all standard relational query patterns:',
      bullets: [
        'SQL Views: customer_balance_view and customer_loan_view for logical data independence.',
        'Joins: Inner Joins (Accounts with Customers & Branches) and Left Outer Joins (Customers with no active loans).',
        'Subqueries: Non-correlated subquery identifying high-net-worth customers whose balance exceeds the overall bank average.',
        'Set Operations: UNION, INTERSECT, and EXCEPT comparing depositors vs borrowers.',
        'Window Functions: Running net balance and peer deposit rankings using RANK() OVER and SUM() OVER.'
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controller */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="card-title">
              <BookOpen size={16} />
              <span>DBMS Theory & Viva Presentation Guide</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Structured relational concepts and speaking points designed for project demonstrations and oral examinations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button 
              className={`btn btn-sm ${viewMode === 'viva' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('viva')}
            >
              <HelpCircle size={13} />
              <span>Viva Presentation Mode (5 Core Q&A)</span>
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'reference' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('reference')}
            >
              <Database size={13} />
              <span>Full Syllabus Reference</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Viva Presentation Q&A Walkthrough */}
      {viewMode === 'viva' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {vivaQuestions.map((item, idx) => (
            <div key={idx} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span className="font-mono" style={{ 
                  fontWeight: 800, 
                  background: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-strong)', 
                  padding: '0.2rem 0.55rem', 
                  fontSize: '0.75rem' 
                }}>
                  TOPIC {idx + 1}
                </span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.q}
                </h3>
              </div>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: 1.5 }}>
                {item.a}
              </p>

              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {item.bullets.map((b, bIdx) => (
                  <li key={bIdx} style={{ lineHeight: 1.5 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Mode 2: Full Syllabus Reference */}
      {viewMode === 'reference' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sub Navigation */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-tertiary)', padding: '0.35rem', border: '1px solid var(--border-strong)', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${activeReferenceTab === 'normalization' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReferenceTab('normalization')}
            >
              1. Normalization (BCNF)
            </button>
            <button 
              className={`btn btn-sm ${activeReferenceTab === 'acid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReferenceTab('acid')}
            >
              2. ACID & Concurrency
            </button>
            <button 
              className={`btn btn-sm ${activeReferenceTab === 'integrity' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReferenceTab('integrity')}
            >
              3. Integrity Constraints
            </button>
            <button 
              className={`btn btn-sm ${activeReferenceTab === 'algebra' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReferenceTab('algebra')}
            >
              4. Relational Algebra & Joins
            </button>
          </div>

          {/* Reference Tab 1: Normalization */}
          {activeReferenceTab === 'normalization' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Layers size={16} />
                  <span>Boyce-Codd Normal Form (BCNF) Verification</span>
                </div>
              </div>

              <div className="table-container" style={{ marginBottom: '1rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Normal Form</th>
                      <th>Theoretical Rule</th>
                      <th>Application in sppa_bank_db</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700 }}>1NF</td>
                      <td>All attributes must hold atomic values; no arrays.</td>
                      <td>Phone numbers, email addresses, and address fields stored as atomic scalar strings.</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>2NF</td>
                      <td>In 1NF and no non-prime attribute partially depends on a candidate key.</td>
                      <td>All primary keys are single-column auto-increments. Zero composite key partial dependencies.</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>3NF</td>
                      <td>In 2NF and no transitive dependency exists (X → Y → Z).</td>
                      <td>Branch city and branch name are factored into BRANCHES table, referenced via branch_id.</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>BCNF</td>
                      <td>For every functional dependency X → Y, X must be a superkey.</td>
                      <td>All functional determinants (account_number, pan_number, ifsc_code) are candidate keys.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reference Tab 2: ACID */}
          {activeReferenceTab === 'acid' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Lock size={16} />
                  <span>ACID Transaction Execution Flow</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', border: '1px solid var(--border-strong)', marginBottom: '1rem' }}>
                <pre className="font-mono" style={{ fontSize: '0.75rem', lineHeight: 1.6, overflowX: 'auto' }}>
{`-- Safe TCL Atomic Money Transfer Procedure
START TRANSACTION;

-- Step 1: Read and Lock Sender Account (Pessimistic X-Lock)
SELECT account_id, balance, status FROM accounts WHERE account_id = 1 FOR UPDATE;

-- Step 2: Validate Sufficient Balance
-- If balance < transfer_amount: ROLLBACK and abort

-- Step 3: Debit Sender & Credit Receiver
UPDATE accounts SET balance = balance - 2000.00 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 2000.00 WHERE account_id = 2;

-- Step 4: Record Audit Trail in Master Ledger
INSERT INTO transactions (reference_no, account_id, txn_type, amount, balance_after, description)
VALUES ('TRF-OUT-001', 1, 'TRANSFER_OUT', 2000.00, balance_after, 'Fund transfer');

INSERT INTO transactions (reference_no, account_id, txn_type, amount, balance_after, description)
VALUES ('TRF-IN-001', 2, 'TRANSFER_IN', 2000.00, balance_after, 'Fund transfer');

-- Step 5: Commit Atomically
COMMIT;`}
                </pre>
              </div>
            </div>
          )}

          {/* Reference Tab 3: Integrity Constraints */}
          {activeReferenceTab === 'integrity' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <ShieldCheck size={16} />
                  <span>Integrity Constraint Matrix</span>
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Constraint Type</th>
                      <th>Database Rule</th>
                      <th>Example in Core Banking</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Entity Integrity</td>
                      <td>Primary key must exist and cannot be NULL.</td>
                      <td><code>customer_id INT PRIMARY KEY AUTO_INCREMENT</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Referential Integrity</td>
                      <td>Child foreign key must reference an existing parent tuple.</td>
                      <td><code>FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Domain Constraints</td>
                      <td>Values must belong to a pre-defined set or range.</td>
                      <td><code>status ENUM('ACTIVE', 'FROZEN', 'CLOSED')</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Key Constraints</td>
                      <td>Candidate keys must be unique across all tuples.</td>
                      <td><code>UNIQUE (pan_number)</code>, <code>UNIQUE (account_number)</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reference Tab 4: Relational Algebra (Plain text, no confusing symbols) */}
          {activeReferenceTab === 'algebra' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <FileText size={16} />
                  <span>Relational Operations Mapped to SQL Queries</span>
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Relational Operation</th>
                      <th>Plain English Purpose</th>
                      <th>Implemented SQL Query in Project</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Selection</td>
                      <td>Filters rows that satisfy a specific condition.</td>
                      <td><code>SELECT * FROM accounts WHERE status = 'ACTIVE'</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Projection</td>
                      <td>Picks specific columns from a relation.</td>
                      <td><code>SELECT account_number, balance FROM accounts</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Inner Join</td>
                      <td>Combines rows from two tables on a matching key.</td>
                      <td><code>accounts a INNER JOIN customers c ON a.customer_id = c.customer_id</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Left Outer Join</td>
                      <td>Preserves all rows from left table, padding missing right data with NULL.</td>
                      <td><code>customers c LEFT JOIN loans l ON c.customer_id = l.customer_id</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Set Union</td>
                      <td>Combines distinct customers from accounts or loans.</td>
                      <td><code>SELECT customer_id FROM accounts UNION SELECT customer_id FROM loans</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Set Intersection</td>
                      <td>Finds customers present in both accounts and loans.</td>
                      <td><code>SELECT customer_id FROM accounts INTERSECT SELECT customer_id FROM loans</code></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Set Difference (Except)</td>
                      <td>Finds customers with accounts who have zero loans.</td>
                      <td><code>SELECT customer_id FROM accounts EXCEPT SELECT customer_id FROM loans</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
