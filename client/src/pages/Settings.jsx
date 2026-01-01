import React, { useState, useEffect } from 'react';
import { Database, Download, ShieldCheck, HardDrive, Info, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { API_URL } from '../utils/api';


export default function Settings() {
    const [dbInfo, setDbInfo] = useState(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchDbInfo();
    }, []);

    const fetchDbInfo = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/db-info`);
            const data = await res.json();
            setDbInfo(data);
        } catch (error) {
            console.error('Error fetching DB info:', error);
        }
    };



    const handleDownload = (url) => {
        const link = document.createElement('a');
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBackup = () => {
        handleDownload(`${API_URL}/settings/backup`);
    };

    const handleExport = () => {
        handleDownload(`${API_URL}/settings/export-employees`);
    };

    return (
        <div className="page-container" dir="rtl">
            <div className="page-header">
                <div className="header-info">
                    <h1>الاعدادات والادارة</h1>
                    <p>إدارة قاعدة البيانات، النسخ الاحتياطي، وتصدير البيانات</p>
                </div>
            </div>

            {status.message && (
                <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '8px' }}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span>{status.message}</span>
                </div>
            )}

            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {/* Database Maintenance Section */}
                <div className="card settings-card">
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div className="icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '10px', borderRadius: '10px' }}>
                            <Database size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>النسخ الاحتياطي</h2>
                    </div>

                    <div className="db-stats" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#64748b' }}>حجم البيانات:</span>
                            <span style={{ fontWeight: '600' }}>{dbInfo?.size || '...'} MB</span>
                        </div>
                    </div>

                    <div className="settings-actions">
                        <button
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', gap: '0.75rem' }}
                            onClick={handleBackup}
                        >
                            <Download size={20} />
                            تحميل نسخة احتياطية
                        </button>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem', textAlign: 'center' }}>
                            سيتم تحميل ملف `.sqlite` يحتوي على كافة بياناتك. احتفظ به في مكان آمن.
                        </p>
                    </div>
                </div>

                {/* Restore Section */}
                <div className="card settings-card">
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div className="icon-box" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', padding: '10px', borderRadius: '10px' }}>
                            <HardDrive size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>استعادة البيانات</h2>
                    </div>

                    <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.9rem' }}>
                        قم برفع ملف النسخة الاحتياطية `.sqlite` لاستعادة البيانات السابقة.
                        <br />
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>تنبيه: سيتم استبدال البيانات الحالية بالكامل.</span>
                    </p>

                    <input
                        type="file"
                        accept=".sqlite"
                        id="restore-file"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                            if (!e.target.files[0]) return;
                            const file = e.target.files[0];
                            if (!window.confirm(`هل أنت متأكد من استعادة البيانات من الملف:\n${file.name}\n\nسيتم حذف البيانات الحالية!`)) {
                                e.target.value = '';
                                return;
                            }

                            setIsBackingUp(true); // Reuse loading state
                            const formData = new FormData();
                            formData.append('database', file);

                            try {
                                const res = await fetch(`${API_URL}/settings/restore`, {
                                    method: 'POST',
                                    body: formData
                                });
                                const data = await res.json();
                                if (res.ok) {
                                    alert(data.message);
                                    window.location.reload(); // Reload app to refresh connection
                                } else {
                                    setStatus({ type: 'error', message: data.error || 'فشل الاستعادة' });
                                }
                            } catch (error) {
                                setStatus({ type: 'error', message: 'خطأ في الاتصال' });
                            } finally {
                                setIsBackingUp(false);
                                e.target.value = ''; // Reset input
                            }
                        }}
                    />
                    <button
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', gap: '0.75rem', borderColor: '#eab308', color: '#a16207', background: '#fefce8' }}
                        onClick={() => document.getElementById('restore-file').click()}
                        disabled={isBackingUp}
                    >
                        <ShieldCheck size={20} />
                        {isBackingUp ? 'جاري الاستعادة...' : 'اختيار ملف الاستعادة'}
                    </button>
                </div>

                {/* Data Center Export Section */}
                <div className="card settings-card">
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div className="icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '10px' }}>
                            <Download size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>تصدير Excel</h2>
                    </div>

                    <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        تصدير كافة بيانات الموظفين إلى ملف CSV.
                    </p>

                    <button
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', gap: '0.75rem', background: '#f0fdf4', color: '#10b981', borderColor: '#bbf7d0', marginTop: 'auto' }}
                        onClick={handleExport}
                    >
                        <Download size={20} />
                        تصدير كشف الموظفين
                    </button>
                </div>

                {/* System Information Section */}
                <div className="card settings-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Info size={20} color="#64748b" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>عن النظام</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '3rem', fontSize: '0.9rem' }}>
                        <div>
                            <span style={{ color: '#64748b' }}>إصدار التطبيق:</span>
                            <span style={{ marginInlineStart: '0.5rem', fontWeight: '500' }}>v{import.meta.env.PACKAGE_VERSION}</span>
                        </div>
                        <div>
                            <span style={{ color: '#64748b' }}>بيئة التشغيل:</span>
                            <span style={{ marginInlineStart: '0.5rem', fontWeight: '500' }}>Electron Desktop</span>
                        </div>
                        <div>
                            <span style={{ color: '#64748b' }}>المطور:</span>
                            <span style={{ marginInlineStart: '0.5rem', fontWeight: '500' }}>M. Elsebai</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .alert-success {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    color: #166534;
                }
                .alert-error {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                }
                .settings-card {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .settings-actions {
                    margin-top: auto;
                }
            `}</style>
        </div>
    );
}
