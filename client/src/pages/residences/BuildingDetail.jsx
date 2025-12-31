import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Plus, Home, User, Calendar, Trash2, UserPlus, UserMinus, AlertCircle, Edit2 } from 'lucide-react';
import { API_URL } from '../../utils/api';
import ConfirmationModal from '../../components/ConfirmationModal';
import CustomSelect from '../../components/CustomSelect';
import PageLoading from '../../components/PageLoading';

export default function BuildingDetail() {
    const { id } = useParams();
    const [building, setBuilding] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAptModal, setShowAptModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAptId, setSelectedAptId] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [assignMode, setAssignMode] = useState('permanent'); // 'permanent' or 'temporary'
    const [confirmUnassign, setConfirmUnassign] = useState({ isOpen: false, roomId: null, mode: null });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
    const [editModal, setEditModal] = useState({ isOpen: false, type: '', id: null, value: '' });

    const [newAptNumber, setNewAptNumber] = useState('');
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    useEffect(() => {
        fetchBuilding();
        fetchEmployees();
    }, [id]);

    const fetchBuilding = async () => {
        try {
            const res = await fetch(`${API_URL}/residences/buildings/${id}`);
            const data = await res.json();
            setBuilding(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching building:', error);
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_URL}/employees`);
            const data = await res.json();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleAddApartment = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/residences/apartments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: newAptNumber, buildingId: id })
            });
            if (res.ok) {
                setNewAptNumber('');
                setShowAptModal(false);
                fetchBuilding();
            }
        } catch (error) {
            console.error('Error adding apartment:', error);
        }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/residences/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: newRoomNumber, apartmentId: selectedAptId })
            });
            if (res.ok) {
                setNewRoomNumber('');
                setShowRoomModal(false);
                fetchBuilding();
            }
        } catch (error) {
            console.error('Error adding room:', error);
        }
    };

    const handleAssignResident = async (e) => {
        e.preventDefault();
        const updateData = {};
        if (assignMode === 'permanent') {
            updateData.permanentResidentId = selectedEmployeeId || null;
        } else {
            updateData.temporaryResidentId = selectedEmployeeId || null;
        }

        try {
            const res = await fetch(`${API_URL}/residences/rooms/${selectedRoom.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (res.ok) {
                setSelectedEmployeeId('');
                setShowAssignModal(false);
                fetchBuilding();
            }
        } catch (error) {
            console.error('Error assigning resident:', error);
        }
    };

    const handleUnassign = async () => {
        const { roomId, mode } = confirmUnassign;
        const updateData = mode === 'permanent' ? { permanentResidentId: null } : { temporaryResidentId: null };
        try {
            const res = await fetch(`${API_URL}/residences/rooms/${roomId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (res.ok) {
                fetchBuilding();
                setConfirmUnassign({ isOpen: false, roomId: null, mode: null });
            }
        } catch (error) {
            console.error('Error unassigning resident:', error);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        const { type, id, value } = editModal;
        const url = type === 'apartment' ? `${API_URL}/residences/apartments/${id}` : `${API_URL}/residences/rooms/${id}`;
        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: value })
            });
            if (res.ok) {
                setEditModal({ isOpen: false, type: '', id: null, value: '' });
                fetchBuilding();
            }
        } catch (error) {
            console.error(`Error editing ${type}:`, error);
        }
    };

    const handleDelete = async () => {
        const { type, id } = confirmDelete;
        const url = type === 'apartment' ? `${API_URL}/residences/apartments/${id}` : `${API_URL}/residences/rooms/${id}`;
        try {
            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                setConfirmDelete({ isOpen: false, type: '', id: null, title: '', message: '' });
                fetchBuilding();
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
        }
    };

    if (isLoading) return <PageLoading />;
    if (!building) return <div className="page-container">المبنى غير موجود</div>;

    return (
        <div className="page-container" dir="rtl">
            <div className="breadcrumb">
                <Link to="/residences">الاستراحات</Link>
                <ChevronRight size={16} />
                <span>{building.name}</span>
            </div>

            <div className="page-header">
                <div className="header-info">
                    <h1>{building.name}</h1>
                    <p>إدارة الشقق والغرف</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAptModal(true)}>
                    <Plus size={18} />
                    إضافة شقة
                </button>
            </div>

            <div className="apartment-grid">
                {building.apartments?.map(apt => (
                    <div key={apt.id} className="card apartment-card">
                        <div className="apt-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h3>شقة رقم {apt.number}</h3>
                                <div className="action-buttons">
                                    <button className="btn-action edit" title="تعديل" onClick={() => setEditModal({ isOpen: true, type: 'apartment', id: apt.id, value: apt.number })}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button className="btn-action delete" title="حذف" onClick={() => setConfirmDelete({
                                        isOpen: true,
                                        type: 'apartment',
                                        id: apt.id,
                                        title: 'حذف الشقة',
                                        message: `هل أنت متأكد من حذف الشقة رقم ${apt.number}؟ سيتم حذف جميع الغرف التابعة لها.`
                                    })}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <button className="btn-secondary btn-sm" onClick={() => {
                                setSelectedAptId(apt.id);
                                setShowRoomModal(true);
                            }}>
                                <Plus size={14} />
                                إضافة غرفة
                            </button>
                        </div>

                        <div className="room-list">
                            {apt.rooms?.map(room => {
                                const perm = room.permanentResident;
                                const temp = room.temporaryResident;
                                const today = new Date().toISOString().split('T')[0];
                                const effectiveVacationStart = perm?.travelDate || perm?.vacationStartDate;
                                const onVacation = perm && perm.vacationReturnDate && effectiveVacationStart && today >= effectiveVacationStart;
                                const futureVacation = perm && perm.vacationReturnDate && effectiveVacationStart && today < effectiveVacationStart;

                                return (
                                    <div key={room.id} className="room-item">
                                        <div className="room-info">
                                            <span className="room-name">غرفة {room.number}</span>
                                            <div className="action-buttons">
                                                <button className="btn-action edit" title="تعديل" onClick={() => setEditModal({ isOpen: true, type: 'room', id: room.id, value: room.number })}>
                                                    <Edit2 size={12} />
                                                </button>
                                                <button className="btn-action delete" title="حذف" onClick={() => setConfirmDelete({
                                                    isOpen: true,
                                                    type: 'room',
                                                    id: room.id,
                                                    title: 'حذف الغرفة',
                                                    message: `هل أنت متأكد من حذف الغرفة رقم ${room.number}؟`
                                                })}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="resident-slots">
                                            {/* Permanent Resident Slot */}
                                            <div className={`resident-slot ${onVacation ? 'away' : ''}`}>
                                                {perm ? (
                                                    <>
                                                        <div className="resident-details">
                                                            <User size={14} />
                                                            <span className="name">{perm.firstName} {perm.lastName}</span>
                                                            {onVacation && (
                                                                <div className="vacation-badge">
                                                                    <Calendar size={12} />
                                                                    <span>إجازة عودة: {perm.vacationReturnDate}</span>
                                                                </div>
                                                            )}
                                                            {futureVacation && (
                                                                <div className="vacation-badge future">
                                                                    <Calendar size={12} />
                                                                    <span>سفر: {perm.travelDate || perm.vacationStartDate}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button className="btn-icon btn-sm" onClick={() => setConfirmUnassign({ isOpen: true, roomId: room.id, mode: 'permanent' })}>
                                                            <UserMinus size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className="btn-ghost" onClick={() => {
                                                        setSelectedRoom(room);
                                                        setAssignMode('permanent');
                                                        setShowAssignModal(true);
                                                    }}>
                                                        <UserPlus size={14} />
                                                        تسكين دائم
                                                    </button>
                                                )}
                                            </div>

                                            {/* Temporary Resident Slot (Visible if on vacation or already assigned) */}
                                            {(onVacation || temp) && (
                                                <div className="resident-slot temporary">
                                                    {temp ? (
                                                        <>
                                                            <div className="resident-details">
                                                                <User size={14} />
                                                                <span className="name">{temp.firstName} {temp.lastName} (مؤقت)</span>
                                                            </div>
                                                            <button className="btn-icon btn-sm" onClick={() => setConfirmUnassign({ isOpen: true, roomId: room.id, mode: 'temporary' })}>
                                                                <UserMinus size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button className="btn-ghost-warning" onClick={() => {
                                                            setSelectedRoom(room);
                                                            setAssignMode('temporary');
                                                            setShowAssignModal(true);
                                                        }}>
                                                            <UserPlus size={14} />
                                                            تسكين مؤقت
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!apt.rooms || apt.rooms.length === 0) && (
                                <p className="empty-text">لا يوجد غرف في هذه الشقة</p>
                            )}
                        </div>
                    </div>
                ))}
                {(!building.apartments || building.apartments.length === 0) && (
                    <div className="empty-state">
                        <Home size={48} />
                        <p>لا يوجد شقق مسجلة في هذا المبنى</p>
                    </div>
                )}
            </div>

            {/* Modals ... */}
            {showAptModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header"><h2>إضافة شقة</h2></div>
                        <form onSubmit={handleAddApartment}>
                            <div className="form-group">
                                <label>رقم أو اسم الشقة</label>
                                <input type="text" required value={newAptNumber} onChange={(e) => setNewAptNumber(e.target.value)} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowAptModal(false)}>إلغاء</button>
                                <button type="submit" className="btn-primary">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRoomModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header"><h2>إضافة غرفة</h2></div>
                        <form onSubmit={handleAddRoom}>
                            <div className="form-group">
                                <label>رقم أو اسم الغرفة</label>
                                <input type="text" required value={newRoomNumber} onChange={(e) => setNewRoomNumber(e.target.value)} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowRoomModal(false)}>إلغاء</button>
                                <button type="submit" className="btn-primary">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{assignMode === 'permanent' ? 'تسكين دائم' : 'تسكين مؤقت (بديل)'}</h2>
                        </div>
                        <form onSubmit={handleAssignResident}>
                            <div className="form-group">
                                <label>اختر الموظف</label>
                                <CustomSelect
                                    options={[
                                        { value: '', label: '-- اختر موظف --' },
                                        ...employees
                                            .filter(emp => !emp.permanentRoom && !emp.temporaryRoom && emp.isActive)
                                            .map(emp => ({
                                                value: emp.id,
                                                label: `${emp.firstName} ${emp.lastName} (${emp.position})`
                                            }))
                                    ]}
                                    value={selectedEmployeeId}
                                    onChange={setSelectedEmployeeId}
                                    placeholder="-- اختر موظف --"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>إلغاء</button>
                                <button type="submit" className="btn-primary">تسكين</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmUnassign.isOpen}
                onClose={() => setConfirmUnassign({ isOpen: false, roomId: null, mode: null })}
                onConfirm={handleUnassign}
                title="إلغاء التسكين"
                message="هل أنت متأكد من إلغاء تسكين هذا الموظف من الغرفة؟"
            />

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, type: '', id: null, title: '', message: '' })}
                onConfirm={handleDelete}
                title={confirmDelete.title}
                message={confirmDelete.message}
            />

            {editModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>{editModal.type === 'apartment' ? 'تعديل الشقة' : 'تعديل الغرفة'}</h2>
                        </div>
                        <form onSubmit={handleEdit}>
                            <div className="form-group">
                                <label>الرقم / الاسم الجديد</label>
                                <input
                                    type="text"
                                    required
                                    value={editModal.value}
                                    onChange={(e) => setEditModal({ ...editModal, value: e.target.value })}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setEditModal({ isOpen: false, type: '', id: null, value: '' })}>إلغاء</button>
                                <button type="submit" className="btn-primary">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #64748b;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                }
                .breadcrumb a {
                    color: #3b82f6;
                    text-decoration: none;
                }
                .apartment-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 2rem;
                }
                .apartment-card {
                    padding: 0;
                    overflow: hidden;
                }
                .apt-header {
                    padding: 1.25rem;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .apt-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }
                .action-buttons {
                    display: flex;
                    gap: 0.25rem;
                }
                .btn-action {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    border: none;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--text-secondary);
                }
                .btn-action:hover {
                    background: #f1f5f9;
                }
                .btn-action.edit:hover {
                    color: var(--primary-color);
                }
                .btn-action.delete:hover {
                    color: #ef4444;
                    background: #fef2f2;
                }
                .room-list {
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .room-item {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1rem;
                }
                .room-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }
                .room-name {
                    font-weight: 600;
                    color: #475569;
                    display: block;
                    margin-bottom: 0.75rem;
                    font-size: 0.95rem;
                }
                .resident-slots {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .resident-slot {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #f1f5f9;
                    padding: 0.75rem;
                    border-radius: 6px;
                    min-height: 44px;
                }
                .resident-slot.away {
                    background: #fff7ed;
                    border: 1px dashed #fdba74;
                }
                .resident-slot.temporary {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                }
                .resident-details {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .resident-details .name {
                    font-weight: 500;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .vacation-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: #ea580c;
                    background: #ffedd5;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-top: 4px;
                }
                .vacation-badge.future {
                    color: #0284c7;
                    background: #e0f2fe;
                }
                .btn-sm {
                    padding: 0.4rem 0.8rem;
                    font-size: 0.8rem;
                    height: auto;
                }
                .btn-ghost {
                    background: none;
                    border: 1px dashed #cbd5e1;
                    color: #64748b;
                    width: 100%;
                    padding: 0.5rem;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                }
                .btn-ghost:hover {
                    background: #f8fafc;
                    border-color: #3b82f6;
                    color: #3b82f6;
                }
                .btn-ghost-warning {
                    background: none;
                    border: 1px dashed #fdba74;
                    color: #ea580c;
                    width: 100%;
                    padding: 0.5rem;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                }
                .btn-ghost-warning:hover {
                    background: #fff7ed;
                }
                .empty-text {
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.85rem;
                    margin: 0;
                }
                .empty-state {
                    grid-column: 1 / -1;
                    padding: 4rem;
                    text-align: center;
                    color: #94a3b8;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 2px dashed #e2e8f0;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    width: 90%;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                .modal-header {
                    margin-bottom: 1.5rem;
                }
                .modal-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                .form-group {
                    margin-bottom: 1.25rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #64748b;
                }
            `}</style>
        </div>
    );
}
