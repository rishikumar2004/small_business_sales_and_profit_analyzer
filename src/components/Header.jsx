import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react';

export default function Header({ title }) {
    const { theme, toggleTheme, user } = useAuth();

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
                <h1 className="title" style={{ margin: 0 }}>{title || 'Small Business Analyzer'}</h1>
                <p className="subtitle" style={{ margin: 0 }}>Hello, {user?.businessName || 'Business Owner'}</p>
            </div>

            <button
                onClick={toggleTheme}
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
        </div>
    );
}
