import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserPlus, Trash2, Edit2, Shield, Search, X, Check, Briefcase } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function Users() {
    const { token, user: currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
        if (isModalOpen) {
            if (mainContent) mainContent.style.overflowY = 'hidden';
        } else {
            if (mainContent) mainContent.style.overflowY = 'auto';
        }
        return () => {
            if (mainContent) mainContent.style.overflowY = 'auto';
        };
    }, [isModalOpen]);

    const fetchUsers = async () => {
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
    };

    const validateUsername = (name) => /^[a-zA-Z0-9_]+$/.test(name);

    const handleSubmit = async (e) => {
        e.preventDefault();

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
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const openModal = (user = null) => {
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
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="fade-in">Loading users...</div>;

    return (
        <>
            <div className="fade-in">
                {/* Sticky Header Section */}
                <div style={{
                    position: 'sticky',
                    top: '-2rem', // Adjust for main-content padding
                    zIndex: 10,
                    backgroundColor: 'var(--bg-primary)',
                    paddingTop: '2rem',
                    paddingBottom: '1.5rem',
                    marginTop: '-2rem',
                }}>
                    <div className="flex-between" style={{ marginBottom: '2rem' }}>
                        <div>
                            <h1 className="title" style={{ fontSize: '1.8rem' }}>User Management</h1>
                            <p className="subtitle">Manage roles and permissions</p>
                        </div>
                        <button onClick={() => openModal()} className="btn btn-primary" style={{ width: 'auto', gap: '8px' }}>
                            <UserPlus size={18} /> Add User
                        </button>
                    </div>

                    <div className="card" style={{ padding: '1rem', marginBottom: '0' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden', marginTop: '1.5rem' }}>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>User</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Role</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Business</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: '600' }}>{u.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {u.id}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                background: u.role === 'Admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                                                color: u.role === 'Admin' ? 'var(--accent)' : 'var(--text-primary)',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div>{u.businessName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.companyUsername}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openModal(u)} className="btn" style={{ padding: '8px', width: 'auto', background: 'var(--bg-card)' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="btn"
                                                    style={{ padding: '8px', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
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
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, backdropFilter: 'blur(8px)', padding: '2rem'
                }}>
                    <div className="card fade-in" style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        position: 'relative'
                    }}>
                        <div className="flex-between" style={{ marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button onClick={closeModal} style={{ background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Username</label>
                                <input
                                    className="input-field"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                                <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                                    Letters, numbers, and underscores only (no spaces).
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Password {editingUser && '(Leave blank to keep current)'}</label>
                                <input
                                    className="input-field"
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Role</label>
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
