import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  X,
  Mail,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';

export default function AccountsView({ 
  accounts, 
  customers, 
  branches, 
  onRefresh, 
  showToast 
}) {
  const [subTab, setSubTab] = useState('accounts'); // 'accounts' | 'customers'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [showOpenAccountModal, setShowOpenAccountModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Account Form
  const [accountForm, setAccountForm] = useState({
    customer_id: '',
    branch_id: '',
    account_type: 'SAVINGS',
    initial_deposit: '1000',
    interest_rate: '3.50'
  });

  // New Customer Form
  const [customerForm, setCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    pan_number: '',
    aadhaar_number: '',
    date_of_birth: '1995-01-01',
    address: '',
    kyc_status: 'VERIFIED'
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = 
      acc.account_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.branch_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || acc.status === statusFilter;
    const matchesType = !typeFilter || acc.account_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Filter customers
  const filteredCustomers = customers.filter((cust) => {
    const full = `${cust.first_name} ${cust.last_name}`.toLowerCase();
    return (
      full.includes(searchTerm.toLowerCase()) ||
      cust.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone?.includes(searchTerm)
    );
  });

  // Toggle Account Status
  const handleStatusChange = async (account, newStatus) => {
    try {
      await api.updateAccountStatus(account.account_id, newStatus);
      showToast(`Account ${account.account_number} status set to ${newStatus}`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open Account Submit
  const handleOpenAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.customer_id || !accountForm.branch_id) {
      showToast('Please select a customer and branch', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.openAccount({
        customer_id: parseInt(accountForm.customer_id),
        branch_id: parseInt(accountForm.branch_id),
        account_type: accountForm.account_type,
        initial_deposit: parseFloat(accountForm.initial_deposit || 0),
        interest_rate: parseFloat(accountForm.interest_rate || 3.5)
      });
      showToast(`Account opened successfully: ${res.account_number}`, 'success');
      setShowOpenAccountModal(false);
      setAccountForm({
        customer_id: '',
        branch_id: '',
        account_type: 'SAVINGS',
        initial_deposit: '1000',
        interest_rate: '3.50'
      });
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Customer Submit
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createCustomer(customerForm);
      showToast(`Customer registered: ${customerForm.first_name} ${customerForm.last_name}`, 'success');
      setShowAddCustomerModal(false);
      setCustomerForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        pan_number: '',
        aadhaar_number: '',
        date_of_birth: '1995-01-01',
        address: '',
        kyc_status: 'VERIFIED'
      });
      onRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header & Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
          <button 
            className={`btn btn-sm ${subTab === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('accounts')}
          >
            <CreditCard size={14} />
            <span>Bank Accounts ({filteredAccounts.length})</span>
          </button>
          <button 
            className={`btn btn-sm ${subTab === 'customers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('customers')}
          >
            <Users size={14} />
            <span>Customers ({filteredCustomers.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowAddCustomerModal(true)}>
            <Plus size={15} />
            <span>New Customer</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowOpenAccountModal(true)}>
            <Plus size={15} />
            <span>Open Account</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder={subTab === 'accounts' ? "Search account number, customer, branch..." : "Search name, email, phone..."}
              className="input"
              style={{ width: '100%', paddingLeft: '2.2rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {subTab === 'accounts' && (
            <>
              <select 
                className="select" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '140px' }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="FROZEN">FROZEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <select 
                className="select" 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: '140px' }}
              >
                <option value="">All Types</option>
                <option value="SAVINGS">SAVINGS</option>
                <option value="CURRENT">CURRENT</option>
                <option value="FD">FIXED DEPOSIT</option>
              </select>
            </>
          )}

          {(searchTerm || statusFilter || typeFilter) && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchTerm(''); setStatusFilter(''); setTypeFilter(''); }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table view */}
      {subTab === 'accounts' ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Account No</th>
                <th>Account Holder</th>
                <th>Branch</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Interest</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => (
                  <tr key={acc.account_id}>
                    <td className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {acc.account_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{acc.customer_name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{acc.customer_email}</div>
                    </td>
                    <td>
                      <div>{acc.branch_name}</div>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{acc.branch_city}</div>
                    </td>
                    <td>
                      <span className="badge badge-muted">{acc.account_type}</span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-text)', fontSize: '0.9rem' }}>
                      {formatCurrency(acc.balance)}
                    </td>
                    <td className="font-mono">{acc.interest_rate}%</td>
                    <td>
                      <span className={`badge ${
                        acc.status === 'ACTIVE' ? 'badge-success' :
                        acc.status === 'FROZEN' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {acc.status === 'ACTIVE' && (
                          <button 
                            className="btn btn-secondary btn-sm" 
                            title="Freeze Account"
                            onClick={() => handleStatusChange(acc, 'FROZEN')}
                          >
                            <Lock size={12} />
                            <span>Freeze</span>
                          </button>
                        )}
                        {acc.status === 'FROZEN' && (
                          <button 
                            className="btn btn-primary btn-sm" 
                            title="Activate Account"
                            onClick={() => handleStatusChange(acc, 'ACTIVE')}
                          >
                            <Unlock size={12} />
                            <span>Activate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    No bank accounts matching the filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Full Name</th>
                <th>Contact Info</th>
                <th>PAN / Aadhaar</th>
                <th>Date of Birth</th>
                <th>KYC Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => (
                  <tr key={cust.customer_id}>
                    <td className="font-mono">#{cust.customer_id}</td>
                    <td style={{ fontWeight: 600 }}>{cust.first_name} {cust.last_name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{cust.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Phone size={12} />
                        <span>{cust.phone}</span>
                      </div>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                      <div>PAN: {cust.pan_number || 'N/A'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>UID: {cust.aadhaar_number || 'N/A'}</div>
                    </td>
                    <td className="font-mono">{cust.date_of_birth ? cust.date_of_birth.substring(0, 10) : 'N/A'}</td>
                    <td>
                      <span className={`badge ${cust.kyc_status === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>
                        {cust.kyc_status}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                      {cust.created_at ? cust.created_at.substring(0, 10) : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    No customer records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Open Account */}
      {showOpenAccountModal && (
        <div className="modal-overlay" onClick={() => setShowOpenAccountModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Open New Bank Account</h3>
              <button className="btn-icon" onClick={() => setShowOpenAccountModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleOpenAccount}>
              <div className="form-group">
                <label className="form-label">Select Customer</label>
                <select 
                  className="select"
                  required
                  value={accountForm.customer_id}
                  onChange={(e) => setAccountForm({ ...accountForm, customer_id: e.target.value })}
                >
                  <option value="">-- Choose Account Holder --</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      #{c.customer_id} - {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Home Branch</label>
                <select 
                  className="select"
                  required
                  value={accountForm.branch_id}
                  onChange={(e) => setAccountForm({ ...accountForm, branch_id: e.target.value })}
                >
                  <option value="">-- Choose Branch --</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name} - {b.city} ({b.ifsc_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <select 
                    className="select"
                    value={accountForm.account_type}
                    onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                  >
                    <option value="SAVINGS">SAVINGS</option>
                    <option value="CURRENT">CURRENT</option>
                    <option value="FD">FIXED DEPOSIT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Interest Rate (%)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input"
                    value={accountForm.interest_rate}
                    onChange={(e) => setAccountForm({ ...accountForm, interest_rate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Opening Deposit (₹)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="input"
                  value={accountForm.initial_deposit}
                  onChange={(e) => setAccountForm({ ...accountForm, initial_deposit: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOpenAccountModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Opening...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Customer */}
      {showAddCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowAddCustomerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Register New Customer</h3>
              <button className="btn-icon" onClick={() => setShowAddCustomerModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer}>
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input 
                    type="text"
                    required
                    className="input"
                    value={customerForm.first_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input 
                    type="text"
                    required
                    className="input"
                    value={customerForm.last_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email"
                    required
                    className="input"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel"
                    required
                    className="input"
                    placeholder="9876543210"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">PAN Number</label>
                  <input 
                    type="text"
                    required
                    className="input font-mono"
                    placeholder="ABCDE1234F"
                    value={customerForm.pan_number}
                    onChange={(e) => setCustomerForm({ ...customerForm, pan_number: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Aadhaar (12 digits)</label>
                  <input 
                    type="text"
                    required
                    className="input font-mono"
                    placeholder="123456789012"
                    value={customerForm.aadhaar_number}
                    onChange={(e) => setCustomerForm({ ...customerForm, aadhaar_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input 
                    type="date"
                    required
                    className="input"
                    value={customerForm.date_of_birth}
                    onChange={(e) => setCustomerForm({ ...customerForm, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">KYC Verification</label>
                  <select 
                    className="select"
                    value={customerForm.kyc_status}
                    onChange={(e) => setCustomerForm({ ...customerForm, kyc_status: e.target.value })}
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <input 
                  type="text"
                  className="input"
                  placeholder="Street, City, Pincode"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCustomerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
