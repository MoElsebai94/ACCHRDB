import React, { useEffect, useState } from 'react';
import { Trash2, FolderTree, Pencil, X, FileText } from 'lucide-react';
import { API_URL } from '../utils/api';
import ConfirmationModal from '../components/ConfirmationModal';
import PageLoading from '../components/PageLoading';
import CustomSelect from '../components/CustomSelect';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../assets/logo.png';

export default function DepartmentList() {
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]); // Added for counts
    const [newDept, setNewDept] = useState('');
    const [newDeptParent, setNewDeptParent] = useState('');
    const [editingId, setEditingId] = useState(null); // Track editing state
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchDepartments();
        fetchEmployees();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${API_URL}/departments`);
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
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
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newDept.trim()) return;

        try {
            const url = editingId ? `${API_URL}/departments/${editingId}` : `${API_URL}/departments`;
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newDept,
                    parentId: newDeptParent || null
                })
            });

            if (response.ok) {
                setNewDept('');
                setNewDeptParent('');
                setEditingId(null);
                fetchDepartments();
            }
        } catch (error) {
            console.error('Error saving department:', error);
        }
    };

    const handleEdit = (dept) => {
        setNewDept(dept.name);
        setNewDeptParent(dept.parentId || '');
        setEditingId(dept.id);
    };

    const cancelEdit = () => {
        setNewDept('');
        setNewDeptParent('');
        setEditingId(null);
    };

    // ... handleDelete and getOrganizedDepartments remain same ...  
    const handleDelete = async () => {
        const id = confirmDelete.id;
        try {
            await fetch(`${API_URL}/departments/${id}`, { method: 'DELETE' });
            fetchDepartments();
            setConfirmDelete({ isOpen: false, id: null });
        } catch (error) {
            console.error('Error deleting department:', error);
        }
    };

    // Helper to build hierarchy
    const getOrganizedDepartments = () => {
        const map = {};
        const roots = [];

        // Deep copy to avoid mutating state directly in complex ways during render
        const depts = departments.map(d => ({ ...d, children: [] }));

        depts.forEach(d => {
            map[d.id] = d;
        });

        depts.forEach(d => {
            if (d.parentId && map[d.parentId]) {
                map[d.parentId].children.push(d);
            } else {
                roots.push(d);
            }
        });

        // Flatten for display
        const flatten = (nodes, level = 0) => {
            let result = [];
            nodes.forEach(node => {
                result.push({ ...node, level });
                if (node.children.length > 0) {
                    result = result.concat(flatten(node.children, level + 1));
                }
            });
            return result;
        };

        return flatten(roots);
    };

    const organizedDepartments = getOrganizedDepartments();

    // --- Report Generation Logic ---
    const generateStructurePDF = async () => {
        const element = document.getElementById('structure-report-printable');
        if (!element) return;

        try {
            setLoading(true);
            element.style.display = 'block';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            element.style.display = 'none';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('Company_Structure.pdf');

        } catch (error) {
            console.error('PDF Error:', error);
            alert('حدث خطأ أثناء إنشاء التقرير');
        } finally {
            setLoading(false);
        }
    };

    const calculateEmployeeCount = (deptName) => {
        if (!deptName) return 0;
        // Case-insensitive match
        const target = deptName.toLowerCase().trim();
        return employees.filter(e => e.department && e.department.toLowerCase().trim() === target && e.isActive).length;
    };

    // Recursive Tree Renderer for PDF
    const renderTreeNodes = (nodes) => {
        return nodes.map(node => (
            <div key={node.id} style={{ marginBottom: '10px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: node.level === 0 ? '#1e3a8a' : (node.level === 1 ? '#f1f5f9' : 'white'),
                    color: node.level === 0 ? 'white' : '#1e293b',
                    border: node.level === 0 ? 'none' : '1px solid #e2e8f0',
                    borderRight: node.level > 0 ? '4px solid #3b82f6' : 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }}>
                    <span>{node.name}</span>
                    <span style={{
                        backgroundColor: node.level === 0 ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                    }}>
                        {calculateEmployeeCount(node.name)} موظف
                    </span>
                </div>
                {node.children.length > 0 && (
                    <div style={{ marginRight: '20px', paddingRight: '10px', borderRight: '1px dashed #cbd5e1', marginTop: '5px' }}>
                        {renderTreeNodes(node.children)}
                    </div>
                )}
            </div>
        ));
    };

    // Inject GM for the report if not present
    const getReportData = () => {
        const data = [...organizedDepartments];
        // Check if GM exists (Arabic or English)
        const hasGM = data.some(d => d.name === 'المدير العام' || d.name === 'General Manager');

        let reportStructure = data.filter(d => d.level === 0);

        // If we want a strictly "General Manager" at top structure, we can simulate it
        // Or just return the roots. The user asked for "General Manager" at top.

        if (!hasGM) {
            // We can artificially render a GM node at the top of the report
            // But for now, let's just use the roots.
        }
        return reportStructure;
    };


    // Prepare options for CustomSelect, restricted to max depth for parents
    const parentOptions = [
        { value: '', label: '-- قسم رئيسي --' },
        ...organizedDepartments
            .filter(d => d.level < 1 && d.id !== editingId) // Limit: Can only add under Root (0)
            .map(d => ({
                value: d.id,
                label: (d.level > 0 ? '\u00A0\u00A0\u00A0\u00A0↳ ' : '') + d.name
            }))
    ];

    if (loading) return <PageLoading />;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <FolderTree size={32} color="#3b82f6" />
                    إدارة الأقسام
                </h1>
                <button
                    onClick={generateStructurePDF}
                    className="btn btn-primary"
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                >
                    <FileText size={18} /> هيكل الشركة (PDF)
                </button>
            </div>

            <div className="card" style={{ marginBottom: '2rem', position: 'relative', zIndex: 20 }}>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="input-label">
                            {editingId ? 'تعديل اسم القسم' : 'اسم القسم الجديد'}
                        </label>
                        <input
                            className="input-field"
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            placeholder="أدخل اسم القسم..."
                            required
                        />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <label className="input-label">تابع لقسم (اختياري)</label>
                        <CustomSelect
                            options={parentOptions}
                            value={newDeptParent}
                            onChange={setNewDeptParent}
                            placeholder="-- قسم رئيسي --"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button type="submit" className="btn btn-primary" style={{ marginBottom: '2px' }}>
                            {editingId ? 'حفظ التعديلات' : '+ إضافة قسم'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="btn btn-secondary"
                                style={{ marginBottom: '2px', padding: '0.75rem' }}
                                title="إلغاء"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>اسم القسم</th>
                            <th>التبعية</th>
                            <th style={{ width: '120px' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizedDepartments.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد أقسام مسجلة.</td>
                            </tr>
                        ) : (
                            organizedDepartments.map((dept) => (
                                <tr key={dept.id} style={{ backgroundColor: editingId === dept.id ? '#f1f5f9' : 'transparent' }}>
                                    <td style={{
                                        fontWeight: dept.level === 0 ? '600' : '400',
                                        paddingRight: `${dept.level * 20 + 10}px`
                                    }}>
                                        {dept.level > 0 && <span style={{ color: '#94a3b8', marginLeft: '5px' }}>↳</span>}
                                        {dept.name}
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                                        {dept.parentId ? 'قسم فرعي' : 'قسم رئيسي'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleEdit(dept)} className="btn btn-secondary" style={{ padding: '0.4rem', color: '#3b82f6', borderColor: '#3b82f6' }}>
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => setConfirmDelete({ isOpen: true, id: dept.id })} className="btn btn-danger" style={{ padding: '0.4rem' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="حذف القسم"
                message="هل أنت متأكد من حذف هذا القسم؟ قد يؤدي ذلك إلى حذف الأقسام الفرعية المرتبطة به."
            />

            {/* Hidden Printable Report */}
            <div id="structure-report-printable" style={{
                position: 'fixed', top: 0, left: '-10000px', zIndex: 1000,
                width: '210mm', padding: '15mm', backgroundColor: 'white', direction: 'rtl', fontFamily: 'Cairo, sans-serif'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #1e3a8a', paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img src={logo} alt="Logo" style={{ height: '60px' }} />
                        <div style={{ lineHeight: '1.4' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>المقاولون العرب الكاميرونيه</div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>Arab Contractors Cameroun</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                        <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                        <div>Structure Report</div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ marginBottom: '30px' }}>
                    {/* Artificial GM Node */}
                    <div style={{ marginBottom: '10px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 15px',
                            backgroundColor: '#f59e0b', // Gold for GM
                            color: 'white',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <span>المدير العام (General Manager)</span>
                            <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: '12px', fontSize: '14px' }}>
                                {calculateEmployeeCount('المدير العام') + calculateEmployeeCount('General Manager')} موظف
                            </span>
                        </div>
                        {/* Roots contain the rest */}
                        <div style={{ marginRight: '20px', paddingRight: '10px', borderRight: '2px dashed #9ca3af', marginTop: '10px' }}>
                            {renderTreeNodes(getReportData().filter(d => d.name !== 'المدير العام' && d.name !== 'General Manager'))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <div>إجمالي القوى العاملة: {employees.filter(e => e.isActive).length}</div>
                    <div>Generated by HR Database System</div>
                </div>
            </div>
        </div>
    );
}
