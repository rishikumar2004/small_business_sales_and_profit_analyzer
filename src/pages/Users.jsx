import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Search, UserPlus, Edit2, Trash2, Shield, Briefcase, X } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import usersBg from '../assets/users_bg.jpg';

export default function Users() {
    const { token, user: currentUser, theme } = useAuth();
    const { showNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm); // Optimize search responsiveness

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'Staff'
    });

    const roles = ['Admin', 'Owner', 'Accountant', 'Analyst', 'Staff'];

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.backgroundImage = `url(${usersBg})`;
            mainContent.style.backgroundSize = 'cover';
            mainContent.style.backgroundPosition = 'center';
            mainContent.style.backgroundAttachment = 'fixed';
            mainContent.style.position = 'relative';
        }

        if (isModalOpen) {
            if (mainContent) mainContent.style.overflowY = 'hidden';
        } else {
            if (mainContent) mainContent.style.overflowY = 'auto';
        }

        return () => {
            if (mainContent) {
                mainContent.style.backgroundImage = '';
                mainContent.style.backgroundSize = '';
                mainContent.style.backgroundPosition = '';
                mainContent.style.backgroundAttachment = '';
                mainContent.style.overflowY = 'auto';
            }
        };
    }, [isModalOpen]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const validateUsername = useCallback((name) => /^[a-zA-Z0-9_]+$/.test(name), []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        // Use functional state to get latest formData without dependency if needed, 
        // but here we can just depend on formData since it changes only on input.
        // Actually, best to just keep it simple as form submission isn't high frequency.

        if (!validateUsername(formData.username)) {
            alert("Username can only contain letters, numbers, and underscores (no spaces).");
            return;
        }

        const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showNotification(`User ${editingUser ? 'updated' : 'created'} successfully!`);
                fetchUsers();
                closeModal();
            } else {
                const data = await res.json();
                alert(data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving user:', error);
        }
    }, [formData, editingUser, token, fetchUsers, showNotification, validateUsername]);

    const handleDelete = useCallback(async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }, [token]);

    const openModal = useCallback((user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '', // Don't show password
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                role: 'Staff'
            });
        }
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingUser(null);
    }, []);

    // Optimized filtering using deferred value to keep UI responsive
    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.username.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
            u.role.toLowerCase().includes(deferredSearchTerm.toLowerCase())
        );
    }, [users, deferredSearchTerm]);

    if (loading) return <div className="fade-in">Loading users...</div>;

    return (
        <>
            {/* Dynamic Overlay for the page content */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: theme === 'light'
                    ? 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 100%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div className="fade-in" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '1400px', padding: '0 1rem' }}>
                    {/* Header Section */}
                    <div style={{
                        paddingBottom: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div className="flex-between">
                            <div>
                                <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>User Management</h1>
                                <p className="subtitle" style={{ color: 'var(--text-secondary)' }}>Manage store access and team roles</p>
                            </div>
                            <button onClick={() => openModal()} className="btn btn-primary" style={{ width: 'auto', gap: '8px', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)' }}>
                                <UserPlus size={18} /> Add New Member
                            </button>
                        </div>
                    </div>

                    {/* Search & Stats Area */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="card" style={{
                            padding: '1.25rem',
                            background: theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.6)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid var(--border)',
                            boxShadow: theme === 'light' ? '0 10px 25px rgba(0,0,0,0.05)' : '0 15px 35px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }}>
                                    <Search size={20} />
                                </div>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{
                                        paddingLeft: '48px',
                                        background: theme === 'light' ? '#fff' : 'rgba(15, 23, 42, 0.4)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="Search by name, role or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="card" style={{
                        padding: '0',
                        overflow: 'hidden',
                        background: theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.6)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--border)',
                        boxShadow: theme === 'light' ? '0 10px 25px rgba(0,0,0,0.05)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', background: theme === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(15, 23, 42, 0.3)' }}>
                                        <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Details</th>
                                        <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Level</th>
                                        <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Unit</th>
                                        <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '12px',
                                                        background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontWeight: '700',
                                                        fontSize: '1.1rem'
                                                    }}>
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.username}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{u.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{
                                                    background: u.role === 'Admin' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-primary)',
                                                    border: '1px solid var(--border)',
                                                    color: u.role === 'Admin' ? 'var(--accent)' : 'var(--text-primary)',
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <Shield size={12} /> {u.role.toUpperCase()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{u.businessName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Briefcase size={12} /> {u.companyUsername}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => openModal(u)} className="btn-icon-hover" style={{
                                                        padding: '10px',
                                                        borderRadius: '10px',
                                                        background: 'var(--bg-primary)',
                                                        border: '1px solid var(--border)',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer'
                                                    }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="btn-icon-hover"
                                                        style={{
                                                            padding: '10px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(239, 68, 68, 0.05)',
                                                            border: '1px solid rgba(239, 68, 68, 0.1)',
                                                            color: 'var(--danger)',
                                                            cursor: 'pointer'
                                                        }}
                                                        disabled={u.id === currentUser.id}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div style={{ padding: '4rem', textAlign: 'center' }}>
                                    <div style={{ marginBottom: '1rem', opacity: 0.3, color: 'var(--text-secondary)' }}>
                                        <Search size={48} style={{ margin: '0 auto' }} />
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>No matching team members found</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, backdropFilter: 'blur(16px)', padding: '2rem'
                }}>
                    <div className="card fade-in" style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2.5rem',
                        boxShadow: theme === 'light' ? '0 10px 40px rgba(0,0,0,0.1)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        background: 'var(--bg-secondary)',
                        position: 'relative',
                        border: '1px solid var(--border)'
                    }}>
                        <div className="flex-between" style={{ marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label style={{ color: 'var(--text-secondary)' }}>Username</label>
                                <input
                                    className="input-field"
                                    type="text"
                                    required
                                    style={{ background: theme === 'light' ? '#fff' : 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                                <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                                    Letters, numbers, and underscores only (no spaces).
                                </div>
                            </div>
                            <div className="input-group">
                                <label style={{ color: 'var(--text-secondary)' }}>Password {editingUser && '(Leave blank to keep current)'}</label>
                                <input
                                    className="input-field"
                                    type="password"
                                    required={!editingUser}
                                    style={{ background: theme === 'light' ? '#fff' : 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ color: 'var(--text-secondary)' }}>Role</label>
                                <CustomSelect
                                    options={roles}
                                    value={formData.role}
                                    onChange={(val) => setFormData({ ...formData, role: val })}
                                    placeholder="Select role"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                <button type="button" onClick={closeModal} className="btn" style={{ flex: 1, background: 'var(--bg-primary)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingUser ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
