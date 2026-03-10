import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LayoutDashboard, ReceiptText, PieChart, Target, Bot, LogOut, Menu, X, FileBarChart } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }: { isOpen: boolean, toggleSidebar: () => void }) => {
  const location = useLocation();
  const { logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'AI Advisor', path: '/advisor', icon: Bot },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="flex items-center justify-between h-20 px-8 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <PieChart size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">SmartFinance</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-2 -mr-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          <div className="px-4 mb-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Overview</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'}`}
              >
                <Icon size={20} className={`mr-3 transition-colors ${isActive ? 'text-emerald-400 dark:text-emerald-600' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 m-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50">
          <button
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export const Layout = () => {
  const { token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quote, setQuote] = useState({ text: 'Loading...', author: '' });

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch('https://api.quotable.io/random?tags=success|business|inspirational');
        if (response.ok) {
          const data = await response.json();
          setQuote({ text: data.content, author: data.author });
        } else {
          setQuote({ text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' });
        }
      } catch (error) {
        setQuote({ text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' });
      }
    };
    fetchQuote();
  }, []);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500/30">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="lg:ml-72 flex flex-col min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <Menu size={20} />
            </button>
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
              <PieChart size={14} className="text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">SmartFinance</span>
          </div>
          <div className="w-10"></div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-6 p-4 bg-white dark:bg-[#121212] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 italic">"{quote.text}"</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">— {quote.author}</p>
            </div>
            <div className="hidden sm:block px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full whitespace-nowrap">
              Quote of the Day
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
