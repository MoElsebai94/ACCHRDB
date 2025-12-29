
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Plane, Search, Filter, Settings, Check, FileText } from 'lucide-react';
import { API_URL } from '../utils/api';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomSelect from '../components/CustomSelect';
import PageLoading from '../components/PageLoading';
import logo from '../assets/logo.png';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import AlertModal from '../components/AlertModal';

export default function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedCostCenter, setSelectedCostCenter] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');
    const [departments, setDepartments] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [showInactive, setShowInactive] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });

    const availableColumns = [
        { key: 'name', label: 'الاسم', alwaysVisible: true },
        { key: 'position', label: 'المسمى الوظيفي' }, // Job Title
        { key: 'jobRole', label: 'الوظيفة' }, // Job Role
        { key: 'department', label: 'القسم' },
        { key: 'costCenter', label: 'مركز التكلفة' },
        { key: 'salary', label: 'الراتب' },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'fixedNumber', label: 'الرقم الثابت' },
        { key: 'dateHired', label: 'تاريخ التعيين' },
        { key: 'contractStartDate', label: 'تاريخ بداية العقد' },
        { key: 'contractEndDate', label: 'تاريخ نهاية العقد' },
        { key: 'arrivalDate', label: 'تاريخ الوصول للكاميرون' },
        { key: 'vacationReturnDate', label: 'تاريخ العودة من الأجازة' },
        { key: 'qualification', label: 'المؤهل' },
        { key: 'qualificationDate', label: 'تاريخ المؤهل' },
        { key: 'grade', label: 'الدرجة الوظيفية' },
        { key: 'gradeDate', label: 'تاريخ الدرجة' },
        { key: 'currentJobTitleDate', label: 'تاريخ المسمى' },
        { key: 'maritalStatus', label: 'الحالة الاجتماعية' },
        { key: 'loanStartDate', label: 'تاريخ بداية الإعارة' },
        { key: 'loanEndDate', label: 'تاريخ نهاية الإعارة' }
    ];

    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('employeeTableColumns');
        return saved ? JSON.parse(saved) : ['name', 'jobRole', 'department', 'email', 'costCenter'];
    });

    useEffect(() => {
        localStorage.setItem('employeeTableColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchCostCenters();
    }, []);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = selectedDept ? emp.department === selectedDept : true;
            const matchesCostCenter = selectedCostCenter ? emp.costCenter === selectedCostCenter : true;
            const matchesPosition = selectedPosition ? emp.jobRole === selectedPosition : true;
            const matchesInactive = showInactive ? true : emp.isActive;
            return matchesSearch && matchesDept && matchesCostCenter && matchesPosition && matchesInactive;
        });
    }, [employees, searchTerm, selectedDept, selectedCostCenter, selectedPosition, showInactive]);

    const toggleColumn = (key) => {
        setVisibleColumns(prev => {
            if (prev.includes(key)) {
                return prev.filter(c => c !== key);
            } else {
                if (prev.length >= 15) {
                    setAlertModal({
                        isOpen: true,
                        title: 'تنبيه',
                        message: 'عفواً، لا يمكن اختيار أكثر من 15 عموداً لضمان جودة العرض والطباعة.',
                        type: 'warning'
                    });
                    return prev;
                }
                return [...prev, key];
            }
        });
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch(`${API_URL}/employees`);
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${API_URL}/departments`);
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchCostCenters = async () => {
        try {
            const response = await fetch(`${API_URL}/cost-centers`);
            if (response.ok) {
                const data = await response.json();
                setCostCenters(data);
            }
        } catch (error) {
            console.error('Error fetching cost centers:', error);
        }
    };


    const deleteEmployee = async () => {
        const id = confirmDelete.id;
        try {
            await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
            fetchEmployees();
            setConfirmDelete({ isOpen: false, id: null });
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const generatePDF = async () => {
        try {
            setLoading(true);
            const reportElement = document.getElementById('employee-report-printable');

            if (!reportElement) {
                console.error("Report element not found");
                alert("Report template not found!");
                return;
            }

            // Temporarily show the element to capture it
            reportElement.style.display = 'block';

            const canvas = await html2canvas(reportElement, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Hide it again
            reportElement.style.display = 'none';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // First page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Additional pages
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`Employee_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`);

        } catch (error) {
            console.error('Report generation failed:', error);
            alert('حدث خطأ أثناء إنشاء التقرير: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportEmployeeReport = async () => {
        console.log('--- EXPORT START (MANUAL MODE) ---');
        await generatePDF();
    };


    if (loading) return <PageLoading />;

    return (
        <div>
            <div className="header" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                    onClick={handleExportEmployeeReport}
                    className="btn btn-primary"
                    style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                >
                    <FileText size={18} /> تصدير تقرير (PDF)
                </button>
                <Link to="/employees/new" className="btn btn-primary">
                    + إضافة موظف
                </Link>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1, pointerEvents: 'none' }} />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="بحث بالاسم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingRight: '2.8rem' }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <CustomSelect
                        options={[
                            { value: '', label: 'كل الأقسام' },
                            ...departments.map(dept => ({ value: dept.name, label: dept.name }))
                        ]}
                        value={selectedDept}
                        onChange={setSelectedDept}
                        placeholder="كل الأقسام"
                        icon={Filter}
                    />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <CustomSelect
                        options={[
                            { value: '', label: 'كل مراكز التكلفة' },
                            ...costCenters.map(cc => ({ value: cc.name, label: cc.name }))
                        ]}
                        value={selectedCostCenter}
                        onChange={setSelectedCostCenter}
                        placeholder="كل مراكز التكلفة"
                        icon={Filter}
                    />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <CustomSelect
                        options={[
                            { value: '', label: 'كل الوظائف' },
                            ...[...new Set(employees.map(e => e.jobRole).filter(Boolean))].map(role => ({ value: role, label: role }))
                        ]}
                        value={selectedPosition}
                        onChange={setSelectedPosition}
                        placeholder="كل الوظائف"
                        icon={Filter}
                    />
                </div>
                {(selectedDept || selectedCostCenter || selectedPosition || searchTerm) && (
                    <button
                        onClick={() => {
                            setSelectedDept('');
                            setSelectedCostCenter('');
                            setSelectedPosition('');
                            setSearchTerm('');
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', height: '42px' }}
                        title="إعادة تعيين الفلاتر"
                    >
                        <Filter size={16} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                    <div
                        onClick={() => setShowInactive(!showInactive)}
                        style={{
                            width: '40px',
                            height: '22px',
                            background: showInactive ? '#3b82f6' : '#cbd5e1',
                            borderRadius: '99px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        <div style={{
                            width: '18px',
                            height: '18px',
                            background: 'white',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: showInactive ? 'calc(100% - 20px)' : '2px',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>إظهار غير النشطين</span>
                </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                <button
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className="btn btn-secondary"
                    style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                >
                    <Settings size={18} /> تخصيص الجدول
                </button>
                {showColumnMenu && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '0.5rem',
                        zIndex: 20,
                        minWidth: '400px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem'
                    }}>
                        {availableColumns.map(col => (
                            <div
                                key={col.key}
                                onClick={() => !col.alwaysVisible && toggleColumn(col.key)}
                                style={{
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: col.alwaysVisible ? 'default' : 'pointer',
                                    opacity: col.alwaysVisible ? 0.7 : 1,
                                    borderRadius: '4px',
                                    background: visibleColumns.includes(col.key) ? '#f8fafc' : 'transparent'
                                }}
                            >
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: visibleColumns.includes(col.key) ? 'var(--primary-color)' : 'white',
                                    borderColor: visibleColumns.includes(col.key) ? 'var(--primary-color)' : '#cbd5e1'
                                }}>
                                    {visibleColumns.includes(col.key) && <Check size={12} color="white" />}
                                </div>
                                <span style={{ fontSize: '0.9rem' }}>{col.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="table-container card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            {availableColumns.filter(c => visibleColumns.includes(c.key)).map(col => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>لا يوجد موظفين مطابقين للبحث.</td>
                            </tr>
                        ) : (
                            filteredEmployees.map((emp) => {
                                const isOnVacation = !!emp.vacationReturnDate;
                                const isInactive = emp.isActive === false || emp.isActive === 0; // Handle boolean or integer storage
                                return (
                                    <tr
                                        key={emp.id}
                                        className="employee-row"
                                        style={{
                                            cursor: 'pointer',
                                            background: isInactive ? '#fff1f2' : (isOnVacation ? '#eff6ff' : 'transparent'),
                                            opacity: isInactive ? 0.8 : 1
                                        }}
                                    >
                                        {availableColumns.filter(c => visibleColumns.includes(c.key)).map(col => {
                                            if (col.key === 'name') {
                                                return (
                                                    <td key={col.key}>
                                                        <Link to={`/employees/${emp.id}`} style={{ fontWeight: '600', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                background: 'var(--primary-color)',
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold',
                                                                overflow: 'hidden',
                                                                flexShrink: 0
                                                            }}>
                                                                {emp.photoUrl ? (
                                                                    <img
                                                                        src={`${API_URL.replace('/api', '')}${emp.photoUrl}`}
                                                                        alt=""
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <>{emp.firstName[0]}{emp.lastName[0]}</>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    {emp.firstName} {emp.lastName}
                                                                    {isOnVacation && (
                                                                        <span style={{
                                                                            background: '#dbeafe',
                                                                            color: '#1e40af',
                                                                            padding: '0.1rem 0.4rem',
                                                                            borderRadius: '999px',
                                                                            fontSize: '0.65rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.2rem'
                                                                        }}>
                                                                            <Plane size={10} /> في أجازة
                                                                        </span>
                                                                    )}
                                                                    {isInactive && (
                                                                        <span style={{
                                                                            background: '#fee2e2',
                                                                            color: '#991b1b',
                                                                            padding: '0.1rem 0.4rem',
                                                                            borderRadius: '999px',
                                                                            fontSize: '0.65rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.2rem',
                                                                            border: '1px solid #fecaca'
                                                                        }}>
                                                                            غير نشط
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </td>
                                                );
                                            }
                                            // Handle other dynamic columns
                                            let cellContent = emp[col.key];
                                            if (col.key === 'salary') cellContent = emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '-';
                                            else if (!cellContent) cellContent = '-';

                                            return <td key={col.key}>{cellContent}</td>;
                                        })}
                                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link to={`/employees/${emp.id}/edit`} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                                <Edit2 size={16} />
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row click
                                                    setConfirmDelete({ isOpen: true, id: emp.id });
                                                }}
                                                className="btn btn-danger"
                                                style={{ padding: '0.5rem' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={deleteEmployee}
                title="حذف الموظف"
                message="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />

            {/* Hidden Printable Report */}
            <div id="employee-report-printable" style={{ position: 'absolute', top: '-10000px', left: 0, width: '297mm', minHeight: '210mm', background: 'white', padding: '10mm 10mm 30mm 10mm', direction: 'rtl', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2980b9', paddingBottom: '10px', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>المقاولون العرب الكاميرونيه</h1>
                        <h2 style={{ margin: '5px 0 0', color: '#7f8c8d', fontSize: '18px' }}>تقرير الموظفين</h2>
                    </div>
                    {logo && <img src={logo} alt="Logo" style={{ height: '60px' }} />}
                </div>

                {/* Sub-header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#34495e', fontSize: '14px' }}>
                    <div>عدد الموظفين: {filteredEmployees.length}</div>
                    <div>تاريخ التقرير: {new Date().toLocaleDateString('en-GB')}</div>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>#</th>
                            {availableColumns.filter(col => visibleColumns.includes(col.key)).map(col => (
                                <th key={col.key} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', direction: 'rtl', unicodeBidi: 'embed', letterSpacing: 'normal' }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((emp, index) => (
                            <tr key={emp._id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{index + 1}</td>
                                {availableColumns.filter(col => visibleColumns.includes(col.key)).map(col => {
                                    let content = emp[col.key] || '-';

                                    if (col.key === 'name') {
                                        content = `${emp.firstName} ${emp.lastName}`;
                                        return (
                                            <td key={col.key} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                                                {content}
                                            </td>
                                        );
                                    }

                                    if (col.key === 'salary') {
                                        content = `$ ${emp.salary ? Number(emp.salary).toLocaleString() : '0'}`;
                                    }

                                    return (
                                        <td key={col.key} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {content}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer */}
                <div style={{ position: 'absolute', bottom: '5mm', left: '10mm', width: '277mm', pageBreakInside: 'avoid' }}>
                    <div style={{ borderTop: '2px solid #2980b9', paddingTop: '10px', textAlign: 'center', fontSize: '10px', color: '#7f8c8d' }}>
                        <p style={{ margin: 0 }}>Avenue Jean Paul II, P.O. BOX 12995 Yaoundé Tel +237 22 01 33 06 Fax +237 22 20 25 11</p>
                        <p style={{ margin: '2px 0 0' }}>Arab Contractors Cameroon Ltd.</p>
                    </div>
                </div>
            </div>
        </div >
    );
}
