import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AccountsView from './components/AccountsView';
import TransactView from './components/TransactView';
import StatementView from './components/StatementView';
import LoansView from './components/LoansView';
import AnalyticsView from './components/AnalyticsView';
import Toast from './components/Toast';
import { api } from './api';

export default function App() {
  // Theme state: Obsidian Dark (default) or Swiss Light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gareeb_theme') || 'dark';
  });

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Backend state
  const [isOnline, setIsOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Core Banking Data
  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);

  // Toast notification queue
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gareeb_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load all banking data from backend
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        healthRes,
        summaryRes,
        branchesRes,
        accountsRes,
        customersRes,
        txnsRes,
        loansRes,
        monthlyRes
      ] = await Promise.allSettled([
        api.checkHealth(),
        api.getSummary(),
        api.getBranches(),
        api.getAccounts(),
        api.getCustomers(),
        api.getTransactions({ limit: 50 }),
        api.getLoans(),
        api.getMonthlyActivity()
      ]);

      const online = healthRes.status === 'fulfilled';
      setIsOnline(online);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (branchesRes.status === 'fulfilled') setBranches(branchesRes.value || []);
      if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value || []);
      if (customersRes.status === 'fulfilled') setCustomers(customersRes.value || []);
      if (txnsRes.status === 'fulfilled') setTransactions(txnsRes.value || []);
      if (loansRes.status === 'fulfilled') setLoans(loansRes.value || []);
      if (monthlyRes.status === 'fulfilled') setMonthlyActivity(monthlyRes.value || []);

      if (!online) {
        showToast('MySQL backend is offline or unreachable on port 5000', 'error');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setIsOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // 20s soft poll
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="app-container">
      <Navbar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        theme={theme}
        toggleTheme={toggleTheme}
        isOnline={isOnline}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      <main className="main-content">
        {currentTab === 'dashboard' && (
          <DashboardView 
            summary={summary}
            branches={branches}
            monthlyActivity={monthlyActivity}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView 
            accounts={accounts}
            customers={customers}
            branches={branches}
            onRefresh={loadData}
            showToast={showToast}
          />
        )}

        {currentTab === 'transact' && (
          <TransactView 
            accounts={accounts}
            transactions={transactions}
            onRefresh={loadData}
            showToast={showToast}
          />
        )}

        {currentTab === 'statement' && (
          <StatementView 
            accounts={accounts}
            showToast={showToast}
          />
        )}

        {currentTab === 'loans' && (
          <LoansView 
            loans={loans}
            accounts={accounts}
            customers={customers}
            branches={branches}
            onRefresh={loadData}
            showToast={showToast}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView 
            summary={summary}
            accounts={accounts}
            loans={loans}
            branches={branches}
            customers={customers}
            showToast={showToast}
          />
        )}
      </main>

      <footer className="footer" style={{ justifyContent: 'center' }}>
        <span>
          © {new Date().getFullYear()}{' '}
          <a 
            href="https://github.com/suhaniyadav-netizen/GareebSQL" 
            target="_blank" 
            rel="noreferrer"
            style={{ fontWeight: 800, color: 'var(--text-primary)', textDecoration: 'none' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          >
            <strong>Suhani Yadav</strong>
          </a>
        </span>
      </footer>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
