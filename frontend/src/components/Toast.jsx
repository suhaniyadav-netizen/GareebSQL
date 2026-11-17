import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        return (
          <div 
            key={toast.id} 
            className="toast"
            style={{ 
              borderColor: isSuccess ? 'rgba(16, 185, 129, 0.4)' : isError ? 'rgba(244, 63, 94, 0.4)' : 'var(--border)'
            }}
          >
            {isSuccess && <CheckCircle2 size={16} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />}
            {isError && <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
            {!isSuccess && !isError && <Info size={16} style={{ color: 'var(--info)', flexShrink: 0 }} />}
            
            <div style={{ flex: 1, fontSize: '0.825rem' }}>{toast.message}</div>
            
            <button 
              onClick={() => onDismiss(toast.id)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
