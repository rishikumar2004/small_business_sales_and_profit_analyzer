import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, Trash2, IndianRupee, Euro, PoundSterling, Image as ImageIcon, PieChart as PieIcon, ListChecks } from 'lucide-react';
import Header from '../components/Header';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
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
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setTransactions(data);
                } else {
                    console.error("Invalid transactions format", data);
                    setTransactions([]);
                }
            })
            .catch(err => {
                console.error("Error loading transactions:", err);
                setTransactions([]);
            });
    };

    const handleDelete = useCallback(async (id) => {
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
    }, []);

    const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [transactions]);
    const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [transactions]);

    // Pie Chart Data: Income vs Expense
    const incomeExpenseData = useMemo(() => [
        { name: 'Income', value: totalIncome, color: '#22c55e' },
        { name: 'Expense', value: totalExpense, color: '#ef4444' }
    ], [totalIncome, totalExpense]);

    // Pie Chart Data: Expenses by Category
    const expenseCategoryData = useMemo(() => {
        const categories = {};

        // Smarter categorization logic
        const catKeywords = {
            'Rent': ['rent', 'lease', 'apartment'],
            'Salary': ['salary', 'wage', 'payroll', 'employee'],
            'Office Supplies': ['office', 'stationary', 'print', 'supplies'],
            'Travel': ['travel', 'flight', 'hotel', 'uber', 'taxi', 'transport'],
            'Utilities': ['utility', 'water', 'gas', 'bill'],
            'Internet': ['internet', 'wifi', 'broadband'],
            'Electricity': ['electricity', 'eb bill', 'power'],
            'Marketing': ['marketing', 'ads', 'facebook', 'google', 'adwords'],
            'Food': ['food', 'lunch', 'dinner', 'restaurant', 'meal'],
            'Maintenance': ['repair', 'maintenance', 'fix'],
            'Insurance': ['insurance', 'policy']
        };

        transactions.filter(t => t.type === 'expense').forEach(t => {
            let cat = t.category;

            // If No Category or "Other", try to auto-detect from description
            if (!cat || cat === 'Other' || cat === 'other') {
                const desc = (t.description || '').toLowerCase();
                for (const [category, keywords] of Object.entries(catKeywords)) {
                    if (keywords.some(k => desc.includes(k))) {
                        cat = category;
                        break;
                    }
                }
            }

            cat = cat || 'Other';
            categories[cat] = (categories[cat] || 0) + t.amount;
        });

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    const PIE_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'];

    // Data Analysis for Charts
    const chartData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const dayTxs = transactions.filter(t => t.date && typeof t.date === 'string' && t.date.split('T')[0] === date);
            return {
                date: date.split('-').slice(1).join('/'), // MM/DD
                income: dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
                expense: dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
                net: dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) - dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
            };
        });
    }, [transactions]);

    const chartColors = {
        text: theme === 'light' ? '#475569' : '#94a3b8',
        grid: theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.05)',
        tooltip: theme === 'light' ? '#ffffff' : '#1e293b',
        tooltipText: theme === 'light' ? '#0f172a' : '#f8fafc'
    };

    return (
        <div className="fade-in" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1400px', padding: '0 1rem' }}>
                <Header title="Retail Store Dashboard" />

                <div className="dashboard-container">
                    {/* Row 1: Stats */}
                    <div className="dashboard-stats">
                        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.1, color: 'var(--success)' }}>
                                <TrendingUp size={100} />
                            </div>
                            <div className="flex-between" style={{ position: 'relative', zIndex: 1 }}>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Sales</p>
                                    <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{currencySymbol}{totalIncome.toFixed(2)}</h2>
                                </div>
                                <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.1, color: 'var(--danger)' }}>
                                <TrendingDown size={100} />
                            </div>
                            <div className="flex-between" style={{ position: 'relative', zIndex: 1 }}>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Expenses</p>
                                    <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{currencySymbol}{totalExpense.toFixed(2)}</h2>
                                </div>
                                <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                    <TrendingDown size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.1, color: 'var(--accent)' }}>
                                <CurrencyIcon size={100} />
                            </div>
                            <div className="flex-between" style={{ position: 'relative', zIndex: 1 }}>
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

                    {/* Unified Dashboard Content Grid */}
                    <div className="dashboard-grid" style={{ gap: '1.25rem' }}>
                        {/* Pie Chart 1: Income vs Expense */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <PieIcon size={18} color="var(--accent)" /> Income vs Expense
                                </h3>
                            </div>
                            <div style={{ height: '280px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                                        <Pie
                                            data={incomeExpenseData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {incomeExpenseData.map((entry, index) => (
                                                <Cell key={`cell - ${index} `} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(value) => [`${currencySymbol}${parseFloat(value).toLocaleString()} `, '']}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart 2: Expense Categories */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <PieIcon size={18} color="var(--accent)" /> Expense Distribution
                                </h3>
                            </div>
                            <div style={{ height: '280px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                                        <Pie
                                            data={expenseCategoryData}
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={2}
                                            dataKey="value"
                                            cx="50%"
                                            cy="50%"
                                        >
                                            {expenseCategoryData.map((entry, index) => (
                                                <Cell key={`cell - ${index} `} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(value) => [`${currencySymbol}${parseFloat(value).toLocaleString()} `, 'Amount']}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            layout="horizontal"
                                            iconSize={10}
                                            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Additional Stats: Top Spending */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingDown size={18} color="var(--danger)" /> Spending Summary
                            </h3>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {expenseCategoryData.slice(0, 3).map((item, idx) => (
                                    <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div className="flex-between" style={{ fontSize: '0.85rem' }}>
                                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{currencySymbol}{item.value.toLocaleString()}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${totalExpense > 0 ? (item.value / totalExpense * 100) : 0}% `,
                                                height: '100%',
                                                background: PIE_COLORS[idx % PIE_COLORS.length],
                                                borderRadius: '10px'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                                {expenseCategoryData.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                                        No expense data available.
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Top 3 expense categories account for <b>{totalExpense > 0 ? ((expenseCategoryData.slice(0, 3).reduce((s, i) => s + i.value, 0) / totalExpense) * 100).toFixed(1) : 0}%</b> of total spending.
                            </div>
                        </div>

                        {/* Lower Section Cards (Now part of the same grid) */}
                        {/* Col 1: Bar Chart */}
                        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Revenue vs Expense</h3>
                            <div style={{ height: '320px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                                        <XAxis dataKey="date" stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} width={55} />
                                        <Tooltip
                                            cursor={false}
                                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            itemStyle={{ fontSize: '12px', color: 'var(--text-primary)' }}
                                            formatter={(value) => [`${currencySymbol}${value.toFixed(2)} `, '']}
                                        />
                                        <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>


                        {/* Col 2: Area Chart */}
                        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Profit Trend</h3>
                            <div style={{ height: '320px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                        <YAxis stroke={chartColors.text} fontSize={12} tickLine={false} axisLine={false} width={55} />
                                        <Tooltip
                                            cursor={false}
                                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(value) => [`${currencySymbol}${value.toFixed(2)} `, 'Net Profit']}
                                        />
                                        <Area type="monotone" dataKey="net" name="Profit/Loss" stroke="var(--accent)" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} baseValue={0} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Col 3: Transactions */}
                        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Recent</h3>
                            <div className="tx-list" style={{ height: '210px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {transactions.slice().reverse().slice(0, 4).map(tx => (
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
        </div>
    );
}
