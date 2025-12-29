import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building as BuildingIcon, Users, Trash2 } from 'lucide-react';
import { API_URL } from '../../utils/api';
import ConfirmationModal from '../../components/ConfirmationModal';
import PageLoading from '../../components/PageLoading';

export default function Residences() {
    const [buildings, setBuildings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBuildingName, setNewBuildingName] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        try {
            const res = await fetch(`${API_URL}/residences/buildings`);
            const data = await res.json();
            setBuildings(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching buildings:', error);
            setIsLoading(false);
        }
    };

    const handleAddBuilding = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/residences/buildings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBuildingName })
            });
            if (res.ok) {
                setNewBuildingName('');
                setShowAddModal(false);
                fetchBuildings();
            }
        } catch (error) {
            console.error('Error adding building:', error);
        }
    };

    const handleDeleteBuilding = async (e) => {
        const id = confirmDelete.id;
        try {
            const res = await fetch(`${API_URL}/residences/buildings/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchBuildings();
                setConfirmDelete({ isOpen: false, id: null });
            }
        } catch (error) {
            console.error('Error deleting building:', error);
        }
    };

    if (isLoading) return <PageLoading />;

    return (
        <div className="page-container" dir="rtl">
            <div className="page-header">
                <div className="header-info">
                    <h1>نظام إدارة الاستراحات</h1>
                    <p>إدارة المباني السكنية وتسكين الموظفين</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    إضافة استراحة
                </button>
            </div>

            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <BuildingIcon size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>إجمالي المباني</h3>
                        <p className="stat-value">{buildings.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {buildings.map(building => {
                    const totalRooms = building.apartments?.reduce((sum, apt) => sum + (apt.rooms?.length || 0), 0) || 0;
                    const occupiedRooms = building.apartments?.reduce((sum, apt) =>
                        sum + (apt.rooms?.filter(r => r.permanentResidentId || r.temporaryResidentId).length || 0), 0) || 0;

                    return (
                        <Link to={`/residences/${building.id}`} key={building.id} className="card residence-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div className="icon-badge">
                                        <BuildingIcon size={20} />
                                    </div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{building.name}</h2>
                                </div>
                                <button className="btn-icon" onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setConfirmDelete({ isOpen: true, id: building.id });
                                }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="card-stats">
                                <div className="stat-item">
                                    <span className="label">الشقق</span>
                                    <span className="value">{building.apartments?.length || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="label">الغرف</span>
                                    <span className="value">{totalRooms}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="label">نسبة الإشغال</span>
                                    <span className="value">
                                        {totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%
                                    </span>
                                </div>
                            </div>

                            <div className="progress-bar-container" style={{ marginTop: '1rem', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                    className="progress-bar"
                                    style={{
                                        width: `${totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0}%`,
                                        height: '100%',
                                        background: '#3b82f6'
                                    }}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>إضافة استراحة جديدة</h2>
                        </div>
                        <form onSubmit={handleAddBuilding}>
                            <div className="form-group">
                                <label>اسم الاستراحة</label>
                                <input
                                    type="text"
                                    required
                                    value={newBuildingName}
                                    onChange={(e) => setNewBuildingName(e.target.value)}
                                    placeholder="مثلاً: سكن المهندسين"
                                />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                                <button type="submit" className="btn-primary">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={handleDeleteBuilding}
                title="حذف الاستراحة"
                message="هل أنت متأكد من حذف هذه الاستراحة؟ سيتم حذف جميع الشقق والغرف التابعة لها."
            />

            <style>{`
                .page-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .header-info h1 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }
                .header-info p {
                    color: #64748b;
                    font-size: 1rem;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-content h3 {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 0.25rem;
                    font-weight: 500;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }
                .residence-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                .residence-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
                    border-color: #3b82f6;
                }
                .btn-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #94a3b8;
                    padding: 0;
                }
                .btn-icon:hover {
                    background: #fef2f2;
                    color: #ef4444 !important;
                }
                .icon-badge {
                    width: 44px;
                    height: 44px;
                    background: #eff6ff;
                    color: #3b82f6;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .card-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin: 1.5rem 0;
                    padding: 1rem 0;
                    border-top: 1px solid #f1f5f9;
                    border-bottom: 1px solid #f1f5f9;
                }
                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .stat-item .label {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-bottom: 4px;
                }
                .stat-item .value {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #334155;
                }
                .progress-bar-container {
                    background: #f1f5f9;
                    border-radius: 10px;
                    height: 8px;
                    overflow: hidden;
                }
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #3b82f6, #60a5fa);
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }
                .empty-state {
                    grid-column: 1 / -1;
                    padding: 4rem;
                    text-align: center;
                    color: #94a3b8;
                    background: white;
                    border-radius: 16px;
                    border: 2px dashed #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
            `}</style>
        </div>
    );
}
