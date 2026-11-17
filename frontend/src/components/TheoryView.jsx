import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  GitBranch, 
  Scale, 
  Lock, 
  Database,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileCode,
  CheckCircle2
} from 'lucide-react';

export default function TheoryView() {
  const [activeModule, setActiveModule] = useState('normalization');
  // 'normalization' | 'acid' | 'integrity' | 'architecture' | 'algebra'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="card-title">
              <BookOpen size={18} style={{ color: 'var(--accent-text)' }} />
              <span>DBMS Syllabus & Theoretical Architecture</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Rigorous relational database management system principles implemented within <code>sppa_bank_db</code>.
            </p>
          </div>

          {/* Module Selector */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${activeModule === 'normalization' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveModule('normalization')}
            >
              1. Normalization (BCNF)
            </button>
            <button 
              className={`btn btn-sm ${activeModule === 'acid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveModule('acid')}
            >
              2. ACID & Concurrency
            </button>
            <button 
              className={`btn btn-sm ${activeModule === 'integrity' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveModule('integrity')}
            >
              3. Integrity Constraints
            </button>
            <button 
              className={`btn btn-sm ${activeModule === 'architecture' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveModule('architecture')}
            >
              4. 3-Schema Architecture
            </button>
            <button 
              className={`btn btn-sm ${activeModule === 'algebra' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveModule('algebra')}
            >
              5. Relational Operations & SQL
            </button>
          </div>
        </div>
      </div>

      {/* Module 1: Normalization (1NF to BCNF) */}
      {activeModule === 'normalization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Layers size={16} style={{ color: 'var(--accent-text)' }} />
                <span>Decomposition & Boyce-Codd Normal Form (BCNF)</span>
              </div>
              <span className="badge badge-success">ZERO REDUNDANCY</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Normalization systematically organizes attributes to eliminate insertion, update, and deletion anomalies. In <strong>sppa_bank_db</strong>, all 6 relations are fully decomposed to <strong>BCNF</strong>: for every non-trivial functional dependency where attribute X determines Y, X is guaranteed to be a superkey.
            </p>

            <div className="table-container" style={{ marginBottom: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Normal Form</th>
                    <th>Theoretical Requirement</th>
                    <th>Implementation in Core Banking Schema</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>1NF (First Normal Form)</td>
                    <td>Atomic attribute domains; no repeating groups or multivalued arrays.</td>
                    <td>Customer phones, emails, and address segments stored as discrete atomic scalar fields.</td>
                    <td><span className="badge badge-success">SATISFIED</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>2NF (Second Normal Form)</td>
                    <td>In 1NF and no non-prime attribute is partially dependent on any candidate key.</td>
                    <td>All candidate keys (e.g. <code>account_id</code>, <code>loan_id</code>, <code>transaction_id</code>) are single-attribute keys. Zero partial dependencies.</td>
                    <td><span className="badge badge-success">SATISFIED</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>3NF (Third Normal Form)</td>
                    <td>In 2NF and no non-prime attribute is transitively dependent on the primary key (no chain where X determines Y and Y determines Z).</td>
                    <td>Branch city and branch name are factored out of <code>accounts</code> into <code>branches</code> (Branch ID foreign key reference only).</td>
                    <td><span className="badge badge-success">SATISFIED</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BCNF (Boyce-Codd)</td>
                    <td>Strictly: For every functional dependency where X determines Y, X must be a candidate superkey.</td>
                    <td>Alternate keys (e.g., <code>ifsc_code</code>, <code>pan_number</code>, <code>account_number</code>, <code>reference_no</code>) each have unique constraints and determine their respective relations.</td>
                    <td><span className="badge badge-success">BCNF COMPLIANT</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Formal Functional Dependencies */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FileCode size={16} />
                <span>Functional Dependencies (FD Analysis)</span>
              </div>
            </div>
            <div className="grid-2">
              <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', border: '1px solid var(--border-strong)', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-text)', marginBottom: '0.35rem' }}>RELATION: ACCOUNTS</div>
                <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li><code>account_id</code> determines {'{account_number, customer_id, branch_id, balance, status}'}</li>
                  <li><code>account_number</code> determines {'{account_id, customer_id, branch_id, balance, status}'}</li>
                  <li><em>Both determinants are candidate keys (BCNF verified).</em></li>
                </ul>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', border: '1px solid var(--border-strong)', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-text)', marginBottom: '0.35rem' }}>RELATION: TRANSACTIONS</div>
                <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li><code>transaction_id</code> determines {'{reference_no, account_id, txn_type, amount, balance_after}'}</li>
                  <li><code>reference_no</code> determines {'{transaction_id, account_id, txn_type, amount, balance_after}'}</li>
                  <li><em>Every determinant is a superkey (Zero redundancy).</em></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module 2: ACID & Concurrency Control */}
      {activeModule === 'acid' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Lock size={16} style={{ color: 'var(--accent-text)' }} />
                <span>Transaction Processing & ACID Properties</span>
              </div>
              <span className="badge badge-info">SERIALIZABLE CONCURRENCY</span>
            </div>

            <div className="kpi-grid" style={{ marginBottom: '1rem' }}>
              <div className="kpi-card">
                <div className="kpi-label">A — ATOMICITY</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>All-or-Nothing Execution</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Multi-account fund transfers execute within a single TCL block (<code>START TRANSACTION ... COMMIT / ROLLBACK</code>). If a debit succeeds but credit fails, changes rollback immediately.
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">C — CONSISTENCY</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>Mathematical Invariance</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Total money in the system is invariant during transfers: (Sender Balance + Receiver Balance) before transfer equals total after transfer. Negative balances strictly prohibited.
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">I — ISOLATION</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>Two-Phase Locking (2PL)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Enforced via <code>SELECT ... FOR UPDATE</code>. Rows locked in exclusive mode (X-lock) to prevent Dirty Reads (G1), Non-Repeatable Reads (G2a), and Lost Updates.
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">D — DURABILITY</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>Write-Ahead Logging (WAL)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  MySQL InnoDB Redo Logs ensure that once a <code>COMMIT</code> returns success to the client, the transaction remains permanently recorded even upon sudden system reboot.
                </div>
              </div>
            </div>

            {/* Formal Serial Schedule Notation */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', border: '1px solid var(--border-strong)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent-text)', marginBottom: '0.4rem' }}>
                FORMAL INTER-ACCOUNT TRANSFER TRANSACTION SCHEDULE:
              </div>
              <pre className="font-mono" style={{ fontSize: '0.75rem', lineHeight: 1.6, overflowX: 'auto' }}>
{`T1: START TRANSACTION;
T1: r1(Account_A.balance)                 -- Read sender balance with X-Lock (FOR UPDATE)
T1: Verify(Account_A.balance >= Amount)   -- Consistency assertion
T1: w1(Account_A.balance - Amount)        -- Debit sender
T1: r1(Account_B.balance)                 -- Read receiver balance with X-Lock (FOR UPDATE)
T1: w1(Account_B.balance + Amount)        -- Credit receiver
T1: w1(Insert Transaction TRF-OUT)       -- Audit trail debit record
T1: w1(Insert Transaction TRF-IN)        -- Audit trail credit record
T1: COMMIT;                               -- Atomic commit and release of all locks`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Module 3: Integrity Constraints */}
      {activeModule === 'integrity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShieldCheck size={16} style={{ color: 'var(--accent-text)' }} />
                <span>Integrity Constraints & Referential Cascade Policies</span>
              </div>
              <span className="badge badge-success">REFERENTIAL INTEGRITY</span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Constraint Class</th>
                    <th>Formal Definition</th>
                    <th>Enforcement in sppa_bank_db</th>
                    <th>DBMS Action on Violation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Entity Integrity</td>
                    <td>Primary Key cannot contain <code>NULL</code> values.</td>
                    <td><code>PRIMARY KEY AUTO_INCREMENT</code> on all tables (<code>customer_id</code>, <code>account_id</code>, etc.).</td>
                    <td>Rejection of tuple insertion.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Referential Integrity</td>
                    <td>Foreign key must either be <code>NULL</code> or match an existing Primary Key in the referenced parent relation.</td>
                    <td>
                      <code>FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT</code>
                    </td>
                    <td>
                      <strong>RESTRICT:</strong> Prevents deletion of a customer who holds active bank accounts or outstanding loans.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Domain Constraints</td>
                    <td>Value must belong to valid attribute domain.</td>
                    <td>
                      <code>ENUM('SAVINGS', 'CURRENT', 'FD')</code> for account types; <code>DECIMAL(15,2)</code> for monetary balances.
                    </td>
                    <td>Schema validation error.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Check Constraints</td>
                    <td>Arbitrary predicate evaluating to TRUE or UNKNOWN for every tuple.</td>
                    <td>
                      <code>CHECK (balance &gt;= 0.00)</code> prevents overdrafts; <code>CHECK (interest_rate &gt;= 0.00)</code>.
                    </td>
                    <td>Immediate transaction abort.</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Key Constraints (Uniqueness)</td>
                    <td>No two distinct tuples can possess the same value on Candidate Keys.</td>
                    <td>
                      <code>UNIQUE</code> index on <code>pan_number</code>, <code>email</code>, <code>account_number</code>, and <code>reference_no</code>.
                    </td>
                    <td>Duplicate key error 1062.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Module 4: Three-Schema Architecture */}
      {activeModule === 'architecture' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Database size={16} style={{ color: 'var(--accent-text)' }} />
                <span>ANSI/SPARC Three-Schema Architecture & Data Independence</span>
              </div>
              <span className="badge badge-info">ANSI/SPARC MODEL</span>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              The ANSI/SPARC 3-level database architecture isolates user applications from physical storage concerns, providing <strong>Logical Data Independence</strong> and <strong>Physical Data Independence</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', border: '1px solid var(--border-strong)', borderLeft: '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>LEVEL 1: EXTERNAL / VIEW LEVEL (User Subschemas)</span>
                  <span className="badge badge-success">VIRTUAL RELATIONS</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  Represented by <code>customer_balance_view</code> and <code>customer_loan_view</code>. External clients query aggregated balances and loan metrics without direct write exposure to base ledger tables.
                </div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', border: '1px solid var(--border-strong)', borderLeft: '4px solid var(--info)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>LEVEL 2: CONCEPTUAL / LOGICAL LEVEL (Community View)</span>
                  <span className="badge badge-info">BCNF BASE TABLES</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  The 6 normalized tables (<code>customers</code>, <code>branches</code>, <code>accounts</code>, <code>loans</code>, <code>transactions</code>, <code>loan_repayments</code>) capturing all entities, foreign keys, and enterprise integrity constraints.
                </div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', border: '1px solid var(--border-strong)', borderLeft: '4px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>LEVEL 3: INTERNAL / PHYSICAL LEVEL (Storage Structures)</span>
                  <span className="badge badge-warning">INNODB B+ TREES</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  MySQL InnoDB clustered primary key index structures, B+ Tree secondary indexes (<code>idx_account_transactions</code>, <code>idx_customer_loans</code>), buffer pools, and doublewrite buffers on disk.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module 5: Relational Operations & SQL */}
      {activeModule === 'algebra' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Scale size={16} style={{ color: 'var(--accent-text)' }} />
                <span>Relational Operations Mapped to SQL Execution</span>
              </div>
              <span className="badge badge-success">CORE RELATIONAL OPERATIONS</span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Relational Operation</th>
                    <th>SQL Equivalent</th>
                    <th>Meaning & Plain Explanation</th>
                    <th>Implemented SQL Query in Project</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Selection (Row Filtering)</td>
                    <td className="font-mono" style={{ color: 'var(--accent-text)' }}>WHERE clause</td>
                    <td>Filters rows satisfying a condition (e.g. only active accounts).</td>
                    <td><code>SELECT * FROM accounts WHERE status = 'ACTIVE'</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Projection (Column Picking)</td>
                    <td className="font-mono" style={{ color: 'var(--accent-text)' }}>SELECT columns</td>
                    <td>Extracts only requested columns and ignores unused fields.</td>
                    <td><code>SELECT account_number, balance FROM accounts</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Natural / Inner Join</td>
                    <td className="font-mono" style={{ color: 'var(--accent-text)' }}>INNER JOIN ... ON</td>
                    <td>Combines matching rows between two tables using foreign key equality.</td>
                    <td><code>accounts a INNER JOIN customers c ON a.customer_id = c.customer_id</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Left Outer Join</td>
                    <td className="font-mono" style={{ color: 'var(--accent-text)' }}>LEFT JOIN ... ON</td>
                    <td>Preserves all records from the left table, filling missing right table values with NULL.</td>
                    <td><code>customers c LEFT JOIN loans l ON c.customer_id = l.customer_id</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Set Union</td>
                    <td className="font-mono" style={{ color: 'var(--accent-text)' }}>UNION</td>
                    <td>Combines distinct records from both queries into one combined list.</td>
                    <td><code>SELECT customer_id FROM accounts UNION SELECT customer_id FROM loans</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Set Intersection</td>
                    <td className="font-mono" style={{ color: 'var(--accent-text)' }}>INTERSECT</td>
                    <td>Returns only records that appear in both queries simultaneously.</td>
                    <td><code>SELECT customer_id FROM accounts INTERSECT SELECT customer_id FROM loans</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Set Difference</td>
                    <td className="font-mono" style={{ color: 'var(--accent-text)' }}>EXCEPT / NOT IN</td>
                    <td>Returns records that exist in the first query but NOT in the second query.</td>
                    <td><code>SELECT customer_id FROM accounts EXCEPT SELECT customer_id FROM loans</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
