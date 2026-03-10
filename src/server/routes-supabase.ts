/**
 * API routes for Vercel serverless - uses Supabase only (no better-sqlite3).
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import * as db from '../db/api.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.dbGetUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'User not found' });
    const validPassword = await bcrypt.compare(password, user.password!);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, currency: user.currency } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Login failed' });
  }
});

router.get('/wallets', authenticate, async (req: any, res) => {
  try {
    const wallets = await db.dbGetWallets(req.user.id);
    res.json(wallets);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post('/wallets', authenticate, async (req: any, res) => {
  const { name, type, balance, currency } = req.body;
  try {
    const { id } = await db.dbInsertWallet(req.user.id, name, type, balance || 0, currency || 'USD');
    res.json({ id, name, type, balance, currency });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.get('/transactions', authenticate, async (req: any, res) => {
  try {
    const transactions = await db.dbGetTransactions(req.user.id);
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post('/transactions', authenticate, async (req: any, res) => {
  const { wallet_id, type, amount, category, date, payment_method, notes } = req.body;
  try {
    const { id } = await db.dbInsertTransaction(req.user.id, {
      wallet_id,
      type,
      amount,
      category,
      date,
      payment_method,
      notes,
    });
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.get('/budgets', authenticate, async (req: any, res) => {
  try {
    const budgets = await db.dbGetBudgets(req.user.id);
    res.json(budgets);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post('/budgets', authenticate, async (req: any, res) => {
  const { category, amount, month } = req.body;
  try {
    const { id } = await db.dbUpsertBudget(req.user.id, category, amount, month);
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.get('/goals', authenticate, async (req: any, res) => {
  try {
    const goals = await db.dbGetGoals(req.user.id);
    res.json(goals);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post('/goals', authenticate, async (req: any, res) => {
  const { name, target_amount, current_amount, deadline } = req.body;
  try {
    const { id } = await db.dbInsertGoal(req.user.id, { name, target_amount, current_amount, deadline });
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.get('/subscriptions', authenticate, async (req: any, res) => {
  try {
    const subscriptions = await db.dbGetSubscriptions(req.user.id);
    res.json(subscriptions);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post('/subscriptions', authenticate, async (req: any, res) => {
  const { name, cost, billing_cycle, next_billing_date } = req.body;
  try {
    const { id } = await db.dbInsertSubscription(req.user.id, { name, cost, billing_cycle, next_billing_date });
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

router.post('/ai/advisor', authenticate, async (req: any, res) => {
  const { prompt } = req.body;
  if (!ai) return res.status(503).json({ error: 'AI advisor not configured' });
  try {
    const [transactions, budgets] = await Promise.all([
      db.dbGetTransactions(req.user.id, 50),
      db.dbGetBudgets(req.user.id),
    ]);
    const context = `
User Financial Data Context:
Transactions (last 50): ${JSON.stringify(transactions)}
Budgets: ${JSON.stringify(budgets)}
User Question/Prompt: ${prompt}
Provide a helpful, concise financial advice based on the user's data. Be professional and encouraging.
`;
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: context });
    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

export default router;
