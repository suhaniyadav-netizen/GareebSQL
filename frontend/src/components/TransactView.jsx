import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Send, 
  CheckCircle, 
  History, 
  Filter, 
  Search,
  DollarSign
} from 'lucide-react';
import { api } from '../api';

export default function TransactView({ 
  accounts, 
  transactions, 
  onRefresh, 
  showToast 
}) {
  const [activeAction, setActiveAction] = useState('transfer'); // 'transfer' | 'deposit' | 'withdraw'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txnTypeFilter, setTxnTypeFilter] = useState('');
  const [searchTxn, setSearchTxn] = useState('');

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: 'NEFT/IMPS Fund Transfer'
  });

  // Deposit/Withdraw Form State
  const [cashForm, setCashForm] = useState({
    account_id: '',
    amount: '',
    description: ''
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  // Sender account lookup for real-time balance display
  const selectedSender = accounts.find(a => a.account_id === parseInt(transferForm.from_account_id));
  const selectedCashAccount = accounts.find(a => a.account_id === parseInt(cashForm.account_id));

  // Handle Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount) {
      showToast('Please fill all transfer fields', 'error');
      return;
    }
    if (transferForm.from_account_id === transferForm.to_account_id) {
      showToast('Sender and Receiver accounts cannot be the same', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.transfer({
        from_account_id: parseInt(transferForm.from_account_id),
        to_account_id: parseInt(transferForm.to_account_id),
        amount: parseFloat(transferForm.amount),
        description: transferForm.description
      });
      showToast(`Transfer successful! Ref: ${res.transfer_out_ref}`, 'success');
      setTransferForm({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        description: 'NEFT/IMPS Fund Transfer'
      });
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cash Deposit / Withdraw
  const handleCashAction = async (e) => {
    e.preventDefault();
    if (!cashForm.account_id || !cashForm.amount) {
      showToast('Select account and amount', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        account_id: parseInt(cashForm.account_id),
        amount: parseFloat(cashForm.amount),
        description: cashForm.description || (activeAction === 'deposit' ? 'Cash/Online Deposit' : 'ATM/Counter Withdrawal')
      };

      if (activeAction === 'deposit') {
        const res = await api.deposit(payload);
        showToast(`Deposited ${formatCurrency(payload.amount)}. Ref: ${res.reference_no}`, 'success');
      } else {
        const res = await api.withdraw(payload);
        showToast(`Withdrew ${formatCurrency(payload.amount)}. Ref: ${res.reference_no}`, 'success');
      }

      setCashForm({ account_id: '', amount: '', description: '' });
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Transactions
  const filteredTxns = transactions.filter((t) => {
    const matchesType = !txnTypeFilter || t.txn_type === txnTypeFilter;
    const matchesSearch = 
      t.reference_no?.toLowerCase().includes(searchTxn.toLowerCase()) ||
      t.account_number?.includes(searchTxn) ||
      t.customer_name?.toLowerCase().includes(searchTxn.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTxn.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Operations Panel */}
      <div className="grid-2">
        {/* Action Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ArrowLeftRight size={18} style={{ color: 'var(--accent-text)' }} />
              <span>Initiate Transaction</span>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button 
                className={`btn btn-sm ${activeAction === 'transfer' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveAction('transfer')}
              >
                Transfer (TCL)
              </button>
              <button 
                className={`btn btn-sm ${activeAction === 'deposit' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveAction('deposit')}
              >
                Deposit
              </button>
              <button 
                className={`btn btn-sm ${activeAction === 'withdraw' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveAction('withdraw')}
              >
                Withdraw
              </button>
            </div>
          </div>

          {activeAction === 'transfer' ? (
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label className="form-label">
                  Sender Account (Debit) {selectedSender && (
                    <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
                      — Available: {formatCurrency(selectedSender.balance)}
                    </span>
                  )}
                </label>
                <select 
                  className="select"
                  required
                  value={transferForm.from_account_id}
                  onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}
                >
                  <option value="">-- Choose Source Account --</option>
                  {accounts.filter(a => a.status === 'ACTIVE').map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_number} ({a.customer_name}) — {formatCurrency(a.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Recipient Account (Credit)</label>
                <select 
                  className="select"
                  required
                  value={transferForm.to_account_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}
                >
                  <option value="">-- Choose Destination Account --</option>
                  {accounts
                    .filter(a => a.status === 'ACTIVE' && a.account_id !== parseInt(transferForm.from_account_id))
                    .map(a => (
                      <option key={a.account_id} value={a.account_id}>
                        {a.account_number} ({a.customer_name})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Transfer Amount (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="5000"
                    className="input font-mono"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks / Description</label>
                  <input 
                    type="text"
                    className="input"
                    value={transferForm.description}
                    onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '0.65rem', border: '1px solid var(--border-strong)', marginBottom: '0.75rem', fontSize: '0.725rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>DBMS TRANSACTION PIPELINE (ACID & TCL):</div>
                <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span>• <strong>Isolation:</strong> <code>SELECT ... FOR UPDATE</code> applies row-level exclusive locks (2PL X-Lock).</span>
                  <span>• <strong>Consistency:</strong> Verifies sender balance ≥ transfer amount (Invariance check).</span>
                  <span>• <strong>Atomicity:</strong> Dual updates committed atomically via <code>START TRANSACTION ... COMMIT</code>.</span>
                  <span>• <strong>Durability:</strong> Recorded in Write-Ahead Log (WAL) and master ledger.</span>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.65rem' }}
                  disabled={isSubmitting}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Executing TCL Transfer...' : 'Execute Atomic Transfer'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCashAction}>
              <div className="form-group">
                <label className="form-label">
                  Select Target Account {selectedCashAccount && (
                    <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
                      — Current Balance: {formatCurrency(selectedCashAccount.balance)}
                    </span>
                  )}
                </label>
                <select 
                  className="select"
                  required
                  value={cashForm.account_id}
                  onChange={(e) => setCashForm({ ...cashForm, account_id: e.target.value })}
                >
                  <option value="">-- Choose Account --</option>
                  {accounts.filter(a => a.status === 'ACTIVE').map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_number} ({a.customer_name}) — {formatCurrency(a.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="2000"
                  className="input font-mono"
                  value={cashForm.amount}
                  onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Note</label>
                <input 
                  type="text"
                  placeholder={activeAction === 'deposit' ? "Counter Cash Deposit" : "Counter Cash Withdrawal"}
                  className="input"
                  value={cashForm.description}
                  onChange={(e) => setCashForm({ ...cashForm, description: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className={`btn ${activeAction === 'deposit' ? 'btn-primary' : 'btn-danger'}`}
                  style={{ width: '100%', padding: '0.65rem' }}
                  disabled={isSubmitting}
                >
                  {activeAction === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  <span>
                    {isSubmitting 
                      ? 'Processing...' 
                      : (activeAction === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Informational Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <div className="card-title">
                <History size={18} style={{ color: 'var(--info)' }} />
                <span>RDBMS Transaction Isolation & ACID</span>
              </div>
              <span className="badge badge-info">SERIALIZABLE LOCKS</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '0.75rem' }}>
                All transfers operate under MySQL's transactional engine with explicit <code>FOR UPDATE</code> row-level pessimistic locking.
              </p>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><strong>Atomicity:</strong> Both sender debit and recipient credit commit together or rollback seamlessly on error.</li>
                <li><strong>Consistency:</strong> Zero overdraft without approval; account balance integrity is mathematically verified.</li>
                <li><strong>Audit Trail:</strong> Generates distinct cross-referenced <code>TRF-OUT</code> and <code>TRF-IN</code> receipts.</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIVE ACCOUNTS READY FOR TRANSACTING</div>
            <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {accounts.filter(a => a.status === 'ACTIVE').length} Accounts
            </div>
          </div>
        </div>
      </div>

      {/* Live Transaction Ledger Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="card-title">
            <History size={18} />
            <span>Master Transaction Ledger ({filteredTxns.length})</span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="Search reference, account..."
                className="input"
                style={{ width: '100%', paddingLeft: '2rem', padding: '0.35rem 0.5rem 0.35rem 2rem', fontSize: '0.8rem' }}
                value={searchTxn}
                onChange={(e) => setSearchTxn(e.target.value)}
              />
            </div>

            <select 
              className="select"
              value={txnTypeFilter}
              onChange={(e) => setTxnTypeFilter(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
            >
              <option value="">All Types</option>
              <option value="DEPOSIT">DEPOSIT</option>
              <option value="WITHDRAWAL">WITHDRAWAL</option>
              <option value="TRANSFER_IN">TRANSFER IN</option>
              <option value="TRANSFER_OUT">TRANSFER OUT</option>
              <option value="LOAN_EMI">LOAN EMI</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference No</th>
                <th>Account</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Description</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.length > 0 ? (
                filteredTxns.map((txn) => {
                  const isCredit = txn.txn_type === 'DEPOSIT' || txn.txn_type === 'TRANSFER_IN';
                  return (
                    <tr key={txn.transaction_id}>
                      <td className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {txn.reference_no}
                      </td>
                      <td className="font-mono">{txn.account_number}</td>
                      <td>{txn.customer_name}</td>
                      <td>
                        <span className={`badge ${
                          isCredit ? 'badge-success' : 'badge-danger'
                        }`}>
                          {txn.txn_type}
                        </span>
                      </td>
                      <td className="font-mono" style={{ 
                        fontWeight: 700, 
                        color: isCredit ? 'var(--accent-text)' : 'var(--danger)' 
                      }}>
                        {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                      </td>
                      <td className="font-mono">{formatCurrency(txn.balance_after)}</td>
                      <td style={{ fontSize: '0.75rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {txn.description}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {txn.txn_timestamp?.replace('T', ' ')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    No transactions matching criteria
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
