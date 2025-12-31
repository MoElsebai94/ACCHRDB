import React, { useState } from 'react';
import { X, Printer, Calendar, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../assets/logo.png';

export default function VacationReportModal({ isOpen, onClose, employees }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handlePrint = async () => {
        const element = document.getElementById('vacation-report-template');
        if (!element) return;

        setIsGenerating(true);
        element.style.display = 'block';

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Vacation_Movement_Report_${startDate}_to_${endDate}.pdf`);
            onClose();
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('حدث خطأ أثناء إنشاء التقرير');
        } finally {
            element.style.display = 'none';
            setIsGenerating(false);
        }
    };

    // --- Logic & Calculations ---
    const today = new Date().toISOString().split('T')[0];

    // Filter Logic
    const leavingEmployees = employees.filter(emp => {
        if (!emp.isActive || !emp.vacationStartDate) return false;
        return emp.vacationStartDate >= startDate && emp.vacationStartDate <= endDate;
    }).sort((a, b) => new Date(a.vacationStartDate) - new Date(b.vacationStartDate));

    const returningEmployees = employees.filter(emp => {
        // Can be active or inactive (usually active but marked as away), we just care about the date
        if (!emp.vacationReturnDate) return false;
        return emp.vacationReturnDate >= startDate && emp.vacationReturnDate <= endDate;
    }).sort((a, b) => new Date(a.vacationReturnDate) - new Date(b.vacationReturnDate));

    // Headcount Snapshot (Current Status Today)
    const totalActiveEmployees = employees.filter(e => e.isActive).length;

    // Currently Away (Today): Has return date AND (start date is null OR start date <= today)
    const currentlyAwayCount = employees.filter(e =>
        e.isActive &&
        e.vacationReturnDate &&
        (!e.vacationStartDate || today >= e.vacationStartDate)
    ).length;

    const currentOnSite = totalActiveEmployees - currentlyAwayCount;

    // Projection for the Selected Period
    // This is a simplified projection: Current OnSite - Leaving + Returning
    // Note: This assumes "Leaving" are currently OnSite and "Returning" are currently Away.
    const projectedOnSite = currentOnSite - leavingEmployees.length + returningEmployees.length;

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
            <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2rem', position: 'relative', background: 'white', borderRadius: '12px' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: '#e0f2fe', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                        <FileText size={32} color="#0284c7" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>تقرير تحركات الأجازات</h2>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>حدد الفترة لاستخراج تقرير المغادرين والعائدين</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>من تاريخ</label>
                        <input
                            type="date"
                            className="input-field"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>إلى تاريخ</label>
                        <input
                            type="date"
                            className="input-field"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            min={startDate}
                        />
                    </div>
                </div>

                <button
                    onClick={handlePrint}
                    disabled={!startDate || !endDate || isGenerating}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem' }}
                >
                    {isGenerating ? 'جاري التحضير...' : 'استخراج التقرير (PDF)'}
                    <Printer size={18} style={{ marginRight: '8px' }} />
                </button>

                {/* --- PDF TEMPLATE (Hidden) --- */}
                <div id="vacation-report-template" dir="rtl" style={{
                    display: 'none',
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '10mm',
                    background: 'white',
                    color: '#0f172a',
                    fontFamily: 'Cairo, sans-serif', // Ensure font supports Arabic if configured, else fallback
                    position: 'absolute',
                    top: 0,
                    right: '-9999px'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0284c7', paddingBottom: '5mm', marginBottom: '10mm' }}>
                        <div style={{ textAlign: 'right' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>تقرير تحركات الموظفين</h1>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: '5px 0 0 0' }}>الفترة من: {startDate} إلى: {endDate}</p>
                        </div>
                        <img src={logo} alt="Logo" style={{ height: '60px' }} />
                    </div>

                    {/* Dashboard Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5mm', marginBottom: '10mm' }}>
                        <div style={{ background: '#f8fafc', padding: '5mm', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2mm' }}>القوة الحالية (بالموقع)</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{currentOnSite}</div>
                        </div>
                        <div style={{ background: '#fff7ed', padding: '5mm', borderRadius: '8px', border: '1px solid #ffedd5', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#c2410c', marginBottom: '2mm' }}>مغادرون (أجازة)</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2410c' }}>{leavingEmployees.length}</div>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '5mm', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '2mm' }}>عائدون (من أجازة)</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>{returningEmployees.length}</div>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '5mm', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#1d4ed8', marginBottom: '2mm' }}>القوة المتوقعة</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>{projectedOnSite}</div>
                        </div>
                    </div>

                    {/* Departures Section */}
                    <div style={{ marginBottom: '10mm' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '5mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm' }}>
                            <div style={{ background: '#fff7ed', padding: '2mm', borderRadius: '4px' }}>
                                <ArrowLeft size={16} color="#c2410c" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#c2410c' }}>المغادرون للأجازة (Departures)</h3>
                        </div>
                        {leavingEmployees.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: '#fff7ed', color: '#c2410c' }}>
                                        <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #fed7aa', letterSpacing: 'normal' }}>الاسم</th>
                                        <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #fed7aa', letterSpacing: 'normal' }}>الوظيفة</th>
                                        <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #fed7aa', letterSpacing: 'normal' }}>القسم</th>
                                        <th style={{ padding: '3mm', textAlign: 'center', border: '1px solid #fed7aa', letterSpacing: 'normal' }}>خط الطيران</th>
                                        <th style={{ padding: '3mm', textAlign: 'center', border: '1px solid #fed7aa', letterSpacing: 'normal' }}>تاريخ السفر</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leavingEmployees.map((emp, index) => (
                                        <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#fffaf0' }}>
                                            <td style={{ padding: '3mm', border: '1px solid #fed7aa' }}>{emp.firstName} {emp.lastName}</td>
                                            <td style={{ padding: '3mm', border: '1px solid #fed7aa' }}>{emp.position}</td>
                                            <td style={{ padding: '3mm', border: '1px solid #fed7aa' }}>{emp.department}</td>
                                            <td style={{ padding: '3mm', textAlign: 'center', border: '1px solid #fed7aa' }}>{emp.airline || '-'}</td>
                                            <td style={{ padding: '3mm', textAlign: 'center', border: '1px solid #fed7aa', fontWeight: 'bold' }}>{emp.vacationStartDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '5mm', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>لا يوجد مغادرون في هذه الفترة</p>
                        )}
                    </div>

                    {/* Returns Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '5mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm' }}>
                            <div style={{ background: '#f0fdf4', padding: '2mm', borderRadius: '4px' }}>
                                <ArrowRight size={16} color="#15803d" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#15803d' }}>العائدون من الأجازة (Returns)</h3>
                        </div>
                        {returningEmployees.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: '#f0fdf4', color: '#15803d' }}>
                                        <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>الاسم</th>
                                        <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>الوظيفة</th>
                                        <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>القسم</th>
                                        <th style={{ padding: '3mm', textAlign: 'center', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>تاريخ العودة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returningEmployees.map((emp, index) => (
                                        <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f0fdf4' }}>
                                            <td style={{ padding: '3mm', border: '1px solid #bbf7d0' }}>{emp.firstName} {emp.lastName}</td>
                                            <td style={{ padding: '3mm', border: '1px solid #bbf7d0' }}>{emp.position}</td>
                                            <td style={{ padding: '3mm', border: '1px solid #bbf7d0' }}>{emp.department}</td>
                                            <td style={{ padding: '3mm', textAlign: 'center', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>{emp.vacationReturnDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '5mm', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>لا يوجد عائدون في هذه الفترة</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ position: 'absolute', bottom: '10mm', left: '10mm', right: '10mm', borderTop: '1px solid #e2e8f0', paddingTop: '3mm', textAlign: 'center', color: '#94a3b8', fontSize: '10px' }}>
                        تم استخراج هذا التقرير من نظام الموارد البشرية - المقاولون العرب (الكاميرون) بتاريخ {today}
                    </div>
                </div>
            </div>
        </div>
    );
}
