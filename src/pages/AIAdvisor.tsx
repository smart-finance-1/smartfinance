import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../lib/api';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export const AIAdvisor = () => {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am your AI Financial Advisor. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/advisor', { prompt: userMessage });
      setMessages((prev) => [...prev, { role: 'ai', text: res.data.text }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, I encountered an error while processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-6rem)] flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">AI Financial Advisor</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Get personalized insights based on your financial data.</p>
      </div>

      <div className="flex-1 bg-white dark:bg-[#121212] rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scroll-smooth">
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 ml-4' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 mr-4'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={22} />}
                </div>
                <div className={`px-5 py-4 rounded-3xl shadow-sm ${msg.role === 'user' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-tr-sm' : 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex max-w-[85%] sm:max-w-[75%] flex-row">
                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shadow-sm bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 mr-4">
                  <Bot size={22} />
                </div>
                <div className="px-6 py-4 rounded-3xl shadow-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-200 rounded-tl-sm flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <div className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800/50 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md absolute bottom-0 left-0 right-0">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3 max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your spending, how to save, etc..."
              className="flex-1 pl-6 pr-14 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all shadow-sm text-[15px]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 dark:bg-white dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-zinc-900 rounded-xl transition-colors shadow-sm flex-shrink-0"
            >
              <Send size={18} className={isLoading ? "opacity-0" : "opacity-100"} />
              {isLoading && <Loader2 size={18} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
