import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Package, TrendingUp, Plus, Minus, Search, Trash2, Edit2, AlertTriangle as AlertIcon, Image as ImageIcon, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import inventoryBg from '../assets/images/inventory_bg.jpg';

const InventoryItem = memo(({ item, currencySymbol, onUpdateQuantity, onDelete }) => (
    <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
        <td style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <ImageIcon size={20} color="var(--text-secondary)" />
                )}
            </div>
            {item.name}
        </td>
        <td style={{ padding: '1.25rem 1rem', fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.sku}</td>
        <td style={{ padding: '1.25rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        color: 'var(--danger)',
                        borderRadius: '4px',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Minus size={14} />
                </button>
                <span style={{
                    minWidth: '2.5rem',
                    textAlign: 'center',
                    fontWeight: '700',
                    color: item.quantity <= item.lowStockThreshold ? 'var(--danger)' : 'var(--text-primary)',
                    background: item.quantity <= item.lowStockThreshold ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                }}>
                    {item.quantity}
                </span>
                <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: 'none',
                        color: 'var(--success)',
                        borderRadius: '4px',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Plus size={14} />
                </button>
            </div>
        </td>
        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{currencySymbol}{Number(item.costPrice).toFixed(2)}</td>
        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{currencySymbol}{Number(item.sellingPrice).toFixed(2)}</td>
        <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
            <button
                onClick={() => onDelete(item.id)}
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                className="btn-icon-hover"
            >
                <Trash2 size={16} />
            </button>
        </td>
    </tr>
));

export default function Inventory() {
    const { user, theme } = useAuth();
    const [items, setItems] = useState([]);
    const { showNotification } = useNotification();
    const [showLowStockModal, setShowLowStockModal] = useState(false);

    const currencySymbol = useMemo(() => {
        if (user?.currency === 'INR') return '₹';
        if (user?.currency === 'EUR') return '€';
        if (user?.currency === 'GBP') return '£';
        return '$';
    }, [user?.currency]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        sku: '',
        quantity: 0,
        costPrice: 0,
        sellingPrice: 0,
        lowStockThreshold: 5,
        image: null
    });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewItem({ ...newItem, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setItems(data);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
            setItems([]);
        }
    };

    const handleAddStock = async (e) => {
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
                setNewItem({ name: '', sku: '', quantity: 0, costPrice: 0, sellingPrice: 0, lowStockThreshold: 5, image: null });
                fetchInventory();
            }
        } catch (error) {
            console.error("Failed to add item", error);
        }
    };

    const handleDelete = useCallback(async (id) => {
        if (!confirm('Delete this item?')) return;
        try {
            const res = await fetch(`/api/inventory/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    const handleUpdateQuantity = useCallback(async (id, delta) => {
        let newQty = -1;
        setItems(prev => {
            const item = prev.find(i => i.id === id);
            if (!item) return prev;
            newQty = Math.max(0, item.quantity + delta);
            if (newQty === item.quantity) return prev;
            return prev.map(i => i.id === id ? { ...i, quantity: newQty } : i);
        });

        if (newQty !== -1) {
            try {
                const res = await fetch(`/api/inventory/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ quantity: newQty })
                });
                if (res.ok && delta > 0) showNotification(`Stock updated.`);
            } catch (err) {
                console.error(err);
            }
        }
    }, [showNotification]);

    const totalCostValue = useMemo(() => items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0), [items]);
    const potentialProfit = useMemo(() => items.reduce((sum, item) => sum + ((item.sellingPrice - item.costPrice) * item.quantity), 0), [items]);
    const lowStockItems = useMemo(() => items.filter(i => i.quantity <= i.lowStockThreshold), [items]);

    const filteredItems = useMemo(() => items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ), [items, searchTerm]);

    return (
        <>
            {/* Background Image Layer */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: `url(${inventoryBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: theme === 'light' ? 0.4 : 0.5,
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

            <div className="fade-in" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
                    <Header title="Store Inventory & Stock Analysis" />

                    {/* Stats */}
                    <div className="dashboard-container" style={{ marginBottom: '2rem' }}>
                        <div className="dashboard-stats">
                            <div className="card" style={{ padding: '1.5rem', background: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.4)' }}>
                                <div className="flex-between">
                                    <div>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Cost Value</p>
                                        <h2 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--text-primary)' }}>{currencySymbol}{totalCostValue.toLocaleString()}</h2>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                                        <Package size={24} />
                                    </div>
                                </div>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', background: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.4)' }}>
                                <div className="flex-between">
                                    <div>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Potential Profit</p>
                                        <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--success)' }}>+{currencySymbol}{potentialProfit.toLocaleString()}</h2>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                                        <TrendingUp size={24} />
                                    </div>
                                </div>
                            </div>
                            <div className="card"
                                onClick={() => lowStockItems.length > 0 && setShowLowStockModal(true)}
                                style={{
                                    padding: '1.5rem',
                                    border: lowStockItems.length > 0 ? '1px solid var(--danger)' : 'none',
                                    background: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.4)',
                                    cursor: lowStockItems.length > 0 ? 'pointer' : 'default',
                                    transition: 'transform 0.2s'
                                }}>
                                <div className="flex-between">
                                    <div>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Low Stock Alerts</p>
                                        <h2 style={{ fontSize: '1.5rem', margin: 0, color: lowStockItems.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{lowStockItems.length} Items</h2>
                                    </div>
                                    <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                        <AlertIcon size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: theme === 'light' ? '#fff' : 'var(--bg-secondary)',
                            padding: '0 1.2rem',
                            height: '52px',
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
                                height: '52px',
                                fontSize: '1rem',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                width: '100%',
                                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            <Plus size={20} strokeWidth={3} /> Add New Stock
                        </button>
                    </div>

                    {/* List */}
                    <div className="card" style={{
                        overflowX: 'auto',
                        padding: 0,
                        background: theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid var(--border)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.1)' }}>
                                    <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Item</th>
                                    <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>SKU</th>
                                    <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quantity</th>
                                    <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>COGS</th>
                                    <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Price</th>
                                    <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <InventoryItem
                                        key={item.id}
                                        item={item}
                                        currencySymbol={currencySymbol}
                                        onUpdateQuantity={handleUpdateQuantity}
                                        onDelete={handleDelete}
                                    />
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No items found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Modal */}
                {showLowStockModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10000, backdropFilter: 'blur(8px)', padding: '2rem'
                    }} onClick={() => setShowLowStockModal(false)}>
                        <div className="card fade-in"
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', overflow: 'hidden'
                            }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertIcon color="var(--danger)" size={24} /> Low Stock Alerts
                                </h2>
                                <button onClick={() => setShowLowStockModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div style={{ padding: '0', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {lowStockItems.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{
                                                            width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden',
                                                            background: 'var(--bg-primary)', border: '1px solid var(--border)'
                                                        }}>
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <ImageIcon size={20} color="var(--text-secondary)" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SKU: {item.sku}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{item.quantity} Left</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Threshold: {item.lowStockThreshold}</div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => {
                                                            setSearchTerm(item.name);
                                                            setShowLowStockModal(false);
                                                        }}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '6px',
                                                            background: 'rgba(99, 102, 241, 0.1)',
                                                            color: 'var(--accent)',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                            fontSize: '0.85rem'
                                                        }}>
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'var(--bg-primary)' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {lowStockItems.length} items require attention.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, backdropFilter: 'blur(12px)', padding: '2rem'
                    }}>
                        <div className="card fade-in" style={{
                            width: '100%', maxWidth: '600px', padding: '2.5rem',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', background: 'var(--bg-secondary)', border: '1px solid var(--border)'
                        }}>
                            <h2 style={{ marginTop: 0, marginBottom: '2rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Add New Stock Item</h2>
                            <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden',
                                        background: 'var(--bg-primary)', border: '2px dashed var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative', cursor: 'pointer'
                                    }} onClick={() => document.getElementById('itemImage').click()}>
                                        {newItem.image ? (
                                            <img src={newItem.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <ImageIcon size={24} color="var(--text-secondary)" />
                                        )}
                                        <input
                                            type="file"
                                            id="itemImage"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label>Item Name</label>
                                        <input type="text" className="input-field" required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Milk 1L" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label>SKU / Barcode</label>
                                        <input type="text" className="input-field" required value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} placeholder="D-MLK-01" />
                                    </div>
                                    <div className="input-group">
                                        <label>Initial Quantity</label>
                                        <input type="number" className="input-field" required value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
        </>
    );
}
