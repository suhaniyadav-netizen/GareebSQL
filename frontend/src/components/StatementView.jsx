import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Building,
  UserCheck
} from 'lucide-react';
import { api } from '../api';

export default function StatementView({ accounts, showToast }) {
  const [selectedAccNo, setSelectedAccNo] = useState(accounts[0]?.account_number || '');
  const [statement, setStatement] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAccount, setActiveAccount] = useState(accounts[0] || null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const handleFetchStatement = async (accNo) => {
    if (!accNo) return;
    setIsLoading(true);
    try {
      const data = await api.getStatement(accNo);
      setStatement(data || []);
      const matched = accounts.find(a => a.account_number === accNo);
      setActiveAccount(matched || null);
    } catch (err) {
      showToast(err.message, 'error');
      setStatement([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Account Selector Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={18} style={{ color: 'var(--accent-text)' }} />
            <span>Passbook Statement (MySQL Stored Procedure)</span>
          </div>
          <span className="badge badge-info">sp_account_statement</span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <label className="form-label">Select Bank Account</label>
            <select 
              className="select" 
              style={{ width: '100%' }}
              value={selectedAccNo}
              onChange={(e) => {
                setSelectedAccNo(e.target.value);
                handleFetchStatement(e.target.value);
              }}
            >
              <option value="">-- Choose Account --</option>
              {accounts.map(a => (
                <option key={a.account_id} value={a.account_number}>
                  {a.account_number} — {a.customer_name} ({a.account_type})
                </option>
              ))}
            </select>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button 
              className="btn btn-primary"
              onClick={() => handleFetchStatement(selectedAccNo)}
              disabled={isLoading || !selectedAccNo}
            >
              <Search size={15} />
              <span>{isLoading ? 'Running Stored Procedure...' : 'Query Passbook'}</span>
            </button>
          </div>

          {statement.length > 0 && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={handlePrint}>
                <Printer size={15} />
                <span>Print Statement</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Details Header Banner */}
      {activeAccount && (
        <div className="card" style={{ background: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                ACCOUNT HOLDER
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {activeAccount.customer_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Account No: <span className="font-mono" style={{ fontWeight: 600 }}>{activeAccount.account_number}</span> ({activeAccount.account_type})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                BRANCH & STATUS
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                {activeAccount.branch_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                IFSC: <span className="font-mono">{activeAccount.ifsc_code || 'SPPA000101'}</span> • Status: <span className="badge badge-success">{activeAccount.status}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                NET RUNNING BALANCE
              </div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-text)' }}>
                {formatCurrency(activeAccount.balance)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statement Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={16} />
            <span>Chronological Statement ({statement.length} entries)</span>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Reference No</th>
                <th>Description</th>
                <th>Type</th>
                <th>Debit / Credit Amount</th>
                <th>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {statement.length > 0 ? (
                statement.map((item, idx) => {
                  const isCredit = item.txn_type === 'DEPOSIT' || item.txn_type === 'TRANSFER_IN';
                  return (
                    <tr key={idx}>
                      <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                        {item.txn_timestamp?.replace('T', ' ')}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {item.reference_no}
                      </td>
                      <td>{item.description}</td>
                      <td>
                        <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'}`}>
                          {item.txn_type}
                        </span>
                      </td>
                      <td className="font-mono" style={{ 
                        fontWeight: 700, 
                        color: isCredit ? 'var(--accent-text)' : 'var(--danger)' 
                      }}>
                        {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {formatCurrency(item.balance_after)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    {isLoading ? 'Querying stored procedure...' : 'No statement entries found for this account'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
