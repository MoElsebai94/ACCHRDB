import React from 'react';

export default function PageLoading({ message = 'جاري التحميل...' }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px', // Fixed height for page content area
            width: '100%',
            color: 'var(--text-secondary, #64748b)'
        }}>
            <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(59, 130, 246, 0.1)',
                borderTop: '3px solid var(--primary-color, #3b82f6)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
            }} />
            <span style={{
                fontSize: '0.95rem',
                fontWeight: '500',
                opacity: 0.8
            }}>
                {message}
            </span>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
