import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, Trash2, IndianRupee, Euro, PoundSterling, Image as ImageIcon } from 'lucide-react';
import Header from '../components/Header';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

export default function Dashboard() {
    const { theme, user } = useAuth();
    const [transactions, setTransactions] = useState([]);

    const currencySymbol = useMemo(() => {
        if (user?.currency === 'INR') return '₹';
        if (user?.currency === 'EUR') return '€';
        if (user?.currency === 'GBP') return '£';
        return '$';
    }, [user?.currency]);

    const CurrencyIcon = useMemo(() => {
        if (user?.currency === 'INR') return IndianRupee;
        if (user?.currency === 'EUR') return Euro;
        if (user?.currency === 'GBP') return PoundSterling;
        return DollarSign;
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

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        const res = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        } else {
            console.error('Failed to delete transaction');
        }
    };

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    // Data Analysis for Charts
    const chartData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const dayTxs = transactions.filter(t => t.date.split('T')[0] === date);
            return {
                date: date.split('-').slice(1).join('/'), // MM/DD
                income: dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                expense: dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
                net: dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
            };
        });
    }, [transactions]);

    const chartColors = {
        text: theme === 'light' ? '#0f172a' : '#f8fafc',
        grid: theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.1)'
    };

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Header title="Dashboard" />

            <div className="dashboard-container">
                {/* Row 1: Stats */}
                <div className="dashboard-stats">
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div className="flex-between">
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Sales</p>
                                <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{currencySymbol}{totalIncome.toFixed(2)}</h2>
                            </div>
                            <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div className="flex-between">
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Expenses</p>
                                <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{currencySymbol}{totalExpense.toFixed(2)}</h2>
                            </div>
                            <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                <TrendingDown size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div className="flex-between">
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Net Profit</p>
                                <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{currencySymbol}{(totalIncome - totalExpense).toFixed(2)}</h2>
                            </div>
                            <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                                <CurrencyIcon size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Charts & Transactions */}
                <div className="dashboard-grid">
                    {/* Col 1: Bar Chart */}
                    <div className="card">
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Revenue vs Expense</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                                    <XAxis dataKey="date" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} width={25} />
                                    <Tooltip
                                        cursor={false}
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '12px' }}
                                        formatter={(value) => [`${currencySymbol}${value.toFixed(2)}`, value >= 0 ? 'Income' : 'Expense']}
                                    />
                                    <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Col 2: Area Chart */}
                    <div className="card">
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Profit Trend</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                                    <XAxis dataKey="date" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} width={25} />
                                    <Tooltip
                                        cursor={false}
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        formatter={(value) => [`${currencySymbol}${value.toFixed(2)}`, 'Net Profit']}
                                    />
                                    <Area type="monotone" dataKey="net" name="Profit/Loss" stroke="var(--accent)" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} baseValue={0} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Col 3: Transactions */}
                    <div className="card">
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Recent</h3>
                        <div className="tx-list">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {transactions.slice().reverse().map(tx => (
                                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                padding: '0.5rem',
                                                borderRadius: '50%',
                                                background: tx.type === 'income' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px', fontSize: '0.9rem' }}>{tx.description || 'Untitled'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(tx.date).toLocaleDateString()}
                                                    {tx.user && <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>by {tx.user} ({tx.role || 'User'})</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: tx.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                                                {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(0)}
                                            </span>
                                            {tx.receiptImage && (
                                                <button
                                                    onClick={() => {
                                                        const win = window.open();
                                                        win.document.write(`<img src="${tx.receiptImage}" style="max-width: 100%; border-radius: 8px;" />`);
                                                        win.document.title = "Receipt View";
                                                    }}
                                                    style={{ background: 'none', color: 'var(--accent)', padding: '2px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                                                    title="View Receipt"
                                                >
                                                    <ImageIcon size={14} />
                                                </button>
                                            )}
                                            {['Admin', 'Owner', 'Accountant', 'Analyst'].includes(user?.role) && (
                                                <button
                                                    onClick={() => handleDelete(tx.id)}
                                                    style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', cursor: 'pointer', transition: 'color 0.2s' }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {transactions.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No transactions.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
