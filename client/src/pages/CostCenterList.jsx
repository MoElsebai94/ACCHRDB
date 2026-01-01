import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { API_URL } from '../utils/api';
import ConfirmationModal from '../components/ConfirmationModal';
import PageLoading from '../components/PageLoading';

export default function CostCenterList() {
    const [costCenters, setCostCenters] = useState([]);
    const [newCostCenter, setNewCostCenter] = useState('');
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchCostCenters();
    }, []);

    const fetchCostCenters = async () => {
        try {
            const response = await fetch(`${API_URL}/cost-centers`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) setCostCenters(data);
                else setCostCenters([]);
            }
        } catch (error) {
            console.error('Error fetching cost centers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCostCenter.trim()) return;

        try {
            const response = await fetch(`${API_URL}/cost-centers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCostCenter })
            });

            if (response.ok) {
                setNewCostCenter('');
                fetchCostCenters();
            }
        } catch (error) {
            console.error('Error adding cost center:', error);
        }
    };

    const handleDelete = async () => {
        const id = confirmDelete.id;
        try {
            await fetch(`${API_URL}/cost-centers/${id}`, { method: 'DELETE' });
            fetchCostCenters();
            setConfirmDelete({ isOpen: false, id: null });
        } catch (error) {
            console.error('Error deleting cost center:', error);
        }
    };

    if (loading) return <PageLoading />;

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>


            <div className="card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="input-label">اسم مركز التكلفة الجديد</label>
                        <input
                            className="input-field"
                            value={newCostCenter}
                            onChange={(e) => setNewCostCenter(e.target.value)}
                            placeholder="أدخل اسم مركز التكلفة..."
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginBottom: '2px' }}>
                        + إضافة مركز تكلفة
                    </button>
                </form>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>اسم مركز التكلفة</th>
                            <th style={{ width: '100px' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {costCenters.length === 0 ? (
                            <tr>
                                <td colSpan="2" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد مراكز تكلفة مسجلة.</td>
                            </tr>
                        ) : (
                            costCenters.map((item) => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                                    <td>
                                        <button onClick={() => setConfirmDelete({ isOpen: true, id: item.id })} className="btn btn-danger" style={{ padding: '0.4rem' }}>
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
                title="حذف مركز التكلفة"
                message="هل أنت متأكد من حذف مركز التكلفة هذا؟"
            />
        </div>
    );
}
