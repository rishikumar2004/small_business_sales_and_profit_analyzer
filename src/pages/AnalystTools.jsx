import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { Download, Upload, TrendingUp, TrendingDown, FileSpreadsheet, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AnalystTools() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        const res = await fetch('/api/transactions', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setTransactions(data);
    };

    const showMsg = (message, error = false) => {
        setMsg(message);
        setIsError(error);
        setTimeout(() => {
            setMsg('');
            setIsError(false);
        }, 3000);
    };

    // --- Export Function ---
    const handleExport = () => {
        const wb = XLSX.utils.book_new();

        // Structured export with "Company Name" as requested
        const exportData = [
            ["Company Name", user.businessName], // Row 1
            [], // Row 2: Empty
            ["Expense Name", "Expense Amount", "Date", "Type"] // Row 3: Headers
        ];

        transactions.forEach(t => {
            exportData.push([
                t.description,
                t.amount,
                new Date(t.date).toLocaleDateString(),
                t.type
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.writeFile(wb, `${user.companyUsername}_Financials.xlsx`);
        showMsg('Data exported successfully!', false);
    };

    // --- Import Function ---
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Get raw data as array of arrays to find header row
                const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

                // Find the header row and detect type
                let headerRowIndex = -1;
                let detectedType = 'expense'; // Default

                for (let i = 0; i < rawData.length; i++) {
                    const row = rawData[i];
                    // Clean row strings for comparison
                    const rowStr = row.map(cell => cell ? cell.toString().toLowerCase().trim() : '');

                    if (rowStr.includes('income source') || rowStr.includes('income amount')) {
                        headerRowIndex = i;
                        detectedType = 'income';
                        break;
                    }
                    if (rowStr.includes('expense name') || rowStr.includes('expense amount') || rowStr.includes('description')) {
                        headerRowIndex = i;
                        detectedType = 'expense';
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    showMsg('Invalid file format. Could not find valid headers (Expense Name/Income Source).', true);
                    return;
                }

                // Extract headers
                const headers = rawData[headerRowIndex].map(h => h ? h.toString().toLowerCase().trim() : '');

                // Dynamic Column Mapping
                let descIdx = -1;
                let amtIdx = -1;
                let dateIdx = headers.indexOf('date');

                if (detectedType === 'income') {
                    descIdx = headers.indexOf('income source');
                    amtIdx = headers.indexOf('income amount');
                } else {
                    descIdx = headers.indexOf('expense name');
                    if (descIdx === -1) descIdx = headers.indexOf('description');
                    amtIdx = headers.indexOf('expense amount');
                    if (amtIdx === -1) amtIdx = headers.indexOf('amount');
                }

                if (descIdx === -1 || amtIdx === -1) {
                    showMsg(`Missing required columns for ${detectedType} import (Name/Amount).`, true);
                    return;
                }

                // Process data rows
                const formattedData = [];
                for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                    const row = rawData[i];
                    if (!row || row.length === 0) continue;

                    const desc = row[descIdx] || `Imported ${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}`;
                    const rawAmt = row[amtIdx];
                    const amt = parseFloat(rawAmt);

                    if (!isNaN(amt) && amt > 0) {
                        formattedData.push({
                            description: desc,
                            amount: amt,
                            type: detectedType, // Forced type based on header
                            date: (dateIdx !== -1 && row[dateIdx]) ? row[dateIdx] : new Date().toISOString()
                        });
                    }
                }

                if (formattedData.length === 0) {
                    showMsg('No valid transactions found in file.', true);
                    return;
                }

                // Send to server
                setLoading(true);
                const res = await fetch('/api/transactions/bulk', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(formattedData)
                });

                if (res.ok) {
                    const result = await res.json();
                    showMsg(result.message, false);
                    fetchTransactions(); // Refresh
                } else {
                    showMsg('Failed to import data. Check format.', true);
                }
            } catch (error) {
                console.error(error);
                showMsg('Error parsing Excel file', true);
            } finally {
                setLoading(false);
                // Clear input
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    // --- Calculations ---
    const stats = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income');
        const expense = transactions.filter(t => t.type === 'expense');

        const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);
        const totalExpense = expense.reduce((acc, t) => acc + t.amount, 0);

        const avgIncome = income.length ? totalIncome / income.length : 0;
        const avgExpense = expense.length ? totalExpense / expense.length : 0;

        // Simple Forecast: Next Month Projection (Current Avg * 30 days)
        // (Just a demo calculation for "Beginner Analyst")
        const dailyAvg = (totalIncome - totalExpense) / 30; // Rough assumption
        const nextMonthProjection = dailyAvg * 30;

        return {
            totalIncome,
            totalExpense,
            avgIncome,
            avgExpense,
            count: transactions.length,
            nextMonthProjection
        };
    }, [transactions]);

    return (
        <div className="fade-in">
            <Header title="Analyst Tools" />

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {msg && <div style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: isError ? 'var(--danger)' : 'var(--success)',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                }}>{msg}</div>}

                {/* Import/Export Section */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileSpreadsheet size={24} /> Data Management
                    </h2>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <button onClick={handleExport} className="btn btn-primary" style={{ flex: 1, minWidth: '200px' }}>
                            <Download size={18} style={{ marginRight: '8px' }} /> Export to Excel
                        </button>

                        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleImport}
                                style={{
                                    position: 'absolute',
                                    opacity: 0,
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer'
                                }}
                            />
                            <button className="btn" style={{
                                width: '100%',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)'
                            }}>
                                <Upload size={18} style={{ marginRight: '8px' }} />
                                {loading ? 'Importing...' : 'Import from Excel'}
                            </button>
                        </div>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        * Supports .xlsx, .csv formats. Ensure columns: type (income/expense), amount, description.
                    </p>
                </div>

                {/* Analysis Section */}
                <div className="card">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calculator size={24} /> Financial Analysis
                    </h2>

                    <div className="dashboard-grid">
                        <div style={{ padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Avg. Transaction Value</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                                ${((stats.avgIncome + stats.avgExpense) / 2).toFixed(2)}
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Transaction Count</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                                {stats.count}
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Projected Net (30 Days)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: stats.nextMonthProjection >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                ${stats.nextMonthProjection.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>Based on current avg</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
