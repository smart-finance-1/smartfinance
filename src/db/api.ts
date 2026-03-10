/**
 * Database API layer - uses Supabase on Vercel, SQLite locally.
 * Import this instead of db/index.js in serverless (api/) to avoid better-sqlite3.
 */

import { getSupabase, useSupabase } from './supabase.js';

export type User = {
  id: number;
  name: string;
  email: string;
  password?: string;
  currency?: string;
  timezone?: string;
};

export async function dbInsertUser(name: string, email: string, hashedPassword: string): Promise<{ id: number }> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword })
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id };
  }
  throw new Error('Supabase required for serverless');
}

export async function dbGetUserByEmail(email: string): Promise<User | null> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error?.code === 'PGRST116') return null;
    if (error) throw error;
    return data as User;
  }
  throw new Error('Supabase required for serverless');
}

export async function dbGetWallets(userId: number): Promise<unknown[]> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  }
  throw new Error('Supabase required for serverless');
}

export async function dbInsertWallet(userId: number, name: string, type: string, balance: number, currency: string): Promise<{ id: number }> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('wallets')
      .insert({ user_id: userId, name, type, balance, currency })
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id };
  }
  throw new Error('Supabase required for serverless');
}

export async function dbGetTransactions(userId: number, limit?: number): Promise<unknown[]> {
  if (useSupabase()) {
    const supabase = getSupabase();
    let q = supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }
  throw new Error('Supabase required for serverless');
}

export async function dbInsertTransaction(
  userId: number,
  payload: { wallet_id?: number; type: string; amount: number; category: string; date: string; payment_method?: string; notes?: string }
): Promise<{ id: number }> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: payload.wallet_id || null,
        type: payload.type,
        amount: payload.amount,
        category: payload.category,
        date: payload.date,
        payment_method: payload.payment_method || null,
        notes: payload.notes || null,
      })
      .select('id')
      .single();
    if (error) throw error;
    if (payload.wallet_id && payload.type) {
      const change = payload.type === 'income' ? payload.amount : -payload.amount;
      const { data: w } = await supabase.from('wallets').select('balance').eq('id', payload.wallet_id).single();
      if (w) await supabase.from('wallets').update({ balance: (w.balance || 0) + change }).eq('id', payload.wallet_id);
    }
    return { id: data.id };
  }
  throw new Error('Supabase required for serverless');
}

export async function dbUpdateWalletBalance(walletId: number, delta: number): Promise<void> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data } = await supabase.from('wallets').select('balance').eq('id', walletId).single();
    if (data) {
      await supabase.from('wallets').update({ balance: (data.balance || 0) + delta }).eq('id', walletId);
    }
  }
}

export async function dbGetBudgets(userId: number): Promise<unknown[]> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('budgets').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  }
  throw new Error('Supabase required for serverless');
}

export async function dbUpsertBudget(userId: number, category: string, amount: number, month: string): Promise<{ id: number }> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('budgets')
      .upsert({ user_id: userId, category, amount, month }, { onConflict: 'user_id,category,month' } as any)
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id };
  }
  throw new Error('Supabase required for serverless');
}

export async function dbGetGoals(userId: number): Promise<unknown[]> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  }
  throw new Error('Supabase required for serverless');
}

export async function dbInsertGoal(
  userId: number,
  payload: { name: string; target_amount: number; current_amount?: number; deadline?: string }
): Promise<{ id: number }> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        name: payload.name,
        target_amount: payload.target_amount,
        current_amount: payload.current_amount ?? 0,
        deadline: payload.deadline ?? null,
      })
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id };
  }
  throw new Error('Supabase required for serverless');
}

export async function dbGetSubscriptions(userId: number): Promise<unknown[]> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  }
  throw new Error('Supabase required for serverless');
}

export async function dbInsertSubscription(
  userId: number,
  payload: { name: string; cost: number; billing_cycle: string; next_billing_date?: string }
): Promise<{ id: number }> {
  if (useSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        name: payload.name,
        cost: payload.cost,
        billing_cycle: payload.billing_cycle,
        next_billing_date: payload.next_billing_date ?? null,
      })
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id };
  }
  throw new Error('Supabase required for serverless');
}
