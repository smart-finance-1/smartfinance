import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index.js';
import { GoogleGenAI } from '@google/genai';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Middleware to verify JWT
export const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth Routes
router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const db = getDb();
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const info = stmt.run(name, email, hashedPassword);
    
    const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: info.lastInsertRowid, name, email } });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as any;
    
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, currency: user.currency } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wallets
router.get('/wallets', authenticate, (req: any, res) => {
  const db = getDb();
  const wallets = db.prepare('SELECT * FROM wallets WHERE user_id = ?').all(req.user.id);
  res.json(wallets);
});

router.post('/wallets', authenticate, (req: any, res) => {
  const { name, type, balance, currency } = req.body;
  const db = getDb();
  const stmt = db.prepare('INSERT INTO wallets (user_id, name, type, balance, currency) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, name, type, balance || 0, currency || 'USD');
  res.json({ id: info.lastInsertRowid, name, type, balance, currency });
});

// Transactions
router.get('/transactions', authenticate, (req: any, res) => {
  const db = getDb();
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
  res.json(transactions);
});

router.post('/transactions', authenticate, (req: any, res) => {
  const { wallet_id, type, amount, category, date, payment_method, notes } = req.body;
  const db = getDb();
  
  const stmt = db.prepare('INSERT INTO transactions (user_id, wallet_id, type, amount, category, date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, wallet_id, type, amount, category, date, payment_method, notes);
  
  // Update wallet balance
  if (wallet_id) {
    const balanceChange = type === 'income' ? amount : -amount;
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(balanceChange, wallet_id);
  }
  
  res.json({ id: info.lastInsertRowid });
});

// Budgets
router.get('/budgets', authenticate, (req: any, res) => {
  const db = getDb();
  const budgets = db.prepare('SELECT * FROM budgets WHERE user_id = ?').all(req.user.id);
  res.json(budgets);
});

router.post('/budgets', authenticate, (req: any, res) => {
  const { category, amount, month } = req.body;
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO budgets (user_id, category, amount, month) VALUES (?, ?, ?, ?)');
  const info = stmt.run(req.user.id, category, amount, month);
  res.json({ id: info.lastInsertRowid });
});

// Goals
router.get('/goals', authenticate, (req: any, res) => {
  const db = getDb();
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.id);
  res.json(goals);
});

router.post('/goals', authenticate, (req: any, res) => {
  const { name, target_amount, current_amount, deadline } = req.body;
  const db = getDb();
  const stmt = db.prepare('INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, name, target_amount, current_amount || 0, deadline);
  res.json({ id: info.lastInsertRowid });
});

// Subscriptions
router.get('/subscriptions', authenticate, (req: any, res) => {
  const db = getDb();
  const subscriptions = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').all(req.user.id);
  res.json(subscriptions);
});

router.post('/subscriptions', authenticate, (req: any, res) => {
  const { name, cost, billing_cycle, next_billing_date } = req.body;
  const db = getDb();
  const stmt = db.prepare('INSERT INTO subscriptions (user_id, name, cost, billing_cycle, next_billing_date) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(req.user.id, name, cost, billing_cycle, next_billing_date);
  res.json({ id: info.lastInsertRowid });
});

// AI Advisor
router.post('/ai/advisor', authenticate, async (req: any, res) => {
  const { prompt } = req.body;
  const db = getDb();
  
  try {
    // Fetch user data for context
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 50').all(req.user.id);
    const budgets = db.prepare('SELECT * FROM budgets WHERE user_id = ?').all(req.user.id);
    
    const context = `
      User Financial Data Context:
      Transactions (last 50): ${JSON.stringify(transactions)}
      Budgets: ${JSON.stringify(budgets)}
      
      User Question/Prompt: ${prompt}
      
      Provide a helpful, concise financial advice based on the user's data. Be professional and encouraging.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context,
    });
    
    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
