import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Filter, TrendingUp, TrendingDown, Calendar, Search, ChevronDown } from 'lucide-react';
import Header from '../components/Header';

export default function Reports() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [filters, setFilters] = useState({
        category: 'All',
        timeframe: 'Monthly', // 'Weekly' or 'Monthly'
        search: ''
    });

    const [openDropdown, setOpenDropdown] = useState(null); // 'timeframe' or 'category'
    const timeframeRef = useRef(null);
    const categoryRef = useRef(null);

    const timeframes = [
        { id: 'All', label: 'All Time' },
        { id: 'Weekly', label: 'Last 7 Days' },
        { id: 'Monthly', label: 'Last 30 Days' }
    ];

    const categories = [
        { id: 'All', label: 'All Categories' },
        { id: 'Rent', label: 'Rent' },
        { id: 'Supplies', label: 'Supplies' },
        { id: 'Utilities', label: 'Utilities' },
        { id: 'Travel', label: 'Travel' },
        { id: 'Inventory', label: 'Inventory' },
        { id: 'Other', label: 'Other' }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (timeframeRef.current && !timeframeRef.current.contains(event.target) &&
                categoryRef.current && !categoryRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currencySymbol = useMemo(() => {
        if (user?.currency === 'INR') return '₹';
        if (user?.currency === 'EUR') return '€';
        if (user?.currency === 'GBP') return '£';
        return '$';
    }, [user?.currency]);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = () => {
        fetch('/api/transactions', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setTransactions(data));
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const now = new Date();

            // Timeframe filtering
            if (filters.timeframe === 'Weekly') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                if (txDate < oneWeekAgo) return false;
            } else if (filters.timeframe === 'Monthly') {
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(now.getMonth() - 1);
                if (txDate < oneMonthAgo) return false;
            }

            // Category filtering
            const cat = tx.category || (tx.description.toLowerCase().includes('rent') ? 'Rent' :
                tx.description.toLowerCase().includes('supply') ? 'Supplies' :
                    tx.description.toLowerCase().includes('utility') ? 'Utilities' : 'Other');

            if (filters.category !== 'All' && cat !== filters.category) return false;

            // Search filtering
            if (filters.search && !tx.description.toLowerCase().includes(filters.search.toLowerCase())) return false;

            return true;
        });
    }, [transactions, filters]);

    const stats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    return (
        <div className="fade-in">
            <Header title="Business Reports" />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>

                {/* Stats Summary at Top */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                        <div className="flex-between">
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{filters.timeframe} Profit</p>
                                <h2 style={{ margin: 0, color: 'var(--success)' }}>{currencySymbol}{stats.net.toLocaleString()}</h2>
                            </div>
                            <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                                {stats.net >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex-between">
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{filters.timeframe} Expenses</p>
                                <h2 style={{ margin: 0 }}>{currencySymbol}{stats.expense.toLocaleString()}</h2>
                            </div>
                            <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                <TrendingDown size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Search Transactions</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '2.5rem' }}
                                    placeholder="e.g. Office rent..."
                                    value={filters.search}
                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ minWidth: '220px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Timeframe</label>
                            <div className="custom-select-container" ref={timeframeRef}>
                                <div
                                    className={`custom-select-trigger ${openDropdown === 'timeframe' ? 'active' : ''}`}
                                    onClick={() => setOpenDropdown(openDropdown === 'timeframe' ? null : 'timeframe')}
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}
                                >
                                    <span>{timeframes.find(t => t.id === filters.timeframe)?.label}</span>
                                    <ChevronDown size={18} className="select-chevron" />
                                </div>
                                {openDropdown === 'timeframe' && (
                                    <div className="custom-select-options">
                                        {timeframes.map((tf) => (
                                            <div
                                                key={tf.id}
                                                className={`custom-select-option ${filters.timeframe === tf.id ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setFilters({ ...filters, timeframe: tf.id });
                                                    setOpenDropdown(null);
                                                }}
                                            >
                                                {tf.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ minWidth: '220px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                            <div className="custom-select-container" ref={categoryRef}>
                                <div
                                    className={`custom-select-trigger ${openDropdown === 'category' ? 'active' : ''}`}
                                    onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}
                                >
                                    <span>{categories.find(c => c.id === filters.category)?.label}</span>
                                    <ChevronDown size={18} className="select-chevron" />
                                </div>
                                {openDropdown === 'category' && (
                                    <div className="custom-select-options">
                                        {categories.map((cat) => (
                                            <div
                                                key={cat.id}
                                                className={`custom-select-option ${filters.category === cat.id ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setFilters({ ...filters, category: cat.id });
                                                    setOpenDropdown(null);
                                                }}
                                            >
                                                {cat.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} color="var(--accent)" /> Detailed Transaction List
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filteredTransactions.length} records found</span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>DATE</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>DESCRIPTION</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>BY USER</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.slice().reverse().map(tx => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500 }}>{tx.description || 'No description'}</div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase' }}>{tx.category || 'General'}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem' }}>{tx.user}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{tx.role}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: tx.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                                            {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.2, display: 'block', margin: '0 auto' }} />
                                No transactions found for the selected filters.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
