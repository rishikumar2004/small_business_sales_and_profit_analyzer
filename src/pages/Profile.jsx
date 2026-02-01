import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, User as UserIcon, Briefcase, Settings, ChevronDown, Check, Trash2, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import CustomSelect from '../components/CustomSelect';

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

    const handleResetTransactions = async () => {
        if (!window.confirm("Are you SURE you want to delete ALL transactions for your company? This cannot be undone.")) return;

        try {
            const res = await fetch('/api/transactions/all', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMsg(data.message || 'Transactions reset successfully!');
                setTimeout(() => setMsg(''), 3000);
            }
        } catch (error) {
            console.error('Reset failed:', error);
        }
    };

    const handleResetUsers = async () => {
        if (!window.confirm("Are you SURE you want to delete ALL staff/users for your company (except yourself)? This cannot be undone.")) return;

        try {
            const res = await fetch('/api/admin/reset/users', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMsg(data.message || 'Users reset successfully!');
                setTimeout(() => setMsg(''), 3000);
            }
        } catch (error) {
            console.error('Reset failed:', error);
        }
    };

    const selectedCurrencyLabel = currencies.find(c => c.code === formData.currency)?.label || formData.currency;

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Profile Settings" />

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', maxWidth: '1100px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
                    {/* Left Card: Profile Information */}
                    <div className="card" style={{ flex: '1', minWidth: '400px', maxWidth: '520px', overflow: 'visible', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '1.25rem', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserIcon size={40} color="var(--accent)" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{user?.username}</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.role === 'Admin' ? 'Administrator' : 'Staff Member'}</p>
                            </div>
                        </div>

                        {msg && <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{msg}</div>}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'block' }}>Business Name</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <div style={{ position: 'absolute', left: '14px', width: '20px', display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>
                                        <Briefcase size={18} />
                                    </div>
                                    <input
                                        className="input-field"
                                        style={{ paddingLeft: '46px' }}
                                        type="text"
                                        value={formData.businessName}
                                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'block' }}>Currency</label>
                                <CustomSelect
                                    options={currencies.map(c => ({ label: c.label, value: c.code }))}
                                    value={formData.currency}
                                    onChange={(val) => setFormData({ ...formData, currency: val })}
                                    icon={Settings}
                                    placeholder="Select Currency"
                                />
                            </div>

                            <button className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Changes
                            </button>
                        </form>
                    </div>

                    {/* Right Card: Danger Zone (Admin Only) */}
                    {user?.role === 'Admin' && (
                        <div className="card" style={{ flex: '1', minWidth: '400px', maxWidth: '520px', padding: '2.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--danger)' }}>
                                <AlertCircle size={24} />
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Danger Zone</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <div style={{ flex: 1, marginRight: '1rem' }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Reset Transactions</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Clear all business transaction history.</div>
                                    </div>
                                    <button
                                        onClick={handleResetTransactions}
                                        style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                                    >
                                        <Trash2 size={16} /> Reset
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <div style={{ flex: 1, marginRight: '1rem' }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Reset Users</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Remove all staff accounts from your company.</div>
                                    </div>
                                    <button
                                        onClick={handleResetUsers}
                                        style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                                    >
                                        <Trash2 size={16} /> Reset
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                <b>Warning:</b> Actions in this section are permanent and cannot be reversed. Please proceed with extreme caution.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
