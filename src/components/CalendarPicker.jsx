import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPicker({ value, onChange, placeholder = 'Select date' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(value || new Date()));
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

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    };

    const handleDateSelect = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const offset = newDate.getTimezoneOffset();
        const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
        onChange(adjustedDate.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    const changeMonth = (offset) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const displayDate = value
        ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : placeholder;

    return (
        <div className="custom-select-container" ref={containerRef}>
            <div
                className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar size={18} style={{ color: 'var(--accent)' }} />
                    <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{displayDate}</span>
                </div>
                <ChevronDown size={18} className="select-chevron" />
            </div>

            {isOpen && (
                <div className="custom-select-options calendar-dropdown" style={{ padding: '1.25rem', width: '310px', right: 0, left: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <button type="button" onClick={() => changeMonth(-1)} className="btn-icon">
                            <ChevronLeft size={16} />
                        </button>
                        <div style={{ fontWeight: '700', fontSize: '1rem' }}>
                            {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                        <button type="button" onClick={() => changeMonth(1)} className="btn-icon">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} style={{ fontWeight: '600' }}>{day}</div>)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                        {generateCalendar().map((day, i) => {
                            const isSelected = value &&
                                new Date(value).getDate() === day &&
                                new Date(value).getMonth() === viewDate.getMonth() &&
                                new Date(value).getFullYear() === viewDate.getFullYear();
                            return (
                                <div
                                    key={i}
                                    className={`calendar-day ${day ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
                                    style={{ fontSize: '0.9rem', height: '36px' }}
                                    onClick={() => day && handleDateSelect(day)}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
