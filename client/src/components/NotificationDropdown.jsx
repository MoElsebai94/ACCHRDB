import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';

export default function NotificationDropdown() {
    const { notifications, loading, unreadCount, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!isOpen) {
            // Opening the dropdown
            setIsOpen(true);
            markAllAsRead();
        } else {
            setIsOpen(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'contract': return <AlertTriangle size={16} />;
            case 'residence': return <Clock size={16} />;
            case 'vacation': return <Calendar size={16} />;
            default: return <CheckCircle size={16} />;
        }
    };

    const getColors = (severity) => {
        switch (severity) {
            case 'high': return { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' };
            case 'medium': return { bg: '#fffbeb', text: '#f59e0b', border: '#fcd34d' };
            default: return { bg: '#eff6ff', text: '#3b82f6', border: '#93c5fd' };
        }
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={handleToggle}
                style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    position: 'relative'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    left: '0',
                    width: '320px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 100,
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b' }}>
                        التنبيهات
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>لا توجد تنبيهات جديدة</div>
                        ) : (
                            Array.isArray(notifications) && notifications.map((note) => {
                                const colors = getColors(note.severity);
                                return (
                                    <Link
                                        key={note.id}
                                        to={note.link}
                                        onClick={() => setIsOpen(false)}
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            padding: '1rem',
                                            borderBottom: '1px solid #f1f5f9',
                                            textDecoration: 'none',
                                            transition: 'background 0.2s',
                                            alignItems: 'start'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <div style={{
                                            padding: '0.5rem',
                                            borderRadius: '50%',
                                            background: colors.bg,
                                            color: colors.text
                                        }}>
                                            {getIcon(note.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.2rem' }}>
                                                {note.title}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>
                                                {note.message}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                                                {note.date}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
