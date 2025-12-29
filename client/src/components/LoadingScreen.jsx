import React from 'react';
import logo from '../assets/logo.png';

export default function LoadingScreen({ message = 'جاري الاتصال بقاعدة البيانات...' }) {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            fontFamily: 'inherit'
        }}>
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <img
                    src={logo}
                    alt="Logo"
                    style={{
                        height: '120px',
                        width: 'auto',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                />
            </div>

            <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                letterSpacing: '1px',
                background: 'linear-gradient(to bottom, #ffffff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 10px 20px rgba(0,0,0,0.2)'
            }}>
                HR Database
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '1rem' }}>
                <div className="spinner-mini" style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.05)',
                    borderTop: '2px solid #fbbf24',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)'
                }} />
                <span style={{
                    color: '#e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: '400',
                    letterSpacing: '0.3px',
                    opacity: '0.9'
                }}>
                    {message}
                </span>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.95); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
