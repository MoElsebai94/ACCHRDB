import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Calendar, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../utils/api';
import DashboardCharts from '../components/DashboardCharts';
import PageLoading from '../components/PageLoading';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        departments: 0,
        monthlySalary: 0
    });
    const [employeesList, setEmployeesList] = useState([]);
    const [departmentsList, setDepartmentsList] = useState([]);
    const [residenceStats, setResidenceStats] = useState({
        totalBuildings: 0,
        totalRooms: 0,
        occupiedRooms: 0,
        occupancyRate: 0
    });
    const [expiringContracts, setExpiringContracts] = useState([]);
    const [stayAlerts, setStayAlerts] = useState([]);
    const [vacationAlerts, setVacationAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [empRes, deptRes, expRes, stayRes, vacRes, resStats] = await Promise.all([
                fetch(`${API_URL}/employees`),
                fetch(`${API_URL}/departments`),
                fetch(`${API_URL}/dashboard/expiring-contracts`),
                fetch(`${API_URL}/dashboard/stay-alerts`),
                fetch(`${API_URL}/dashboard/vacation-alerts`),
                fetch(`${API_URL}/dashboard/residence-stats`)
            ]);

            if (empRes.ok && deptRes.ok) {
                const employees = await empRes.json();
                const departments = await deptRes.json();

                if (Array.isArray(employees) && Array.isArray(departments)) {
                    const activeEmployees = employees.filter(emp => emp.isActive);
                    const totalSalary = activeEmployees.reduce((acc, curr) => acc + (parseFloat(curr.salary) || 0), 0);

                    setStats({
                        totalEmployees: activeEmployees.length,
                        departments: departments.length,
                        monthlySalary: totalSalary
                    });
                    setEmployeesList(activeEmployees);
                    setDepartmentsList(departments);
                }
            }

            if (expRes.ok) {
                const expiring = await expRes.json();
                if (Array.isArray(expiring)) {
                    setExpiringContracts(expiring);
                }
            }

            if (stayRes.ok) {
                const stay = await stayRes.json();
                if (Array.isArray(stay)) {
                    setStayAlerts(stay);
                }
            }

            if (vacRes.ok) {
                const vacation = await vacRes.json();
                if (Array.isArray(vacation)) {
                    setVacationAlerts(vacation);
                }
            }

            if (resStats.ok) {
                const resData = await resStats.json();
                setResidenceStats(resData);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoading />;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem' }}>إجمالي الموظفين</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary-color)', fontFamily: 'sans-serif' }}>
                        {stats.totalEmployees}
                    </p>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem' }}>الأقسام</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)', fontFamily: 'sans-serif' }}>
                        {stats.departments}
                    </p>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem' }}>الرواتب الشهرية</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success-color)', fontFamily: 'sans-serif' }}>
                        ${stats.monthlySalary.toLocaleString()}
                    </p>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem' }}>إشغال الاستراحات</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', fontFamily: 'sans-serif', margin: 0 }}>
                            {residenceStats.occupancyRate}%
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            ({residenceStats.occupiedRooms}/{residenceStats.totalRooms} غرفة)
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <DashboardCharts employees={employeesList} departments={departmentsList} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {Array.isArray(expiringContracts) && expiringContracts.length > 0 && (
                    <div className="card" style={{ borderRight: '4px solid #ef4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ef4444' }}>
                            <AlertTriangle size={24} />
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>تنبيهات العقود</h2>
                        </div>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            الموظفين التالية عقودهم ستنتهي قريباً أو انتهت بالفعل:
                        </p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {expiringContracts.map(emp => {
                                const isExpired = new Date(emp.contractEndDate) < new Date(new Date().setHours(0, 0, 0, 0));
                                return (
                                    <Link
                                        key={emp.id}
                                        to={`/employees/${emp.id}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: isExpired ? '#fee2e2' : '#fffbeb',
                                            borderRadius: '6px',
                                            border: `1px solid ${isExpired ? '#ef4444' : '#f59e0b'}`,
                                            color: isExpired ? '#991b1b' : '#92400e',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <span style={{ fontWeight: '500' }}>{emp.firstName} {emp.lastName}</span>
                                        <span>
                                            {isExpired ? 'انتهى العقد في: ' : 'ينتهي في: '}
                                            {emp.contractEndDate}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {Array.isArray(stayAlerts) && stayAlerts.length > 0 && (
                <div className="card" style={{ borderRight: '4px solid #f59e0b', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f59e0b' }}>
                        <Clock size={24} />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>تنبيهات الإقامة (4 أشهر)</h2>
                    </div>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        الموظفين الذين أوشكوا على إكمال 4 أشهر أو تجاوزوها:
                    </p>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {stayAlerts.map(emp => {
                            const fourMonthsMs = new Date(emp.fourMonthsDate).getTime();
                            const todayMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
                            const isOverdue = todayMs > fourMonthsMs;
                            let daysOverdue = 0;

                            if (isOverdue) {
                                daysOverdue = Math.floor((todayMs - fourMonthsMs) / (1000 * 60 * 60 * 24));
                            }

                            return (
                                <Link
                                    key={emp.id}
                                    to={`/employees/${emp.id}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem',
                                        background: isOverdue ? '#fee2e2' : '#fffbeb',
                                        borderRadius: '6px',
                                        border: `1px solid ${isOverdue ? '#ef4444' : '#fcd34d'}`,
                                        color: isOverdue ? '#991b1b' : '#92400e',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <span style={{ fontWeight: '500' }}>{emp.firstName} {emp.lastName}</span>
                                    <span>
                                        {isOverdue
                                            ? `تجاوز المدة بـ ${daysOverdue} يوم`
                                            : `يكمل 4 أشهر في: ${emp.fourMonthsDate}`
                                        }
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )
            }

            {
                Array.isArray(vacationAlerts) && vacationAlerts.length > 0 && (
                    <div className="card" style={{ borderRight: '4px solid #3b82f6', marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#3b82f6' }}>
                            <Calendar size={24} />
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>تنبيهات العودة من الأجازة</h2>
                        </div>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            الموظفين الذين سيعودون من الأجازة قريباً:
                        </p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {vacationAlerts.map(emp => (
                                <Link
                                    key={emp.id}
                                    to={`/employees/${emp.id}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem',
                                        background: '#eff6ff',
                                        borderRadius: '6px',
                                        border: '1px solid #dbeafe',
                                        color: '#1e40af',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <span style={{ fontWeight: '500' }}>{emp.firstName} {emp.lastName}</span>
                                    <span>يعود في: {emp.vacationReturnDate}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
