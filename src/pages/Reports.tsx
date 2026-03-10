import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../lib/api';
import { Download, FileText, FileSpreadsheet, FileBarChart } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Reports = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvType, setCsvType] = useState('transactions');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transactions');
        setTransactions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTransactions();
  }, []);

  // Data Aggregation Helpers
  const getMonthlyData = () => {
    const data = transactions.reduce((acc, tx) => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = { income: 0, expense: 0 };
      acc[month][tx.type] += tx.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);
    
    return Object.keys(data).sort().reverse().map(month => ({
      month,
      income: data[month].income,
      expense: data[month].expense,
      net: data[month].income - data[month].expense
    }));
  };

  const getCategoryData = () => {
    const data = transactions.filter(t => t.type === 'expense').reduce((acc, tx) => {
      if (!acc[tx.category]) acc[tx.category] = 0;
      acc[tx.category] += tx.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(data).sort((a, b) => data[b] - data[a]).map(category => ({
      category,
      amount: data[category]
    }));
  };

  const getYearlyData = () => {
    const data = transactions.reduce((acc, tx) => {
      const year = tx.date.substring(0, 4); // YYYY
      if (!acc[year]) acc[year] = { income: 0, expense: 0 };
      acc[year][tx.type] += tx.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return Object.keys(data).sort().reverse().map(year => ({
      year,
      income: data[year].income,
      expense: data[year].expense,
      net: data[year].income - data[year].expense
    }));
  };

  const generatePDF = () => {
    setIsLoading(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Financial Report', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);

      // Overall Summary
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netSavings = totalIncome - totalExpense;

      doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 14, 40);
      doc.text(`Total Expense: ₹${totalExpense.toFixed(2)}`, 14, 46);
      doc.text(`Net Savings: ₹${netSavings.toFixed(2)}`, 14, 52);

      // Yearly Overview Table
      const yearlyData = getYearlyData();
      if (yearlyData.length > 0) {
        autoTable(doc, {
          startY: 60,
          head: [['Year', 'Income', 'Expense', 'Net Savings']],
          body: yearlyData.map(y => [y.year, `₹${y.income.toFixed(2)}`, `₹${y.expense.toFixed(2)}`, `₹${y.net.toFixed(2)}`]),
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
        });
      }

      // Monthly Summary Table
      const monthlyData = getMonthlyData();
      if (monthlyData.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Monthly Summary', 14, 22);
        autoTable(doc, {
          startY: 30,
          head: [['Month', 'Income', 'Expense', 'Net Savings']],
          body: monthlyData.map(m => [m.month, `₹${m.income.toFixed(2)}`, `₹${m.expense.toFixed(2)}`, `₹${m.net.toFixed(2)}`]),
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
        });
      }

      // Category Breakdown Table
      const categoryData = getCategoryData();
      if (categoryData.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Category Breakdown (Expenses)', 14, 22);
        autoTable(doc, {
          startY: 30,
          head: [['Category', 'Amount Spent']],
          body: categoryData.map(c => [c.category, `₹${c.amount.toFixed(2)}`]),
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
        });
      }

      // Transactions Table
      if (transactions.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Transaction History', 14, 22);
        const tableColumn = ["Date", "Type", "Category", "Amount", "Notes"];
        const tableRows = transactions.map(tx => [
          format(new Date(tx.date), 'MMM dd, yyyy'),
          tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
          tx.category,
          `₹${tx.amount.toFixed(2)}`,
          tx.notes || '-'
        ]);

        autoTable(doc, {
          startY: 30,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
        });
      }

      doc.save('financial_report.pdf');
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCSV = () => {
    setIsLoading(true);
    try {
      let csvRows: string[] = [];
      let filename = 'financial_report.csv';

      if (csvType === 'transactions') {
        const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
        csvRows.push(headers.join(','));
        transactions.forEach(tx => {
          const row = [tx.date, tx.type, `"${tx.category}"`, tx.amount, `"${tx.notes || ''}"`];
          csvRows.push(row.join(','));
        });
        filename = 'transactions_report.csv';
      } else if (csvType === 'monthly') {
        const headers = ['Month', 'Income', 'Expense', 'Net Savings'];
        csvRows.push(headers.join(','));
        getMonthlyData().forEach(m => {
          csvRows.push([m.month, m.income, m.expense, m.net].join(','));
        });
        filename = 'monthly_summary.csv';
      } else if (csvType === 'category') {
        const headers = ['Category', 'Amount Spent'];
        csvRows.push(headers.join(','));
        getCategoryData().forEach(c => {
          csvRows.push([`"${c.category}"`, c.amount].join(','));
        });
        filename = 'category_breakdown.csv';
      }
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating CSV', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Reports & Export</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Analyze your financial data and export reports.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-8">Monthly Income vs Expenses</h2>
        <div className="h-80 w-full">
          {getMonthlyData().length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getMonthlyData().reverse()} // Reverse to show chronological order
                margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, undefined]}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
                <FileBarChart size={20} className="text-zinc-400" />
              </div>
              <p>No data available to display chart.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col items-center text-center group hover:border-red-500/30 transition-colors">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText size={28} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">PDF Report</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
            Download a comprehensive financial summary including total income, expenses, yearly/monthly overviews, category breakdowns, and a detailed transaction history.
          </p>
          <div className="mt-auto w-full flex justify-center">
            <button
              onClick={generatePDF}
              disabled={isLoading || transactions.length === 0}
              className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download size={18} className="mr-2" />
              Export as PDF
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121212] p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col items-center text-center group hover:border-emerald-500/30 transition-colors">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileSpreadsheet size={28} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">CSV Export</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
            Export your financial data as a CSV file. Select the type of report you want to export for custom analysis in Excel or Google Sheets.
          </p>
          
          <div className="w-full max-w-xs mb-8 text-left">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Report Type</label>
            <select
              value={csvType}
              onChange={(e) => setCsvType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-sm"
            >
              <option value="transactions">All Transactions</option>
              <option value="monthly">Monthly Summary</option>
              <option value="category">Category Breakdown</option>
            </select>
          </div>

          <div className="mt-auto w-full flex justify-center">
            <button
              onClick={generateCSV}
              disabled={isLoading || transactions.length === 0}
              className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download size={18} className="mr-2" />
              Export as CSV
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
