import express from 'express';
import cors from 'cors';
import { initDb } from '../src/db/index.js';
import apiRoutes from '../src/server/routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// In serverless, modules can be reused across invocations.
// Keep DB initialization idempotent by relying on table IF NOT EXISTS.
initDb();

app.use('/api', apiRoutes);

export default app;
