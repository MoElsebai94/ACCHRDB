import React, { useState } from 'react';
import { Calendar, X, Printer, Save, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../assets/logo.png';

export default function VacationModal({ isOpen, onClose, onConfirm, employee }) {
    const [returnDate, setReturnDate] = useState('');
    const [travelDate, setTravelDate] = useState('');
    const [airline, setAirline] = useState('الخطوط الجوية المصرية');
    const [customAirline, setCustomAirline] = useState('');
    const [isAirlineOpen, setIsAirlineOpen] = useState(false);
    const [financialManager, setFinancialManager] = useState('سيد أدم');
    const [isGenerating, setIsGenerating] = useState(false);

    const airlineOptions = [
        "الخطوط الجوية المصرية",
        "الخطوط الجوية الإثيوبية",
        "الخطوط الجوية التركية",
        "أخرى"
    ];

    if (!isOpen) return null;

    const handlePrint = async () => {
        const element = document.getElementById('vacation-letter');
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
            pdf.save(`Vacation_Letter_${employee?.firstName}_${employee?.lastName}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('حدث خطأ أثناء إنشاء ملف PDF');
        } finally {
            element.style.display = 'none';
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(returnDate);
        setReturnDate(''); // Reset after submit
    };

    const getDaysDiff = (start, end) => {
        if (!start || !end) return 0;
        const date1 = new Date(start);
        const date2 = new Date(end);
        const diffTime = Math.abs(date2 - date1);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    };

    const calculateVacations = () => {
        if (!travelDate || !returnDate) return { regular: 0, deduction: 0, total: 0, regularEndDateStr: '', deductionStartDateStr: '', deductionEndDateStr: '', vacationStartDateStr: '' };

        // Vacation starts the day AFTER travel
        const vStart = new Date(travelDate);
        vStart.setDate(vStart.getDate() + 1);
        const vacationStartDateStr = vStart.toISOString().split('T')[0];

        const totalDuration = Math.ceil((new Date(returnDate) - vStart) / (1000 * 60 * 60 * 24));

        // Determine the start of the working period
        const lastReturn = employee?.vacationReturnDate || employee?.arrivalDate;

        // Fallback if no valid start date is found: Treat all as regular
        if (!lastReturn) {
            const rEnd = new Date(returnDate);
            rEnd.setDate(rEnd.getDate() - 1);
            return {
                regular: totalDuration,
                deduction: 0,
                total: totalDuration,
                regularEndDateStr: rEnd.toISOString().split('T')[0],
                deductionStartDateStr: '',
                deductionEndDateStr: '',
                vacationStartDateStr
            };
        }

        const workingDays = getDaysDiff(lastReturn, travelDate);

        const rawAccrued = workingDays / 8;
        const fraction = rawAccrued % 1;
        let accruedDays = Math.floor(rawAccrued);

        if (fraction > 0.5) {
            accruedDays += 1;
        }

        const regular = Math.min(totalDuration, accruedDays);
        const deduction = Math.max(0, totalDuration - regular);

        // Calculate split dates
        let regularEndDateStr = '';
        let deductionStartDateStr = '';
        let deductionEndDateStr = '';

        // End of total vacation is Return Date - 1
        const globalEndDate = new Date(returnDate);
        globalEndDate.setDate(globalEndDate.getDate() - 1);
        const globalEndDateStr = globalEndDate.toISOString().split('T')[0];

        if (deduction > 0) {
            // Split scenario
            const rEnd = new Date(vStart);
            rEnd.setDate(rEnd.getDate() + regular - 1); // Regular End = Start + Duration - 1
            regularEndDateStr = rEnd.toISOString().split('T')[0];

            const dStart = new Date(vStart);
            dStart.setDate(dStart.getDate() + regular); // Deduction Start = Start + Regular
            deductionStartDateStr = dStart.toISOString().split('T')[0];

            deductionEndDateStr = globalEndDateStr;
        } else {
            // All regular
            regularEndDateStr = globalEndDateStr;
        }

        return { regular, deduction, total: totalDuration, regularEndDateStr, deductionStartDateStr, deductionEndDateStr, vacationStartDateStr };
    };

    const { regular, deduction, total, regularEndDateStr, deductionStartDateStr, deductionEndDateStr, vacationStartDateStr } = calculateVacations();

    const formatDate = (dateStr) => dateStr ? dateStr.replace(/-/g, '/') : '...';

    const displayAirline = airline === 'أخرى' ? customAirline : airline;

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
            zIndex: 1000,
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        background: '#e0f2fe',
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto'
                    }}>
                        <Calendar size={28} color="#0284c7" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>تسجيل أجازة</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        الرجاء تحديد موعد عودة الموظف من الأجازة
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label className="input-label">تاريخ السفر (البداية)</label>
                        <input
                            type="date"
                            className="input-field"
                            value={travelDate}
                            onChange={(e) => setTravelDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label className="input-label">تاريخ العودة (النهاية)</label>
                        <input
                            type="date"
                            className="input-field"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            required
                            min={travelDate || new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem', position: 'relative' }}>
                        <label className="input-label">خط الطيران</label>

                        {/* Custom Dropdown Trigger */}
                        <div
                            className="input-field"
                            onClick={() => setIsAirlineOpen(!isAirlineOpen)}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>{airline}</span>
                            <ChevronDown size={16} color="#64748b" />
                        </div>

                        {/* Custom Dropdown Menu */}
                        {isAirlineOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                zIndex: 50,
                                marginTop: '4px',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                {airlineOptions.map((option) => (
                                    <div
                                        key={option}
                                        onClick={() => {
                                            setAirline(option);
                                            setIsAirlineOpen(false);
                                        }}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            cursor: 'pointer',
                                            textAlign: 'right',
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.2s',
                                            backgroundColor: airline === option ? '#f0f9ff' : 'white',
                                            color: airline === option ? '#0284c7' : 'inherit'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = airline === option ? '#f0f9ff' : 'white'}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}

                        {airline === 'أخرى' && (
                            <input
                                type="text"
                                className="input-field"
                                placeholder="أدخل اسم خط الطيران"
                                value={customAirline}
                                onChange={(e) => setCustomAirline(e.target.value)}
                                style={{ marginTop: '0.5rem' }}
                            />
                        )}
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label className="input-label">اسم المدير المالي والإداري</label>
                        <input
                            type="text"
                            className="input-field"
                            value={financialManager}
                            onChange={(e) => setFinancialManager(e.target.value)}
                            placeholder="اسم المدير المالي"
                            style={{ textAlign: 'right' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexDirection: 'column' }}>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="btn"
                            disabled={!travelDate || !returnDate || isGenerating}
                            style={{ background: '#8b5cf6', color: 'white', justifyContent: 'center', gap: '8px' }}
                        >
                            <Printer size={18} />
                            {isGenerating ? 'جاري الطباعة...' : 'طباعة خطاب الأجازة'}
                        </button>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
                            >
                                <Save size={18} />
                                حفظ الأجازة
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </form>

                {/* Hidden PDF Template */}
                <div id="vacation-letter" lang="ar" dir="rtl" style={{
                    display: 'none',
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '8mm 20mm',
                    background: 'white',
                    color: 'black',
                    fontFamily: 'Arial, sans-serif',
                    position: 'absolute',
                    top: 0,
                    right: '-9999px'
                }}>
                    {/* Header */}
                    <div style={{ borderBottom: '2px solid #000', paddingBottom: '2mm', marginBottom: '5mm', paddingTop: '2mm', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2mm' }}>
                            <img src={logo} alt="Logo" style={{ width: '60px', height: 'auto', position: 'absolute', left: 0, top: '-0.8mm' }} />
                            <div style={{ textAlign: 'center' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0', textTransform: 'uppercase' }}>ARAB CONTRACTORS CAMEROON LTD</h2>
                                <p style={{ fontSize: '10px', margin: 0 }}>Avenue Jean Paul II, P.O. BOX 12995 Yaoundé Tel +237 22 01 33 06 Fax +237 22 20 25 11</p>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: '1px', background: '#000', marginTop: '2mm' }}></div>
                    </div>

                    {/* Date */}
                    <div style={{ textAlign: 'left', marginBottom: '10mm', fontSize: '14px', fontWeight: 'bold', textDecoration: 'underline', letterSpacing: 'normal' }}>
                        ياوندي في {formatDate(new Date().toLocaleDateString('en-GB'))}
                    </div>

                    {/* Recipient */}
                    <div style={{ marginBottom: '10mm' }}>
                        <h3 style={{ fontSize: '18px', margin: '0 0 5px 0', textAlign: 'right', letterSpacing: 'normal' }}>السيد الأستاذ/ مدير إدارة الشئون الإدارية</h3>
                        <h4 style={{ fontSize: '16px', margin: 0, fontWeight: 'bold', textAlign: 'center', letterSpacing: 'normal' }}>للفروع والمشروعات الخارجية</h4>
                    </div>

                    {/* Greeting */}
                    <div style={{ textAlign: 'right', marginBottom: '5mm', marginTop: '5mm', paddingRight: '15mm' }}>
                        <p style={{ fontSize: '16px', margin: 0, fontWeight: 'bold', letterSpacing: 'normal' }}>تحية طيبة وبعد :-</p>
                    </div>

                    {/* Body */}
                    <div style={{ marginBottom: '8mm', fontSize: '16px', lineHeight: '1.8' }}>
                        <p style={{ margin: '0 0 10px 0' }}>
                            قادم لسيادتكم السيد/ <strong>{employee?.firstName} {employee?.lastName}</strong> - بمهنة / {employee?.jobRole || employee?.position} - رقم ثابت/ {employee?.fixedNumber || '.....'}
                        </p>
                        <p style={{ margin: 0 }}>
                            وذلك في أجازة لمدة ( <strong>{total || '...'}</strong> ) يوم وذلك حسب البيان التالي :-
                        </p>
                        <p style={{ margin: '10px 0 0 0', textDecoration: 'underline', fontWeight: 'bold' }}>أولاً :- بيان الأجازات</p>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10mm', direction: 'rtl' }}>
                        <thead>
                            <tr style={{ border: '1px solid #000' }}>
                                <th style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#eff6ff', color: '#000', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>نوع الأجازة</th>
                                <th style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#eff6ff', color: '#000', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>المدة</th>
                                <th style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#eff6ff', color: '#000', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>من</th>
                                <th style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#eff6ff', color: '#000', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>الى</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ border: '1px solid #000' }}>
                                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>أجازة إعتيادية</td>
                                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>
                                    {regular > 0 ? regular : '...'}
                                </td>
                                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>{formatDate(vacationStartDateStr)}</td>
                                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>{formatDate(regularEndDateStr)}</td>
                            </tr>
                            {deduction > 0 && (
                                <tr style={{ border: '1px solid #000' }}>
                                    <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>أجازة بالخصم</td>
                                    <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>{deduction}</td>
                                    <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>{formatDate(deductionStartDateStr)}</td>
                                    <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>{formatDate(deductionEndDateStr)}</td>
                                </tr>
                            )}
                            <tr style={{ border: '1px solid #000' }}>
                                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', fontWeight: 'bold', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>تاريخ العودة</td>
                                <td colSpan={3} style={{ border: '1px solid #000', padding: '10px', fontSize: '16px', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>{formatDate(returnDate)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Footer Info */}
                    <div style={{ marginBottom: '5mm', fontSize: '16px', letterSpacing: 'normal' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', textDecoration: 'underline', textAlign: 'right' }}>ثانياً: تذكرة السفر</p>
                        <p style={{ margin: '0 0 10px 0', textAlign: 'right', paddingRight: '10mm' }}>لديه تذكرة سفر على {displayAirline} .</p>

                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', textDecoration: 'underline', textAlign: 'right' }}>ثالثاً : جواز السفر</p>
                        <p style={{ margin: 0, textAlign: 'right', paddingRight: '20mm' }}>علما بأن المذكور لديه تأشيرة سفر للكاميرون سارية علي الباسبور</p>
                    </div>

                    {/* Signature */}
                    <div style={{ textAlign: 'center', marginTop: '0', marginBottom: '10mm', letterSpacing: 'normal' }}>
                        <p style={{ margin: '0 0 5px 0', paddingRight: '30mm', textAlign: 'right' }}>والسلام عليكم ورحمة الله وبركاته</p>
                    </div>

                    <table style={{ width: '100%', direction: 'rtl', border: 'none', marginTop: '0', marginBottom: '0', fontFamily: 'Arial, sans-serif' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '50%', verticalAlign: 'top', border: 'none', textAlign: 'left', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>
                                    <div style={{ paddingTop: '60px', position: 'relative', left: '-30mm' }}>
                                        <p style={{ fontWeight: 'bold', margin: 0, letterSpacing: 'normal' }}>محاسب /</p>
                                    </div>
                                </td>
                                <td style={{ width: '50%', verticalAlign: 'top', border: 'none', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>
                                    <p style={{ fontWeight: 'bold', margin: '0', letterSpacing: 'normal' }}>المدير المالي والاداري</p>
                                    <p style={{ fontWeight: 'bold', margin: 0, letterSpacing: 'normal' }}>لشركة المقاولون العرب الكاميرونية</p>
                                    <br /><br />
                                    <p style={{ margin: 0, letterSpacing: 'normal', fontWeight: 'bold' }}>{financialManager}</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
