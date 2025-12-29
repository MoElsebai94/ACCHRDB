import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export default function AlertModal({ isOpen, onClose, title, message, type = 'error' }) {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const Icon = isSuccess ? CheckCircle : AlertCircle;
    const iconColor = isSuccess ? '#22c55e' : '#ef4444';
    const iconBg = isSuccess ? '#dcfce7' : '#fee2e2';
    const btnClass = isSuccess ? 'btn' : 'btn btn-danger';
    const btnStyle = isSuccess ? { background: 'var(--primary-color)', color: 'white' } : {};

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                position: 'relative',
                textAlign: 'center'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{
                    background: iconBg,
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                }}>
                    <Icon size={28} color={iconColor} />
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className={btnClass}
                    style={{ width: '100%', justifyContent: 'center', ...btnStyle }}
                >
                    حسناً
                </button>
            </div>
        </div>
    );
}
