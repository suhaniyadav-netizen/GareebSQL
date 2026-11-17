import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  PieChart, 
  Users, 
  ArrowUpRight, 
  Database,
  Code2,
  TrendingUp,
  CreditCard,
  Building2,
  ShieldCheck,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../api';

export default function AnalyticsView({ 
  summary, 
  accounts = [], 
  loans = [], 
  branches = [], 
  customers = [],
  showToast 
}) {
  const [activeTab, setActiveTab] = useState('balances'); 
  // 'balances' | 'loans' | 'subquery' | 'sets' | 'window'
  
  const [customerBalances, setCustomerBalances] = useState([]);
  const [customerLoans, setCustomerLoans] = useState([]);
  const [aboveAvg, setAboveAvg] = useState([]);
  const [setOps, setSetOps] = useState({
    union_accounts_or_loans: [],
    intersect_accounts_and_loans: [],
    except_accounts_no_loans: []
  });
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  const [activeSetFilter, setActiveSetFilter] = useState('intersect');
  const [showSqlInspector, setShowSqlInspector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    setIsLoading(true);
    try {
      const [balancesRes, loansRes, aboveRes, setsRes, windowRes] = await Promise.allSettled([
        api.getCustomerBalances(),
        api.getCustomerLoans(),
        api.getAboveAverageCustomers(),
        api.getSetOperations(),
        api.getMonthlyActivity()
      ]);

      if (balancesRes.status === 'fulfilled') setCustomerBalances(balancesRes.value || []);
      if (loansRes.status === 'fulfilled') setCustomerLoans(loansRes.value || []);
      if (aboveRes.status === 'fulfilled') setAboveAvg(aboveRes.value || []);
      if (setsRes.status === 'fulfilled') setSetOps(setsRes.value || {});
      if (windowRes.status === 'fulfilled') setMonthlyActivity(windowRes.value || []);
    } catch (err) {
      showToast?.('Error loading analytical datasets: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Financial Calculations
  const totalVaultBalance = accounts.reduce((acc, a) => acc + parseFloat(a.balance || 0), 0);
  const totalPrincipal = loans.reduce((acc, l) => acc + parseFloat(l.principal_amount || 0), 0);
  const totalOutstanding = loans.reduce((acc, l) => acc + parseFloat(l.outstanding_balance || 0), 0);
  const totalLoanRepaid = Math.max(0, totalPrincipal - totalOutstanding);
  const loanRecoveryRate = totalPrincipal > 0 ? ((totalLoanRepaid / totalPrincipal) * 100).toFixed(1) : 0;
  const ldrRatio = totalVaultBalance > 0 ? ((totalOutstanding / totalVaultBalance) * 100).toFixed(1) : 0;
  const avgAccountBalance = accounts.length > 0 ? (totalVaultBalance / accounts.length) : 0;
  const verifiedKycCount = customers.filter(c => c.kyc_status === 'VERIFIED').length;
  const kycRate = customers.length > 0 ? ((verifiedKycCount / customers.length) * 100).toFixed(1) : 0;

  // Account Type Distribution breakdown
  const savingsBalance = accounts.filter(a => a.account_type === 'SAVINGS').reduce((s, a) => s + parseFloat(a.balance || 0), 0);
  const currentBalance = accounts.filter(a => a.account_type === 'CURRENT').reduce((s, a) => s + parseFloat(a.balance || 0), 0);
  const fdBalance = accounts.filter(a => a.account_type === 'FD').reduce((s, a) => s + parseFloat(a.balance || 0), 0);

  const savingsPercent = totalVaultBalance > 0 ? ((savingsBalance / totalVaultBalance) * 100).toFixed(1) : 0;
  const currentPercent = totalVaultBalance > 0 ? ((currentBalance / totalVaultBalance) * 100).toFixed(1) : 0;
  const fdPercent = totalVaultBalance > 0 ? ((fdBalance / totalVaultBalance) * 100).toFixed(1) : 0;

  // Branch Rankings
  const sortedBranches = [...branches].sort((a, b) => parseFloat(b.total_deposits || 0) - parseFloat(a.total_deposits || 0));

  // SQL Query Reference Definitions
  const sqlSnippets = {
    balances: `-- 1. VIEW DEFINITION: customer_balance_view
CREATE OR REPLACE VIEW customer_balance_view AS
SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS full_name,
    c.email,
    c.kyc_status,
    COUNT(a.account_id) AS total_accounts,
    COALESCE(SUM(a.balance), 0.00) AS total_balance
FROM customers c
LEFT JOIN accounts a ON c.customer_id = a.customer_id AND a.status = 'ACTIVE'
GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.kyc_status;`,

    loans: `-- 2. VIEW DEFINITION: customer_loan_view
CREATE OR REPLACE VIEW customer_loan_view AS
SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS full_name,
    l.loan_id,
    l.loan_type,
    b.branch_name,
    l.principal_amount,
    l.interest_rate,
    l.tenure_months,
    l.outstanding_balance,
    (l.principal_amount - l.outstanding_balance) AS amount_paid,
    l.application_status
FROM loans l
JOIN customers c ON l.customer_id = c.customer_id
JOIN branches b ON l.branch_id = b.branch_id;`,

    subquery: `-- 3. NON-CORRELATED SUBQUERY: Above Average Balance Customers
SELECT 
    customer_id,
    full_name,
    total_balance
FROM customer_balance_view
WHERE total_balance > (
    SELECT AVG(balance) FROM accounts WHERE status = 'ACTIVE'
)
ORDER BY total_balance DESC;`,

    sets: `-- 4. RELATIONAL SET OPERATIONS: Customers in Accounts vs Loans
-- INTERSECT (Both Account & Loan):
SELECT customer_id, CONCAT(first_name, ' ', last_name) FROM customers
WHERE customer_id IN (SELECT customer_id FROM accounts INTERSECT SELECT customer_id FROM loans);

-- UNION (Account OR Loan):
SELECT customer_id, CONCAT(first_name, ' ', last_name) FROM customers
WHERE customer_id IN (SELECT customer_id FROM accounts UNION SELECT customer_id FROM loans);

-- EXCEPT / MINUS (Account but NO Loan):
SELECT customer_id, CONCAT(first_name, ' ', last_name) FROM customers
WHERE customer_id IN (SELECT customer_id FROM accounts EXCEPT SELECT customer_id FROM loans);`,

    window: `-- 5. CTE & WINDOW FUNCTIONS: Monthly Running Ledger & Deposit Ranking
WITH monthly_activity AS (
    SELECT 
        a.account_number,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        DATE_FORMAT(t.txn_timestamp, '%Y-%m') AS month_year,
        SUM(CASE WHEN t.txn_type IN ('DEPOSIT', 'TRANSFER_IN') THEN t.amount ELSE 0 END) AS total_credits,
        SUM(CASE WHEN t.txn_type IN ('WITHDRAWAL', 'TRANSFER_OUT', 'LOAN_EMI') THEN t.amount ELSE 0 END) AS total_debits
    FROM transactions t
    JOIN accounts a ON t.account_id = a.account_id
    JOIN customers c ON a.customer_id = c.customer_id
    GROUP BY a.account_number, customer_name, month_year
)
SELECT 
    account_number,
    customer_name,
    month_year,
    total_credits,
    total_debits,
    (total_credits - total_debits) AS net_monthly_change,
    SUM(total_credits - total_debits) OVER (
        PARTITION BY account_number ORDER BY month_year
    ) AS running_net_total,
    RANK() OVER (
        PARTITION BY month_year ORDER BY total_credits DESC
    ) AS monthly_deposit_rank
FROM monthly_activity
ORDER BY month_year DESC, monthly_deposit_rank ASC;`
  };

  // Set Operations active array
  const currentSetList = 
    activeSetFilter === 'intersect' ? (setOps.intersect_accounts_and_loans || []) :
    activeSetFilter === 'union' ? (setOps.union_accounts_or_loans || []) :
    (setOps.except_accounts_no_loans || []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            RDBMS Analytics & Intelligence Engine
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Analytical cockpit powered by MySQL 8.0 Views, Correlated Subqueries, Relational Set Theory, and Window Functions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSqlInspector(!showSqlInspector)}
          >
            <Code2 size={14} />
            <span>{showSqlInspector ? 'Hide SQL Logic' : 'View SQL Logic'}</span>
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={loadAllAnalytics}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Computing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* SQL Logic Inspector Drawer */}
      {showSqlInspector && (
        <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--info)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--info)' }}>
              UNDERLYING MYSQL SCHEMA & RELATIONAL LOGIC ({activeTab.toUpperCase()})
            </span>
          </div>
          <pre className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {sqlSnippets[activeTab]}
          </pre>
        </div>
      )}

      {/* Financial Health & Banking Cockpit Metrics */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderTopColor: 'var(--accent)' }}>
          <div className="kpi-label">TOTAL VAULT DEPOSITS</div>
          <div className="kpi-value">{formatCurrency(totalVaultBalance)}</div>
          <div className="kpi-sub">
            <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>● {accounts.length}</span> active accounts across {branches.length} branches
          </div>
        </div>

        <div className="kpi-card" style={{ borderTopColor: 'var(--info)' }}>
          <div className="kpi-label">LOAN-TO-DEPOSIT RATIO (LDR)</div>
          <div className="kpi-value">{ldrRatio}%</div>
          <div className="kpi-sub">
            <span className={`badge ${parseFloat(ldrRatio) <= 85 ? 'badge-success' : 'badge-warning'}`}>
              {parseFloat(ldrRatio) <= 85 ? 'HEALTHY LIQUIDITY' : 'ELEVATED EXPOSURE'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: &lt; 85%</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderTopColor: 'var(--warning)' }}>
          <div className="kpi-label">PORTFOLIO RECOVERY RATE</div>
          <div className="kpi-value">{loanRecoveryRate}%</div>
          <div className="kpi-sub">
            <span>Repaid: {formatCurrency(totalLoanRepaid)}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderTopColor: '#a855f7' }}>
          <div className="kpi-label">KYC COMPLIANCE INDEX</div>
          <div className="kpi-value">{kycRate}%</div>
          <div className="kpi-sub">
            <ShieldCheck size={13} style={{ color: 'var(--accent-text)' }} />
            <span>{verifiedKycCount} of {customers.length} verified customers</span>
          </div>
        </div>
      </div>

      {/* Visual Charts: Deposit Composition & Branch Rankings */}
      <div className="grid-2">
        {/* Deposit Composition Multi-Segment Meter */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PieChart size={16} style={{ color: 'var(--accent-text)' }} />
              <span>Deposit Capital Distribution</span>
            </div>
            <span className="badge badge-info">BY ACCOUNT TYPE</span>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            {/* Multi-segment stacked bar */}
            <div style={{ display: 'flex', height: '14px', width: '100%', border: '1px solid var(--border-strong)', overflow: 'hidden', marginBottom: '0.75rem' }}>
              <div style={{ width: `${savingsPercent}%`, background: 'var(--accent)' }} title={`SAVINGS: ${savingsPercent}%`} />
              <div style={{ width: `${currentPercent}%`, background: 'var(--info)' }} title={`CURRENT: ${currentPercent}%`} />
              <div style={{ width: `${fdPercent}%`, background: 'var(--warning)' }} title={`FD: ${fdPercent}%`} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent)', display: 'inline-block' }} />
                SAVINGS: {savingsPercent}% ({formatCurrency(savingsBalance)})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--info)', display: 'inline-block' }} />
                CURRENT: {currentPercent}% ({formatCurrency(currentBalance)})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--warning)', display: 'inline-block' }} />
                FD: {fdPercent}% ({formatCurrency(fdBalance)})
              </span>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Account Category</th>
                  <th>Accounts</th>
                  <th>Average Balance</th>
                  <th>Total Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>SAVINGS ACCOUNTS</td>
                  <td className="font-mono">{accounts.filter(a => a.account_type === 'SAVINGS').length}</td>
                  <td className="font-mono">{formatCurrency(accounts.filter(a => a.account_type === 'SAVINGS').length > 0 ? savingsBalance / accounts.filter(a => a.account_type === 'SAVINGS').length : 0)}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-text)' }}>{formatCurrency(savingsBalance)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>CURRENT ACCOUNTS</td>
                  <td className="font-mono">{accounts.filter(a => a.account_type === 'CURRENT').length}</td>
                  <td className="font-mono">{formatCurrency(accounts.filter(a => a.account_type === 'CURRENT').length > 0 ? currentBalance / accounts.filter(a => a.account_type === 'CURRENT').length : 0)}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--info)' }}>{formatCurrency(currentBalance)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>FIXED DEPOSITS (FD)</td>
                  <td className="font-mono">{accounts.filter(a => a.account_type === 'FD').length}</td>
                  <td className="font-mono">{formatCurrency(accounts.filter(a => a.account_type === 'FD').length > 0 ? fdBalance / accounts.filter(a => a.account_type === 'FD').length : 0)}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(fdBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Performance Rankings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={16} style={{ color: 'var(--info)' }} />
              <span>Branch Deposit Leaderboard</span>
            </div>
            <span className="badge badge-muted">{branches.length} TOTAL BRANCHES</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {sortedBranches.map((b, idx) => {
              const deposit = parseFloat(b.total_deposits || 0);
              const branchShare = totalVaultBalance > 0 ? Math.round((deposit / totalVaultBalance) * 100) : 0;
              return (
                <div key={b.branch_id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="font-mono" style={{ 
                        fontWeight: 700, 
                        width: '20px', 
                        height: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: idx === 0 ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: idx === 0 ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        border: '1px solid var(--border-strong)'
                      }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontWeight: 600 }}>{b.branch_name}</span>
                      <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({b.city})</span>
                    </div>
                    <div className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(deposit)} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({branchShare}%)</span>
                    </div>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${branchShare}%`, background: idx === 0 ? 'var(--accent)' : 'var(--info)', transition: 'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Relational DBMS Showcase Tabs */}
      <div className="card">
        {/* Navigation Selector Bar */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-strong)', 
          background: 'var(--bg-tertiary)', 
          overflowX: 'auto',
          marginBottom: '1.25rem' 
        }}>
          <button 
            className={`btn btn-sm ${activeTab === 'balances' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderBottom: 'none' }}
            onClick={() => setActiveTab('balances')}
          >
            <Layers size={13} />
            <span>1. View: Customer Balances ({customerBalances.length})</span>
          </button>

          <button 
            className={`btn btn-sm ${activeTab === 'loans' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderBottom: 'none' }}
            onClick={() => setActiveTab('loans')}
          >
            <CreditCard size={13} />
            <span>2. View: Customer Loans ({customerLoans.length})</span>
          </button>

          <button 
            className={`btn btn-sm ${activeTab === 'subquery' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderBottom: 'none' }}
            onClick={() => setActiveTab('subquery')}
          >
            <ArrowUpRight size={13} />
            <span>3. Subquery: Above Average ({aboveAvg.length})</span>
          </button>

          <button 
            className={`btn btn-sm ${activeTab === 'sets' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderBottom: 'none' }}
            onClick={() => setActiveTab('sets')}
          >
            <PieChart size={13} />
            <span>4. Set Theory: Union / Intersect / Except</span>
          </button>

          <button 
            className={`btn btn-sm ${activeTab === 'window' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderBottom: 'none' }}
            onClick={() => setActiveTab('window')}
          >
            <TrendingUp size={13} />
            <span>5. Window Functions & CTE</span>
          </button>
        </div>

        {/* Tab 1: customer_balance_view */}
        {activeTab === 'balances' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  SQL View: customer_balance_view
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Virtual aggregation table computing each customer's active account count and total vault balance.
                </p>
              </div>
              <span className="badge badge-info">VIRTUAL RELATION (VIEW)</span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Account Holder</th>
                    <th>Email Address</th>
                    <th>KYC Status</th>
                    <th>Active Accounts</th>
                    <th>Consolidated Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {customerBalances.length > 0 ? (
                    customerBalances.map((b) => (
                      <tr key={b.customer_id}>
                        <td className="font-mono">#{b.customer_id}</td>
                        <td style={{ fontWeight: 600 }}>{b.full_name}</td>
                        <td>{b.email}</td>
                        <td>
                          <span className={`badge ${b.kyc_status === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>
                            {b.kyc_status}
                          </span>
                        </td>
                        <td className="font-mono">{b.total_accounts}</td>
                        <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-text)' }}>
                          {formatCurrency(b.total_balance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                        No records found in customer_balance_view
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: customer_loan_view */}
        {activeTab === 'loans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  SQL View: customer_loan_view
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Multi-table view joining loans, borrowers, and branches to calculate paid vs remaining debt.
                </p>
              </div>
              <span className="badge badge-info">VIRTUAL RELATION (VIEW)</span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Borrower Name</th>
                    <th>Category</th>
                    <th>Branch</th>
                    <th>Principal</th>
                    <th>Tenure & Rate</th>
                    <th>Amount Repaid</th>
                    <th>Remaining Debt</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLoans.length > 0 ? (
                    customerLoans.map((l) => (
                      <tr key={l.loan_id}>
                        <td className="font-mono" style={{ fontWeight: 600 }}>#{l.loan_id}</td>
                        <td style={{ fontWeight: 600 }}>{l.full_name}</td>
                        <td><span className="badge badge-muted">{l.loan_type}</span></td>
                        <td>{l.branch_name}</td>
                        <td className="font-mono">{formatCurrency(l.principal_amount)}</td>
                        <td className="font-mono">{l.tenure_months}m @ {l.interest_rate}%</td>
                        <td className="font-mono" style={{ color: 'var(--accent-text)' }}>{formatCurrency(l.amount_paid)}</td>
                        <td className="font-mono" style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(l.outstanding_balance)}</td>
                        <td>
                          <span className={`badge ${l.application_status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                            {l.application_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                        No records found in customer_loan_view
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Subquery */}
        {activeTab === 'subquery' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Non-Correlated Subquery: High-Net-Worth Customers
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Evaluates <code>WHERE total_balance &gt; (SELECT AVG(balance) FROM accounts WHERE status = 'ACTIVE')</code>. Average threshold: <strong>{formatCurrency(avgAccountBalance)}</strong>.
                </p>
              </div>
              <span className="badge badge-warning">SUBQUERY FILTER</span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Account Holder</th>
                    <th>Consolidated Balance</th>
                    <th>Bank Average Benchmark</th>
                    <th>Capital Surplus</th>
                  </tr>
                </thead>
                <tbody>
                  {aboveAvg.length > 0 ? (
                    aboveAvg.map((a) => {
                      const bal = parseFloat(a.total_balance || 0);
                      const surplus = Math.max(0, bal - avgAccountBalance);
                      return (
                        <tr key={a.customer_id}>
                          <td className="font-mono">#{a.customer_id}</td>
                          <td style={{ fontWeight: 600 }}>{a.full_name}</td>
                          <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-text)', fontSize: '0.9rem' }}>
                            {formatCurrency(bal)}
                          </td>
                          <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                            {formatCurrency(avgAccountBalance)}
                          </td>
                          <td className="font-mono" style={{ fontWeight: 600, color: 'var(--info)' }}>
                            +{formatCurrency(surplus)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                        No accounts exceeding the average benchmark
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Set Operations */}
        {activeTab === 'sets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Relational Algebra Set Operations (UNION, INTERSECT, EXCEPT)
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Set comparisons between the relation <strong>Accounts (Depositors)</strong> and <strong>Loans (Borrowers)</strong>.
                </p>
              </div>

              {/* Set selector buttons */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button 
                  className={`btn btn-sm ${activeSetFilter === 'intersect' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveSetFilter('intersect')}
                >
                  INTERSECT ({setOps.intersect_accounts_and_loans?.length || 0})
                </button>
                <button 
                  className={`btn btn-sm ${activeSetFilter === 'union' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveSetFilter('union')}
                >
                  UNION ({setOps.union_accounts_or_loans?.length || 0})
                </button>
                <button 
                  className={`btn btn-sm ${activeSetFilter === 'except' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveSetFilter('except')}
                >
                  EXCEPT ({setOps.except_accounts_no_loans?.length || 0})
                </button>
              </div>
            </div>

            {/* Set definition banner */}
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)', borderLeft: '4px solid var(--accent)', marginBottom: '1rem', fontSize: '0.8rem' }}>
              {activeSetFilter === 'intersect' && (
                <span>
                  <strong>A ∩ B (INTERSECT):</strong> Customers who hold <strong>both</strong> an active bank account AND an active loan. These represent prime cross-serviced core banking relationships.
                </span>
              )}
              {activeSetFilter === 'union' && (
                <span>
                  <strong>A ∪ B (UNION):</strong> Total distinct universe of all individuals who either hold an account or have applied for a loan.
                </span>
              )}
              {activeSetFilter === 'except' && (
                <span>
                  <strong>A − B (EXCEPT / MINUS):</strong> Pure Depositors who have savings/current/FD accounts but have <strong>never taken any loan</strong>. Primary targets for credit card / pre-approved lending.
                </span>
              )}
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Customer Full Name</th>
                    <th>Set Partition</th>
                    <th>Banking Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSetList.length > 0 ? (
                    currentSetList.map((row) => (
                      <tr key={row.customer_id}>
                        <td className="font-mono">#{row.customer_id}</td>
                        <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                        <td>
                          <span className={`badge ${
                            activeSetFilter === 'intersect' ? 'badge-success' :
                            activeSetFilter === 'union' ? 'badge-info' : 'badge-warning'
                          }`}>
                            {activeSetFilter.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {activeSetFilter === 'intersect' && 'Dual Holder (Depositor + Borrower)'}
                          {activeSetFilter === 'union' && 'Registered Banking Client'}
                          {activeSetFilter === 'except' && 'Sole Depositor (Zero Credit Exposure)'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                        No records in this set partition
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Window Functions */}
        {activeTab === 'window' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  SQL Window Functions & Common Table Expression (CTE)
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Calculates running net balance with <code>SUM(...) OVER (PARTITION BY account_number ORDER BY month_year)</code> and peer rank with <code>RANK() OVER (PARTITION BY month_year ORDER BY total_credits DESC)</code>.
                </p>
              </div>
              <span className="badge badge-info">WINDOW & RANK() OVER</span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Customer Name</th>
                    <th>Billing Month</th>
                    <th>Total Credits</th>
                    <th>Total Debits</th>
                    <th>Net Monthly Flow</th>
                    <th>Running Net Total</th>
                    <th>Deposit Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyActivity.length > 0 ? (
                    monthlyActivity.map((m, idx) => (
                      <tr key={idx}>
                        <td className="font-mono" style={{ fontWeight: 600 }}>{m.account_number}</td>
                        <td style={{ fontWeight: 600 }}>{m.customer_name}</td>
                        <td className="font-mono">{m.month_year}</td>
                        <td className="font-mono" style={{ color: 'var(--accent-text)' }}>{formatCurrency(m.total_credits)}</td>
                        <td className="font-mono" style={{ color: 'var(--danger)' }}>{formatCurrency(m.total_debits)}</td>
                        <td className="font-mono" style={{ fontWeight: 600 }}>
                          <span style={{ color: parseFloat(m.net_monthly_change || 0) >= 0 ? 'var(--accent-text)' : 'var(--danger)' }}>
                            {formatCurrency(m.net_monthly_change)}
                          </span>
                        </td>
                        <td className="font-mono" style={{ fontWeight: 700 }}>
                          {formatCurrency(m.running_net_total)}
                        </td>
                        <td>
                          <span className="badge badge-info font-mono">
                            RANK #{m.monthly_deposit_rank}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                        No monthly window function activity found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
