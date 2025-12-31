import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, X } from 'lucide-react';
import { API_URL } from '../utils/api';
import CustomSelect from '../components/CustomSelect';

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        department: '',
        costCenter: '',
        salary: '',
        dateHired: '',
        fixedNumber: '',
        jobRole: '',
        contractStartDate: '',
        contractEndDate: '',
        arrivalDate: '',
        photoUrl: '',
        qualification: '',
        qualificationDate: '',
        maritalStatus: 'Single',
        grade: '',
        gradeDate: '',
        currentJobTitleDate: '',
        loanStartDate: '',
        loanEndDate: '',
        isActive: true,
        departmentBeforeLoan: '',
        currentWorkLocation: '',
        cairoPhone: '',
        cameroonPhone: '',
        address: '',
        efficiencyReport: ''
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [costCenters, setCostCenters] = useState([]);

    useEffect(() => {
        if (isEditMode) {
            fetchEmployee();
        }
        fetchDepartments();
        fetchCostCenters();
    }, [id]);

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

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${API_URL}/departments`);
            if (response.ok) {
                const data = await response.json();

                // Organize hierarchy
                const map = {};
                const roots = [];
                const depts = data.map(d => ({ ...d, children: [] }));

                depts.forEach(d => map[d.id] = d);
                depts.forEach(d => {
                    if (d.parentId && map[d.parentId]) {
                        map[d.parentId].children.push(d);
                    } else {
                        roots.push(d);
                    }
                });

                // Flatten with visual hierarchy
                const flatten = (nodes, level = 0) => {
                    let result = [];
                    nodes.forEach(node => {
                        // Create indented label
                        const prefix = level > 0 ? '\u00A0\u00A0\u00A0\u00A0'.repeat(level) + '↳ ' : '';
                        result.push({ value: node.name, label: prefix + node.name });

                        if (node.children.length > 0) {
                            result = result.concat(flatten(node.children, level + 1));
                        }
                    });
                    return result;
                };

                const options = flatten(roots);
                setDepartments(options);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchEmployee = async () => {
        try {
            const response = await fetch(`${API_URL}/employees/${id}`);
            if (response.ok) {
                const data = await response.json();
                setFormData(data);
                if (data.photoUrl) {
                    setPreviewUrl(`${API_URL.replace('/api', '')}${data.photoUrl}`);
                }
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('فقط الصور من نوع JPG, JPEG, PNG, WEBP مسموحة');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
                return;
            }
            setSelectedFile(file);

            // Use FileReader instead of createObjectURL for better reliability
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation - check all fields except email and vacationReturnDate
        // If inactive, salary is not required/can be zero/empty string
        const requiredFields = ['firstName', 'lastName', 'position', 'department', 'dateHired', 'fixedNumber', 'jobRole', 'contractStartDate', 'arrivalDate'];
        if (formData.isActive) {
            requiredFields.push('salary');
        }

        const missing = requiredFields.filter(f => !formData[f] || (typeof formData[f] === 'string' && !formData[f].trim()));

        if (missing.length > 0) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const url = isEditMode
            ? `${API_URL}/employees/${id}`
            : `${API_URL}/employees`;

        const method = isEditMode ? 'PUT' : 'POST';

        // Clean data: convert empty strings to null for the backend
        let cleanedData = { ...formData };
        if (cleanedData.email === '') cleanedData.email = null;
        cleanedData.isActive = !!formData.isActive; // Force boolean

        try {
            setIsUploading(true);

            // Upload photo if selected
            if (selectedFile) {
                const photoFormData = new FormData();
                photoFormData.append('photo', selectedFile);

                const uploadRes = await fetch(`${API_URL}/upload-photo`, {
                    method: 'POST',
                    body: photoFormData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    cleanedData.photoUrl = uploadData.url;
                } else {
                    alert('فشل رفع الصورة');
                    setIsUploading(false);
                    return;
                }
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData)
            });

            if (response.ok) {
                navigate('/employees');
            } else {
                const errorData = await response.json();
                let errorMessage = errorData.error || response.statusText;

                if (errorMessage.includes('Validation isEmail on email failed')) {
                    errorMessage = "البريد الإلكتروني غير صحيح";
                } else if (errorMessage.includes('email must be unique')) {
                    errorMessage = "البريد الإلكتروني مسجل لموظف آخر";
                }

                alert(`خطأ في حفظ البيانات: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(`خطأ في الاتصال: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>{isEditMode ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h1>
            <form onSubmit={handleSubmit} className="card">
                {/* Photo Upload Section */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => document.getElementById('photo-input').click()}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: '#f1f5f9',
                                border: '2px dashed #cbd5e1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                        >
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        alert('فشل عرض الصورة. قد يكون الملف تالفاً.');
                                    }}
                                />
                            ) : (
                                <>
                                    <Camera size={24} color="#94a3b8" />
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>رفع صورة</span>
                                </>
                            )}

                            {/* Hover overlay */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s'
                            }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                                onMouseOut={(e) => e.currentTarget.style.opacity = 0}
                            >
                                <Upload size={20} color="white" />
                            </div>
                        </div>

                        {previewUrl && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                    setFormData(prev => ({ ...prev, photoUrl: '' }));
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}

                        <input
                            id="photo-input"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {/* Status Toggle */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                    <label style={{ fontWeight: '600', color: '#475569' }}>حالة الموظف:</label>
                    <div
                        onClick={() => {
                            const newStatus = !formData.isActive;
                            setFormData(prev => ({
                                ...prev,
                                isActive: newStatus,
                                costCenter: newStatus ? prev.costCenter : '', // Clear if becoming inactive
                                salary: newStatus ? prev.salary : 0 // Zero if becoming inactive
                            }));
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            background: formData.isActive ? '#dcfce7' : '#fee2e2',
                            color: formData.isActive ? '#166534' : '#991b1b',
                            border: `1px solid ${formData.isActive ? '#bbf7d0' : '#fecaca'}`,
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: formData.isActive ? '#166534' : '#991b1b'
                        }} />
                        {formData.isActive ? 'نشط (Active)' : 'غير نشط (Inactive)'}
                    </div>
                </div>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">الاسم الأول</label>
                        <input
                            className="input-field"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">اسم العائلة</label>
                        <input
                            className="input-field"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">البريد الإلكتروني <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(اختياري)</span></label>
                    <input
                        className="input-field"
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">المؤهل</label>
                        <input
                            className="input-field"
                            name="qualification"
                            value={formData.qualification || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">تاريخ المؤهل</label>
                        <input
                            className="input-field"
                            type="date"
                            name="qualificationDate"
                            value={formData.qualificationDate || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label className="input-label">الحالة الاجتماعية</label>
                    <CustomSelect
                        options={[
                            { value: 'Single', label: 'أعزب' },
                            { value: 'Married', label: 'متزوج' },
                            { value: 'MarriedWithDependents', label: 'متزوج و يعول' },
                            { value: 'Divorced', label: 'مطلق' },
                            { value: 'Widowed', label: 'أرمل' }
                        ]}
                        value={formData.maritalStatus || 'Single'}
                        onChange={(val) => setFormData(prev => ({ ...prev, maritalStatus: val }))}
                        placeholder="اختر الحالة الاجتماعية"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">الدرجة الوظيفية</label>
                        <input
                            className="input-field"
                            name="grade"
                            value={formData.grade || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">تاريخ الدرجة</label>
                        <input
                            className="input-field"
                            type="date"
                            name="gradeDate"
                            value={formData.gradeDate || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">تاريخ بداية الإعارة</label>
                        <input
                            className="input-field"
                            type="date"
                            name="loanStartDate"
                            value={formData.loanStartDate || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">تاريخ انتهاء الإعارة</label>
                        <input
                            className="input-field"
                            type="date"
                            name="loanEndDate"
                            value={formData.loanEndDate || ''}
                            onChange={handleChange}
                            disabled={formData.isActive}
                            style={{
                                background: formData.isActive ? '#f1f5f9' : 'white',
                                cursor: formData.isActive ? 'not-allowed' : 'text'
                            }}
                        />
                        {formData.isActive && <small style={{ color: '#94a3b8' }}>متاح فقط للموظفين غير النشطين</small>}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">القسم</label>
                        <CustomSelect
                            options={[
                                { value: '', label: 'اختر القسم' },
                                ...departments.map(dept => ({ value: dept.name, label: dept.name }))
                            ]}
                            value={formData.department}
                            onChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                            placeholder="اختر القسم"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">مركز التكلفة</label>
                        <CustomSelect
                            options={[
                                { value: '', label: 'اختر مركز التكلفة' },
                                ...costCenters.map(cc => ({ value: cc.name, label: cc.name }))
                            ]}
                            value={formData.costCenter || ''}
                            onChange={(val) => setFormData(prev => ({ ...prev, costCenter: val }))}
                            placeholder="اختر مركز التكلفة"
                            disabled={!formData.isActive}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">المسمي الوظيفي</label>
                        <input
                            className="input-field"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">تاريخ المسمى</label>
                        <input
                            className="input-field"
                            type="date"
                            name="currentJobTitleDate"
                            value={formData.currentJobTitleDate || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">الوظيفة</label>
                        <input
                            className="input-field"
                            name="jobRole"
                            value={formData.jobRole || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">الرقم الثابت</label>
                        <input
                            className="input-field"
                            name="fixedNumber"
                            value={formData.fixedNumber || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">الراتب</label>
                        <input
                            className="input-field"
                            type="number"
                            name="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            required={(formData.isActive || false)} // Salary not required if inactive (disabled)
                            disabled={!formData.isActive}
                            style={{
                                background: !formData.isActive ? '#f1f5f9' : 'white',
                                cursor: !formData.isActive ? 'not-allowed' : 'text'
                            }}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">تاريخ التعيين</label>
                        <input
                            className="input-field"
                            type="date"
                            name="dateHired"
                            value={formData.dateHired}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">تاريخ بداية العقد</label>
                        <input
                            className="input-field"
                            type="date"
                            name="contractStartDate"
                            value={formData.contractStartDate || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">تاريخ الوصول للكاميرون</label>
                        <input
                            className="input-field"
                            type="date"
                            name="arrivalDate"
                            value={formData.arrivalDate || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <div className="input-group">
                        <label className="input-label">العنوان</label>
                        <input
                            className="input-field"
                            name="address"
                            value={formData.address || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">تقرير الكفاءة</label>
                        <input
                            className="input-field"
                            name="efficiencyReport"
                            value={formData.efficiencyReport || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">التليفون بالقاهره</label>
                        <input
                            className="input-field"
                            name="cairoPhone"
                            value={formData.cairoPhone || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">التليفون بالكاميرون</label>
                        <input
                            className="input-field"
                            name="cameroonPhone"
                            value={formData.cameroonPhone || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">جهه العمل الحاليه</label>
                        <input
                            className="input-field"
                            name="currentWorkLocation"
                            value={formData.currentWorkLocation || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">الادارة قبل الاعاره</label>
                        <input
                            className="input-field"
                            name="departmentBeforeLoan"
                            value={formData.departmentBeforeLoan || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={isUploading}>
                        {isUploading ? 'جاري الحفظ...' : (isEditMode ? 'تحديث البيانات' : 'إنشاء الموظف')}
                    </button>
                    <button type="button" onClick={() => navigate('/employees')} className="btn btn-secondary">
                        إلغاء
                    </button>
                </div>
            </form >
        </div >
    );
}
