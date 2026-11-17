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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Precision KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">TOTAL VAULT DEPOSITS</div>
          <div className="kpi-value">{formatCurrency(accounts.total_balance)}</div>
          <div className="kpi-sub">
            <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>● {accounts.active || 0}</span> active accounts ({accounts.total || 0} total)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">CUSTOMER DIRECTORY</div>
          <div className="kpi-value">{customers.total || 0}</div>
          <div className="kpi-sub">
            <ShieldCheck size={13} style={{ color: 'var(--accent-text)' }} />
            <span>{customers.verified_kyc || 0} Verified KYC</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">DISBURSED CREDIT BOOK</div>
          <div className="kpi-value">{formatCurrency(loans.total_principal)}</div>
          <div className="kpi-sub">
            <span>Outstanding: {formatCurrency(loans.total_outstanding)}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">TRANSACTED VOLUME</div>
          <div className="kpi-value">{formatCurrency(transactions.total_volume)}</div>
          <div className="kpi-sub">
            <TrendingUp size={13} style={{ color: 'var(--info)' }} />
            <span>{transactions.total_count || 0} master ledger events</span>
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
                  <th>Deposits</th>
                  <th>Withdrawals</th>
                  <th>Net Flow</th>
                  <th>Running Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyActivity && monthlyActivity.length > 0 ? (
                  monthlyActivity.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-mono">{row.txn_month}</td>
                      <td className="font-mono" style={{ color: 'var(--accent-text)' }}>
                        {formatCurrency(row.total_deposits)}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--danger)' }}>
                        {formatCurrency(row.total_withdrawals)}
                      </td>
                      <td className="font-mono">
                        <span style={{ color: (row.net_monthly_flow || 0) >= 0 ? 'var(--accent-text)' : 'var(--danger)' }}>
                          {formatCurrency(row.net_monthly_flow)}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {formatCurrency(row.running_net_total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>
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
