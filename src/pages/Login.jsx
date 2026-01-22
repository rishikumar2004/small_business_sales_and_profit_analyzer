import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { Lock, User, Briefcase, Eye, EyeOff } from 'lucide-react';
import loginIllustration from '../assets/login_illustration.png';

export default function Login() {
    const { login } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '', companyUsername: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');



    const fillDemo = () => {
        setFormData({
            username: 'demo_user',
            password: 'Safe@123',
            companyUsername: 'demo_company'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
            showNotification(`Welcome back, ${data.user.username}!`);
            login(data.token, data.user);
            navigate('/');
        } else {
            setError(data.message);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', overflow: 'hidden', padding: '1rem' }}>
            <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '900px',
                maxHeight: '85vh',
                padding: 0,
                display: 'flex',
                overflow: 'hidden',
                flexDirection: 'row'
            }}>
                {/* Left Side: Image & Description */}
                <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRight: '1px solid var(--border)',
                    textAlign: 'center'
                }} className="login-visual">
                    <img
                        src={loginIllustration}
                        alt="Tech Analytics"
                        style={{ width: '100%', maxWidth: '340px', borderRadius: '1.5rem', marginBottom: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    />
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '700' }}>Unlock Business Intelligence</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem', maxWidth: '340px', margin: '0 auto' }}>
                        Empower your decision-making with our advanced tech-driven financial analyzer. Track every cent and optimize your growth.
                    </p>
                </div>

                {/* Right Side: Form */}
                <div style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Tech Business Analyzer</h1>
                        <p className="subtitle" style={{ marginBottom: 0 }}>Advanced Business Intelligence</p>
                    </div>

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
                            <label>Company Username</label>
                            <div style={{ position: 'relative' }}>
                                <Briefcase size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '40px' }}
                                    type="text"
                                    required
                                    value={formData.companyUsername}
                                    onChange={e => setFormData({ ...formData, companyUsername: e.target.value })}
                                    placeholder="Enter company ID"
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Username</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '40px' }}
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '40px', paddingRight: '80px' }}
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '10px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1.5 }}>Sign In</button>
                            <button type="button" onClick={fillDemo} className="btn" style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Demo</button>
                        </div>
                        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>Register Now</Link>
                        </p>
                    </form>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media (max-width: 768px) {
                    .login-visual { display: none !important; }
                    .card { max-width: 450px !important; }
                }
            `}} />
        </div>
    );
}
