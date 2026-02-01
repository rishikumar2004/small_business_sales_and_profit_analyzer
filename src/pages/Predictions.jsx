import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { TrendingUp, AlertCircle, ShoppingBag, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import aiBg from '../assets/images/ai_bg.jpg';

export default function Predictions() {
    const { user, theme } = useAuth();

    const currencySymbol = useMemo(() => {
        if (user?.currency === 'INR') return '₹';
        if (user?.currency === 'EUR') return '€';
        if (user?.currency === 'GBP') return '£';
        return '$';
    }, [user?.currency]);

    // Dummy forecast data
    const data = [
        { month: 'Jan', actual: 4000, forecast: 4100 },
        { month: 'Feb', actual: 3000, forecast: 3200 },
        { month: 'Mar', actual: 2000, forecast: 2400 },
        { month: 'Apr', actual: 2780, forecast: 2900 },
        { month: 'May', actual: 1890, forecast: 2100 },
        { month: 'Jun', actual: 2390, forecast: 2500 },
        { month: 'Jul', actual: 3490, forecast: 3600 },
        { month: 'Aug', forecast: 3800 },
        { month: 'Sep', forecast: 4200 },
        { month: 'Oct', forecast: 4500 },
    ];

    return (
        <>
            {/* Background Image Layer */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: `url(${aiBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: theme === 'light' ? 0.4 : 0.5, // Brighter effect
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            {/* Dynamic Gradient Overlay */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: theme === 'light'
                    ? 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(248, 250, 252, 0.5) 100%)'
                    : 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.6) 100%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div className="fade-in" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
                    <Header title="Retail Forecasts & AI Insights" />

                    <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                        {/* Summary Card 1 */}
                        <div className="card" style={{ padding: '1.5rem', background: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.4)' }}>
                            <div className="flex-between">
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Projected Revenue (Next Month)</p>
                                    <h2 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--accent)' }}>{currencySymbol}4,200</h2>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <TrendingUp size={14} /> +12.5% vs Last Month
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                                    <ShoppingBag size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Summary Card 2 */}
                        <div className="card" style={{ padding: '1.5rem', background: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.4)' }}>
                            <div className="flex-between">
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Predicted High Demand Item</p>
                                    <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Wireless Earbuds</h2>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        Expected to sell 150+ units
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                                    <AlertCircle size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Summary Card 3 */}
                        <div className="card" style={{ padding: '1.5rem', background: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.4)' }}>
                            <div className="flex-between">
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Inventory Action</p>
                                    <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Reorder Stock</h2>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
                                        3 Items predicted to run out
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                    <Calendar size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Chart */}
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingUp size={20} color="var(--accent)" /> Sales Forecast Analysis
                            </h3>
                        </div>
                        <div style={{ height: '400px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value}`} />
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.05)'} vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                    />
                                    <Area type="monotone" dataKey="actual" name="Actual Sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="forecast" name="AI Forecast" stroke="#22c55e" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p>AI Prediction models are training on your latest data...</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>More insights will appear here as your transaction history grows.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
