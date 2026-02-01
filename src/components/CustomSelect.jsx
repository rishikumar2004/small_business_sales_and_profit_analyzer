import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder = "Select option", icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getLabel = (opt) => {
        if (typeof opt === 'string') return opt;
        return opt.label || opt.value;
    };

    const getValue = (opt) => {
        if (typeof opt === 'string') return opt;
        return opt.value;
    };

    const selectedOption = options.find(opt => getValue(opt) === value);
    const displayValue = selectedOption ? getLabel(selectedOption) : placeholder;

    return (
        <div className="custom-select-container" ref={containerRef}>
            <button
                type="button"
                className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    {Icon && <Icon size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                    <span style={{
                        color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {displayValue}
                    </span>
                </div>
                <ChevronDown size={18} className="select-chevron" style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            </button>

            {isOpen && (
                <div className="custom-select-options">
                    {options.map((option) => {
                        const optValue = getValue(option);
                        const optLabel = getLabel(option);
                        const isSelected = value === optValue;

                        return (
                            <div
                                key={optValue}
                                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(optValue);
                                    setIsOpen(false);
                                }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <span>{optLabel}</span>
                                {isSelected && <Check size={14} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
