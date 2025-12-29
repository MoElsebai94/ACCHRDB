import React from 'react';
import { useLocation } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { Menu } from 'lucide-react';

export default function TopBar() {
    const location = useLocation();

    const getPageTitle = (pathname) => {
        if (pathname === '/') return 'لوحة التحكم';
        if (pathname === '/employees') return 'الموظفين';
        if (pathname === '/employees/new') return 'إضافة موظف';
        if (pathname.includes('/employees/')) return 'ملف الموظف';
        if (pathname === '/departments') return 'الأقسام';
        if (pathname === '/residences') return 'الاستراحات';
        if (pathname.includes('/residences/')) return 'تفاصيل المبنى';
        if (pathname === '/settings') return 'الإعدادات';
        return 'لوحة التحكم';
    };

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            marginBottom: '2rem',
            padding: '1rem 0',
            background: 'transparent', // Let background show through or use white with blur
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                {getPageTitle(location.pathname)}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <NotificationDropdown />

                {/* User Profile Placeholder */}

            </div>
        </header>
    );
}
