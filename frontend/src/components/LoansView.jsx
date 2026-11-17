import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  TrendingDown, 
  X,
  FileCheck
} from 'lucide-react';
import { api } from '../api';

export default function LoansView({ 
  loans, 
  accounts, 
  customers, 
  branches, 
  onRefresh, 
  showToast 
}) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [repayLoanTarget, setRepayLoanTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // Loan Application Form
  const [loanForm, setLoanForm] = useState({
    customer_id: '',
    branch_id: '',
    loan_type: 'PERSONAL',
    principal_amount: '200000',
    tenure_months: '24',
    interest_rate: '8.5'
  });

  // Repayment Form
  const [repayForm, setRepayForm] = useState({
    account_id: '',
    emi_amount: ''
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const filteredLoans = statusFilter 
    ? loans.filter(l => l.application_status === statusFilter)
    : loans;

  // Apply Loan Submit
  const handleApplyLoan = async (e) => {
    e.preventDefault();
    if (!loanForm.customer_id || !loanForm.branch_id || !loanForm.principal_amount) {
      showToast('Please fill all required loan fields', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.applyLoan({
        customer_id: parseInt(loanForm.customer_id),
        branch_id: parseInt(loanForm.branch_id),
        loan_type: loanForm.loan_type,
        principal_amount: parseFloat(loanForm.principal_amount),
        tenure_months: parseInt(loanForm.tenure_months),
        interest_rate: parseFloat(loanForm.interest_rate)
      });
      showToast('Loan application submitted for review', 'success');
      setShowApplyModal(false);
      setLoanForm({
        customer_id: '',
        branch_id: '',
        loan_type: 'PERSONAL',
        principal_amount: '200000',
        tenure_months: '24',
        interest_rate: '8.5'
      });
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Change (Approve / Reject)
  const handleStatusChange = async (loanId, newStatus) => {
    try {
      await api.updateLoanStatus(loanId, newStatus);
      showToast(`Loan #${loanId} status updated to ${newStatus}`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Repay Loan Submit
  const handleRepayLoan = async (e) => {
    e.preventDefault();
    if (!repayForm.account_id || !repayForm.emi_amount) {
      showToast('Select account and EMI amount', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.repayLoan(repayLoanTarget.loan_id, {
        account_id: parseInt(repayForm.account_id),
        emi_amount: parseFloat(repayForm.emi_amount)
      });
      showToast(`EMI payment of ${formatCurrency(repayForm.emi_amount)} applied!`, 'success');
      setRepayLoanTarget(null);
      setRepayForm({ account_id: '', emi_amount: '' });
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Credit & Loan Portfolio
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Monitor outstanding credit lines, approve applications, and process atomic account repayments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <select 
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="APPLIED">APPLIED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
            <Plus size={15} />
            <span>Apply for Loan</span>
          </button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Borrower</th>
                <th>Branch</th>
                <th>Type</th>
                <th>Principal</th>
                <th>Interest & Tenure</th>
                <th>Repayment Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const principal = parseFloat(loan.principal_amount || 0);
                  const outstanding = parseFloat(loan.outstanding_balance || 0);
                  const repaid = Math.max(0, principal - outstanding);
                  const percent = principal > 0 ? Math.min(100, Math.round((repaid / principal) * 100)) : 0;

                  return (
                    <tr key={loan.loan_id}>
                      <td className="font-mono" style={{ fontWeight: 600 }}>#{loan.loan_id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loan.customer_name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{loan.customer_email}</div>
                      </td>
                      <td>{loan.branch_name}</td>
                      <td>
                        <span className="badge badge-muted">{loan.loan_type}</span>
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700 }}>
                        {formatCurrency(principal)}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                        {loan.interest_rate}% • {loan.tenure_months} mos
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                          <span className="font-mono" style={{ color: 'var(--accent-text)' }}>{formatCurrency(repaid)}</span>
                          <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{percent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Bal: {formatCurrency(outstanding)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          loan.application_status === 'APPROVED' ? 'badge-success' :
                          loan.application_status === 'APPLIED' ? 'badge-warning' :
                          loan.application_status === 'CLOSED' ? 'badge-info' : 'badge-danger'
                        }`}>
                          {loan.application_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {loan.application_status === 'APPLIED' && (
                            <>
                              <button 
                                className="btn btn-primary btn-sm"
                                title="Approve Loan"
                                onClick={() => handleStatusChange(loan.loan_id, 'APPROVED')}
                              >
                                <CheckCircle2 size={13} />
                                <span>Approve</span>
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                title="Reject Loan"
                                onClick={() => handleStatusChange(loan.loan_id, 'REJECTED')}
                              >
                                <XCircle size={13} />
                              </button>
                            </>
                          )}
                          {loan.application_status === 'APPROVED' && outstanding > 0 && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setRepayLoanTarget(loan);
                                setRepayForm({
                                  account_id: '',
                                  emi_amount: Math.min(outstanding, Math.round(principal / (loan.tenure_months || 12)))
                                });
                              }}
                            >
                              <DollarSign size={13} />
                              <span>Pay EMI</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    No loans found matching filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Apply Loan */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Submit Loan Application</h3>
              <button className="btn-icon" onClick={() => setShowApplyModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyLoan}>
              <div className="form-group">
                <label className="form-label">Select Borrower</label>
                <select 
                  className="select"
                  required
                  value={loanForm.customer_id}
                  onChange={(e) => setLoanForm({ ...loanForm, customer_id: e.target.value })}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      #{c.customer_id} - {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Disbursement Branch</label>
                <select 
                  className="select"
                  required
                  value={loanForm.branch_id}
                  onChange={(e) => setLoanForm({ ...loanForm, branch_id: e.target.value })}
                >
                  <option value="">-- Choose Branch --</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Loan Type</label>
                  <select 
                    className="select"
                    value={loanForm.loan_type}
                    onChange={(e) => setLoanForm({ ...loanForm, loan_type: e.target.value })}
                  >
                    <option value="PERSONAL">PERSONAL</option>
                    <option value="HOME">HOME</option>
                    <option value="EDUCATION">EDUCATION</option>
                    <option value="VEHICLE">VEHICLE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Principal Amount (₹)</label>
                  <input 
                    type="number"
                    step="1000"
                    min="10000"
                    required
                    className="input font-mono"
                    value={loanForm.principal_amount}
                    onChange={(e) => setLoanForm({ ...loanForm, principal_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Tenure (Months)</label>
                  <input 
                    type="number"
                    min="6"
                    max="360"
                    required
                    className="input font-mono"
                    value={loanForm.tenure_months}
                    onChange={(e) => setLoanForm({ ...loanForm, tenure_months: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Annual Interest Rate (%)</label>
                  <input 
                    type="number"
                    step="0.05"
                    min="1"
                    required
                    className="input font-mono"
                    value={loanForm.interest_rate}
                    onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Apply for Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Repay Loan */}
      {repayLoanTarget && (
        <div className="modal-overlay" onClick={() => setRepayLoanTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                Repay Loan #{repayLoanTarget.loan_id} ({repayLoanTarget.loan_type})
              </h3>
              <button className="btn-icon" onClick={() => setRepayLoanTarget(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', border: '1px solid var(--border-strong)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>Borrower: <strong>{repayLoanTarget.customer_name}</strong></div>
              <div>Outstanding Balance: <strong className="font-mono" style={{ color: 'var(--danger)' }}>{formatCurrency(repayLoanTarget.outstanding_balance)}</strong></div>
            </div>

            <form onSubmit={handleRepayLoan}>
              <div className="form-group">
                <label className="form-label">Debit from Account</label>
                <select 
                  className="select"
                  required
                  value={repayForm.account_id}
                  onChange={(e) => setRepayForm({ ...repayForm, account_id: e.target.value })}
                >
                  <option value="">-- Choose Account to Debit --</option>
                  {accounts
                    .filter(a => a.status === 'ACTIVE')
                    .map(a => (
                      <option key={a.account_id} value={a.account_id}>
                        {a.account_number} ({a.customer_name}) — Bal: {formatCurrency(a.balance)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Repayment Amount (₹)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="1"
                  max={repayLoanTarget.outstanding_balance}
                  required
                  className="input font-mono"
                  value={repayForm.emi_amount}
                  onChange={(e) => setRepayForm({ ...repayForm, emi_amount: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRepayLoanTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing EMI...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
