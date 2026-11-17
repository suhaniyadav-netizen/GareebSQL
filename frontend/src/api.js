// API client for GareebSQL Core Banking API
const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
    }
    return json.data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // System Health
  checkHealth: () => request('/api/health'),

  // Analytics & Dashboard
  getSummary: () => request('/api/analytics/summary'),
  getCustomerBalances: () => request('/api/analytics/customer-balances'),
  getCustomerLoans: () => request('/api/analytics/customer-loans'),
  getMonthlyActivity: () => request('/api/analytics/monthly-activity'),
  getSetOperations: () => request('/api/analytics/set-operations'),
  getAboveAverageCustomers: () => request('/api/analytics/above-average-customers'),

  // Branches
  getBranches: () => request('/api/branches'),
  createBranch: (data) => request('/api/branches', { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/customers${query ? `?${query}` : ''}`);
  },
  getCustomer: (id) => request(`/api/customers/${id}`),
  createCustomer: (data) => request('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Accounts
  getAccounts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/accounts${query ? `?${query}` : ''}`);
  },
  getAccount: (idOrNo) => request(`/api/accounts/${idOrNo}`),
  openAccount: (data) => request('/api/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccountStatus: (id, status) => request(`/api/accounts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Transactions
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/transactions${query ? `?${query}` : ''}`);
  },
  deposit: (data) => request('/api/transactions/deposit', { method: 'POST', body: JSON.stringify(data) }),
  withdraw: (data) => request('/api/transactions/withdraw', { method: 'POST', body: JSON.stringify(data) }),
  transfer: (data) => request('/api/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }),
  getStatement: (accNumber) => request(`/api/transactions/statement/${accNumber}`),

  // Loans
  getLoans: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/loans${query ? `?${query}` : ''}`);
  },
  getLoan: (id) => request(`/api/loans/${id}`),
  applyLoan: (data) => request('/api/loans', { method: 'POST', body: JSON.stringify(data) }),
  updateLoanStatus: (id, status) => request(`/api/loans/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  repayLoan: (id, data) => request(`/api/loans/${id}/repay`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
