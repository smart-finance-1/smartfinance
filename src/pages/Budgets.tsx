import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../lib/api';
import { Plus, PieChart, AlertCircle } from 'lucide-react';

export const Budgets = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  const fetchData = async () => {
    try {
      const [budgetsRes, txRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/transactions')
      ]);
      setBudgets(budgetsRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const defaultExpenseCategories = ['Food', 'Rent', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Health'];

  const categories = Array.from(new Set([
    ...defaultExpenseCategories,
    ...transactions.filter(t => t.type === 'expense').map(t => t.category)
  ])).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/budgets', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setIsModalOpen(false);
      fetchData();
      setFormData({ category: '', amount: '', month: new Date().toISOString().slice(0, 7) });
    } catch (err) {
      console.error(err);
    }
  };

  const getSpentAmount = (category: string, month: string) => {
    return transactions
      .filter((tx) => tx.type === 'expense' && tx.category === category && tx.date.startsWith(month))
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Budgets</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your spending limits by category.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Set Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const spent = getSpentAmount(budget.category, budget.month);
          const percentage = Math.min(100, (spent / budget.amount) * 100);
          const isOver = spent > budget.amount;

          return (
            <div key={budget.id} className="bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 mr-4">
                    <PieChart size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">{budget.category}</h3>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">{new Date(budget.month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                {isOver && (
                  <div className="text-red-500 bg-red-50 dark:bg-red-500/10 p-2 rounded-xl" title="Over budget">
                    <AlertCircle size={20} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Spent: <span className="font-semibold text-zinc-900 dark:text-white">₹{spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                  <span className="text-zinc-500 dark:text-zinc-400">Budget: <span className="font-semibold text-zinc-900 dark:text-white">₹{budget.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                </div>
                <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className={`text-xs text-right ${isOver ? 'text-red-500 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {isOver ? `Over by ₹${(spent - budget.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${(100 - percentage).toFixed(0)}% remaining`}
                </p>
              </div>
            </div>
          );
        })}
        {budgets.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-3xl bg-zinc-50/50 dark:bg-[#121212]/50">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <PieChart size={28} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No budgets set</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">Create a budget to track your spending limits and reach your financial goals faster.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium transition-colors shadow-sm inline-flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Set First Budget
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#121212] rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80"
          >
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/20">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Set Budget</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                <input
                  type="text"
                  required
                  list="budget-category-options"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  placeholder="e.g., Food, Rent, Entertainment"
                />
                <datalist id="budget-category-options">
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Month</label>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl transition-colors shadow-sm"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
