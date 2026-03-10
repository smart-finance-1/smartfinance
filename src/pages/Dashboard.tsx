import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../store/AuthContext';
import api from '../lib/api';
import { Wallet, TrendingUp, TrendingDown, Target, Activity, ArrowRight, Plus, ReceiptText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    savings: 0,
    healthScore: 85,
  });
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/transactions');
        const txs = res.data;
        setTransactions(txs);
        
        let income = 0;
        let expense = 0;
        txs.forEach((t: any) => {
          if (t.type === 'income') income += t.amount;
          if (t.type === 'expense') expense += t.amount;
        });
        
        setStats({
          totalIncome: income,
          totalExpense: expense,
          savings: income - expense,
          healthScore: Math.min(100, Math.max(0, 50 + ((income - expense) / (income || 1)) * 50)),
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const pieData = [
    { name: 'Income', value: stats.totalIncome, color: '#10b981' },
    { name: 'Expense', value: stats.totalExpense, color: '#ef4444' },
  ];

  const recentTxs = transactions.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Here's what's happening with your finances today.</p>
        </div>
        <Link 
          to="/transactions" 
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Add Transaction
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Balance" amount={stats.savings} icon={Wallet} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" />
        <StatCard title="Total Income" amount={stats.totalIncome} icon={TrendingUp} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatCard title="Total Expense" amount={stats.totalExpense} icon={TrendingDown} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-500/10" />
        <StatCard title="Health Score" amount={stats.healthScore} isScore icon={Activity} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Income vs Expense</h2>
            <select className="text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/50">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Current Month', Income: stats.totalIncome, Expense: stats.totalExpense }]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          <div className="space-y-1 flex-1">
            {recentTxs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-8">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
                  <ReceiptText size={20} className="text-zinc-400" />
                </div>
                <p className="text-sm">No transactions yet.</p>
              </div>
            ) : (
              recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 rounded-2xl transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                      {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{tx.category}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, amount, icon: Icon, color, bg, isScore = false }: any) => (
  <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${bg} ${color}`}>
        <Icon size={22} />
      </div>
      {isScore && (
        <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full">
          Good
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
        {isScore ? amount.toFixed(0) : `₹${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </h3>
    </div>
  </div>
);
