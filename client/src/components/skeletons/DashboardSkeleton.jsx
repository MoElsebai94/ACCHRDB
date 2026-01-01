import React from 'react';
import Skeleton from '../Skeleton';

export default function DashboardSkeleton() {
    return (
        <div className="page-container" dir="rtl">
            {/* Header Skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <Skeleton width="200px" height="32px" style={{ marginBottom: '10px' }} />
                    <Skeleton width="300px" height="20px" />
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[1, 2, 3].map((i) => (
                    <div className="card" key={i} style={{ height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Skeleton width="120px" height="24px" />
                        <Skeleton width="80px" height="48px" />
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Skeleton width="150px" height="24px" />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px' }}>
                        {[...Array(5)].map((_, idx) => (
                            <Skeleton key={idx} width="40px" height={`${Math.random() * 60 + 20}%`} />
                        ))}
                    </div>
                </div>
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Skeleton width="150px" height="24px" />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Skeleton width="200px" height="200px" borderRadius="50%" />
                    </div>
                </div>
            </div>
        </div>
    );
}
