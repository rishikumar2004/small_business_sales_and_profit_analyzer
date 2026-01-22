import { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import Header from '../components/Header';

export default function Inventory() {
    const [items, setItems] = useState([]);
    const { showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        sku: '',
        quantity: 0,
        costPrice: 0,
        sellingPrice: 0,
        lowStockThreshold: 5
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                showNotification(`Global stock updated: ${newItem.name} added.`);
                setShowAddModal(false);
                setNewItem({ name: '', sku: '', quantity: 0, costPrice: 0, sellingPrice: 0, lowStockThreshold: 5 });
                fetchInventory();
            }
        } catch (error) {
            console.error("Failed to add item", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;
        try {
            const res = await fetch(`/api/inventory/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setItems(items.filter(i => i.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Analysis
    const totalInventoryValue = items.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
    const potentialRevenue = items.reduce((acc, item) => acc + (item.quantity * item.sellingPrice), 0);
    const potentialProfit = potentialRevenue - totalInventoryValue;
    const lowStockItems = items.filter(item => item.quantity <= item.lowStockThreshold);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <Header title="Inventory & Stock Analysis" />

            <div style={{
                flex: 1,
                width: '100%',
                maxWidth: '1300px',
                margin: '0 auto',
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center' // This helps center the content vertically if it's short
            }}>
                {/* Stats */}
                <div className="dashboard-container" style={{ marginBottom: '2rem' }}>
                    <div className="dashboard-stats">
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div className="flex-between">
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Cost Value</p>
                                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>${totalInventoryValue.toLocaleString()}</h2>
                                </div>
                                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                                    <Package size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div className="flex-between">
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Potential Profit</p>
                                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--success)' }}>+${potentialProfit.toLocaleString()}</h2>
                                </div>
                                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', border: lowStockItems.length > 0 ? '1px solid var(--danger)' : 'none' }}>
                            <div className="flex-between">
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Low Stock Alerts</p>
                                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: lowStockItems.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{lowStockItems.length} Items</h2>
                                </div>
                                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                    <AlertTriangle size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                        flex: '1',
                        minWidth: '280px',
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-secondary)',
                        padding: '0.8rem 1.2rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <Search size={20} style={{ color: 'var(--text-secondary)', marginRight: '0.75rem' }} />
                        <input
                            type="text"
                            placeholder="Search items, SKU, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '1rem' }}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                        style={{
                            flex: '1.5',
                            minWidth: '200px',
                            height: 'auto',
                            padding: '1.2rem',
                            fontSize: '1.1rem',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        <Plus size={24} strokeWidth={3} /> Add Stock
                    </button>
                </div>

                {/* List */}
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Item Name</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>SKU</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Quantity</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>COGS</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Price</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{item.name}</td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{item.sku}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            background: item.quantity <= item.lowStockThreshold ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                            color: item.quantity <= item.lowStockThreshold ? 'var(--danger)' : 'var(--success)',
                                            fontWeight: 600,
                                            fontSize: '0.85rem'
                                        }}>
                                            {item.quantity}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>${item.costPrice.toFixed(2)}</td>
                                    <td style={{ padding: '1rem' }}>${item.sellingPrice.toFixed(2)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No items found.</div>
                    )}
                </div>

                {/* Modal */}
                {showAddModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '2rem'
                    }}>
                        <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '2rem', fontSize: '1.75rem' }}>Add Inventory Item</h2>
                            <form onSubmit={handleAddItem}>
                                <div className="input-group">
                                    <label>Item Name</label>
                                    <input className="input-field" required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Laptop Charger" />
                                </div>
                                <div className="input-group">
                                    <label>SKU</label>
                                    <input className="input-field" required value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} placeholder="PRD-001" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label>Quantity</label>
                                        <input type="number" className="input-field" required value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                                    </div>
                                    <div className="input-group">
                                        <label>Low Stock Alert At</label>
                                        <input type="number" className="input-field" required value={newItem.lowStockThreshold} onChange={e => setNewItem({ ...newItem, lowStockThreshold: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                    <div className="input-group">
                                        <label>Cost Price (COGS)</label>
                                        <input type="number" step="0.01" className="input-field" required value={newItem.costPrice} onChange={e => setNewItem({ ...newItem, costPrice: Number(e.target.value) })} />
                                    </div>
                                    <div className="input-group">
                                        <label>Selling Price</label>
                                        <input type="number" step="0.01" className="input-field" required value={newItem.sellingPrice} onChange={e => setNewItem({ ...newItem, sellingPrice: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" className="btn" onClick={() => setShowAddModal(false)} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', height: '3.5rem', fontWeight: '600' }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3.5rem' }}>Add Item</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
