import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { Plus, Building as BuildingIcon, Users, Trash2 } from 'lucide-react';
import { logoBase64 } from '../../assets/logoBase64';
import { API_URL } from '../../utils/api';
import ConfirmationModal from '../../components/ConfirmationModal';
import PageLoading from '../../components/PageLoading';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
            if (Array.isArray(data)) setBuildings(data);
            else setBuildings([]);
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

    const handleDeleteBuilding = async () => {
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

    // --- Report Logic ---
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [printableData, setPrintableData] = useState(null); // Stores data for the hidden PDF view

    const generateMonthlyReport = async () => {
        setIsGeneratingReport(true);
        try {
            // 1. Fetch Data
            const [empRes, vacRes] = await Promise.all([
                fetch(`${API_URL}/employees`),
                fetch(`${API_URL}/vacations`)
            ]);
            const empData = await empRes.json();
            const vacData = await vacRes.json();
            const employees = Array.isArray(empData) ? empData : [];
            const vacations = Array.isArray(vacData) ? vacData : [];

            // 2. Prepare Date Info
            const [year, month] = reportMonth.split('-').map(Number);
            // JS months are 0-indexed for Date constructor but logic handles 1-based month from split ok?
            // new Date(2025, 12, 0) gives last day of Dec 2025? No, month is 0-11.
            // Split "2025-12" -> month=12. new Date(2025, 12, 0) is actually Jan 0th 2026 -> Dec 31 2025. Correct.
            const daysInMonth = new Date(year, month, 0).getDate();
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

            // 3. Logic Helper
            const getStatusForDay = (emp, dayNumber) => {
                const currentStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

                // Active Vacation Check
                const empVacations = vacations.filter(v => v.employeeId === emp.id);
                for (const v of empVacations) {
                    const effectivelyStarted = v.travelDate || v.startDate;
                    if (currentStr >= effectivelyStarted && currentStr < v.returnDate) {
                        return 'V';
                    }
                }
                return 'P';
            };

            // 4. Build Data Structure
            const data = buildings.map(b => {
                const buildingResidents = [];
                // Find residents (Permanent or Temporary) in this building
                // We iterate employees for safety if associations are weak
                // But efficient way: rely on 'buildings' if it has nested structure, OR iterate buildings->apartments->rooms
                b.apartments?.forEach(apt => {
                    apt.rooms?.forEach(room => {
                        [room.permanentResidentId, room.temporaryResidentId].forEach(resId => {
                            if (resId) {
                                const emp = employees.find(e => e.id === resId);
                                if (emp) buildingResidents.push(emp);
                            }
                        });
                    });
                });

                const dailyStats = days.map(day => {
                    let present = 0;
                    let vacation = 0;
                    buildingResidents.forEach(emp => {
                        if (getStatusForDay(emp, day) === 'V') vacation++;
                        else present++;
                    });
                    return { day, present, vacation };
                });

                return {
                    name: b.name,
                    stats: dailyStats,
                    totalResidents: buildingResidents.length
                };
            });

            // 5. Calculate Grand Totals & Daily Aggregates
            const totalResidents = data.reduce((sum, b) => sum + b.totalResidents, 0);

            const dailyGrandTotals = days.map(day => {
                let totalP = 0;
                let totalV = 0;
                data.forEach(b => {
                    // stats index is 0-based, days are 1-based but array matches length
                    const stat = b.stats[day - 1]; // day 1 is index 0
                    if (stat) {
                        totalP += stat.present;
                        totalV += stat.vacation;
                    }
                });
                return { day, totalP, totalV };
            });

            // 5b. Use local Logo Base64 (No fetch required)
            setPrintableData({
                month: reportMonth,
                days,
                buildings: data,
                totalResidents,
                totalBuildings: buildings.length,
                dailyGrandTotals,
                logoBase64: logoBase64 // Imported from assets
            });

            // Wait for render
            setTimeout(async () => {
                const element = document.getElementById('residences-report-print');
                if (!element) return;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    width: element.scrollWidth,
                    height: element.scrollHeight,
                    windowHeight: 5000,
                    x: 0,
                    y: 0
                });

                const imgData = canvas.toDataURL('image/png');

                // Convert pixels to mm (1 px = 0.264583 mm)
                const pxToMm = 0.264583;
                const pdfWidth = canvas.width * pxToMm;
                const pdfHeight = canvas.height * pxToMm;

                // Create PDF with EXACT dimensions of the captured image
                const pdf = new jsPDF({
                    orientation: pdfWidth > pdfHeight ? 'l' : 'p',
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Residences_Report_${reportMonth}.pdf`);

                setPrintableData(null);
                setIsGeneratingReport(false);
            }, 1000);

        } catch (error) {
            console.error(error);
            alert('Error: ' + error.message);
            setIsGeneratingReport(false);
        }
    };

    if (isLoading) return <PageLoading />;

    return (
        <div className="page-container" dir="rtl">
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="header-info">
                    <h1>نظام إدارة الاستراحات</h1>
                    <p>إدارة المباني السكنية وتسكين الموظفين</p>
                </div>
                <div className="controls-container" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="date-picker-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.25rem 0.5rem' }}>
                        <input
                            type="month"
                            value={reportMonth}
                            onChange={(e) => setReportMonth(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: '#334155' }}
                        />
                    </div>
                    <button
                        onClick={generateMonthlyReport}
                        disabled={isGeneratingReport}
                        className="btn btn-secondary"
                        title="تحميل تقرير شهري"
                    >
                        {isGeneratingReport ? 'جاري...' : 'تقرير (PDF)'}
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        استراحة جديدة
                    </button>
                </div>
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

            {
                showAddModal && ReactDOM.createPortal(
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 9999, // Ensure it's on top
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            background: 'white',
                            width: '100%',
                            maxWidth: '500px',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            overflow: 'hidden'
                        }}>
                            {/* Modal Header */}
                            <div style={{
                                padding: '24px',
                                borderBottom: '1px solid #f1f5f9',
                                background: '#f8fafc'
                            }}>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    color: '#0f172a'
                                }}>إضافة استراحة جديدة</h2>
                            </div>

                            <form onSubmit={handleAddBuilding}>
                                {/* Modal Body */}
                                <div style={{ padding: '24px' }}>
                                    <div className="form-group">
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: '#475569',
                                            marginBottom: '8px'
                                        }}>اسم الاستراحة</label>
                                        <input
                                            type="text"
                                            required
                                            value={newBuildingName}
                                            onChange={(e) => setNewBuildingName(e.target.value)}
                                            placeholder="مثلاً: سكن المهندسين"
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                transition: 'all 0.2s',
                                                color: '#1e293b'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div style={{
                                    padding: '20px 24px',
                                    background: '#f8fafc',
                                    borderTop: '1px solid #f1f5f9',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            background: 'white',
                                            color: '#64748b',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
                                        onMouseOut={(e) => e.target.style.background = 'white'}
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#3b82f6',
                                            color: 'white',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = '#2563eb'}
                                        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                                    >
                                        حفظ الاستراحة
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            }

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={handleDeleteBuilding}
                title="حذف الاستراحة"
                message="هل أنت متأكد من حذف هذه الاستراحة؟ سيتم حذف جميع الشقق والغرف التابعة لها."
            />

            {/* Hidden Printable Report - Premium Design */}
            {printableData && (
                <div id="residences-report-print" style={{
                    position: 'fixed', // Changed from absolute to fixed
                    top: 0, // Keep at top of viewport vertically to ensure full render
                    left: '-5000px', // Hide horizontally off-screen
                    zIndex: -1,
                    width: '1122px', // Standard A4 width @ 96dpi to reduce whitespace
                    height: 'auto',
                    minHeight: '100%',
                    padding: '0',
                    background: '#ffffff',
                    fontFamily: "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    direction: 'rtl',
                    textAlign: 'right',
                    color: '#1e293b'
                }}>
                    {/* Dark Header Banner */}
                    <div dir="rtl" lang="ar" style={{ background: '#0f172a', color: 'white', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {printableData.logoBase64 ? (
                                <img src={printableData.logoBase64} alt="Logo" style={{ height: '80px', width: 'auto', background: 'white', padding: '5px', borderRadius: '8px' }} />
                            ) : (
                                <div style={{ height: '80px', width: '80px', background: 'white', borderRadius: '8px' }}></div>
                            )}
                            <div>
                                <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 5px 0', color: '#ffffff', letterSpacing: '0px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>المقاولون العرب الكاميرونيه</h1>
                                <h2 style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#94a3b8' }}>إدارة الموارد البشرية - شئون الاستراحات</h2>
                            </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Report</div>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6' }}>{printableData.month}</div>
                        </div>
                    </div>

                    <div style={{ padding: '40px' }}>
                        {/* Summary Metrics */}
                        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>إجمالي المسكنين</div>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>{printableData.totalResidents}</div>
                                </div>
                                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '50%', color: '#3b82f6' }}>
                                    <Users size={32} />
                                </div>
                            </div>
                            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>عدد الاستراحات</div>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>{printableData.totalBuildings}</div>
                                </div>
                                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '50%', color: '#d97706' }}>
                                    <BuildingIcon size={32} />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                {/* Legend */}
                                <div style={{ fontSize: '12px', lineHeight: '2' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '3px' }}></div>
                                        <span>حضور (Present)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }}></div>
                                        <span>أجازة (Vacation)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Table */}
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', color: '#334155' }}>
                                    <th style={{ padding: '15px 10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', width: '100px', fontWeight: '700', letterSpacing: '0px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>التاريخ</th>

                                    {printableData.buildings.map((b, i) => (
                                        <th key={i} style={{ padding: '15px 10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: '700', letterSpacing: '0px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                                            {b.name}
                                        </th>
                                    ))}

                                    {/* Grand Total Column (Moved to end for RTL Left positioning) */}
                                    <th style={{ padding: '15px 10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#e2e8f0', fontWeight: '700', borderLeft: '2px solid #cbd5e1', borderRight: '2px solid #cbd5e1', letterSpacing: '0px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                                        الإجمالي اليومي
                                        <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.8 }}>(حضور | أجازة)</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {printableData.days.map((day, dayIdx) => (
                                    <tr key={dayIdx} style={{ background: dayIdx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                        {/* Date */}
                                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                                            {String(day).padStart(2, '0')}
                                        </td>

                                        {/* Building Cells */}
                                        {printableData.buildings.map((b, bIdx) => {
                                            const stat = b.stats[dayIdx];
                                            const isPresent = stat.present > 0;
                                            const isVacation = stat.vacation > 0;

                                            return (
                                                <td key={bIdx} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                        {isPresent && (
                                                            <div style={{
                                                                width: '24px', height: '24px',
                                                                borderRadius: '4px', background: '#dcfce7', color: '#15803d',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: '700'
                                                            }}>
                                                                {stat.present}
                                                            </div>
                                                        )}
                                                        {isVacation && (
                                                            <div style={{
                                                                width: '24px', height: '24px',
                                                                borderRadius: '4px', background: '#fee2e2', color: '#b91c1c',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: '700'
                                                            }}>
                                                                {stat.vacation}
                                                            </div>
                                                        )}
                                                        {!isPresent && !isVacation && <span style={{ color: '#e2e8f0' }}>-</span>}
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {/* Grand Total Cell (Moved to end for RTL Left positioning) */}
                                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', background: dayIdx % 2 === 0 ? '#f1f5f9' : '#e2e8f0', borderBottom: '1px solid #cbd5e1', borderLeft: '2px solid #cbd5e1', borderRight: '2px solid #cbd5e1' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                                <span style={{ color: '#166534' }}>{printableData.dailyGrandTotals[dayIdx].totalP}</span>
                                                <span style={{ color: '#dc2626' }}>{printableData.dailyGrandTotals[dayIdx].totalV}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <div>تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة الموارد البشرية</div>
                            <div>{new Date().toLocaleString('en-GB')}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Report for PDF Generation */}
            {printableData && (
                <div id="residences-report-print" style={{
                    position: 'fixed',
                    top: 0,
                    left: '-10000px', // Hide off-screen
                    zIndex: 1000,
                    width: 'fit-content', // Let it take natural width based on content
                    background: 'white',
                    padding: '20px',
                    direction: 'rtl',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <img src={printableData.logoBase64} alt="Logo" style={{ height: '60px' }} />
                            <div>
                                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>المقاولون العرب (الكاميرون)</h2>
                                <p style={{ margin: 0, color: '#334155' }}>Arab Contractors Cameroon</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>تقرير الاستراحات الشهري</h1>
                            <p style={{ margin: 0, color: '#64748b' }}>Month: {printableData.month}</p>
                        </div>
                    </div>

                    {/* Report Table */}
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ background: '#1e293b', color: 'white' }}>
                                <th style={{ padding: '8px', border: '1px solid #cbd5e1', width: '60px' }}>Day</th>
                                {printableData.buildings.map((b, i) => (
                                    <th key={i} style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{b.name}</th>
                                ))}
                                <th style={{ padding: '8px', border: '1px solid #cbd5e1', background: '#334155' }}>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            {printableData.days.map((day, dIdx) => (
                                <tr key={dIdx} style={{ background: dIdx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                    <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold' }}>{day}</td>
                                    {printableData.buildings.map((b, bIdx) => {
                                        const stat = b.stats[day - 1]; // day is 1-based
                                        const p = stat?.present || 0;
                                        const v = stat?.vacation || 0;
                                        return (
                                            <td key={bIdx} style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                {p > 0 && <span style={{ color: '#166534', fontWeight: 'bold' }}>P: {p}</span>}
                                                {p > 0 && v > 0 && <span style={{ margin: '0 4px', color: '#cbd5e1' }}>|</span>}
                                                {v > 0 && <span style={{ color: '#dc2626' }}>V: {v}</span>}
                                                {p === 0 && v === 0 && <span style={{ color: '#94a3b8' }}>-</span>}
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'center', background: '#f1f5f9', fontWeight: 'bold' }}>
                                        <span style={{ color: '#166534' }}>{printableData.dailyGrandTotals[day - 1].totalP}</span>
                                        <span style={{ margin: '0 5px' }}>/</span>
                                        <span style={{ color: '#dc2626' }}>{printableData.dailyGrandTotals[day - 1].totalV}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer */}
                    <div style={{ marginTop: '20px', fontSize: '10px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                        تم استخراج هذا التقرير من نظام إدارة الموارد البشرية | {new Date().toLocaleDateString('ar-EG')}
                    </div>
                </div>
            )}

            <style>{`
                .page-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .page-header {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .controls-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    align-items: center;
                }
                .date-picker-wrapper {
                    background: white;
                    padding: 0.5rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                }
                .date-picker-wrapper input {
                    border: none;
                    outline: none;
                    font-family: inherit;
                    color: #334155;
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
                    text-decoration: none;
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
