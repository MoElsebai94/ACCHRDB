import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, AlertCircle, Loader, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_URL } from '../utils/api';

export default function BulkImportModal({ isOpen, onClose, onSuccess, departments = [], costCenters = [], buildings = [] }) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Validate, 2.5: New Cost Centers Confirmation, 3: Result
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importStats, setImportStats] = useState(null);
    const [newCostCenters, setNewCostCenters] = useState([]); // Cost centers that don't exist yet
    const [newBuildings, setNewBuildings] = useState([]); // Buildings that don't exist yet
    const [employeesNeedingRoomAssignment, setEmployeesNeedingRoomAssignment] = useState([]); // Employees assigned to buildings but need room
    const [newDepartments, setNewDepartments] = useState([]); // New departments to be created (includes parent-child info)

    if (!isOpen) return null;

    // --- Arabic Field Mapping ---
    const fieldMapping = {
        'الاسم الكامل': 'fullName',
        'القسم': 'departmentName',
        'القسم الفرعي': 'subDepartmentName',
        'المسمى الوظيفي': 'position',
        'تاريخ المسمى الوظيفي (YYYY-MM-DD)': 'currentJobTitleDate',
        'الوظيفة': 'jobRole',
        'المؤهل': 'qualification',
        'تاريخ المؤهل (YYYY-MM-DD)': 'qualificationDate',
        'الفئة': 'grade',
        'تاريخ الفئة (YYYY-MM-DD)': 'gradeDate',
        'الحالة الاجتماعية': 'maritalStatus',
        'الاستراحة': 'buildingName',
        'مركز التكلفة': 'costCenter',
        'الراتب الأساسي': 'salary',
        'البدلات': 'allowances',
        'العنوان': 'address',
        'رقم الهاتف (مصر)': 'cairoPhone',
        'رقم الهاتف (الكاميرون)': 'cameroonPhone',
        'الرقم الثابت': 'fixedNumber',
        'البريد الإلكتروني': 'email',
        'تاريخ التعيين (YYYY-MM-DD)': 'dateHired',
        'تاريخ بداية الإعارة (YYYY-MM-DD)': 'loanStartDate',
        'تاريخ انتهاء الإعارة (YYYY-MM-DD)': 'loanEndDate',
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
        // Reverse headers for RTL Arabic layout (rightmost column = first field)
        const headers = Object.keys(fieldMapping).reverse();
        // Example: loanEndDate is empty = employee is still active
        // Fields: fullName, departmentName, subDepartmentName, position, currentJobTitleDate, jobRole, qualification, qualificationDate, grade, gradeDate, maritalStatus, buildingName, costCenter, salary, allowances, address, cairoPhone, cameroonPhone, fixedNumber, email, dateHired, loanStartDate, loanEndDate, birthDate, arrivalDate
        // maritalStatus options: Single, Married, MarriedWithDependents, Divorced, Widowed (or Arabic equivalents)
        // If subDepartmentName exists, employee is assigned to sub-department; otherwise to main department
        const exampleData = ['أحمد محمد', 'الإدارة المالية', 'المحاسبة', 'مهندس', '2023-01-01', 'Full Time', 'بكالوريوس', '2020-06-01', 'الأولى', '2022-01-01', 'متزوج', 'استراحة 1', 'مركز تكلفة 1', '5000', '1000', 'القاهرة', '01000000000', '23700000000', '', 'ahmed@example.com', '2024-01-01', '2024-01-01', '', '1990-01-01', '2024-01-15'].reverse();

        const ws = XLSX.utils.aoa_to_sheet([
            headers,
            // Example Row (reversed for RTL):
            exampleData
        ]);

        // Auto-width columns
        const wscols = headers.map(h => ({ wch: h.length + 5 }));
        ws['!cols'] = wscols;

        // Set RTL view for the sheet
        ws['!views'] = [{ RTL: true }];

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

    // Map Arabic marital status to English values
    const maritalStatusMapping = {
        'أعزب': 'Single',
        'اعزب': 'Single',
        'متزوج': 'Married',
        'متزوج و يعول': 'MarriedWithDependents',
        'متزوج ويعول': 'MarriedWithDependents',
        'مطلق': 'Divorced',
        'أرمل': 'Widowed',
        'ارمل': 'Widowed'
    };

    const processParsedData = (data) => {
        const processed = [];
        const validationErrors = [];
        const existingCostCenterNames = costCenters.map(cc => cc.name.toLowerCase().trim());
        const existingBuildingNames = buildings.map(b => b.name.toLowerCase().trim());
        const existingDepartmentNames = departments.map(d => d.name.toLowerCase().trim());

        // Build a map of department names to their IDs for parent lookup
        const departmentNameToId = {};
        departments.forEach(d => {
            departmentNameToId[d.name.toLowerCase().trim()] = d.id;
        });

        const detectedNewCostCenters = new Set();
        const detectedNewBuildings = new Set();
        const detectedNewDepartments = new Map(); // Map of "parent|child" -> {parent, child, isNewParent, isNewChild}
        const employeesWithBuildings = [];

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
                    if (['dateHired', 'loanStartDate', 'loanEndDate', 'birthDate', 'arrivalDate', 'qualificationDate', 'currentJobTitleDate', 'gradeDate'].includes(enKey)) {
                        const parsedDate = parseExcelDate(value);
                        if (parsedDate === 'INVALID') {
                            hasError = true;
                            rowErrorMsg += `صيغة التاريخ غير صحيحة في ${arKey}. استخدم YYYY-MM-DD. `;
                            value = null; // Don't save invalid date
                        } else {
                            value = parsedDate;
                        }
                    }

                    // Convert Arabic marital status to English
                    if (enKey === 'maritalStatus' && value) {
                        const normalizedValue = String(value).trim();
                        value = maritalStatusMapping[normalizedValue] || normalizedValue;
                    }

                    newRow[enKey] = value;
                }
            });

            // Basic Validation (Only Name is strict)
            if (!newRow.fullName || String(newRow.fullName).trim() === '') {
                hasError = true;
                rowErrorMsg += "الاسم الكامل مطلوب. ";
            }

            // Sanitize: Convert empty strings to null (Fixes unique constraint issues for optional fields like email)
            Object.keys(newRow).forEach(key => {
                if (typeof newRow[key] === 'string' && newRow[key].trim() === '') {
                    newRow[key] = null;
                }
            });

            // Handle department hierarchy
            // If subDepartmentName exists, employee goes to sub-department
            // Otherwise, employee goes to main department
            const mainDeptName = newRow.departmentName?.trim();
            const subDeptName = newRow.subDepartmentName?.trim();

            if (subDeptName) {
                // Employee goes to sub-department
                newRow.department = subDeptName;

                // Check if sub-department exists
                const subDeptExists = existingDepartmentNames.includes(subDeptName.toLowerCase());
                const mainDeptExists = mainDeptName ? existingDepartmentNames.includes(mainDeptName.toLowerCase()) : true;

                if (!subDeptExists || !mainDeptExists) {
                    const key = `${mainDeptName || ''}|${subDeptName}`;
                    if (!detectedNewDepartments.has(key)) {
                        detectedNewDepartments.set(key, {
                            parent: mainDeptName || null,
                            child: subDeptName,
                            isNewParent: mainDeptName ? !mainDeptExists : false,
                            isNewChild: !subDeptExists
                        });
                    }
                }
            } else if (mainDeptName) {
                // Employee goes to main department
                newRow.department = mainDeptName;

                // Check if main department exists
                if (!existingDepartmentNames.includes(mainDeptName.toLowerCase())) {
                    const key = `${mainDeptName}|`;
                    if (!detectedNewDepartments.has(key)) {
                        detectedNewDepartments.set(key, {
                            parent: null,
                            child: mainDeptName,
                            isNewParent: false,
                            isNewChild: true
                        });
                    }
                }
            }

            // Check for new cost centers
            if (newRow.costCenter && !existingCostCenterNames.includes(newRow.costCenter.toLowerCase().trim())) {
                detectedNewCostCenters.add(newRow.costCenter.trim());
            }

            // Check for buildings (existing or new)
            if (newRow.buildingName) {
                const buildingNameLower = newRow.buildingName.toLowerCase().trim();
                if (!existingBuildingNames.includes(buildingNameLower)) {
                    detectedNewBuildings.add(newRow.buildingName.trim());
                }
                // Track employees that need room assignment
                employeesWithBuildings.push({
                    name: newRow.fullName,
                    building: newRow.buildingName.trim(),
                    isNew: !existingBuildingNames.includes(buildingNameLower)
                });
            }

            // Determine active status based on loanEndDate
            // If loanEndDate is empty/null, employee is still active (loan hasn't ended)
            newRow.isActive = !newRow.loanEndDate;

            processed.push({ ...newRow, _rowNum: index + 2, _error: hasError ? rowErrorMsg : null });
            if (hasError) validationErrors.push(`صف #${index + 2}: ${rowErrorMsg}`);
        });

        setParsedData(processed);
        setErrors(validationErrors);
        setNewCostCenters(Array.from(detectedNewCostCenters));
        setNewBuildings(Array.from(detectedNewBuildings));
        setNewDepartments(Array.from(detectedNewDepartments.values()));
        setEmployeesNeedingRoomAssignment(employeesWithBuildings);
        setStep(2);
    };

    // --- Create new cost centers ---
    const createNewCostCenters = async () => {
        for (const name of newCostCenters) {
            try {
                await fetch(`${API_URL}/cost-centers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
            } catch (err) {
                console.error(`Failed to create cost center: ${name}`, err);
            }
        }
    };

    // --- Create new buildings ---
    const createNewBuildings = async () => {
        for (const name of newBuildings) {
            try {
                await fetch(`${API_URL}/residences/buildings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
            } catch (err) {
                console.error(`Failed to create building: ${name}`, err);
            }
        }
    };

    // --- Create new departments with hierarchy ---
    const createNewDepartments = async () => {
        // First, fetch current departments to get IDs
        let currentDepartments = [...departments];

        // First pass: create all parent departments that don't exist
        for (const dept of newDepartments) {
            if (dept.parent && dept.isNewParent) {
                try {
                    const response = await fetch(`${API_URL}/departments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: dept.parent, parentId: null })
                    });
                    if (response.ok) {
                        const newDept = await response.json();
                        currentDepartments.push(newDept);
                    }
                } catch (err) {
                    console.error(`Failed to create parent department: ${dept.parent}`, err);
                }
            }
        }

        // Second pass: create all child departments
        for (const dept of newDepartments) {
            if (dept.isNewChild) {
                try {
                    // Find parent ID if parent exists
                    let parentId = null;
                    if (dept.parent) {
                        const parentDept = currentDepartments.find(d => d.name.toLowerCase().trim() === dept.parent.toLowerCase().trim());
                        parentId = parentDept?.id || null;
                    }

                    const response = await fetch(`${API_URL}/departments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: dept.child, parentId })
                    });
                    if (response.ok) {
                        const newDept = await response.json();
                        currentDepartments.push(newDept);
                    }
                } catch (err) {
                    console.error(`Failed to create department: ${dept.child}`, err);
                }
            }
        }
    };

    // --- Submission ---
    const handleImport = async () => {
        setIsSubmitting(true);

        try {
            // First, create any new departments (must be before employees since they reference departments)
            if (newDepartments.length > 0) {
                await createNewDepartments();
            }

            // Create any new cost centers
            if (newCostCenters.length > 0) {
                await createNewCostCenters();
            }

            // Create any new buildings
            if (newBuildings.length > 0) {
                await createNewBuildings();
            }

            // Fetch updated buildings list to get IDs for newly created buildings
            let allBuildings = [...buildings];
            if (newBuildings.length > 0) {
                const buildingsRes = await fetch(`${API_URL}/residences/buildings`);
                if (buildingsRes.ok) {
                    allBuildings = await buildingsRes.json();
                }
            }

            // Process rows and add buildingId based on buildingName
            const validRows = parsedData.filter(r => !r._error).map(({ _rowNum, _error, buildingName, departmentName, subDepartmentName, ...rest }) => {
                // Look up buildingId from buildingName
                if (buildingName) {
                    const building = allBuildings.find(b => b.name.toLowerCase().trim() === buildingName.toLowerCase().trim());
                    if (building) {
                        rest.buildingId = building.id;
                    }
                }
                return rest;
            });

            const response = await fetch(`${API_URL}/employees/bulk`, {
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
                success: result.count,
                newCostCenters: newCostCenters.length,
                newBuildings: newBuildings.length,
                newDepartments: newDepartments.length,
                employeesNeedingRooms: employeesNeedingRoomAssignment.length
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
        setNewCostCenters([]);
        setNewBuildings([]);
        setNewDepartments([]);
        setEmployeesNeedingRoomAssignment([]);
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

                            {/* New Departments Notification */}
                            {newDepartments.length > 0 && (
                                <div style={{ background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                                    <h5 style={{ color: '#7c3aed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Plus size={16} />
                                        أقسام جديدة ({newDepartments.length})
                                    </h5>
                                    <p style={{ fontSize: '0.85rem', color: '#6b21a8', marginBottom: '0.5rem' }}>
                                        سيتم إنشاء الأقسام التالية تلقائياً عند الاستيراد:
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        {newDepartments.map((dept, i) => (
                                            <div key={i} style={{ fontSize: '0.8rem', color: '#7c3aed', padding: '0.25rem 0' }}>
                                                • {dept.parent ? (
                                                    <>
                                                        {dept.isNewParent && <span style={{ background: '#e9d5ff', padding: '0.1rem 0.3rem', borderRadius: '4px', marginLeft: '0.25rem' }}>{dept.parent}</span>}
                                                        {!dept.isNewParent && <span>{dept.parent}</span>}
                                                        <span style={{ margin: '0 0.25rem' }}>←</span>
                                                        {dept.isNewChild && <span style={{ background: '#e9d5ff', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{dept.child}</span>}
                                                        {!dept.isNewChild && <span>{dept.child}</span>}
                                                    </>
                                                ) : (
                                                    <span style={{ background: '#e9d5ff', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{dept.child}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Cost Centers Notification */}
                            {newCostCenters.length > 0 && (
                                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                                    <h5 style={{ color: '#b45309', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Plus size={16} />
                                        مراكز تكلفة جديدة ({newCostCenters.length})
                                    </h5>
                                    <p style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '0.5rem' }}>
                                        سيتم إنشاء مراكز التكلفة التالية تلقائياً عند الاستيراد:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {newCostCenters.map((cc, i) => (
                                            <span key={i} style={{
                                                background: '#fef3c7',
                                                color: '#92400e',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.8rem',
                                                fontWeight: '500'
                                            }}>
                                                {cc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Buildings Notification */}
                            {newBuildings.length > 0 && (
                                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                                    <h5 style={{ color: '#166534', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Plus size={16} />
                                        استراحات جديدة ({newBuildings.length})
                                    </h5>
                                    <p style={{ fontSize: '0.85rem', color: '#15803d', marginBottom: '0.5rem' }}>
                                        سيتم إنشاء الاستراحات التالية تلقائياً عند الاستيراد:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {newBuildings.map((b, i) => (
                                            <span key={i} style={{
                                                background: '#dcfce7',
                                                color: '#166534',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.8rem',
                                                fontWeight: '500'
                                            }}>
                                                {b}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Employees Needing Room Assignment */}
                            {employeesNeedingRoomAssignment.length > 0 && (
                                <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                                    <h5 style={{ color: '#1e40af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <AlertTriangle size={16} />
                                        موظفين يحتاجون تسجيل غرفة ({employeesNeedingRoomAssignment.length})
                                    </h5>
                                    <p style={{ fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                                        هؤلاء الموظفين تم تحديد استراحة لهم ولكن يجب تسجيلهم في شقة وغرفة محددة بعد الاستيراد:
                                    </p>
                                    <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                        {employeesNeedingRoomAssignment.slice(0, 10).map((emp, i) => (
                                            <div key={i} style={{ fontSize: '0.8rem', color: '#1e40af', padding: '0.25rem 0' }}>
                                                • {emp.name} → {emp.building} {emp.isNew && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.65rem' }}>جديد</span>}
                                            </div>
                                        ))}
                                        {employeesNeedingRoomAssignment.length > 10 && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                                ... و {employeesNeedingRoomAssignment.length - 10} آخرين
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                            <th style={{ padding: '0.75rem' }}>مركز التكلفة</th>
                                            <th style={{ padding: '0.75rem' }}>الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.slice(0, 5).map((row, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid #f1f5f9', background: row._error ? '#fff1f2' : 'white' }}>
                                                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{row._rowNum}</td>
                                                <td style={{ padding: '0.75rem' }}>{row.fullName}</td>
                                                <td style={{ padding: '0.75rem' }}>{row.position || '-'}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {row.costCenter ? (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}>
                                                            {row.costCenter}
                                                            {newCostCenters.includes(row.costCenter) && (
                                                                <span style={{
                                                                    background: '#fef3c7',
                                                                    color: '#b45309',
                                                                    padding: '0.1rem 0.4rem',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.65rem'
                                                                }}>جديد</span>
                                                            )}
                                                        </span>
                                                    ) : '-'}
                                                </td>
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
                            {importStats?.newDepartments > 0 && (
                                <p style={{ color: '#7c3aed', marginTop: '0.5rem' }}>
                                    تم إنشاء {importStats.newDepartments} قسم جديد.
                                </p>
                            )}
                            {importStats?.newCostCenters > 0 && (
                                <p style={{ color: '#b45309', marginTop: '0.5rem' }}>
                                    تم إنشاء {importStats.newCostCenters} مركز تكلفة جديد.
                                </p>
                            )}
                            {importStats?.newBuildings > 0 && (
                                <p style={{ color: '#166534', marginTop: '0.5rem' }}>
                                    تم إنشاء {importStats.newBuildings} استراحة جديدة.
                                </p>
                            )}
                            {importStats?.employeesNeedingRooms > 0 && (
                                <p style={{ color: '#1e40af', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                    ⚠️ {importStats.employeesNeedingRooms} موظف يحتاج تسجيل في شقة وغرفة محددة.
                                </p>
                            )}
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
