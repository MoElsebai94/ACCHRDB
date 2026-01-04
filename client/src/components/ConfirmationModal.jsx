import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
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
            zIndex: 1100, // Higher than regular modals
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out',
                position: 'relative'
            }}>
                <button
                    type="button"
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

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        background: '#fef3c7',
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto'
                    }}>
                        <AlertTriangle size={28} color="#d97706" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {message}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="btn btn-danger"
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        تأكيد
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
