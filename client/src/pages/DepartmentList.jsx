import React, { useEffect, useState } from 'react';
import { Trash2, FolderTree } from 'lucide-react';
import { API_URL } from '../utils/api';
import ConfirmationModal from '../components/ConfirmationModal';
import PageLoading from '../components/PageLoading';

export default function DepartmentList() {
    const [departments, setDepartments] = useState([]);
    const [newDept, setNewDept] = useState('');
    const [newDeptParent, setNewDeptParent] = useState('');
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
                body: JSON.stringify({
                    name: newDept,
                    parentId: newDeptParent || null
                })
            });

            if (response.ok) {
                setNewDept('');
                setNewDeptParent('');
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

    // Helper to build hierarchy
    const getOrganizedDepartments = () => {
        const map = {};
        const roots = [];

        // Deep copy to avoid mutating state directly in complex ways during render
        const depts = departments.map(d => ({ ...d, children: [] }));

        depts.forEach(d => {
            map[d.id] = d;
        });

        depts.forEach(d => {
            if (d.parentId && map[d.parentId]) {
                map[d.parentId].children.push(d);
            } else {
                roots.push(d);
            }
        });

        // Flatten for display
        const flatten = (nodes, level = 0) => {
            let result = [];
            nodes.forEach(node => {
                result.push({ ...node, level });
                if (node.children.length > 0) {
                    result = result.concat(flatten(node.children, level + 1));
                }
            });
            return result;
        };

        return flatten(roots);
    };

    const organizedDepartments = getOrganizedDepartments();

    if (loading) return <PageLoading />;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderTree size={32} color="#3b82f6" />
                إدارة الأقسام
            </h1>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="input-label">اسم القسم الجديد</label>
                        <input
                            className="input-field"
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            placeholder="أدخل اسم القسم..."
                            required
                        />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <label className="input-label">تابع لقسم (اختياري)</label>
                        <select
                            className="input-field"
                            value={newDeptParent}
                            onChange={(e) => setNewDeptParent(e.target.value)}
                        >
                            <option value="">-- قسم رئيسي --</option>
                            {organizedDepartments.map(dept => (
                                <option key={dept.id} value={dept.id}>
                                    {'\u00A0\u00A0'.repeat(dept.level)} {dept.level > 0 ? '↳ ' : ''} {dept.name}
                                </option>
                            ))}
                        </select>
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
                            <th>التبعية</th>
                            <th style={{ width: '100px' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizedDepartments.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد أقسام مسجلة.</td>
                            </tr>
                        ) : (
                            organizedDepartments.map((dept) => (
                                <tr key={dept.id}>
                                    <td style={{
                                        fontWeight: dept.level === 0 ? '600' : '400',
                                        paddingRight: `${dept.level * 20 + 10}px`
                                    }}>
                                        {dept.level > 0 && <span style={{ color: '#94a3b8', marginLeft: '5px' }}>↳</span>}
                                        {dept.name}
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                                        {dept.parentId ? 'قسم فرعي' : 'قسم رئيسي'}
                                    </td>
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
                message="هل أنت متأكد من حذف هذا القسم؟ قد يؤدي ذلك إلى حذف الأقسام الفرعية المرتبطة به."
            />
        </div>
    );
}
