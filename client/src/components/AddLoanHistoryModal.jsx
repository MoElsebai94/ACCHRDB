import React, { useState } from 'react';
import { X, Calendar, FileText } from 'lucide-react';

export default function AddLoanHistoryModal({ isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        // Reset form slightly delayed or just rely on parent to close/reset
        setFormData({ startDate: '', endDate: '', notes: '' });
    };

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
            zIndex: 1000
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', position: 'relative' }}>
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

                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>إضافة فترة إعارة سابقة</h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div>
                        <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>تاريخ البداية</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                required
                                className="input"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                            <Calendar size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        </div>
                    </div>

                    <div>
                        <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>تاريخ النهاية</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                required
                                className="input"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                            <Calendar size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        </div>
                    </div>

                    <div>
                        <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>ملاحظات (اختياري)</label>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                className="input"
                                rows="3"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="أي تفاصيل إضافية..."
                                style={{ width: '100%', paddingLeft: '2.5rem', resize: 'vertical' }}
                            />
                            <FileText size={18} style={{ position: 'absolute', left: '0.75rem', top: '1rem', color: 'var(--text-secondary)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                            حفظ
                        </button>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                            إلغاء
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
