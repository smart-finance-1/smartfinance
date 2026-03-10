# Supabase setup for Vercel deployment

`better-sqlite3` does not run reliably on Vercel serverless. Use Supabase for production.

## 1. Create tables in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor**
3. Run the contents of `supabase-schema.sql`

## 2. Add env vars in Vercel

1. Project → **Settings** → **Environment Variables**
2. Add:
   - `SUPABASE_URL` – from Supabase → Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` – from Supabase → Settings → API (keep secret)
   - `GEMINI_API_KEY` – for AI advisor
   - `JWT_SECRET` – any random string for tokens

## 3. Redeploy

Push to your repo and redeploy. Login/register will use Supabase instead of SQLite.
