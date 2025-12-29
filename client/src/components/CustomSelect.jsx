import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    icon: Icon,
    className = '',
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Normalize options to { value, label } format
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return opt;
        }
        return { value: opt, label: opt };
    });

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div
            className={`custom-select-container ${className}`}
            ref={containerRef}
            style={{ position: 'relative', width: '100%', zIndex: isOpen ? 50 : 'auto' }}
        >
            <div
                className="input-field"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    paddingRight: Icon ? '2.8rem' : '1rem', // Adjust if external icon is present
                    backgroundColor: disabled ? '#f1f5f9' : 'white',
                    opacity: disabled ? 0.7 : 1,
                    // Note: If using external standard icon placement, we might not need internal padding here, 
                    // but the standard input styling usually has padding.
                }}
            >
                {Icon && (
                    <Icon
                        size={20}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            color: '#94a3b8',
                            pointerEvents: 'none'
                        }}
                    />
                )}
                <span style={{ color: selectedOption ? 'inherit' : '#94a3b8' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    style={{
                        color: '#94a3b8',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        marginLeft: '0.5rem'
                    }}
                />
            </div>

            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        zIndex: 50,
                        maxHeight: '250px',
                        overflowY: 'auto'
                    }}
                >
                    {normalizedOptions.length > 0 ? (
                        normalizedOptions.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: value === option.value ? '#f1f5f9' : 'transparent',
                                    transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== option.value) e.currentTarget.style.backgroundColor = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== option.value) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check size={14} color="#3b82f6" />}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                            No options
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
