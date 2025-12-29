import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

export default function LandingPage({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Fade out animation start
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3000); // Show for 3 seconds

        // Unmount trigger
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 3500); // Wait for fade out to finish

        return () => {
            clearTimeout(timer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            zIndex: 9999,
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
        }}>
            {/* Left Sidebar Placeholder (matches app sidebar width/color) */}
            <div style={{
                width: '280px',
                height: '100%',
                backgroundColor: '#0f172a',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                transform: 'translateX(0)',
                transition: 'transform 0.5s ease-out',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%)',
                    animation: 'spin 15s linear infinite'
                }} />
            </div>

            {/* Right Content Area */}
            <div style={{
                flex: 1,
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'fadeInUp 1s ease-out'
                }}>
                    <img
                        src={logo}
                        alt="Logo"
                        style={{
                            width: '180px',
                            height: 'auto',
                            marginBottom: '2.5rem',
                            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
                            transform: 'scale(1)',
                            transition: 'transform 3s ease-out'
                        }}
                    />

                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '3rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.025em',
                        borderBottom: '4px solid #eab308',
                        paddingBottom: '0.5rem'
                    }}>
                        HR Database
                    </h1>

                    <h2 style={{
                        fontFamily: "'Cairo', sans-serif",
                        fontSize: '2.2rem',
                        fontWeight: '600',
                        color: '#64748b',
                        marginTop: '1rem'
                    }}>
                        الموارد البشرية
                    </h2>
                </div>
            </div>

            <style>
                {`
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translate3d(0, 30px, 0);
                        }
                        to {
                            opacity: 1;
                            transform: translate3d(0, 0, 0);
                        }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
}
