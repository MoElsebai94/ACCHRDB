import React, { useState } from 'react';
import { X, Printer, Calendar, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../assets/logo.png';

export default function VacationReportModal({ isOpen, onClose, employees, departments }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [printPage, setPrintPage] = useState(null);

    if (!isOpen) return null;

    const handlePrint = async () => {
        setIsGenerating(true);
        const ROWS_FIRST_PAGE = 8;
        const ROWS_PER_PAGE = 16;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        let pageAdded = false;

        // Plan Pages
        const pages = [];

        // 1. First Page: Dashboard + First Chunk of Departures (if any)
        // If departures is huge, we start with it. If matching result is small, it fits.

        let depIndex = 0;
        let retIndex = 0;

        // Page 1: Dashboard + start of Departures
        const initialDepChunk = leavingEmployees.slice(0, ROWS_FIRST_PAGE);
        depIndex = initialDepChunk.length;

        pages.push({
            type: 'mixed_start',
            dashboardData: { currentOnSite, leavingCount: leavingEmployees.length, returningCount: returningEmployees.length, projectedOnSite },
            departures: initialDepChunk,
            returns: [], // Don't try to squeeze returns on first page if complicated, keep it simple
            pageNum: 1
        });

        // Remaining Departures
        while (depIndex < leavingEmployees.length) {
            const chunk = leavingEmployees.slice(depIndex, depIndex + ROWS_PER_PAGE);
            pages.push({
                type: 'departures_cont',
                departures: chunk,
                pageNum: pages.length + 1
            });
            depIndex += chunk.length;
        }

        // Returns (Start new page for returns usually cleaner)
        if (returningEmployees.length > 0) {
            // Check if last page has space? For robustness, just start new page or append if last page was empty-ish? 
            // Let's just start new chunks for Returns to be safe.
            while (retIndex < returningEmployees.length) {
                const chunk = returningEmployees.slice(retIndex, retIndex + ROWS_PER_PAGE);
                pages.push({
                    type: 'returns_cont',
                    returns: chunk,
                    pageNum: pages.length + 1
                });
                retIndex += chunk.length;
            }
        }

        const element = document.getElementById('vacation-report-template');
        if (!element) return;

        const originalDisplay = element.style.display;
        // Make visible (off-screen)
        element.style.display = 'block';
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '-10000px';
        element.style.zIndex = '1000';

        try {
            for (const pageConfig of pages) {
                setPrintPage(pageConfig);
                // Wait for render
                await new Promise(resolve => setTimeout(resolve, 200));

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                if (pageAdded) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pageAdded = true;
            }

            pdf.save(`Vacation_Movement_Report_${startDate}_to_${endDate}.pdf`);
            onClose();
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('حدث خطأ أثناء إنشاء التقرير');
        } finally {
            element.style.display = originalDisplay;
            setIsGenerating(false);
            setPrintPage(null);
        }
    };

    // --- Logic & Calculations ---
    const today = new Date().toISOString().split('T')[0];

    // Filter Logic
    const leavingEmployees = employees.filter(emp => {
        if (!emp.isActive) return false;
        const tDate = emp.travelDate || emp.vacationStartDate;
        if (!tDate) return false;
        return tDate >= startDate && tDate <= endDate;
    }).sort((a, b) => {
        const dateA = a.travelDate || a.vacationStartDate;
        const dateB = b.travelDate || b.vacationStartDate;
        return new Date(dateA) - new Date(dateB);
    });

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
        today >= (e.travelDate || e.vacationStartDate)
    ).length;

    const currentOnSite = totalActiveEmployees - currentlyAwayCount;

    // Projection for the Selected Period
    // This is a simplified projection: Current OnSite - Leaving + Returning
    // Note: This assumes "Leaving" are currently OnSite and "Returning" are currently Away.
    const projectedOnSite = currentOnSite - leavingEmployees.length + returningEmployees.length;

    // Helper to get full hierarchy name
    const getFullDeptName = (deptName) => {
        if (!deptName || !departments) return deptName;
        const dept = departments.find(d => d.name === deptName);
        if (dept && dept.parentId) {
            const parent = departments.find(p => p.id === dept.parentId);
            if (parent) return `${parent.name} / ${dept.name}`;
        }
        return deptName;
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
                    fontFamily: 'Cairo, sans-serif',
                    position: 'absolute',
                    top: 0,
                    left: '-10000px', // Hide off-screen
                    zIndex: 1000
                }}>
                    {printPage && (
                        <>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0284c7', paddingBottom: '5mm', marginBottom: '10mm' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>تقرير تحركات الموظفين</h1>
                                    <p style={{ fontSize: '14px', color: '#64748b', margin: '5px 0 0 0' }}>
                                        الفترة من: {startDate} إلى: {endDate} | صفحة {printPage.pageNum}
                                    </p>
                                </div>
                                <img src={logo} alt="Logo" style={{ height: '60px' }} />
                            </div>

                            {/* Dashboard Cards (Only on Mixed Start Page) */}
                            {printPage.type === 'mixed_start' && printPage.dashboardData && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5mm', marginBottom: '10mm' }}>
                                    <div style={{ background: '#f8fafc', padding: '5mm', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2mm' }}>القوة الحالية (بالشركة)</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{printPage.dashboardData.currentOnSite}</div>
                                    </div>
                                    <div style={{ background: '#fff7ed', padding: '5mm', borderRadius: '8px', border: '1px solid #ffedd5', textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#c2410c', marginBottom: '2mm' }}>مغادرون (أجازة)</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2410c' }}>{printPage.dashboardData.leavingCount}</div>
                                    </div>
                                    <div style={{ background: '#f0fdf4', padding: '5mm', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '2mm' }}>عائدون (من أجازة)</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>{printPage.dashboardData.returningCount}</div>
                                    </div>
                                    <div style={{ background: '#eff6ff', padding: '5mm', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#1d4ed8', marginBottom: '2mm' }}>القوة المتوقعة</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>{printPage.dashboardData.projectedOnSite}</div>
                                    </div>
                                </div>
                            )}

                            {/* Departures Section */}
                            {(printPage.departures || []).length > 0 && (
                                <div style={{ marginBottom: '10mm' }}>
                                    {/* Show Section Header only if first chunk of departures */}
                                    {printPage.type === 'mixed_start' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '5mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm' }}>
                                            <div style={{ background: '#fff7ed', padding: '2mm', borderRadius: '4px' }}>
                                                <ArrowLeft size={16} color="#c2410c" />
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#c2410c' }}>المغادرون للأجازة (Departures)</h3>
                                        </div>
                                    )}
                                    {printPage.type === 'departures_cont' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '5mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm' }}>
                                            <div style={{ background: '#fff7ed', padding: '2mm', borderRadius: '4px' }}>
                                                <ArrowLeft size={16} color="#c2410c" />
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#c2410c' }}>تابع: المغادرون للأجازة</h3>
                                        </div>
                                    )}

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
                                            {printPage.departures.map((emp, index) => (
                                                <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#fffaf0' }}>
                                                    <td style={{ padding: '3mm', border: '1px solid #fed7aa' }}>{emp.firstName} {emp.lastName}</td>
                                                    <td style={{ padding: '3mm', border: '1px solid #fed7aa' }}>{emp.position}</td>
                                                    <td style={{ padding: '3mm', border: '1px solid #fed7aa' }}>
                                                        {getFullDeptName(emp.department)}
                                                    </td>
                                                    <td style={{ padding: '3mm', textAlign: 'center', border: '1px solid #fed7aa' }}>{emp.airline || '-'}</td>
                                                    <td style={{ padding: '3mm', textAlign: 'center', border: '1px solid #fed7aa', fontWeight: 'bold' }}>{emp.travelDate || emp.vacationStartDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Empty Departures Message (Only show on first page if truly empty) */}
                            {printPage.type === 'mixed_start' && leavingEmployees.length === 0 && (
                                <div style={{ marginBottom: '10mm' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '5mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#c2410c' }}>المغادرون للأجازة</h3>
                                    </div>
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '5mm', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>لا يوجد مغادرون في هذه الفترة</p>
                                </div>
                            )}

                            {/* Returns Section */}
                            {(printPage.returns || []).length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '5mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm' }}>
                                        <div style={{ background: '#f0fdf4', padding: '2mm', borderRadius: '4px' }}>
                                            <ArrowRight size={16} color="#15803d" />
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#15803d' }}>
                                            {printPage.type === 'returns_cont' ? 'تابع: العائدون من الأجازة' : 'العائدون من الأجازة (Returns)'}
                                        </h3>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ background: '#f0fdf4', color: '#15803d' }}>
                                                <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>الاسم</th>
                                                <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>الوظيفة</th>
                                                <th style={{ padding: '3mm', textAlign: 'right', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>القسم</th>
                                                <th style={{ padding: '3mm', textAlign: 'center', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>خط الطيران</th>
                                                <th style={{ padding: '3mm', textAlign: 'center', border: '1px solid #bbf7d0', letterSpacing: 'normal' }}>تاريخ العودة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {printPage.returns.map((emp, index) => (
                                                <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f0fdf4' }}>
                                                    <td style={{ padding: '3mm', border: '1px solid #bbf7d0' }}>{emp.firstName} {emp.lastName}</td>
                                                    <td style={{ padding: '3mm', border: '1px solid #bbf7d0' }}>{emp.position}</td>
                                                    <td style={{ padding: '3mm', border: '1px solid #bbf7d0' }}>
                                                        {getFullDeptName(emp.department)}
                                                    </td>
                                                    <td style={{ padding: '3mm', textAlign: 'center', border: '1px solid #bbf7d0' }}>{emp.airline || '-'}</td>
                                                    <td style={{ padding: '3mm', textAlign: 'center', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>{emp.vacationReturnDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Empty Returns Message */}
                            {printPage.type === 'mixed_start' && returningEmployees.length === 0 && (
                                <div style={{ marginTop: '10mm' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '5mm', borderBottom: '1px solid #e2e8f0', paddingBottom: '2mm' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#15803d' }}>العائدون من الأجازة</h3>
                                    </div>
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '5mm', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>لا يوجد عائدون في هذه الفترة</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div style={{ position: 'absolute', bottom: '10mm', left: '10mm', right: '10mm', borderTop: '1px solid #e2e8f0', paddingTop: '3mm', textAlign: 'center', color: '#94a3b8', fontSize: '10px' }}>
                                تم استخراج هذا التقرير من نظام الموارد البشرية - المقاولون العرب (الكاميرون) بتاريخ {today}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
