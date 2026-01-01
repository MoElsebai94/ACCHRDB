import React, { useState } from 'react';
import logo from '../assets/logo.png';
import { ArrowLeft } from 'lucide-react';

export default function LandingPage({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    const handleStart = () => {
        setIsVisible(false);
        setTimeout(onComplete, 500); // Wait for fade out transition
    };

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
            transition: 'opacity 0.5s ease-in-out',
            pointerEvents: isVisible ? 'auto' : 'none'
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
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
                    animation: 'fadeInUp 0.8s ease-out'
                }}>
                    <img
                        src={logo}
                        alt="Logo"
                        style={{
                            width: '180px',
                            height: 'auto',
                            marginBottom: '2rem',
                            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
                        }}
                    />

                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.025em',
                        lineHeight: 1.1
                    }}>
                        HR Database
                    </h1>

                    <h2 style={{
                        fontFamily: "'Cairo', sans-serif",
                        fontSize: '2rem',
                        fontWeight: '600',
                        color: '#64748b',
                        marginTop: '0.5rem',
                        marginBottom: '3rem'
                    }}>
                        الموارد البشرية
                    </h2>

                    <button
                        onClick={handleStart}
                        className="start-button"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 48px',
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: 'white',
                            background: '#0f172a',
                            border: 'none',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.5)',
                            transition: 'all 0.3s ease',
                            animation: 'fadeInUp 0.8s ease-out 0.3s backwards', // Delay appearance
                            fontFamily: "'Cairo', sans-serif"
                        }}
                    >
                        <span>بدء النظام</span>
                        <ArrowLeft size={24} />
                    </button>
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
                    .start-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 20px 30px -10px rgba(15, 23, 42, 0.6) !important;
                    }
                    .start-button:active {
                        transform: translateY(0);
                    }
                `}
            </style>
        </div>
    );
}
