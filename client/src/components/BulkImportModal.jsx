import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, AlertCircle, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BulkImportModal({ isOpen, onClose, onSuccess, departments = [] }) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Validate, 3: Result
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importStats, setImportStats] = useState(null);

    if (!isOpen) return null;

    // --- Arabic Field Mapping ---
    // --- Arabic Field Mapping (Simplified & Verified) ---
    const fieldMapping = {
        'الاسم الأول': 'firstName',
        'اسم العائلة': 'lastName',
        'المسمى الوظيفي': 'position',
        'الوظيفة': 'jobRole',
        'المؤهل': 'qualification',
        'جهة العمل الحالية': 'currentWorkLocation',
        'الراتب الأساسي': 'salary',
        'العنوان': 'address',
        'رقم الهاتف (مصر)': 'cairoPhone',
        'رقم الهاتف (الكاميرون)': 'cameroonPhone',
        'الرقم الثابت': 'fixedNumber',
        'البريد الإلكتروني': 'email',
        'تاريخ التعيين (YYYY-MM-DD)': 'dateHired',
        'تاريخ بداية العقد (YYYY-MM-DD)': 'contractStartDate',
        'تاريخ نهاية العقد (YYYY-MM-DD)': 'contractEndDate',
        'تاريخ الميلاد (YYYY-MM-DD)': 'birthDate',
        'تاريخ الوصول (YYYY-MM-DD)': 'arrivalDate'
    };

    const reverseMapping = Object.fromEntries(Object.entries(fieldMapping).map(([k, v]) => [v, k]));

    // --- Helper: Excel Date to JS Date ---
    const parseExcelDate = (value) => {
        if (!value) return null;

        // 1. If it's a number (Excel Serial Date)
        if (typeof value === 'number') {
            // Excel date is days since 1900-01-01 (mostly)
            // JS is ms since 1970-01-01
            const date = new Date(Math.round((value - 25569) * 86400 * 1000));
            return date.toISOString().split('T')[0];
        }

        // 2. If it's a string, try to parse
        if (typeof value === 'string') {
            const trimmed = value.trim();
            // Match YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                return trimmed;
            }
            // For now, enforce YYYY-MM-DD or valid ISO.
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) {
                return d.toISOString().split('T')[0];
            }
        }
        return 'INVALID';
    };

    // --- Template Generation ---
    const handleDownloadTemplate = () => {
        const headers = Object.keys(fieldMapping);
        const ws = XLSX.utils.aoa_to_sheet([
            headers,
            // Example Row: 
            ['أحمد', 'محمد', 'مهندس', 'Full Time', 'بكالوريوس', 'المقر الرئيسي', '5000', 'القاهرة', '01000000000', '23700000000', '', 'ahmed@example.com', '2024-01-01', '2024-01-01', '2025-01-01', '1990-01-01', '2024-01-15']
        ]);

        // Auto-width columns
        const wscols = headers.map(h => ({ wch: h.length + 5 }));
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employees");
        XLSX.writeFile(wb, "employees_template.xlsx");
    };

    // --- File Handling ---
    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        parseExcel(selectedFile);
    };

    const parseExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                processParsedData(jsonData);
            } catch (err) {
                setErrors(["فشل في قراءة الملف. تأكد من أنه ملف Excel صالح."]);
                setStep(2);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const processParsedData = (data) => {
        const processed = [];
        const validationErrors = [];

        data.forEach((row, index) => {
            const newRow = {};
            let hasError = false;
            let rowErrorMsg = "";

            // Map fields
            Object.keys(fieldMapping).forEach(arKey => {
                const enKey = fieldMapping[arKey];
                let value = row[arKey];

                if (value !== undefined) {
                    // Check if it's a date field
                    if (['dateHired', 'contractStartDate', 'contractEndDate', 'birthDate', 'arrivalDate'].includes(enKey)) {
                        const parsedDate = parseExcelDate(value);
                        if (parsedDate === 'INVALID') {
                            hasError = true;
                            rowErrorMsg += `صيغة التاريخ غير صحيحة في ${arKey}. استخدم YYYY-MM-DD. `;
                            value = null; // Don't save invalid date
                        } else {
                            value = parsedDate;
                        }
                    }
                    newRow[enKey] = value;
                }
            });

            // Basic Validation (Only Names are strict)
            if (!newRow.firstName || String(newRow.firstName).trim() === '') {
                hasError = true;
                rowErrorMsg += "الاسم الأول مطلوب. ";
            }
            if (!newRow.lastName || String(newRow.lastName).trim() === '') {
                hasError = true;
                rowErrorMsg += "اسم العائلة مطلوب. ";
            }

            // Sanitize: Convert empty strings to null (Fixes unique constraint issues for optional fields like email)
            Object.keys(newRow).forEach(key => {
                if (typeof newRow[key] === 'string' && newRow[key].trim() === '') {
                    newRow[key] = null;
                }
            });

            // Handle Mandatory DB Fields Defaults (to allow import of partial data)
            if (!newRow.fixedNumber) newRow.fixedNumber = "-";
            if (!newRow.salary) newRow.salary = 0;

            // Dates: If missing, default to today (Model requires these)
            const today = new Date().toISOString().split('T')[0];
            if (!newRow.dateHired) newRow.dateHired = today;
            if (!newRow.contractStartDate) newRow.contractStartDate = today;
            if (!newRow.contractEndDate) newRow.contractEndDate = today;
            if (!newRow.arrivalDate) newRow.arrivalDate = today;
            if (!newRow.jobRole) newRow.jobRole = "General";

            // Department Default
            if (!newRow.department) {
                newRow.department = "غير محدد";
            }

            // Map Status - default to Active
            newRow.isActive = true;

            processed.push({ ...newRow, _rowNum: index + 2, _error: hasError ? rowErrorMsg : null });
            if (hasError) validationErrors.push(`صف #${index + 2}: ${rowErrorMsg}`);
        });

        setParsedData(processed);
        setErrors(validationErrors);
        setStep(2);
    };

    // --- Submission ---
    const handleImport = async () => {
        setIsSubmitting(true);
        const validRows = parsedData.filter(r => !r._error).map(({ _rowNum, _error, ...rest }) => rest);

        try {
            const response = await fetch('http://localhost:3001/api/employees/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validRows)
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 50)}...`);
            }

            if (!response.ok) {
                throw new Error(result.error || 'Import failed');
            }

            setImportStats({
                total: validRows.length,
                success: result.count
            });
            setStep(3);
            if (onSuccess) onSuccess();

        } catch (err) {
            setErrors([err.message || "حدث خطأ أثناء الاستيراد"]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setStep(1);
        setFile(null);
        setParsedData([]);
        setErrors([]);
        setImportStats(null);
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div className="card" style={{ width: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'white', padding: '0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>استيراد موظفين (Excel)</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                {/* Body */}
                <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <FileSpreadsheet size={48} color="#0284c7" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ color: '#64748b' }}>قم بتحميل ملف Excel يحتوي على بيانات الموظفين.</p>
                                <button onClick={handleDownloadTemplate} className="btn-text" style={{ color: '#0284c7', textDecoration: 'underline', marginTop: '0.5rem' }}>
                                    تحميل نموذج فارغ (Template)
                                </button>
                            </div>

                            <label style={{
                                display: 'block', padding: '3rem', border: '2px dashed #cbd5e1', borderRadius: '12px',
                                cursor: 'pointer', transition: 'border-color 0.2s', background: '#f8fafc'
                            }}>
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                                <Upload size={32} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
                                <span style={{ fontWeight: '500', color: '#334155' }}>اضغط لاختيار ملف</span>
                                <span style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>XLSX, CSV up to 10MB</span>
                            </label>
                        </div>
                    )}

                    {/* Step 2: Validate */}
                    {step === 2 && (
                        <div>
                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ fontWeight: 'bold' }}>معاينة البيانات</h4>
                                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>تم العثور على {parsedData.length} صف</span>
                            </div>

                            {/* Error Summary */}
                            {errors.length > 0 && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                    <h5 style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <AlertTriangle size={16} />
                                        تنبيهات ({errors.length})
                                    </h5>
                                    <ul style={{ margin: 0, paddingRight: '1.5rem', fontSize: '0.9rem', color: '#b91c1c' }}>
                                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Preview Table (First 5 rows) */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'right' }}>
                                    <thead style={{ background: '#f8fafc', color: '#475569' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem' }}>#</th>
                                            <th style={{ padding: '0.75rem' }}>الاسم</th>
                                            <th style={{ padding: '0.75rem' }}>الوظيفة</th>
                                            <th style={{ padding: '0.75rem' }}>القسم</th>
                                            <th style={{ padding: '0.75rem' }}>الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.slice(0, 5).map((row, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid #f1f5f9', background: row._error ? '#fff1f2' : 'white' }}>
                                                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{row._rowNum}</td>
                                                <td style={{ padding: '0.75rem' }}>{row.firstName} {row.lastName}</td>
                                                <td style={{ padding: '0.75rem' }}>{row.position || '-'}</td>
                                                <td style={{ padding: '0.75rem' }}>{row.department || '-'}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {row._error ? <AlertCircle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#22c55e" />}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 5 && (
                                    <div style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', fontSize: '0.8rem', color: '#64748b' }}>
                                        ... والمزيد ({parsedData.length - 5})
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{ background: '#dcfce7', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CheckCircle size={32} color="#16a34a" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534', marginBottom: '0.5rem' }}>تم الاستيراد بنجاح!</h3>
                            <p style={{ color: '#4c5d76' }}>
                                تم إضافة {importStats?.success} موظف جديد إلى قاعدة البيانات.
                            </p>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    {step === 1 && (
                        <button onClick={onClose} className="btn btn-secondary">إلغاء</button>
                    )}

                    {step === 2 && (
                        <>
                            <button onClick={reset} className="btn btn-secondary">إلغاء وإعادة المحاولة</button>
                            <button
                                onClick={handleImport}
                                disabled={parsedData.filter(r => !r._error).length === 0 || isSubmitting}
                                className="btn btn-primary"
                                style={{ minWidth: '120px' }}
                            >
                                {isSubmitting ? 'جاري الحفظ...' : `استيراد (${parsedData.filter(r => !r._error).length})`}
                            </button>
                        </>
                    )}

                    {step === 3 && (
                        <button onClick={onClose} className="btn btn-primary">إغلاق</button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
