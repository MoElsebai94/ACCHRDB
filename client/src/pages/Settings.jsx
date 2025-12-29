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

    const handleBackup = async () => {
        setIsBackingUp(true);
        setStatus({ type: '', message: '' });
        try {
            const res = await fetch(`${API_URL}/settings/backup`);
            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: `تم النسخ الاحتياطي بنجاح: ${data.filename}` });
            } else {
                setStatus({ type: 'error', message: 'فشل النسخ الاحتياطي' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'خطأ في الاتصال بالخادم' });
        } finally {
            setIsBackingUp(false);
            fetchDbInfo();
        }
    };

    const handleExport = () => {
        window.open(`${API_URL}/settings/export-employees`, '_blank');
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
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>صيانة قاعدة البيانات</h2>
                    </div>

                    <div className="db-stats" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#64748b' }}>حجم قاعدة البيانات:</span>
                            <span style={{ fontWeight: '600' }}>{dbInfo?.size || '...'} MB</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>آخر تعديل:</span>
                            <span style={{ fontWeight: '600' }}>{dbInfo ? new Date(dbInfo.lastModified).toLocaleString('ar-EG') : '...'}</span>
                        </div>
                    </div>

                    <div className="settings-actions">
                        <button
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', gap: '0.75rem' }}
                            onClick={handleBackup}
                            disabled={isBackingUp}
                        >
                            <ShieldCheck size={20} />
                            {isBackingUp ? 'جاري النسخ الاحتياطي...' : 'بدء نسخة احتياطية فورية'}
                        </button>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem', textAlign: 'center' }}>
                            سيتم حفظ النسخة في مجلد `backups` المخصص في ملفات النظام.
                        </p>
                    </div>
                </div>

                {/* Data Center Export Section */}
                <div className="card settings-card">
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div className="icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '10px' }}>
                            <Download size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>مركز تصدير البيانات</h2>
                    </div>

                    <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        يمكنك تصدير كافة بيانات الموظفين المسجلة حالياً في النظام إلى ملف CSV متوافق مع برامج Excel.
                    </p>

                    <button
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', gap: '0.75rem', background: '#f0fdf4', color: '#10b981', borderColor: '#bbf7d0' }}
                        onClick={handleExport}
                    >
                        <Download size={20} />
                        تصدير كشف الموظفين (CSV)
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
                            <span style={{ marginInlineStart: '0.5rem', fontWeight: '500' }}>1.0.0 (Gold)</span>
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
