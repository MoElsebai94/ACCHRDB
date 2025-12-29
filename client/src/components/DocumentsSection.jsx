import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, Trash2, Download, Package } from 'lucide-react';
import { API_URL } from '../utils/api';
import AlertModal from './AlertModal';
import ConfirmationModal from './ConfirmationModal';

export default function DocumentsSection({ employeeId }) {
    const [documents, setDocuments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [alert, setAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        fetchDocuments();
    }, [employeeId]);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`${API_URL}/employees/${employeeId}/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('document', file);

        setIsUploading(true);
        try {
            const res = await fetch(`${API_URL}/employees/${employeeId}/documents`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                fetchDocuments();
                setAlert({ isOpen: true, type: 'success', title: 'تم الرفع', message: 'تم رفع الملف بنجاح' });
            } else {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading:', error);
            setAlert({ isOpen: true, type: 'error', title: 'خطأ', message: error.message || 'فشل رفع الملف' });
        } finally {
            setIsUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`${API_URL}/documents/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                setDocuments(documents.filter(d => d.id !== deleteId));
                setDeleteId(null);
                setAlert({ isOpen: true, type: 'success', title: 'تم الحذف', message: 'تم حذف الملف بنجاح' });
            }
        } catch (error) {
            console.error('Error deleting:', error);
            setAlert({ isOpen: true, type: 'error', title: 'خطأ', message: 'فشل حذف الملف' });
        }
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.includes('image')) return <Image size={24} color="#3b82f6" />;
        if (mimeType.includes('pdf')) return <FileText size={24} color="#ef4444" />;
        return <FileText size={24} color="#64748b" />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '2rem auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Package size={20} /> المستندات والمرفقات
                </h3>
                <div style={{ position: 'relative' }}>
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                        disabled={isUploading}
                    />
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} disabled={isUploading}>
                        {isUploading ? 'جاري الرفع...' : '+ رفع ملف'}
                    </button>
                </div>
            </div>

            {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                    <Upload size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>لا توجد مستندات مرفقة</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {documents.map(doc => (
                        <div key={doc.id} style={{
                            padding: '1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            position: 'relative',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                {getFileIcon(doc.mimeType)}
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.originalName}>
                                        {doc.originalName}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {formatSize(doc.size)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                                <a
                                    href={`${API_URL.replace('/api', '')}/uploads/documents/${doc.filename}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center', padding: '0.25rem', fontSize: '0.8rem' }}
                                >
                                    <Download size={14} /> عرض
                                </a>
                                <button
                                    onClick={() => setDeleteId(doc.id)}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#ef4444',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0.25rem 0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AlertModal
                isOpen={alert.isOpen}
                onClose={() => setAlert({ ...alert, isOpen: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="حذف الملف"
                message="هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء."
            />
        </div>
    );
}
