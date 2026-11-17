import React from 'react';
import { 
  Landmark, 
  Sun, 
  Moon, 
  Activity, 
  Users, 
  ArrowLeftRight, 
  FileText, 
  CreditCard, 
  BarChart3, 
  RefreshCw 
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  theme, 
  toggleTheme, 
  isOnline, 
  onRefresh, 
  isRefreshing 
}) {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'accounts', label: 'Accounts & KYC', icon: Users },
    { id: 'transact', label: 'Transfers & Cash', icon: ArrowLeftRight },
    { id: 'statement', label: 'Passbook Statement', icon: FileText },
    { id: 'loans', label: 'Credit & Loans', icon: CreditCard },
    { id: 'analytics', label: 'DBMS Analytics', icon: BarChart3 }
  ];

  return (
    <>
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Landmark size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="brand-title">GareebSQL</span>
              <span className="brand-badge">sppa_bank_db • BCNF</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="status-pill" title="MySQL Backend Connectivity">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span>{isOnline ? 'ENGINE ONLINE' : 'DISCONNECTED'}</span>
          </div>

          <button 
            className="btn-icon" 
            onClick={onRefresh} 
            title="Refresh Data"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button 
            className="btn-icon" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <nav className="nav-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
