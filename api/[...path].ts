import express from 'express';
import cors from 'cors';
import apiRoutes from '../src/server/routes-supabase.js';

const app = express();

app.use(cors());
app.use(express.json());

// Use Supabase-backed routes (no better-sqlite3) for Vercel serverless
app.use('/api', apiRoutes);

export default app;
