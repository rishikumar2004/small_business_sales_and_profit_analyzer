import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const SECRET_KEY = 'super_secret_premium_key'; // Use env vars in production

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Database Helpers ---
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const INVENTORY_FILE = path.join(DATA_DIR, 'inventory.json');

const readData = (file) => {
    if (!fs.existsSync(file)) return [];
    try {
        const data = fs.readFileSync(file, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// --- Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.sendStatus(403);

        // Fetch full user data to ensure we have the latest role
        const users = readData(USERS_FILE);
        const user = users.find(u => u.id === decoded.id);
        if (!user) return res.sendStatus(403);

        req.user = user;
        next();
    });
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized: insufficient permissions' });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// --- Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
    console.log('Register request incoming...');
    const username = req.body.username?.trim();
    const password = req.body.password;
    const businessName = req.body.businessName?.trim();
    const companyUsername = req.body.companyUsername?.trim();

    if (!username || !password || !companyUsername) {
        return res.status(400).json({ message: 'Username, Password, and Company ID are required' });
    }

    const validPattern = /^[a-zA-Z0-9_]+$/;
    if (!validPattern.test(username)) {
        return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
    }
    if (!validPattern.test(companyUsername)) {
        return res.status(400).json({ message: 'Company ID can only contain letters, numbers, and underscores.' });
    }

    const users = readData(USERS_FILE);

    // 1. Check if username is already taken by ANYONE
    if (users.some(u => u.username?.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ message: 'This username is already registered. Please login instead.' });
    }

    // 2. Check if Company ID is already taken by ANYONE
    // (A Company ID can only be registered once via the public signup page)
    if (users.some(u => u.companyUsername?.toLowerCase() === companyUsername.toLowerCase())) {
        return res.status(400).json({ message: 'Company ID is already in use. Please choose a different ID or contact your administrator.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now(),
        username,
        password: hashedPassword,
        businessName: businessName || 'My Business',
        companyUsername: companyUsername,
        role: 'Admin', // Public signups are always Admins/Owners
        currency: 'USD',
        theme: 'dark'
    };

    users.push(newUser);
    writeData(USERS_FILE, users);
    console.log(`Success: Registered new company ${companyUsername} for user ${username}`);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
    console.log('Login attempt:', req.body.username, 'for company:', req.body.companyUsername);
    const { username, password, companyUsername } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const users = readData(USERS_FILE);

    // Find user matching both username AND companyUsername
    const user = users.find(u =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.companyUsername.toLowerCase() === (companyUsername || '').toLowerCase()
    );

    if (!user) {
        console.log('Login failed: User not found or company mismatch');
        return res.status(400).json({ message: 'Invalid credentials or company ID' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log('Login failed: Password mismatch');
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful:', username);
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            businessName: user.businessName,
            companyUsername: user.companyUsername,
            role: user.role
        }
    });
});

// Get Profile
app.get('/api/profile', authenticateToken, (req, res) => {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // safe return
    const { password, ...safeUser } = user;
    res.json(safeUser);
});

// Update Profile
app.put('/api/profile', authenticateToken, (req, res) => {
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    // Update fields
    const { businessName, currency, theme } = req.body;
    users[userIndex] = { ...users[userIndex], businessName, currency, theme };

    writeData(USERS_FILE, users);
    const { password, ...safeUser } = users[userIndex];
    res.json(safeUser);
});

// Get Transactions
app.get('/api/transactions', authenticateToken, (req, res) => {
    const transactions = readData(TRANSACTIONS_FILE);
    // Filter by company so all company members see the same business data
    const companyTransactions = transactions.filter(t => t.companyUsername === req.user.companyUsername);
    res.json(companyTransactions);
});

// Add Transaction
app.post('/api/transactions', authenticateToken, (req, res) => {
    const { type, amount, description, date, receiptImage } = req.body;
    if (!type || !amount) return res.status(400).json({ message: 'Missing fields' });

    const transactions = readData(TRANSACTIONS_FILE);
    const newTx = {
        id: Date.now(),
        userId: req.user.id,
        companyUsername: req.user.companyUsername, // Link to company
        user: req.user.username,
        role: req.user.role,
        type,
        amount: parseFloat(amount),
        description: description || '',
        date: date || new Date().toISOString(),
        receiptImage: receiptImage || null
    };

    transactions.push(newTx);
    writeData(TRANSACTIONS_FILE, transactions);
    res.status(201).json(newTx);
});

// Bulk Add Transactions (For Excel Import)
app.post('/api/transactions/bulk', authenticateToken, (req, res) => {
    try {
        const items = req.body;
        console.log(`[Bulk Import] Processing ${items?.length} items for user: ${req.user.username}`);

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Invalid data format: Expected a non-empty array.' });
        }

        const transactions = readData(TRANSACTIONS_FILE);
        let successCount = 0;
        const now = Date.now();

        items.forEach((item, index) => {
            const amt = parseFloat(item.amount);
            if (isNaN(amt) || amt <= 0) return;

            const newTx = {
                id: `bulk_${now}_${index}_${Math.floor(Math.random() * 1000)}`,
                userId: req.user.id,
                companyUsername: req.user.companyUsername,
                user: req.user.username,
                role: req.user.role,
                type: item.type?.toLowerCase() === 'income' ? 'income' : 'expense',
                amount: amt,
                description: item.description?.trim() || 'Imported Transaction',
                date: item.date || new Date().toISOString(),
                category: item.category || (item.description?.toLowerCase().includes('rent') ? 'Rent' : 'Other')
            };
            transactions.push(newTx);
            successCount++;
        });

        if (successCount === 0) {
            return res.status(400).json({ message: 'No valid transactions found (check amounts and headers).' });
        }

        writeData(TRANSACTIONS_FILE, transactions);
        console.log(`[Bulk Import] Success: ${successCount} items saved.`);
        res.status(201).json({ message: `Successfully imported ${successCount} transactions` });
    } catch (error) {
        console.error('[Bulk Import] Error:', error);
        res.status(500).json({ message: 'Internal server error during bulk import: ' + error.message });
    }
});

// Delete All Transactions (Bulk) - Must be defined BEFORE /:id
app.delete('/api/transactions/all', authenticateToken, (req, res) => {
    let transactions = readData(TRANSACTIONS_FILE);
    const initialLength = transactions.length;

    // Keep only transactions that DO NOT belong to this company
    transactions = transactions.filter(t => t.companyUsername !== req.user.companyUsername);
    const deletedCount = initialLength - transactions.length;

    writeData(TRANSACTIONS_FILE, transactions);
    res.json({ message: `Success: Deleted ${deletedCount} transactions.` });
});

// Delete Single Transaction
app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    let transactions = readData(TRANSACTIONS_FILE);
    const initialLength = transactions.length;

    // Ensure transaction belongs to the user's company and matches ID
    transactions = transactions.filter(t => t.id != id || t.companyUsername !== req.user.companyUsername);

    if (transactions.length === initialLength) {
        return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }

    writeData(TRANSACTIONS_FILE, transactions);
    res.json({ message: 'Transaction deleted' });
});

// --- Admin Subsystem ---

// Get all users in my company (Admin only)
app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
    const users = readData(USERS_FILE);
    // Strict isolation: only return users belonging to the admin's company
    const companyUsers = users
        .filter(u => u.companyUsername === req.user.companyUsername)
        .map(({ password, ...u }) => u);
    res.json(companyUsers);
});

// Create user (Admin only)
app.post('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    const username = req.body.username?.trim();
    const password = req.body.password;
    const role = req.body.role;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Username, password, and role are required' });
    }

    const validPattern = /^[a-zA-Z0-9_]+$/;
    if (!validPattern.test(username)) {
        return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
    }

    const users = readData(USERS_FILE);
    if (users.some(u => u.username?.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now(),
        username,
        password: hashedPassword,
        role,
        businessName: req.user.businessName, // Inherit from creator
        companyUsername: req.user.companyUsername, // Inherit from creator
        currency: 'USD',
        theme: 'dark'
    };

    users.push(newUser);
    writeData(USERS_FILE, users);
    const { password: pw, ...safeUser } = newUser;
    res.status(201).json(safeUser);
});

// Update user (Admin only)
app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    let users = readData(USERS_FILE);
    const index = users.findIndex(u => u.id == id && u.companyUsername === req.user.companyUsername);

    if (index === -1) return res.status(404).json({ message: 'User not found in your company' });

    // Update allowed fields, keep companyUsername fixed
    const { role, username, password } = req.body;
    if (username) users[index].username = username;
    if (role) users[index].role = role;
    if (password) users[index].password = await bcrypt.hash(password, 10);

    writeData(USERS_FILE, users);
    const { password: pw, ...safeUser } = users[index];
    res.json(safeUser);
});

// Delete user (Admin only)
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    if (id == req.user.id) return res.status(400).json({ message: 'Cannot delete yourself' });

    let users = readData(USERS_FILE);
    const filtered = users.filter(u => u.id != id || u.companyUsername !== req.user.companyUsername);

    if (users.length === filtered.length) return res.status(404).json({ message: 'User not found in your company' });

    writeData(USERS_FILE, filtered);
    res.json({ message: 'User deleted' });
});

// --- Inventory Routes ---

app.get('/api/inventory', authenticateToken, (req, res) => {
    // Inventory is typically shared business-wide
    const inventory = readData(INVENTORY_FILE);
    const companyInventory = inventory.filter(i => i.companyUsername === req.user.companyUsername);
    res.json(companyInventory);
});

app.post('/api/inventory', authenticateToken, checkRole(['Admin', 'Owner', 'Staff']), (req, res) => {
    const { name, sku, quantity, costPrice, sellingPrice, lowStockThreshold } = req.body;
    if (!name || !sku) return res.status(400).json({ message: 'Name and SKU are required' });

    const inventory = readData(INVENTORY_FILE);
    const newItem = {
        id: Date.now(),
        companyUsername: req.user.companyUsername,
        name,
        sku,
        quantity: Number(quantity) || 0,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        updatedAt: new Date().toISOString()
    };

    inventory.push(newItem);
    writeData(INVENTORY_FILE, inventory);
    res.status(201).json(newItem);
});

app.delete('/api/inventory/:id', authenticateToken, checkRole(['Admin', 'Owner', 'Staff']), (req, res) => {
    const { id } = req.params;
    let inventory = readData(INVENTORY_FILE);
    const initialLength = inventory.length;

    inventory = inventory.filter(i => i.id != id || i.companyUsername !== req.user.companyUsername);

    if (inventory.length === initialLength) return res.status(404).json({ message: 'Item not found' });

    writeData(INVENTORY_FILE, inventory);
    res.json({ message: 'Item deleted' });
});

app.patch('/api/inventory/:id', authenticateToken, checkRole(['Admin', 'Owner', 'Staff']), (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const inventory = readData(INVENTORY_FILE);
    const index = inventory.findIndex(i => i.id == id && i.companyUsername === req.user.companyUsername);

    if (index === -1) return res.status(404).json({ message: 'Item not found' });

    inventory[index] = { ...inventory[index], ...updates, updatedAt: new Date().toISOString() };
    writeData(INVENTORY_FILE, inventory);
    res.json(inventory[index]);
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
