import React from 'react';
import { 
  Wallet, 
  Users, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  Building2, 
  ShieldCheck,
  SendHorizontal,
  FileSpreadsheet
} from 'lucide-react';

export default function DashboardView({ 
  summary, 
  branches, 
  monthlyActivity, 
  onNavigate 
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const accounts = summary?.accounts || {};
  const customers = summary?.customers || {};
  const loans = summary?.loans || {};
  const transactions = summary?.transactions || {};

  const totalDeposits = accounts.total_deposits ?? accounts.total_balance ?? 0;
  const activeAccounts = accounts.active_accounts ?? accounts.active ?? 0;
  const totalAccounts = accounts.total_accounts ?? accounts.total ?? 0;

  const totalCustomers = customers.total_customers ?? customers.total ?? 0;
  const verifiedCustomers = customers.verified_customers ?? customers.verified_kyc ?? 0;

  const totalPrincipalDisbursed = loans.total_principal_disbursed ?? loans.total_principal ?? 0;
  const totalOutstandingExposure = loans.total_outstanding_exposure ?? loans.total_outstanding ?? 0;

  const totalVolume = transactions.total_volume ?? 0;
  const totalTransactions = transactions.total_transactions ?? transactions.total_count ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Precision KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">TOTAL VAULT DEPOSITS</div>
          <div className="kpi-value">{formatCurrency(totalDeposits)}</div>
          <div className="kpi-sub">
            <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>● {activeAccounts}</span> active accounts ({totalAccounts} total)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">CUSTOMER DIRECTORY</div>
          <div className="kpi-value">{totalCustomers}</div>
          <div className="kpi-sub">
            <ShieldCheck size={13} style={{ color: 'var(--accent-text)' }} />
            <span>{verifiedCustomers} Verified KYC</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">DISBURSED CREDIT BOOK</div>
          <div className="kpi-value">{formatCurrency(totalPrincipalDisbursed)}</div>
          <div className="kpi-sub">
            <span>Outstanding: {formatCurrency(totalOutstandingExposure)}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">TRANSACTED VOLUME</div>
          <div className="kpi-value">{formatCurrency(totalVolume)}</div>
          <div className="kpi-sub">
            <TrendingUp size={13} style={{ color: 'var(--info)' }} />
            <span>{totalTransactions} master ledger events</span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad Banner */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
              Core Banking Operations Control
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Execute atomic TCL transfers, review customer KYC profiles, or query stored procedure passbook statements.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('transact')}>
              <SendHorizontal size={14} />
              <span>Instant Transfer</span>
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('statement')}>
              <FileSpreadsheet size={14} />
              <span>Generate Statement</span>
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('accounts')}>
              <Users size={14} />
              <span>Manage Accounts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Monthly Trends & Branch Network */}
      <div className="grid-2">
        {/* Monthly Activity via Window Function */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={16} style={{ color: 'var(--accent-text)' }} />
              <span>Monthly Activity (SQL Window CTE)</span>
            </div>
            <span className="badge badge-info">WINDOW FUNCTION</span>
          </div>

          <div className="table-container" style={{ maxHeight: '280px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Account / Customer</th>
                  <th>Credits</th>
                  <th>Debits</th>
                  <th>Net Flow</th>
                  <th>Running Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyActivity && monthlyActivity.length > 0 ? (
                  monthlyActivity.map((row, idx) => {
                    const month = row.month_year || row.txn_month || 'N/A';
                    const credits = row.total_credits ?? row.total_deposits ?? 0;
                    const debits = row.total_debits ?? row.total_withdrawals ?? 0;
                    const netFlow = row.net_monthly_change ?? row.net_monthly_flow ?? 0;
                    const runningTotal = row.running_net_total ?? 0;

                    return (
                      <tr key={idx}>
                        <td className="font-mono">{month}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{row.customer_name || 'Account Holder'}</div>
                          <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {row.account_number} {row.monthly_deposit_rank ? `• Rank #${row.monthly_deposit_rank}` : ''}
                          </div>
                        </td>
                        <td className="font-mono" style={{ color: 'var(--accent-text)' }}>
                          {formatCurrency(credits)}
                        </td>
                        <td className="font-mono" style={{ color: 'var(--danger)' }}>
                          {formatCurrency(debits)}
                        </td>
                        <td className="font-mono">
                          <span style={{ color: netFlow >= 0 ? 'var(--accent-text)' : 'var(--danger)' }}>
                            {formatCurrency(netFlow)}
                          </span>
                        </td>
                        <td className="font-mono" style={{ fontWeight: 600 }}>
                          {formatCurrency(runningTotal)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No activity records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Network Rollup */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={16} style={{ color: 'var(--info)' }} />
              <span>Branch Deposit Distribution</span>
            </div>
            <span className="badge badge-muted">{branches?.length || 0} Branches</span>
          </div>

          <div className="table-container" style={{ maxHeight: '280px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>City / IFSC</th>
                  <th>Accounts</th>
                  <th>Deposits</th>
                </tr>
              </thead>
              <tbody>
                {branches && branches.length > 0 ? (
                  branches.map((b) => (
                    <tr key={b.branch_id}>
                      <td style={{ fontWeight: 600 }}>{b.branch_name}</td>
                      <td>
                        <div>{b.city}</div>
                        <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {b.ifsc_code}
                        </div>
                      </td>
                      <td className="font-mono">{b.total_accounts || 0}</td>
                      <td className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-text)' }}>
                        {formatCurrency(b.total_deposits)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No branch records available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
