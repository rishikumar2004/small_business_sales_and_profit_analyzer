import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Image as ImageIcon, Upload, Download, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Calendar, X, FileSpreadsheet } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

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
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(formData.date));
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [importStatus, setImportStatus] = useState(null);
    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [fileColumns, setFileColumns] = useState([]);
    const [columnMapping, setColumnMapping] = useState({ description: '', amount: '', date: '', type: '', category: '' });
    const [pendingRawData, setPendingRawData] = useState([]);
    const { user } = useAuth();
    const mainDropdownRef = useRef(null);
    const calendarRef = useRef(null);
    const fileInputRef = useRef(null);

    const categories = [
        { id: 'rent', label: 'Rent' },
        { id: 'office_supplies', label: 'Office Supplies' },
        { id: 'transport', label: 'Transport' },
        { id: 'utilities', label: 'Utilities' },
        { id: 'internet', label: 'Internet' },
        { id: 'electricity', label: 'Electricity' },
        { id: 'maintenance', label: 'Maintenance' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'travel', label: 'Travel' },
        { id: 'food', label: 'Food' },
        { id: 'salary', label: 'Salary' },
        { id: 'insurance', label: 'Insurance' },
        { id: 'other', label: 'Other' }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mainDropdownRef.current && !mainDropdownRef.current.contains(event.target)) {
                setIsMainDropdownOpen(false);
            }
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calendar Helpers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Fill empty spaces
        for (let i = 0; i < firstDay; i++) days.push(null);
        // Fill actual days
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    };

    const handleDateSelect = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        // Ensure local date string for form
        const offset = newDate.getTimezoneOffset();
        const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
        setFormData({ ...formData, date: adjustedDate.toISOString().split('T')[0] });
        setIsCalendarOpen(false);
    };

    const changeMonth = (offset) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };



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

    const handleExport = async () => {
        setIsProcessing(true);
        setImportStatus({ message: 'Preparing export...', error: false });
        try {
            const res = await fetch('/api/transactions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const allTransactions = await res.json();

            const wb = XLSX.utils.book_new();
            const exportData = [
                ["Business", user?.businessName || "My Business"],
                ["Export Date", new Date().toLocaleDateString()],
                [],
                ["Description", "Amount", "Type", "Date", "Category"]
            ];

            allTransactions.forEach(t => {
                exportData.push([
                    t.description,
                    t.amount,
                    t.type,
                    new Date(t.date).toLocaleDateString(),
                    t.category || "General"
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, "Transactions");
            XLSX.writeFile(wb, `${user?.companyUsername || 'business'}_transactions.xlsx`);
            setImportStatus({ message: 'Data exported successfully! Check your downloads.', error: false });
        } catch (error) {
            setImportStatus({ message: 'Export failed: ' + error.message, error: true });
        } finally {
            setIsProcessing(false);
            setTimeout(() => setImportStatus(null), 5000);
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

                // Find header row
                let headerRowIndex = -1;
                for (let i = 0; i < rawData.length; i++) {
                    const row = rawData[i];
                    if (!row || !Array.isArray(row)) continue;
                    const rowStr = row.map(c => c?.toString().toLowerCase().trim() || '');
                    if (rowStr.includes('description') || rowStr.includes('amount') || rowStr.includes('expense name') || rowStr.includes('income source')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    setImportStatus({ message: 'Invalid format. Could not detect a header row.', error: true });
                    return;
                }

                const rawHeaders = rawData[headerRowIndex];
                const headers = rawHeaders.map(h => h?.toString().trim() || '').filter(h => h);
                const headersLower = headers.map(h => h.toLowerCase());

                setFileColumns(headers);
                setPendingRawData(rawData.slice(headerRowIndex + 1));

                // Auto-matching logic
                const autoMap = { description: '', amount: '', date: '', type: '', category: '' };
                headersLower.forEach((h, idx) => {
                    const originalHeader = headers[idx];
                    if (h.includes('desc') || h.includes('name') || h.includes('source')) autoMap.description = originalHeader;
                    if (h.includes('amt') || h.includes('amount') || h.includes('value')) autoMap.amount = originalHeader;
                    if (h.includes('date') || h.includes('time')) autoMap.date = originalHeader;
                    if (h.includes('type')) autoMap.type = originalHeader;
                    if (h.includes('cat')) autoMap.category = originalHeader;
                });
                setColumnMapping(autoMap);
                setIsMappingModalOpen(true);

            } catch (err) {
                console.error(err);
                setImportStatus({ message: 'Excel parsing error: ' + err.message, error: true });
            } finally {
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsBinaryString(file);
    };

    const finalizeImport = async () => {
        if (!columnMapping.description || !columnMapping.amount) {
            setImportStatus({ message: 'Please map at least Description and Amount.', error: true });
            return;
        }

        setIsProcessing(true);
        setIsMappingModalOpen(false);

        try {
            const finalData = pendingRawData.map(row => {
                const rowData = {};
                fileColumns.forEach((col, idx) => {
                    rowData[col] = row[idx];
                });

                const amtText = rowData[columnMapping.amount];
                const amt = parseFloat(amtText);
                if (isNaN(amt)) return null;

                let type = 'expense';
                if (columnMapping.type && rowData[columnMapping.type]) {
                    const t = rowData[columnMapping.type].toString().toLowerCase();
                    if (t === 'income' || t === 'plus' || t === 'credit') type = 'income';
                }

                let finalDate = new Date().toISOString();
                if (columnMapping.date && rowData[columnMapping.date]) {
                    const d = new Date(rowData[columnMapping.date]);
                    if (!isNaN(d.getTime())) finalDate = d.toISOString();
                }

                return {
                    description: rowData[columnMapping.description]?.toString() || 'Imported Transaction',
                    amount: amt,
                    type: type,
                    date: finalDate,
                    category: columnMapping.category ? rowData[columnMapping.category]?.toString() : null
                };
            }).filter(item => item !== null);

            if (finalData.length === 0) {
                setImportStatus({ message: 'No valid records found with current mapping.', error: true });
                return;
            }

            const res = await fetch('/api/transactions/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(finalData)
            });

            if (res.status === 401 || res.status === 403) {
                throw new Error('Session expired. Please logout and login again.');
            }

            let result;
            try {
                result = await res.json();
            } catch (parseError) {
                const text = await res.text();
                throw new Error(text.length < 50 ? text : `Server Error (${res.status})`);
            }

            if (res.ok) {
                setImportStatus({ message: result.message || 'Import successful!', error: false });
                setTimeout(() => navigate('/'), 2000);
            } else {
                setImportStatus({ message: result.message || 'Server rejected the batch.', error: true });
            }
        } catch (err) {
            setImportStatus({ message: 'Import failed: ' + err.message, error: true });
        } finally {
            setIsProcessing(false);
        }
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
                        <div className="custom-select-container" ref={calendarRef}>
                            <div
                                className={`custom-select-trigger ${isCalendarOpen ? 'active' : ''}`}
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Calendar size={18} style={{ color: 'var(--accent)' }} />
                                    <span>{new Date(formData.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <ChevronDown size={18} className="select-chevron" />
                            </div>

                            {isCalendarOpen && (
                                <div className="custom-select-options calendar-dropdown" style={{ padding: '1.25rem', width: '310px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <button type="button" onClick={() => changeMonth(-1)} className="btn-icon">
                                            <ChevronLeft size={16} />
                                        </button>
                                        <div style={{ fontWeight: '700', fontSize: '1rem' }}>
                                            {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                        </div>
                                        <button type="button" onClick={() => changeMonth(1)} className="btn-icon">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} style={{ fontWeight: '600' }}>{day}</div>)}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                                        {generateCalendar().map((day, i) => (
                                            <div
                                                key={i}
                                                className={`calendar-day ${day ? 'clickable' : ''} ${day && new Date(formData.date).getDate() === day && new Date(formData.date).getMonth() === viewDate.getMonth() && new Date(formData.date).getFullYear() === viewDate.getFullYear() ? 'selected' : ''}`}
                                                style={{ fontSize: '0.9rem', height: '36px' }}
                                                onClick={() => day && handleDateSelect(day)}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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
                                    <img
                                        src={formData.receiptImage}
                                        alt="Receipt"
                                        style={{ maxHeight: '120px', borderRadius: '0.5rem', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsPreviewOpen(true);
                                        }}
                                    />
                                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--success)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-secondary)', pointerEvents: 'none' }}>
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

            {/* Batch Operations Card */}
            <div className="card fade-in" style={{ maxWidth: '600px', margin: '0 auto 4rem auto' }}>
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
                        <FileSpreadsheet size={22} color="var(--accent)" /> Batch Operations
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                        Excel / CSV Support
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    {/* Export Section */}
                    <div style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Export Data</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Download all transactions in a structured Excel format.</div>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={isProcessing}
                            className="btn"
                            style={{
                                margin: 0,
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--accent)',
                                border: '1px solid var(--accent)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Download size={18} style={{ marginRight: '0.5rem' }} /> Export
                        </button>
                    </div>

                    {/* Import Section */}
                    {user?.role !== 'Staff' && (
                        <div style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Import Data</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Upload transactions from your own Excel or CSV files.</div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleImport}
                                    disabled={isProcessing}
                                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 1 }}
                                />
                                <button
                                    className="btn"
                                    disabled={isProcessing}
                                    style={{
                                        width: '100%',
                                        margin: 0,
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        color: 'var(--success)',
                                        border: '1px solid var(--success)'
                                    }}
                                >
                                    <Upload size={18} style={{ marginRight: '0.5rem' }} /> Import
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column Mapping Guide */}
                {user?.role !== 'Staff' && (
                    <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Column Names</span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {[
                                { name: 'Description', req: true },
                                { name: 'Amount', req: true },
                                { name: 'Type', req: false },
                                { name: 'Date', req: false }
                            ].map(col => (
                                <div key={col.name} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{col.name}</span>
                                    {col.req && <span style={{ color: 'var(--danger)', marginLeft: '0.25rem', fontSize: '1rem' }}>*</span>}
                                </div>
                            ))}
                        </div>

                        <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            Import will automatically map your file columns to these fields.
                            <strong> Description</strong> and <strong>Amount</strong> are mandatory for a successful import.
                        </p>
                    </div>
                )}

                {/* Feedback Slot */}
                {importStatus && (
                    <div className="fade-in" style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: importStatus.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: importStatus.error ? 'var(--danger)' : 'var(--success)',
                        border: `1px solid ${importStatus.error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                        fontSize: '0.85rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {importStatus.error ? <X size={16} /> : <CheckCircle size={16} />}
                            <span style={{ fontWeight: 500 }}>{importStatus.message}</span>
                        </div>
                    </div>
                )}
            </div>


            {/* Image Preview Modal */}
            {isPreviewOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '2rem'
                }} onClick={() => setIsPreviewOpen(false)}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '-40px',
                                background: 'white',
                                color: 'black',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={formData.receiptImage}
                            alt="Receipt Preview"
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '80vh',
                                borderRadius: '0.75rem',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                            }}
                        />
                    </div>
                </div>
            )}
            {/* Column Mapping Modal */}
            {isMappingModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10001,
                    padding: '1.5rem'
                }}>
                    <div className="card fade-in" style={{
                        maxWidth: '500px',
                        width: '100%',
                        padding: '2rem',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <button
                            onClick={() => setIsMappingModalOpen(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                <FileSpreadsheet size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Column Mapping</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Map your file columns to match our database fields.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {[
                                { key: 'description', label: 'Description', req: true },
                                { key: 'amount', label: 'Amount', req: true },
                                { key: 'date', label: 'Date', req: false },
                                { key: 'type', label: 'Type (Income/Expense)', req: false },
                                { key: 'category', label: 'Category', req: false }
                            ].map(field => (
                                <div key={field.key}>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                                        <span>{field.label} {field.req && <span style={{ color: 'var(--danger)' }}>*</span>}</span>
                                    </label>
                                    <select
                                        className="input-field"
                                        value={columnMapping[field.key]}
                                        onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                                        style={{ width: '100%', background: 'var(--bg-primary)' }}
                                    >
                                        <option value="">-- Ignore Field --</option>
                                        {fileColumns.map(col => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setIsMappingModalOpen(false)}
                                className="btn"
                                style={{ flex: 1, margin: 0, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={finalizeImport}
                                className="btn btn-primary"
                                style={{ flex: 2, margin: 0 }}
                            >
                                Confirm & Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
