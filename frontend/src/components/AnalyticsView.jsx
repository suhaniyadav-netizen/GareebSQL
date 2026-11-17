import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  PieChart, 
  Users, 
  ArrowUpRight, 
  Database,
  Code2
} from 'lucide-react';
import { api } from '../api';

export default function AnalyticsView({ showToast }) {
  const [activeReport, setActiveReport] = useState('balances'); // 'balances' | 'above_avg' | 'set_ops'
  const [customerBalances, setCustomerBalances] = useState([]);
  const [aboveAvg, setAboveAvg] = useState([]);
  const [setOps, setSetOps] = useState({ union: [], intersect: [], except: [] });
  const [activeSetTab, setActiveSetTab] = useState('intersect');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [balances, above, sets] = await Promise.all([
        api.getCustomerBalances().catch(() => []),
        api.getAboveAverageCustomers().catch(() => []),
        api.getSetOperations().catch(() => ({ union: [], intersect: [], except: [] }))
      ]);
      setCustomerBalances(balances);
      setAboveAvg(above);
      setSetOps(sets);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Selector Banner */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="card-title">
              <Database size={18} style={{ color: 'var(--accent-text)' }} />
              <span>Advanced Relational DBMS Analytics</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Interactive query visualizations for SQL Views, Subqueries, and Relational Set Operations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
            <button 
              className={`btn btn-sm ${activeReport === 'balances' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReport('balances')}
            >
              <Layers size={13} />
              <span>customer_balance_view</span>
            </button>
            <button 
              className={`btn btn-sm ${activeReport === 'above_avg' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReport('above_avg')}
            >
              <ArrowUpRight size={13} />
              <span>Above Average Subquery</span>
            </button>
            <button 
              className={`btn btn-sm ${activeReport === 'set_ops' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveReport('set_ops')}
            >
              <PieChart size={13} />
              <span>Set Operations</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report 1: customer_balance_view */}
      {activeReport === 'balances' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                Consolidated Customer Balances (SQL View)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Derived from <code>CREATE OR REPLACE VIEW customer_balance_view</code> with conditional aggregates.
              </p>
            </div>
            <span className="badge badge-info">VIEW customer_balance_view</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Accounts</th>
                  <th>Savings Bal</th>
                  <th>Current Bal</th>
                  <th>FD Bal</th>
                  <th>Total Consolidated</th>
                </tr>
              </thead>
              <tbody>
                {customerBalances.length > 0 ? (
                  customerBalances.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</td>
                      <td className="font-mono">{row.total_accounts}</td>
                      <td className="font-mono">{formatCurrency(row.savings_balance)}</td>
                      <td className="font-mono">{formatCurrency(row.current_balance)}</td>
                      <td className="font-mono">{formatCurrency(row.fd_balance)}</td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-text)' }}>
                        {formatCurrency(row.total_balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      {isLoading ? 'Loading view results...' : 'No customer balance view records'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Above Average Subquery */}
      {activeReport === 'above_avg' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                High-Net-Worth Depositors (Correlated SQL Subquery)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Identifies accounts whose balance exceeds the overall bank average: <code>WHERE balance &gt; (SELECT AVG(balance) FROM accounts)</code>.
              </p>
            </div>
            <span className="badge badge-warning">SUBQUERY</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Account No</th>
                  <th>Customer Name</th>
                  <th>Branch</th>
                  <th>Account Type</th>
                  <th>Account Balance</th>
                  <th>Bank Average</th>
                  <th>Surplus Above Avg</th>
                </tr>
              </thead>
              <tbody>
                {aboveAvg.length > 0 ? (
                  aboveAvg.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-mono" style={{ fontWeight: 600 }}>{row.account_number}</td>
                      <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                      <td>{row.branch_name}</td>
                      <td><span className="badge badge-muted">{row.account_type}</span></td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-text)' }}>
                        {formatCurrency(row.balance)}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                        {formatCurrency(row.bank_avg_balance)}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600, color: 'var(--info)' }}>
                        +{formatCurrency(row.surplus_over_avg)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      {isLoading ? 'Evaluating subquery...' : 'No accounts exceeding bank average'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Set Operations (UNION, INTERSECT, EXCEPT) */}
      {activeReport === 'set_ops' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                Relational Set Operations: Depositors vs Borrowers
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Demonstrating Relational Algebra: Depositors ∪ Borrowers, Depositors ∩ Borrowers, Depositors − Borrowers.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button 
                className={`btn btn-sm ${activeSetTab === 'intersect' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveSetTab('intersect')}
              >
                INTERSECT ({setOps.intersect?.length || 0})
              </button>
              <button 
                className={`btn btn-sm ${activeSetTab === 'union' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveSetTab('union')}
              >
                UNION ({setOps.union?.length || 0})
              </button>
              <button 
                className={`btn btn-sm ${activeSetTab === 'except' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveSetTab('except')}
              >
                EXCEPT ({setOps.except?.length || 0})
              </button>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8rem' }}>
            {activeSetTab === 'intersect' && (
              <span><strong>INTERSECT (Both Depositor & Borrower):</strong> Customers holding both an active deposit account and a loan.</span>
            )}
            {activeSetTab === 'union' && (
              <span><strong>UNION (All Active Banking Participants):</strong> Combined distinct set of all depositors and all borrowers.</span>
            )}
            {activeSetTab === 'except' && (
              <span><strong>EXCEPT / MINUS (Depositors Only):</strong> Customers who deposit money with the bank but have never taken any loan.</span>
            )}
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Relationship Category</th>
                </tr>
              </thead>
              <tbody>
                {(setOps[activeSetTab] || []).length > 0 ? (
                  setOps[activeSetTab].map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-mono">#{row.customer_id}</td>
                      <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                      <td>{row.email}</td>
                      <td className="font-mono">{row.phone}</td>
                      <td>
                        <span className={`badge ${
                          activeSetTab === 'intersect' ? 'badge-success' :
                          activeSetTab === 'union' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {activeSetTab.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      No customers in this set partition
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
