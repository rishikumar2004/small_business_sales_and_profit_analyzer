import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, User as UserIcon, Briefcase, Settings, ChevronDown, Check } from 'lucide-react';
import Header from '../components/Header';

export default function Profile() {
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({ businessName: '', currency: '', theme: '' });
    const [msg, setMsg] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currencies = [
        { code: 'USD', label: 'USD ($)' },
        { code: 'EUR', label: 'EUR (€)' },
        { code: 'GBP', label: 'GBP (£)' },
        { code: 'INR', label: 'INR (₹)' }
    ];

    useEffect(() => {
        if (user) {
            setFormData({
                businessName: user.businessName || '',
                currency: user.currency || 'USD',
                theme: user.theme || 'dark'
            });
        }
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
            login(localStorage.getItem('token'), data);
            setMsg('Profile updated successfully!');
            setTimeout(() => setMsg(''), 3000);
        }
    };

    const selectedCurrencyLabel = currencies.find(c => c.code === formData.currency)?.label || formData.currency;

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Profile Settings" />

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div className="card" style={{ width: '100%', maxWidth: '480px', overflow: 'visible', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
                        <div style={{ padding: '1.25rem', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserIcon size={40} color="var(--accent)" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{user?.username}</h2>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Administrator</p>
                        </div>
                    </div>

                    {msg && <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{msg}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'block' }}>Business Name</label>
                            <div style={{ position: 'relative' }}>
                                <Briefcase size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '40px' }}
                                    type="text"
                                    value={formData.businessName}
                                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="input-group" style={{ position: 'relative', margin: 0 }} ref={dropdownRef}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'block' }}>Currency</label>
                            <div
                                className="input-field"
                                style={{
                                    paddingLeft: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <Settings size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
                                <span>{selectedCurrencyLabel}</span>
                                <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                            </div>

                            {isDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    marginTop: '0.5rem',
                                    zIndex: 50,
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    overflow: 'hidden'
                                }}>
                                    {currencies.map(c => (
                                        <div
                                            key={c.code}
                                            onClick={() => {
                                                setFormData({ ...formData, currency: c.code });
                                                setIsDropdownOpen(false);
                                            }}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: formData.currency === c.code ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                color: formData.currency === c.code ? 'var(--accent)' : 'var(--text-primary)',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (formData.currency !== c.code) e.currentTarget.style.background = 'var(--bg-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (formData.currency !== c.code) e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            {c.label}
                                            {formData.currency === c.code && <Check size={16} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                            <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
