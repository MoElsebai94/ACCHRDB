import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, Settings, UserPlus, Building, Briefcase, Wallet, Home } from 'lucide-react';
import logo from '../assets/logo.png';

import { API_URL } from '../utils/api';

export default function Sidebar() {
    const location = useLocation();
    const [backendStatus, setBackendStatus] = useState('checking');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/health`);
                if (res.ok) setBackendStatus('connected');
                else setBackendStatus('error');
            } catch (e) {
                setBackendStatus('disconnected');
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);
    return (
        <aside className="sidebar">
            <div className="sidebar-logo" style={{ gap: '15px', alignItems: 'flex-start' }}>
                <img src={logo} alt="AC Logo" style={{ height: '54px', width: '54px', objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff', letterSpacing: '0.3px' }}>
                        Arab Contractors
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: '600', color: '#fbbf24' }}>
                        Cameroon
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '500', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        HR Database
                    </span>
                </div>
            </div>
            <nav className="sidebar-nav">
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <LayoutDashboard size={20} />
                    لوحة التحكم
                </NavLink>
                <NavLink
                    to="/employees"
                    className={({ isActive }) => {
                        const isActuallyActive = isActive && !location.pathname.includes('/employees/new');
                        return `nav-item ${isActuallyActive ? 'active' : ''}`;
                    }}
                >
                    <Users size={20} />
                    الموظفين
                </NavLink>
                <NavLink
                    to="/departments"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Briefcase size={20} />
                    الأقسام
                </NavLink>
                <NavLink
                    to="/cost-centers"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Wallet size={20} />
                    مراكز التكلفة
                </NavLink>
                <NavLink
                    to="/residences"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Home size={20} />
                    الاستراحات
                </NavLink>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Settings Icon size={20} />
                    الاعدادات
                </NavLink>
            </nav>

            <div style={{
                marginTop: 'auto',
                padding: '1rem',
                fontSize: '0.8rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: backendStatus === 'connected' ? 'var(--success-color)' : 'var(--danger-color)'
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: backendStatus === 'connected' ? 'var(--success-color)' : 'var(--danger-color)',
                    boxShadow: backendStatus === 'connected' ? '0 0 5px var(--success-color)' : 'none'
                }} />
                {backendStatus === 'connected' ? 'Backend Connected' : `Backend ${backendStatus}`}
            </div>
        </aside>
    );
}
