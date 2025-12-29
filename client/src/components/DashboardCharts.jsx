import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function DashboardCharts({ employees = [] }) {
    // 1. Calculate Employees Per Department
    const empPerDept = useMemo(() => {
        const counts = {};
        employees.forEach(emp => {
            const dept = emp.department || 'غير محدد';
            counts[dept] = (counts[dept] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count); // Sort by count descending
    }, [employees]);

    // 2. Calculate Salary Per Department
    const salaryPerDept = useMemo(() => {
        const salaries = {};
        employees.forEach(emp => {
            const dept = emp.department || 'غير محدد';
            const salary = parseFloat(emp.salary) || 0;
            salaries[dept] = (salaries[dept] || 0) + salary;
        });
        return Object.entries(salaries)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);
    }, [employees]);

    // 3. Calculate Employees Per Cost Center
    const empPerCostCenter = useMemo(() => {
        const counts = {};
        employees.forEach(emp => {
            const cc = emp.costCenter || 'غير محدد';
            counts[cc] = (counts[cc] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [employees]);

    // 4. Calculate Salary Per Cost Center
    const salaryPerCostCenter = useMemo(() => {
        const salaries = {};
        employees.forEach(emp => {
            const cc = emp.costCenter || 'غير محدد';
            const salary = parseFloat(emp.salary) || 0;
            salaries[cc] = (salaries[cc] || 0) + salary;
        });
        return Object.entries(salaries)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);
    }, [employees]);

    if (employees.length === 0) return null;

    // Helper to render a custom HTML bar chart
    const renderCustomChart = (data, valueKey, color, formatter = (val) => val) => {
        const maxValue = Math.max(...data.map(d => d[valueKey]), 1);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0 0.5rem' }}>
                {data.map((item, index) => {
                    const widthPercent = (item[valueKey] / maxValue) * 100;
                    return (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Label */}
                            <div style={{ width: '120px', textAlign: 'left', fontWeight: '500', color: '#475569', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                            </div>

                            {/* Bar Track */}
                            <div style={{ flex: 1, background: '#f1f5f9', height: '16px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                                {/* Bar Fill */}
                                <div style={{
                                    width: `${widthPercent}%`,
                                    background: color,
                                    height: '100%',
                                    borderRadius: '8px',
                                    transition: 'width 1s ease-in-out'
                                }}></div>
                            </div>

                            {/* Value Label */}
                            <div style={{ width: '60px', textAlign: 'right', fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>
                                {formatter(item[valueKey])}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* Chart 1: Employees Count */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>توزيع الموظفين حسب القسم</h3>
                {renderCustomChart(empPerDept, 'count', '#3b82f6')}
            </div>

            {/* Chart 2: Salary Distribution */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>توزيع الرواتب حسب القسم</h3>
                {renderCustomChart(salaryPerDept, 'total', '#10b981', (val) => `$${val.toLocaleString()}`)}
            </div>

            {/* Chart 3: Employees Per Cost Center */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>توزيع الموظفين حسب مركز التكلفة</h3>
                {renderCustomChart(empPerCostCenter, 'count', '#8b5cf6')}
            </div>

            {/* Chart 4: Salary Per Cost Center */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>توزيع الرواتب حسب مركز التكلفة</h3>
                {renderCustomChart(salaryPerCostCenter, 'total', '#f59e0b', (val) => `$${val.toLocaleString()}`)}
            </div>
        </div>
    );
}
