import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { Lock, User, Briefcase, Eye, EyeOff, Building } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        businessName: '',
        companyUsername: '',
        role: 'Admin'
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const validatePassword = (pwd) => {
        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        return hasUpper && hasLower && hasNumber && hasSpecial;
    };

    const validateUsername = (name) => /^[a-zA-Z0-9_]+$/.test(name);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateUsername(formData.companyUsername)) {
            setError("Company ID can only contain letters, numbers, and underscores (no spaces).");
            return;
        }

        if (!validateUsername(formData.username)) {
            setError("Username can only contain letters, numbers, and underscores (no spaces).");
            return;
        }

        if (!validatePassword(formData.password)) {
            setError("Password must contain: Capital, Small, Number, Special Character");
            return;
        }
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Account created successfully! Please login.');
            navigate('/login');
        } else {
            setError(data.message);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100vh', overflowY: 'auto', padding: '4rem 1rem 2rem' }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 className="title" style={{ fontSize: '1.5rem' }}>Tech Business Analyzer</h1>
                <p className="subtitle">Create your Tech Business Analyzer account</p>
                {error && <div style={{
                    color: 'var(--danger)',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Company ID (Unique Identifier) *</label>
                        <div style={{ position: 'relative' }}>
                            <Building size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                            <input
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                type="text"
                                required
                                value={formData.companyUsername}
                                onChange={e => setFormData({ ...formData, companyUsername: e.target.value })}
                                placeholder="e.g. my_company_123"
                            />
                        </div>
                        <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                            Letters, numbers, and underscores only.
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Business Name *</label>
                        <div style={{ position: 'relative' }}>
                            <Briefcase size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                            <input
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                type="text"
                                required
                                value={formData.businessName}
                                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                placeholder="My Awesome Business"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Username *</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                            <input
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                type="text"
                                required
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                placeholder="e.g. john_doe"
                            />
                        </div>
                        <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                            Letters, numbers, and underscores only.
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password *</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                            <input
                                className="input-field"
                                style={{ paddingLeft: '40px', paddingRight: '80px' }}
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Strong password required"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '10px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                            Must have: A-Z, a-z, 0-9, Special Char
                        </div>
                    </div>

                    <button className="btn btn-primary">Create Account</button>
                    <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>Login</Link>
                    </p>
                </form >
            </div >
        </div >
    );
}
