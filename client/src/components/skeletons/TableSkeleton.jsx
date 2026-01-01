import React from 'react';
import Skeleton from '../Skeleton';

export default function TableSkeleton() {
    return (
        <div className="page-container" dir="rtl">
            {/* Header Controls Skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <Skeleton width="250px" height="40px" />
                    <Skeleton width="120px" height="40px" />
                    <Skeleton width="120px" height="40px" />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Skeleton width="140px" height="40px" />
                    <Skeleton width="40px" height="40px" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} width={`${100 / 5}%`} height="20px" />
                    ))}
                </div>
                {[...Array(8)].map((_, rowIndex) => (
                    <div key={rowIndex} style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Skeleton width="40px" height="40px" borderRadius="50%" />
                        <div style={{ flex: 1 }}>
                            <Skeleton width="80%" height="16px" style={{ marginBottom: '6px' }} />
                            <Skeleton width="50%" height="12px" />
                        </div>
                        <Skeleton width="15%" height="16px" />
                        <Skeleton width="15%" height="16px" />
                        <Skeleton width="15%" height="16px" />
                    </div>
                ))}
            </div>
        </div>
    );
}
