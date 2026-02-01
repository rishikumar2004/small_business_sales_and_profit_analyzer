import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { Lock, User, Store, Eye, EyeOff } from 'lucide-react';
import retailLoginVisual from '../assets/retail_login_visual.png';
import retailBgVisual from '../assets/retail_meaning_visual.png';

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
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            overflowY: 'auto',
            padding: '2rem 1rem',
            backgroundImage: `url(${retailBgVisual})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            position: 'relative'
        }}>
            {/* Dark Overlay for the whole page */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 100%)',
                zIndex: 0
            }} />

            <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '960px',
                padding: 0,
                display: 'flex',
                overflow: 'hidden',
                flexDirection: 'row',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    flex: 1,
                    position: 'relative',
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.3)'
                }} className="login-visual">
                    {/* Content Layer */}
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <img
                            src={retailLoginVisual}
                            alt="Retail Store Analytics"
                            style={{ width: '100%', maxWidth: '280px', borderRadius: '1.5rem', marginBottom: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}
                        />
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#fff', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Modern Store Management</h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', fontSize: '1rem', maxWidth: '320px', margin: '0 auto' }}>
                            Empower your R-mart team with smart analytics, real-time inventory tracking, and sales growth strategies.
                        </p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div style={{ flex: 1, padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h1 className="title" style={{ fontSize: '2.3rem', marginBottom: '1.8rem', lineHeight: '1.3', paddingBottom: '0.2rem' }}>
                            R-mart<br />
                            <span style={{ whiteSpace: 'nowrap' }}>business analyser</span>
                        </h1>
                        <p className="subtitle" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Smarter management for your modern shop.</p>
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
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div style={{ position: 'absolute', left: '14px', width: '20px', display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>
                                    <Store size={18} />
                                </div>
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '46px' }}
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
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div style={{ position: 'absolute', left: '14px', width: '20px', display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>
                                    <User size={18} />
                                </div>
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '46px' }}
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
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div style={{ position: 'absolute', left: '14px', width: '20px', display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)', zIndex: 1 }}>
                                    <Lock size={18} />
                                </div>
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '46px', paddingRight: '46px' }}
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 1
                                    }}
                                >
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
