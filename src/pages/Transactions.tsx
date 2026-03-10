import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../lib/api';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Edit2, Trash2, X, ReceiptText } from 'lucide-react';

export const Transactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const defaultExpenseCategories = ['Food', 'Rent', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Health'];
  const defaultIncomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts'];

  const categories = Array.from(new Set([
    ...(formData.type === 'expense' ? defaultExpenseCategories : defaultIncomeCategories),
    ...transactions.filter(t => t.type === formData.type).map(t => t.category)
  ])).sort();

  const handleOpenModal = (tx?: any) => {
    if (tx) {
      setEditingId(tx.id);
      setFormData({
        type: tx.type,
        amount: tx.amount.toString(),
        category: tx.category,
        date: tx.date.split('T')[0],
        notes: tx.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({ type: 'expense', amount: '', category: '', date: new Date().toISOString().split('T')[0], notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, {
          ...formData,
          amount: parseFloat(formData.amount),
        });
      } else {
        await api.post('/transactions', {
          ...formData,
          amount: parseFloat(formData.amount),
        });
      }
      setIsModalOpen(false);
      fetchTransactions();
      setFormData({ type: 'expense', amount: '', category: '', date: new Date().toISOString().split('T')[0], notes: '' });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || tx.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Transactions</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your income and expenses.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Add Transaction
        </button>
      </div>

      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center w-full sm:w-auto bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button 
              onClick={() => setFilterType('all')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === 'all' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('income')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === 'income' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              Income
            </button>
            <button 
              onClick={() => setFilterType('expense')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === 'expense' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              Expense
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 hidden sm:table-cell">Notes</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg mr-3 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                        {tx.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </div>
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{tx.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate hidden sm:table-cell">
                    {tx.notes || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(tx)} className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
                        <ReceiptText size={20} className="text-zinc-400" />
                      </div>
                      <p className="text-sm">No transactions found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#121212] rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80"
          >
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/20">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'income' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Income
                </button>
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
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                <input
                  type="text"
                  required
                  list="category-options"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  placeholder={formData.type === 'expense' ? "e.g., Groceries, Rent" : "e.g., Salary, Freelance"}
                />
                <datalist id="category-options">
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  placeholder="Additional details..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl transition-colors shadow-sm"
                >
                  {editingId ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
