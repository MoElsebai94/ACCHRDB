import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { API_URL } from '../utils/api';
import ConfirmationModal from '../components/ConfirmationModal';
import PageLoading from '../components/PageLoading';

export default function DepartmentList() {
    const [departments, setDepartments] = useState([]);
    const [newDept, setNewDept] = useState('');
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${API_URL}/departments`);
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newDept.trim()) return;

        try {
            const response = await fetch(`${API_URL}/departments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDept })
            });

            if (response.ok) {
                setNewDept('');
                fetchDepartments();
            }
        } catch (error) {
            console.error('Error adding department:', error);
        }
    };

    const handleDelete = async () => {
        const id = confirmDelete.id;
        try {
            await fetch(`${API_URL}/departments/${id}`, { method: 'DELETE' });
            fetchDepartments();
            setConfirmDelete({ isOpen: false, id: null });
        } catch (error) {
            console.error('Error deleting department:', error);
        }
    };

    if (loading) return <PageLoading />;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>


            <div className="card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="input-label">اسم القسم الجديد</label>
                        <input
                            className="input-field"
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            placeholder="أدخل اسم القسم..."
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginBottom: '2px' }}>
                        + إضافة قسم
                    </button>
                </form>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>اسم القسم</th>
                            <th style={{ width: '100px' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.length === 0 ? (
                            <tr>
                                <td colSpan="2" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد أقسام مسجلة.</td>
                            </tr>
                        ) : (
                            departments.map((dept) => (
                                <tr key={dept.id}>
                                    <td style={{ fontWeight: '600' }}>{dept.name}</td>
                                    <td>
                                        <button onClick={() => setConfirmDelete({ isOpen: true, id: dept.id })} className="btn btn-danger" style={{ padding: '0.4rem' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="حذف القسم"
                message="هل أنت متأكد من حذف هذا القسم؟ جميع الموظفين في هذا القسم سيفقدون تبعيتهم له."
            />
        </div>
    );
}
