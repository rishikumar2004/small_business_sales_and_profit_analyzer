import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Image as ImageIcon, Upload, Download, CheckCircle, ChevronDown } from 'lucide-react';
import Header from '../components/Header';

export default function AddTransaction() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        description: 'Rent',
        otherDescription: '',
        date: new Date().toISOString().split('T')[0],
        receiptImage: null
    });

    const [isMainDropdownOpen, setIsMainDropdownOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mainDropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    const categories = [
        { id: 'rent', label: 'Rent' },
        { id: 'supplies', label: 'Supplies' },
        { id: 'utilities', label: 'Utilities' },
        { id: 'travel', label: 'Travel' },
        { id: 'inventory', label: 'Inventory' },
        { id: 'other', label: 'Other' }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mainDropdownRef.current && !mainDropdownRef.current.contains(event.target)) {
                setIsMainDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        const finalDescription = formData.description === 'Other'
            ? (formData.otherDescription.trim() || 'Uncategorized')
            : formData.description;

        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                ...formData,
                description: finalDescription
            })
        });

        if (res.ok) {
            navigate('/');
        }
        setIsProcessing(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, receiptImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReceiptSubmit = async (e) => {
        e.preventDefault();
        setUploadStatus('uploading');

        const finalCategory = receiptData.category === 'other' ? receiptData.otherCategory : receiptData.category;

        const res = await fetch('/api/receipts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                image: receiptData.image,
                type: receiptData.type,
                category: finalCategory,
                date: new Date().toISOString()
            })
        });

        if (res.ok) {
            setUploadStatus('success');
            fetchReceipts(); // Update the gallery
            setTimeout(() => setUploadStatus(null), 3000);
            setReceiptData({ image: null, type: 'Expense', category: 'rent', otherCategory: '' });
        }
    };



    return (
        <div className="fade-in">
            <Header title="Add Transaction" />

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Type</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'income' })}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: `1px solid ${formData.type === 'income' ? 'var(--success)' : 'var(--bg-card)'}`,
                                    background: formData.type === 'income' ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-primary)',
                                    color: formData.type === 'income' ? 'var(--success)' : 'var(--text-secondary)',
                                    fontWeight: 600
                                }}>
                                Income
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'expense' })}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: `1px solid ${formData.type === 'expense' ? 'var(--danger)' : 'var(--bg-card)'}`,
                                    background: formData.type === 'expense' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)',
                                    color: formData.type === 'expense' ? 'var(--danger)' : 'var(--text-secondary)',
                                    fontWeight: 600
                                }}>
                                Expense
                            </button>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Amount</label>
                        <input
                            className="input-field"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Category / Description</label>
                        <div className="custom-select-container" ref={mainDropdownRef}>
                            <div
                                className={`custom-select-trigger ${isMainDropdownOpen ? 'active' : ''}`}
                                onClick={() => setIsMainDropdownOpen(!isMainDropdownOpen)}
                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                            >
                                <span>{formData.description}</span>
                                <ChevronDown size={18} className="select-chevron" />
                            </div>

                            {isMainDropdownOpen && (
                                <div className="custom-select-options">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className={`custom-select-option ${formData.description === cat.label ? 'selected' : ''}`}
                                            onClick={() => {
                                                setFormData({ ...formData, description: cat.label });
                                                setIsMainDropdownOpen(false);
                                            }}
                                        >
                                            {cat.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {formData.description === 'Other' && (
                        <div className="input-group fade-in">
                            <label>Specify Description <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>(Leave blank for Uncategorized)</span></label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter custom description..."
                                value={formData.otherDescription}
                                onChange={(e) => setFormData({ ...formData, otherDescription: e.target.value })}
                            />
                        </div>
                    )}
                    <div className="input-group">
                        <label>Date</label>
                        <input
                            className="input-field"
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Attach Receipt (Optional)
                            {formData.receiptImage && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, receiptImage: null })}
                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                    Remove Image
                                </button>
                            )}
                        </label>
                        <div
                            style={{
                                border: '2px dashed var(--border)',
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: formData.receiptImage ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageUpload}
                            />
                            {formData.receiptImage ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <img src={formData.receiptImage} alt="Receipt" style={{ maxHeight: '120px', borderRadius: '0.5rem' }} />
                                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--success)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-secondary)' }}>
                                        <CheckCircle size={14} />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    <Upload size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Click to upload receipt image</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button className="btn btn-primary" disabled={isProcessing}>
                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                        {isProcessing ? 'Saving...' : 'Save Transaction'}
                    </button>
                </form>
            </div>


        </div>
    );
}
