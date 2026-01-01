import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { Save, FileText, Download, Calendar, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageLoading from '../components/PageLoading';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../assets/logo.png';

export default function Salaries() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState(null);
    const [annualYear, setAnnualYear] = useState(new Date().getFullYear().toString());
    const [isExportingAnnual, setIsExportingAnnual] = useState(false);
    const [annualData, setAnnualData] = useState([]);

    useEffect(() => {
        fetchSalaries();
    }, [month]);

    const fetchSalaries = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/salaries/init?month=${month}`);
            const data = await res.json();
            setRecords(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching salaries:', error);
            setIsLoading(false);
        }
    };

    const handleUpdateRecord = (index, field, value) => {
        const newRecords = [...records];
        const record = { ...newRecords[index] };

        if (field === 'attendedDays') {
            record.attendedDays = parseInt(value) || 0;
            if (record.attendedDays > 31) record.attendedDays = 31;
        } else if (field === 'deductions') {
            record.deductions = parseFloat(value) || 0;
        } else if (field === 'baseSalary') {
            record.baseSalary = parseFloat(value) || 0;
        } else if (field === 'notes') {
            record.notes = value;
        }

        // Re-calculate Net: (Base Salary / 30 * Attended Days) - Deductions
        const dailyRate = record.baseSalary / 30;
        record.netSalary = Math.round((dailyRate * record.attendedDays) - record.deductions);

        newRecords[index] = record;
        setRecords(newRecords);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/salaries/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, records })
            });
            if (res.ok) {
                setAlert({ type: 'success', message: 'تم حفظ بيانات المرتبات بنجاح' });
                setTimeout(() => setAlert(null), 3000);
            } else {
                setAlert({ type: 'error', message: 'حدث خطأ أثناء الحفظ' });
            }
        } catch (error) {
            console.error('Error saving salaries:', error);
            setAlert({ type: 'error', message: 'حدث خطأ في الاتصال بالخادم' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById('salaries-report');
        if (!element) return;

        const originalDisplay = element.style.display;
        element.style.display = 'block';

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Salaries_Report_${month}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            element.style.display = originalDisplay;
        }
    };

    const handleExportAnnualPDF = async () => {
        setIsExportingAnnual(true);
        try {
            const res = await fetch(`${API_URL}/salaries/year?year=${annualYear}`);
            const data = await res.json();

            if (!data || data.length === 0) {
                setAlert({ type: 'error', message: 'لا توجد بيانات مرتبات لهذه السنة' });
                setTimeout(() => setAlert(null), 3000);
                setIsExportingAnnual(false);
                return;
            }

            setAnnualData(data);

            // Wait for state to update and hidden template to be ready
            await new Promise(resolve => setTimeout(resolve, 500));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const months = Array.from({ length: 12 }, (_, i) => {
                const m = (i + 1).toString().padStart(2, '0');
                return `${annualYear}-${m}`;
            });

            let pageAdded = false;

            for (const m of months) {
                const element = document.getElementById(`annual-report-${m}`);
                if (!element || element.getAttribute('data-has-records') === 'false') continue;

                // Make visible temporarily for capture
                element.style.display = 'block';

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });

                element.style.display = 'none';

                const imgData = canvas.toDataURL('image/png');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                if (pageAdded) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pageAdded = true;
            }

            if (pageAdded) {
                pdf.save(`Annual_Salaries_Report_${annualYear}.pdf`);
            } else {
                setAlert({ type: 'error', message: 'لا توجد سجلات مكتملة للتصدير' });
                setTimeout(() => setAlert(null), 3000);
            }
        } catch (error) {
            console.error('Error exporting annual PDF:', error);
            setAlert({ type: 'error', message: 'حدث خطأ أثناء تصدير التقرير السنوي' });
            setTimeout(() => setAlert(null), 3000);
        } finally {
            setIsExportingAnnual(false);
        }
    };

    const filteredRecords = records.filter(r => {
        const emp = r.Employee;
        if (!emp) return false;
        const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase()) ||
            emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (isLoading) return <PageLoading />;

    return (
        <div className="page-container" dir="rtl">
            <div className="page-header">
                <div className="header-info">
                    <h1>إدارة المرتبات</h1>
                    <p>تسجيل وإدارة المرتبات الشهرية للموظفين</p>
                </div>
                <div className="header-actions">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <select
                            className="table-input"
                            style={{ width: '100px', padding: '0.25rem' }}
                            value={annualYear}
                            onChange={(e) => setAnnualYear(e.target.value)}
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
                        </select>
                        <button className="btn btn-secondary" onClick={handleExportAnnualPDF} disabled={isExportingAnnual}>
                            <Download size={18} />
                            {isExportingAnnual ? 'جاري التحضير...' : 'تقرير سنوي'}
                        </button>
                    </div>
                    <button className="btn btn-secondary" onClick={handleExportPDF}>
                        <FileText size={18} />
                        تصدير PDF
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        <Save size={18} />
                        {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                </div>
            </div>

            {alert && (
                <div className={`alert alert-${alert.type}`} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {alert.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {alert.message}
                </div>
            )}

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} />
                            الشهر المستهدف
                        </label>
                        <input
                            type="month"
                            className="input-field"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Search size={16} />
                            بحث عن موظف
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="ابحث بالاسم أو الوظيفة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '25%' }}>الموظف</th>
                            <th style={{ width: '20%' }}>الوظيفة</th>
                            <th style={{ width: '15%' }}>المرتب الأساسي</th>
                            <th style={{ width: '15%' }}>عدد الأيام</th>
                            <th style={{ width: '10%' }}>الاستقطاعات</th>
                            <th style={{ width: '15%' }}>الصافي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.length > 0 ? (
                            filteredRecords.map((record, index) => {
                                const realIndex = records.findIndex(r => r.employeeId === record.employeeId);
                                return (
                                    <tr key={record.employeeId}>
                                        <td>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                                {record.Employee?.firstName} {record.Employee?.lastName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {record.Employee?.department || 'بدون قسم'}
                                            </div>
                                        </td>
                                        <td>{record.Employee.position || '-'}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="table-input"
                                                value={record.baseSalary}
                                                min="0"
                                                onChange={(e) => handleUpdateRecord(realIndex, 'baseSalary', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="table-input"
                                                value={record.attendedDays}
                                                min="0"
                                                max="31"
                                                onChange={(e) => handleUpdateRecord(realIndex, 'attendedDays', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="table-input"
                                                value={record.deductions}
                                                min="0"
                                                onChange={(e) => handleUpdateRecord(realIndex, 'deductions', e.target.value)}
                                            />
                                        </td>
                                        <td style={{ fontWeight: '700', color: 'var(--secondary-color)', fontSize: '1.05rem' }}>
                                            {record.netSalary?.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    لا توجد سجلات مطابقة للبحث
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Hidden Report for PDF Generation - Redesigned Modern Look */}
            <div id="salaries-report" style={{
                display: 'none',
                padding: '12mm',
                backgroundColor: 'white',
                minHeight: '297mm',
                width: '210mm',
                fontFamily: "'Cairo', sans-serif",
                direction: 'rtl'
            }}>
                {/* Modern Branded Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10mm',
                    background: '#0f172a',
                    padding: '8mm 12mm',
                    borderRadius: '4mm',
                    color: 'white'
                }}>
                    <div style={{ textAlign: 'right', flex: 1, paddingLeft: '10mm' }}>
                        <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '800', color: '#fbbf24', direction: 'rtl' }}>تقرير المرتبات الشهري</h1>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '18px', direction: 'rtl' }}>
                            فترة شهر: {month}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
                        <div style={{ textAlign: 'left' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'white' }}>Arab Contractors</h2>
                            <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontSize: '18px', fontWeight: 'bold' }}>Cameroon</p>
                        </div>
                        <img src={logo} alt="Logo" style={{ height: '18mm', filter: 'brightness(0) invert(1)' }} />
                    </div>
                </div>

                {/* Summary Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5mm', marginBottom: '8mm', direction: 'rtl' }}>
                    <div style={{ background: '#f8fafc', padding: '5mm', borderRadius: '3mm', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '2mm' }}>إجمالي القوة</span>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{records.length}</span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '5mm', borderRadius: '3mm', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '2mm' }}>إجمالي المستحق</span>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{records.reduce((acc, r) => acc + (r.baseSalary || 0), 0).toLocaleString()}</span>
                    </div>
                    <div style={{ background: '#eff6ff', padding: '5mm', borderRadius: '3mm', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '12px', color: '#1e40af', marginBottom: '2mm' }}>إجمالي الصافي</span>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af' }}>{records.reduce((acc, r) => acc + (r.netSalary || 0), 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Main Data Table */}
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', marginTop: '2mm', border: '1px solid #e2e8f0', borderRadius: '3mm', overflow: 'hidden', direction: 'rtl' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e293b' }}>
                            <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'right', borderBottom: '2px solid #0f172a', fontWeight: '600', fontFamily: "'Cairo', sans-serif" }}>
                                <span style={{ whiteSpace: 'nowrap' }}>اسم الموظف</span>
                            </td>
                            <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'right', borderBottom: '2px solid #0f172a', fontWeight: '600', fontFamily: "'Cairo', sans-serif" }}>
                                <span style={{ whiteSpace: 'nowrap' }}>الوظيفة</span>
                            </td>
                            <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'center', borderBottom: '2px solid #0f172a', fontWeight: '600', fontFamily: "'Cairo', sans-serif" }}>
                                <span style={{ whiteSpace: 'nowrap' }}>الأيام</span>
                            </td>
                            <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'center', borderBottom: '2px solid #0f172a', fontWeight: '600', fontFamily: "'Cairo', sans-serif" }}>
                                <span style={{ whiteSpace: 'nowrap' }}>الأساسي</span>
                            </td>
                            <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'center', borderBottom: '2px solid #0f172a', fontWeight: '600', fontFamily: "'Cairo', sans-serif" }}>
                                <span style={{ whiteSpace: 'nowrap' }}>الاستقطاع</span>
                            </td>
                            <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'center', borderBottom: '2px solid #0f172a', fontWeight: '600', fontFamily: "'Cairo', sans-serif" }}>
                                <span style={{ whiteSpace: 'nowrap' }}>الصافي</span>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record, idx) => (
                            <tr key={record.employeeId} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                <td style={{ padding: '4mm', fontSize: '12px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', fontWeight: '600' }}>{record.Employee?.firstName} {record.Employee?.lastName}</td>
                                <td style={{ padding: '4mm', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{record.Employee?.position}</td>
                                <td style={{ padding: '4mm', fontSize: '12px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{record.attendedDays}</td>
                                <td style={{ padding: '4mm', fontSize: '12px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{record.baseSalary?.toLocaleString()}</td>
                                <td style={{ padding: '4mm', fontSize: '12px', color: '#ef4444', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{record.deductions > 0 ? record.deductions.toLocaleString() : '-'}</td>
                                <td style={{ padding: '4mm', fontSize: '12.5px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: '700', backgroundColor: idx % 2 === 0 ? '#f0f9ff' : '#e0f2fe' }}>{record.netSalary?.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Modern Footer (No Signatures) */}
                <div style={{ marginTop: '15mm', padding: '8mm', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center' }}>
                        تم استخراج هذا التقرير آلياً من نظام إدارة الموارد البشرية | {new Date().toLocaleString('ar-EG')}
                    </div>
                </div>
            </div>

            <style>{`
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    gap: 2rem;
                }
                .header-info h1 {
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--primary-color);
                }
                .header-info p {
                    margin: 0.5rem 0 0 0;
                    font-size: 1.1rem;
                    color: var(--text-secondary);
                }
                .header-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .table-input {
                    width: 90px;
                    padding: 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.95rem;
                    text-align: center;
                    transition: all 0.2s;
                }
                .table-input::-webkit-outer-spin-button,
                .table-input::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                .table-input[type=number] {
                  -moz-appearance: textfield;
                }
                .table-input:focus {
                    outline: none;
                    border-color: var(--secondary-color);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                .alert-success {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    color: #166534;
                    padding: 1rem;
                    border-radius: 8px;
                }
                .alert-error {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                    padding: 1rem;
                    border-radius: 8px;
                }
            `}</style>

            {/* Hidden Templates for Annual Report Months */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
                {Array.from({ length: 12 }, (_, i) => {
                    const monthStr = (i + 1).toString().padStart(2, '0');
                    const fullMonth = `${annualYear}-${monthStr}`;
                    const monthRecords = annualData.filter(r => r.month === fullMonth);
                    const hasRecords = monthRecords.length > 0;

                    return (
                        <div
                            key={fullMonth}
                            id={`annual-report-${fullMonth}`}
                            data-has-records={hasRecords}
                            style={{
                                padding: '12mm',
                                backgroundColor: 'white',
                                width: '210mm',
                                minHeight: '297mm',
                                direction: 'rtl',
                                fontFamily: "'Cairo', sans-serif"
                            }}
                        >
                            {hasRecords && (
                                <>
                                    {/* Monthly Header */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '10mm',
                                        background: '#0f172a',
                                        padding: '8mm 12mm',
                                        borderRadius: '4mm',
                                        color: 'white'
                                    }}>
                                        <div style={{ textAlign: 'right', flex: 1, paddingLeft: '10mm' }}>
                                            <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '800', color: '#fbbf24' }}>
                                                تقرير مرتبات شهر {monthStr} / {annualYear}
                                            </h1>
                                            <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '18px' }}>
                                                التقرير السنوي الشامل - {annualYear}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'white' }}>Arab Contractors</h2>
                                                <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontSize: '18px', fontWeight: 'bold' }}>Cameroon</p>
                                            </div>
                                            <img src={logo} alt="Logo" style={{ height: '18mm', filter: 'brightness(0) invert(1)' }} />
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', marginTop: '2mm', border: '1px solid #e2e8f0', borderRadius: '3mm', overflow: 'hidden', direction: 'rtl' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#1e293b' }}>
                                                <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>اسم الموظف</td>
                                                <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>الوظيفة</td>
                                                <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>الأيام</td>
                                                <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>الأساسي</td>
                                                <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>الاستقطاع</td>
                                                <td style={{ padding: '4mm', color: '#fbbf24', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>الصافي</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthRecords.map((r, idx) => (
                                                <tr key={r.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                    <td style={{ padding: '4mm', fontSize: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: '600' }}>{r.Employee?.firstName} {r.Employee?.lastName}</td>
                                                    <td style={{ padding: '4mm', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{r.Employee?.position}</td>
                                                    <td style={{ padding: '4mm', fontSize: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{r.attendedDays}</td>
                                                    <td style={{ padding: '4mm', fontSize: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{r.baseSalary?.toLocaleString()}</td>
                                                    <td style={{ padding: '4mm', fontSize: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#ef4444' }}>{r.deductions > 0 ? r.deductions.toLocaleString() : '-'}</td>
                                                    <td style={{ padding: '4mm', fontSize: '12.5px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: '700', backgroundColor: idx % 2 === 0 ? '#f0f9ff' : '#e0f2fe' }}>{r.netSalary?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Monthly Total */}
                                    <div style={{ marginTop: '5mm', display: 'flex', justifyContent: 'flex-start', padding: '4mm', background: '#f8fafc', borderRadius: '2mm', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                                            إجمالي صافي الشهر: {monthRecords.reduce((acc, cr) => acc + (cr.netSalary || 0), 0).toLocaleString()}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
