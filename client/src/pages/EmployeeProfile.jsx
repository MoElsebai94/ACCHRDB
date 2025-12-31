import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Mail, Briefcase, DollarSign, Calendar, Building, Hash, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import VacationModal from '../components/VacationModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { API_URL } from '../utils/api';
import logo from '../assets/logo.png';
import PageLoading from '../components/PageLoading';
import AlertModal from '../components/AlertModal';
import AddLoanHistoryModal from '../components/AddLoanHistoryModal';
import DocumentsSection from '../components/DocumentsSection';

export default function EmployeeProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [isEndVacationModalOpen, setIsEndVacationModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isAddHistoryModalOpen, setIsAddHistoryModalOpen] = useState(false);
    const [isDeleteHistoryModalOpen, setIsDeleteHistoryModalOpen] = useState(false);
    const [historyToDelete, setHistoryToDelete] = useState(null);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [loanHistory, setLoanHistory] = useState([]);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchEmployee();
        fetchLoanHistory();
        fetchDepartments();
    }, [id]);

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

    const getDepartmentDisplay = (deptName) => {
        if (!deptName || departments.length === 0) return deptName;

        // Robust matching: trim and case-insensitive
        const normalize = str => str ? str.toString().trim().toLowerCase() : '';
        const targetName = normalize(deptName);

        const dept = departments.find(d => normalize(d.name) === targetName);

        if (dept && dept.parentId) {
            // Loose equality for ID to handle string/number mismatch
            const parent = departments.find(d => d.id == dept.parentId);
            if (parent) {
                return (
                    <span>
                        {parent.name}
                        <span style={{ margin: '0 5px', color: '#94a3b8', fontWeight: 'normal' }}>/</span>
                        {dept.name}
                    </span>
                );
            }
        }
        return deptName;
    };

    const fetchLoanHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/employees/${id}/loan-history`);
            if (response.ok) {
                const data = await response.json();
                setLoanHistory(data);
            }
        } catch (error) {
            console.error('Error fetching loan history:', error);
        }
    };

    const fetchEmployee = async () => {
        try {
            const response = await fetch(`${API_URL}/employees/${id}`);
            if (response.ok) {
                const data = await response.json();
                setEmployee(data);
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteEmployee = async () => {
        try {
            await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
            navigate('/employees');
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById('pdf-content');
        if (!element) return;

        // Make visible for capture
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
            pdf.save(`${employee.firstName}_${employee.lastName}_Profile.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('حدث خطأ أثناء إنشاء ملف PDF');
        } finally {
            // Hide again
            element.style.display = 'none';
        }
    };

    const handleArchiveLoan = () => {
        if (!employee.loanStartDate) return;
        setIsArchiveModalOpen(true);
    };

    const confirmArchiveLoan = async () => {

        try {
            const historyResponse = await fetch(`${API_URL}/employees/${id}/loan-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: employee.loanStartDate,
                    endDate: employee.loanEndDate
                })
            });

            if (!historyResponse.ok) throw new Error('Failed to archive loan');

            const updateResponse = await fetch(`${API_URL}/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...employee,
                    loanStartDate: null,
                    loanEndDate: null
                })
            });

            if (!updateResponse.ok) throw new Error('Failed to update employee');

            fetchEmployee();
            fetchLoanHistory();
            setIsArchiveModalOpen(false);
            setAlertModal({
                isOpen: true,
                title: 'تمت العملية بنجاح',
                message: 'تم أرشفة فترة الإعارة بنجاح وتم تحديث سجل الموظف.',
                type: 'success'
            });

        } catch (error) {
            console.error('Error archiving loan:', error);
            setIsArchiveModalOpen(false);
            setAlertModal({
                isOpen: true,
                title: 'خطأ',
                message: 'حدث خطأ أثناء الأرشفة. الرجاء التأكد من تشغيل الخادم وإعادة المحاولة.',
                type: 'error'
            });
        }
    };

    const handleManualHistoryAdd = async (data) => {
        try {
            const response = await fetch(`${API_URL}/employees/${id}/loan-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                fetchLoanHistory();
                setIsAddHistoryModalOpen(false);
                setAlertModal({
                    isOpen: true,
                    title: 'تمت الإضافة',
                    message: 'تم إضافة السجل بنجاح.',
                    type: 'success'
                });
            } else {
                throw new Error('Failed to add history');
            }
        } catch (error) {
            console.error('Error adding history:', error);
            setAlertModal({
                isOpen: true,
                title: 'خطأ',
                message: 'حدث خطأ أثناء إضافة السجل.',
                type: 'error'
            });
        }
    };

    const handleDeleteHistoryClick = (id) => {
        setHistoryToDelete(id);
        setIsDeleteHistoryModalOpen(true);
    };

    const confirmDeleteHistory = async () => {
        if (!historyToDelete) return;

        try {
            const response = await fetch(`${API_URL}/loan-history/${historyToDelete}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchLoanHistory();
                setIsDeleteHistoryModalOpen(false);
                setHistoryToDelete(null);
                setAlertModal({
                    isOpen: true,
                    title: 'تم الحذف',
                    message: 'تم حذف السجل بنجاح.',
                    type: 'success'
                });
            } else {
                throw new Error('Failed to delete history');
            }
        } catch (error) {
            console.error('Error deleting history:', error);
            setIsDeleteHistoryModalOpen(false);
            setAlertModal({
                isOpen: true,
                title: 'خطأ',
                message: 'حدث خطأ أثناء حذف السجل.',
                type: 'error'
            });
        }
    };

    if (loading) return <PageLoading />;
    if (!employee) return <div>Employee not found.</div>;

    return (
        <div>
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/employees" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 style={{ marginBottom: 0 }}>ملف الموظف</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/employees/${id}/edit`} className="btn btn-secondary">
                        <Edit2 size={18} /> تعديل
                    </Link>
                    <button onClick={handleExportPDF} className="btn" style={{ background: '#8b5cf6', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FileText size={18} /> تصدير PDF
                    </button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="btn btn-danger">
                        <Trash2 size={18} /> حذف
                    </button>
                    {!employee.vacationReturnDate ? (
                        <button
                            onClick={() => setIsVacationModalOpen(true)}
                            className="btn"
                            style={{ background: '#3b82f6', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                        >
                            <Calendar size={18} /> تسجيل أجازة
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsVacationModalOpen(true)}
                            className="btn"
                            style={{ background: '#eab308', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                        >
                            <Edit2 size={18} /> تعديل / إلغاء الأجازة
                        </button>
                    )}
                </div>
            </div>

            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'var(--primary-color)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        overflow: 'hidden'
                    }}>
                        {employee.photoUrl ? (
                            <img
                                src={`${API_URL.replace('/api', '')}${employee.photoUrl}`}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <>{employee.firstName[0]}{employee.lastName[0]}</>
                        )}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{employee.firstName} {employee.lastName}</h2>
                            {!employee.isActive && (
                                <span style={{
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    border: '1px solid #fecaca'
                                }}>
                                    غير نشط (Inactive)
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Briefcase size={16} /> {employee.position}
                            </span>
                            {employee.jobRole && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Briefcase size={16} /> {employee.jobRole}
                                </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building size={16} /> {getDepartmentDisplay(employee.department)}
                            </span>
                            {employee.costCenter && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Building size={16} /> {employee.costCenter}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>المعلومات الشخصية والاتصال</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>البريد الإلكتروني</div>
                                <div style={{ fontWeight: '500' }}>{employee.email}</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                <Mail size={20} color="var(--primary-color)" />
                            </div>
                        </div>
                        {employee.fixedNumber && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>الرقم الثابت</div>
                                    <div style={{ fontWeight: '500' }}>{employee.fixedNumber}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Hash size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.maritalStatus && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>الحالة الاجتماعية</div>
                                    <div style={{ fontWeight: '500' }}>
                                        {employee.maritalStatus === 'Single' && 'أعزب'}
                                        {employee.maritalStatus === 'Married' && 'متزوج'}
                                        {employee.maritalStatus === 'MarriedWithDependents' && 'متزوج و يعول'}
                                        {employee.maritalStatus === 'Divorced' && 'مطلق'}
                                        {employee.maritalStatus === 'Widowed' && 'أرمل'}
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <FileText size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.qualification && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>المؤهل</div>
                                    <div style={{ fontWeight: '500' }}>
                                        {employee.qualification}
                                        {employee.qualificationDate && <span style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '0.5rem' }}>({employee.qualificationDate})</span>}
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <FileText size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.address && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>العنوان</div>
                                    <div style={{ fontWeight: '500' }}>{employee.address}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Building size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {employee.cairoPhone && (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تليفون القاهرة</div>
                                        <div style={{ fontWeight: '500' }}>{employee.cairoPhone}</div>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                        <Hash size={20} color="var(--primary-color)" />
                                    </div>
                                </div>
                            )}
                            {employee.cameroonPhone && (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تليفون الكاميرون</div>
                                        <div style={{ fontWeight: '500' }}>{employee.cameroonPhone}</div>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                        <Hash size={20} color="var(--primary-color)" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <h3 style={{ margin: '2rem 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>معلومات السكن</h3>
                        {(employee.permanentRoom || employee.temporaryRoom) ? (
                            <>
                                {employee.permanentRoom && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>السكن الدائم</div>
                                            <div style={{ fontWeight: '600' }}>
                                                <Link to={`/residences/${employee.permanentRoom.Apartment.Building.id}`} style={{ color: '#0369a1', textDecoration: 'none' }}>
                                                    {employee.permanentRoom.Apartment.Building.name}
                                                </Link>
                                                <span style={{ margin: '0 0.5rem', color: '#cbd5e1' }}>|</span>
                                                شقة {employee.permanentRoom.Apartment.number}
                                                <span style={{ margin: '0 0.5rem', color: '#cbd5e1' }}>|</span>
                                                غرفة {employee.permanentRoom.number}
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px' }}>
                                            <Building size={20} color="#0369a1" />
                                        </div>
                                    </div>
                                )}
                                {employee.temporaryRoom && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تسكين مؤقت (بديل)</div>
                                            <div style={{ fontWeight: '600' }}>
                                                <Link to={`/residences/${employee.temporaryRoom.Apartment.Building.id}`} style={{ color: '#c2410c', textDecoration: 'none' }}>
                                                    {employee.temporaryRoom.Apartment.Building.name}
                                                </Link>
                                                <span style={{ margin: '0 0.5rem', color: '#cbd5e1' }}>|</span>
                                                شقة {employee.temporaryRoom.Apartment.number}
                                                <span style={{ margin: '0 0.5rem', color: '#cbd5e1' }}>|</span>
                                                غرفة {employee.temporaryRoom.number}
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.75rem', background: '#fff7ed', borderRadius: '8px' }}>
                                            <Building size={20} color="#c2410c" />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', border: '1px dashed #e2e8f0' }}>
                                الموظف غير مسكن حالياً
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>تفاصيل الوظيفة</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تاريخ التعيين</div>
                                <div style={{ fontWeight: '500' }}>{employee.dateHired}</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                <Calendar size={20} color="var(--primary-color)" />
                            </div>
                        </div>
                        {employee.grade && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>الدرجة الوظيفية</div>
                                    <div style={{ fontWeight: '500' }}>
                                        {employee.grade}
                                        {employee.gradeDate && <span style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '0.5rem' }}>({employee.gradeDate})</span>}
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Briefcase size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.position && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>المسمى الوظيفي</div>
                                    <div style={{ fontWeight: '500' }}>
                                        {employee.position}
                                        {employee.currentJobTitleDate && <span style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '0.5rem' }}>({employee.currentJobTitleDate})</span>}
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Briefcase size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.currentWorkLocation && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>جهة العمل الحالية</div>
                                    <div style={{ fontWeight: '500' }}>{employee.currentWorkLocation}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Building size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.departmentBeforeLoan && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>الإدارة قبل الإعارة</div>
                                    <div style={{ fontWeight: '500' }}>{employee.departmentBeforeLoan}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Building size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.efficiencyReport && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تقرير الكفاءة</div>
                                    <div style={{ fontWeight: '500' }}>{employee.efficiencyReport}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <FileText size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.loanStartDate && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>فترة الإعارة</div>
                                    <div style={{ fontWeight: '500' }}>
                                        من {employee.loanStartDate}
                                        {employee.loanEndDate && <> إلى {employee.loanEndDate}</>}
                                    </div>
                                    {employee.loanEndDate && (
                                        <button
                                            onClick={handleArchiveLoan}
                                            style={{ fontSize: '0.75rem', color: '#64748b', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', marginTop: '0.25rem' }}
                                        >
                                            أرشفة هذه الفترة
                                        </button>
                                    )}
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Calendar size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.contractStartDate && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تاريخ بداية العقد</div>
                                    <div style={{ fontWeight: '500' }}>{employee.contractStartDate}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Calendar size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.contractEndDate && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تاريخ نهاية العقد</div>
                                    <div style={{ fontWeight: '500' }}>{employee.contractEndDate}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Calendar size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.arrivalDate && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تاريخ الوصول للكاميرون</div>
                                    <div style={{ fontWeight: '500' }}>{employee.arrivalDate}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <Calendar size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        )}
                        {employee.vacationStartDate && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تاريخ بداية الأجازة</div>
                                    <div style={{ fontWeight: '500', color: '#0284c7' }}>{employee.vacationStartDate}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#e0f2fe', borderRadius: '8px' }}>
                                    <Calendar size={20} color="#0284c7" />
                                </div>
                            </div>
                        )}
                        {employee.vacationReturnDate && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تاريخ العودة من الأجازة</div>
                                    <div style={{ fontWeight: '500', color: '#0284c7' }}>{employee.vacationReturnDate}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#e0f2fe', borderRadius: '8px' }}>
                                    <Calendar size={20} color="#0284c7" />
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>الراتب</div>
                                <div style={{ fontWeight: '500' }}>${Number(employee.salary).toLocaleString()}</div>
                            </div>
                            <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                <DollarSign size={20} color="var(--success-color)" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {(loanHistory.length > 0 || true) && ( // Always show section to allow adding
                <div className="card" style={{ maxWidth: '800px', margin: '2rem auto 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Calendar size={20} /> سجل الإعارات السابقة
                        </h3>
                        <button
                            onClick={() => setIsAddHistoryModalOpen(true)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                        >
                            + إضافة سجل سابق
                        </button>
                    </div>

                    {loanHistory.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>لا يوجد سجلات سابقة.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {loanHistory.map((loan) => (
                                <div key={loan.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>من {loan.startDate} إلى {loan.endDate}</div>
                                        {loan.notes && <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>{loan.notes}</div>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            مؤرشف
                                        </div>
                                        <button
                                            onClick={() => handleDeleteHistoryClick(loan.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#ef4444',
                                                padding: '0.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="حذف السجل"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <DocumentsSection employeeId={id} />

            {/* Modals */}
            <VacationModal
                isOpen={isVacationModalOpen}
                onClose={() => setIsVacationModalOpen(false)}
                employee={employee}
                onConfirm={async (vacationData) => {
                    try {
                        // 1. Create/Update Vacation Record (History)
                        await fetch(`${API_URL}/vacations`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                employeeId: id,
                                startDate: vacationData.startDate,
                                endDate: vacationData.returnDate,
                                returnDate: vacationData.returnDate,
                                type: vacationData.type,
                                duration: vacationData.duration,
                                travelDate: vacationData.travelDate
                            })
                        });

                        // 2. Update Employee Status
                        const response = await fetch(`${API_URL}/employees/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...employee,
                                vacationReturnDate: vacationData.returnDate,
                                vacationStartDate: vacationData.startDate,
                                arrivalDate: vacationData.returnDate,
                                airline: vacationData.airline,
                                arrivalDateBeforeVacation: employee.arrivalDateBeforeVacation || employee.arrivalDate,
                                travelDate: vacationData.travelDate
                            })
                        });
                        if (response.ok) {
                            fetchEmployee();
                            setIsVacationModalOpen(false);
                            setAlertModal({
                                isOpen: true,
                                title: 'تم الحفظ',
                                message: 'تم تحديث بيانات الأجازة بنجاح.',
                                type: 'success'
                            });
                        }
                    } catch (error) {
                        console.error('Error setting vacation:', error);
                    }
                }}
                onDelete={async () => {
                    try {
                        const response = await fetch(`${API_URL}/employees/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...employee,
                                vacationReturnDate: null,
                                vacationStartDate: null,
                                airline: null,
                                arrivalDate: employee.arrivalDateBeforeVacation || employee.arrivalDate,
                                arrivalDateBeforeVacation: null,
                                travelDate: null
                            })
                        });
                        if (response.ok) {
                            fetchEmployee();
                            setIsVacationModalOpen(false);
                            setAlertModal({
                                isOpen: true,
                                title: 'تم الحذف',
                                message: 'تم إلغاء الأجازة بنجاح والتراجع عن تغيير تاريخ الوصول.',
                                type: 'success'
                            });
                        }
                    } catch (error) {
                        console.error('Error deleting vacation:', error);
                    }
                }}
            />
            <ConfirmationModal
                isOpen={isEndVacationModalOpen}
                onClose={() => setIsEndVacationModalOpen(false)}
                title="إنهاء الأجازة"
                message="هل أنت متأكد أنك تريد إنهاء أجازة هذا الموظف؟"
                onConfirm={async () => {
                    try {
                        const today = new Date().toISOString().split('T')[0];
                        const response = await fetch(`${API_URL}/employees/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...employee,
                                vacationReturnDate: null,
                                arrivalDate: today // Automatically set Arrival Date to Today
                            })
                        });
                        if (response.ok) {
                            fetchEmployee();
                            setIsEndVacationModalOpen(false);
                        }
                    } catch (error) {
                        console.error('Error cancelling vacation:', error);
                    }
                }}
            />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="حذف الموظف"
                message="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
                onConfirm={deleteEmployee}
            />
            <ConfirmationModal
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                title="أرشفة فترة الإعارة"
                message="هل أنت متأكد من أرشفة فترة الإعارة الحالية؟ سيتم نقلها إلى السجل ومسحها من البيانات الحالية."
                onConfirm={confirmArchiveLoan}
            />
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
            <AddLoanHistoryModal
                isOpen={isAddHistoryModalOpen}
                onClose={() => setIsAddHistoryModalOpen(false)}
                onSave={handleManualHistoryAdd}
            />
            <ConfirmationModal
                isOpen={isDeleteHistoryModalOpen}
                onClose={() => setIsDeleteHistoryModalOpen(false)}
                title="حذف سجل"
                message="هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء."
                onConfirm={confirmDeleteHistory}
            />
            {/* Hidden PDF Content */}
            <div id="pdf-content" style={{
                display: 'none',
                width: '210mm',
                height: '297mm', // Fixed A4 height for absolute positioning
                padding: '10mm',
                background: 'white',
                color: 'black',
                direction: 'rtl',
                position: 'absolute',
                top: 0,
                right: '-9999px',
                boxSizing: 'border-box'
            }}>
                {/* Header with Logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #2980b9', paddingBottom: '5mm', marginBottom: '5mm' }}>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{ fontSize: '20px', margin: 0, color: '#2c3e50', fontWeight: 'bold' }}>المقاولون العرب الكاميرونيه</h1>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7f8c8d' }}>إدارة الموارد البشرية</p>
                    </div>
                    <img src={logo} alt="Logo" style={{ width: '60px', height: 'auto' }} />
                </div>

                {/* Profile Title & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5mm' }}>
                    <h2 style={{ fontSize: '22px', margin: 0, color: '#2c3e50' }}>بيانات موظف</h2>
                    <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                </div>

                {/* Main Info Block */}
                <div style={{ display: 'flex', gap: '10mm', marginBottom: '5mm', alignItems: 'flex-start' }}>
                    {/* Photo */}
                    <div style={{
                        width: '30mm',
                        height: '30mm',
                        borderRadius: '15px', // Softer square
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8fafc',
                        flexShrink: 0
                    }}>
                        {employee.photoUrl ? (
                            <img
                                src={`${API_URL.replace('/api', '')}${employee.photoUrl}`}
                                alt="Employee"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#64748b' }}>{employee.firstName[0]}{employee.lastName[0]}</span>
                        )}
                    </div>

                    {/* Basic Data Grid */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '20px', margin: '0 0 10px 0', color: '#1e293b' }}>{employee.firstName} {employee.lastName}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: '12px' }}>
                            <div><strong>المسمى الوظيفي:</strong> {employee.position} {employee.currentJobTitleDate && <span style={{ color: '#64748b' }}>({employee.currentJobTitleDate})</span>}</div>
                            {employee.jobRole && <div><strong>الوظيفة:</strong> {employee.jobRole}</div>}
                            <div><strong>القسم:</strong> {getDepartmentDisplay(employee.department)}</div>
                            {employee.costCenter && <div><strong>مركز التكلفة:</strong> {employee.costCenter}</div>}
                            <div><strong>البريد الإلكتروني:</strong> {employee.email || '-'}</div>
                            {employee.address && <div><strong>العنوان:</strong> {employee.address}</div>}

                            {/* Phone Numbers Group */}
                            {employee.cairoPhone && <div><strong>تليفون القاهرة:</strong> {employee.cairoPhone}</div>}
                            {employee.cameroonPhone && <div><strong>تليفون الكاميرون:</strong> {employee.cameroonPhone}</div>}
                            {employee.fixedNumber && <div><strong>الرقم الثابت:</strong> {employee.fixedNumber}</div>}
                        </div>
                    </div>
                </div>

                {/* Details Table */}
                {/* Details Grid (Replaces Table) */}
                {/* Details Flexbox Table (Replaces Grid/Table) */}
                <div style={{
                    border: '1px solid #e2e8f0',
                    borderBottom: 'none', // Last row adds bottom border
                    marginBottom: '5mm',
                    fontSize: '12px',
                    direction: 'rtl'
                }}>
                    {/* Helper for Row */}
                    {[
                        [
                            { label: 'تاريخ التعيين', value: employee.dateHired },
                            { label: 'تاريخ الوصول', value: employee.arrivalDate || '-' }
                        ],
                        [
                            { label: 'تاريخ بداية العقد', value: employee.contractStartDate },
                            { label: 'تاريخ نهاية العقد', value: employee.contractEndDate }
                        ],
                        [
                            { label: 'الدرجة الوظيفية', value: `${employee.grade || '-'} ${employee.gradeDate ? `(${employee.gradeDate})` : ''}` },
                            { label: 'المؤهل', value: `${employee.qualification || '-'} ${employee.qualificationDate ? `(${employee.qualificationDate})` : ''}` }
                        ],
                        [
                            { label: 'جهة العمل الحالية', value: employee.currentWorkLocation || '-' },
                            { label: 'الإدارة قبل الإعارة', value: employee.departmentBeforeLoan || '-' }
                        ],
                        [
                            { label: 'الراتب الأساسي', value: `$${Number(employee.salary).toLocaleString()}` },
                            {
                                label: 'الحالة الاجتماعية', value: (() => {
                                    const statusMap = { 'Single': 'أعزب', 'Married': 'متزوج', 'MarriedWithDependents': 'متزوج و يعول', 'Divorced': 'مطلق', 'Widowed': 'أرمل' };
                                    return statusMap[employee.maritalStatus] || employee.maritalStatus || '-';
                                })()
                            }
                        ],
                        [
                            { label: 'الاستراحه', value: employee.permanentRoom?.Apartment?.Building?.name || (employee.temporaryRoom?.Apartment?.Building?.name ? `${employee.temporaryRoom.Apartment.Building.name} (مؤقت)` : '-') },
                            { label: 'تقرير الكفاءة', value: employee.efficiencyReport || '-' }
                        ]
                    ].map((row, idx) => (
                        <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ width: '20%', padding: '6px 8px', fontWeight: 'bold', background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>{row[0].label}</div>
                            <div style={{ width: '30%', padding: '6px 8px', background: 'white', borderLeft: '1px solid #e2e8f0' }}>{row[0].value}</div>
                            <div style={{ width: '20%', padding: '6px 8px', fontWeight: 'bold', background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>{row[1].label}</div>
                            <div style={{ width: '30%', padding: '6px 8px', background: 'white' }}>{row[1].value}</div>
                        </div>
                    ))}

                    {/* Row 7 - Loan Period (Full Width) */}
                    {employee.loanStartDate && (
                        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ width: '20%', padding: '6px 8px', fontWeight: 'bold', background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>فترة الإعارة</div>
                            <div style={{ width: '80%', padding: '6px 8px', background: 'white' }}>
                                من {employee.loanStartDate} {employee.loanEndDate && `إلى ${employee.loanEndDate}`}
                            </div>
                        </div>
                    )}

                    {/* Row 8 - Vacation Return Date (Full Width) */}
                    {employee.vacationReturnDate && (
                        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ width: '20%', padding: '6px 8px', fontWeight: 'bold', background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>تاريخ العودة من الأجازة</div>
                            <div style={{ width: '80%', padding: '6px 8px', background: 'white', color: '#0369a1' }}>
                                {employee.vacationReturnDate}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ position: 'absolute', bottom: '10mm', left: '10mm', right: '10mm', textAlign: 'center', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '5mm' }}>
                    تم استخراج هذا المستند من نظام إدارة الموارد البشرية - المقاولون العرب الكاميرونية
                </div>
            </div>
        </div>
    );
}
