import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../lib/api';
import { Plus, Target, Trophy } from 'lucide-react';

export const Goals = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
  });

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/goals', {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
      });
      setIsModalOpen(false);
      fetchGoals();
      setFormData({ name: '', target_amount: '', current_amount: '', deadline: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Savings Goals</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your progress towards financial milestones.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Create Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const percentage = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
          const isCompleted = percentage >= 100;

          return (
            <div key={goal.id} className="bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-2xl mr-4 ${isCompleted ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'}`}>
                    {isCompleted ? <Trophy size={22} /> : <Target size={22} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">{goal.name}</h3>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                      {goal.deadline ? `By ${new Date(goal.deadline).toLocaleDateString()}` : 'No deadline'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Saved: <span className="font-semibold text-zinc-900 dark:text-white">₹{goal.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                  <span className="text-zinc-500 dark:text-zinc-400">Target: <span className="font-semibold text-zinc-900 dark:text-white">₹{goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                </div>
                <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-right text-zinc-500 dark:text-zinc-400 font-medium">
                  {percentage.toFixed(0)}% completed
                </p>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-3xl bg-zinc-50/50 dark:bg-[#121212]/50">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Target size={28} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No goals set</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">Create a savings goal to track your progress towards a new car, vacation, or emergency fund.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium transition-colors shadow-sm inline-flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Create First Goal
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
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Create Goal</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Goal Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  placeholder="e.g., New Car, Vacation"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Current Amount (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Deadline (Optional)</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                  Save Goal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
