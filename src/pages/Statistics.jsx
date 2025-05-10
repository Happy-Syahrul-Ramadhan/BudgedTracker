import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar/NavbarBottom';

// Komponen animasi mengetik
const TypingAnimation = () => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="mt-[-50px] mb-20">
      <h2 className="text-lg mb-2 text-blue-300">AI Berfikir</h2>
      <div className="p-6 bg-gray-800 rounded-lg border-l-4 border-blue-500 flex items-start">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="typing-animation">
            <span className="inline-block align-middle h-3 w-3 bg-blue-400 rounded-full mr-1 animate-pulse"></span>
            <span className="inline-block align-middle h-3 w-3 bg-blue-400 rounded-full mr-1 animate-pulse delay-100"></span>
            <span className="inline-block align-middle h-3 w-3 bg-blue-400 rounded-full animate-pulse delay-200"></span>
            <span className="font-medium text-gray-300 ml-2">Berfikirr{dots}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Statistics = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);

  // Load financial data from localStorage or IndexedDB
  useEffect(() => {
    loadFinancialData();
  }, []);

  // Load and analyze financial data
  const loadFinancialData = async () => {
    try {
      // Try to get data from localStorage first
      let loadedTransactions = [];
      const savedTransactions = localStorage.getItem('transactions');
      
      if (savedTransactions) {
        loadedTransactions = JSON.parse(savedTransactions);
        console.log("Data loaded from localStorage:", loadedTransactions);
      } else {
        // If not in localStorage, try IndexedDB as fallback
        try {
          loadedTransactions = await loadFromIndexedDB();
          console.log("Data loaded from IndexedDB:", loadedTransactions);
        } catch (indexedDBError) {
          console.error("Error loading from IndexedDB:", indexedDBError);
        }
      }
      
      if (loadedTransactions && loadedTransactions.length > 0) {
        setTransactions(loadedTransactions);
        
        // Analyze the financial data
        analyzeFinancialData(loadedTransactions);
        return true;
      } else {
        console.log("No financial data found");
        return false;
      }
    } catch (error) {
      console.error("Error loading financial data:", error);
      return false;
    }
  };

  // Load from IndexedDB as fallback
  const loadFromIndexedDB = async () => {
    return new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open("budgetTrackerDB", 1);
        
        request.onerror = (event) => {
          reject("Couldn't open IndexedDB: " + event.target.error);
        };
        
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(["transactions"], "readonly");
          const store = transaction.objectStore("transactions");
          const getAll = store.getAll();
          
          getAll.onsuccess = () => {
            resolve(getAll.result || []);
          };
          
          getAll.onerror = (event) => {
            reject("Error getting data: " + event.target.error);
          };
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  // Analyze financial data and create a summary
  const analyzeFinancialData = (transactions) => {
    // Calculate basic financial information
    const income = transactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const expense = transactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const balance = income - expense;

    // Group by categories
    const categories = {};
    transactions.forEach(transaction => {
      if (!categories[transaction.description]) {
        categories[transaction.description] = {
          income: 0,
          expense: 0
        };
      }
      
      if (transaction.type === 'Pemasukan') {
        categories[transaction.description].income += parseFloat(transaction.amount || 0);
      } else {
        categories[transaction.description].expense += parseFloat(transaction.amount || 0);
      }
    });

    // Get top income and expense categories
    const topIncomeCategories = Object.entries(categories)
      .filter(([_, values]) => values.income > 0)
      .sort((a, b) => b[1].income - a[1].income)
      .slice(0, 5);
    
    const topExpenseCategories = Object.entries(categories)
      .filter(([_, values]) => values.expense > 0)
      .sort((a, b) => b[1].expense - a[1].expense)
      .slice(0, 5);

    // Group by month for trends
    const monthlyData = {};
    transactions.forEach(transaction => {
      if (!transaction.date) return;
      
      const date = new Date(transaction.date);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthName,
          income: 0,
          expense: 0,
          savings: 0
        };
      }
      
      if (transaction.type === 'Pemasukan') {
        monthlyData[monthYear].income += parseFloat(transaction.amount || 0);
      } else {
        monthlyData[monthYear].expense += parseFloat(transaction.amount || 0);
      }
      
      monthlyData[monthYear].savings = monthlyData[monthYear].income - monthlyData[monthYear].expense;
    });

    // Get the last 5 transactions
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);

    // Create summary object
    const summary = {
      totalIncome: income,
      totalExpense: expense,
      balance: balance,
      transactionCount: transactions.length,
      topIncomeCategories,
      topExpenseCategories,
      monthlyTrends: Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6), // Last 6 months
      recentTransactions
    };

    setFinancialSummary(summary);
    console.log("Financial summary created:", summary);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Ask AI about financial data
  const askGroq = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResponse(''); // Clear previous response
    
    try {
      // Generate data context for AI
      let dataContext = '';
      let enhancedSystemPrompt = 'Anda adalah asisten keuangan yang membantu menganalisis dan memberikan wawasan tentang data keuangan dalam bahasa Indonesia.';
      
      if (financialSummary) {
        // Create a concise financial summary for the AI
        dataContext = `
Data keuangan pengguna:
- Total Pemasukan: ${formatCurrency(financialSummary.totalIncome)}
- Total Pengeluaran: ${formatCurrency(financialSummary.totalExpense)}
- Saldo: ${formatCurrency(financialSummary.balance)}
- Jumlah Transaksi: ${financialSummary.transactionCount}

Kategori Pemasukan Teratas:
${financialSummary.topIncomeCategories.map(([category, data]) => 
  `- ${category}: ${formatCurrency(data.income)}`
).join('\n')}

Kategori Pengeluaran Teratas:
${financialSummary.topExpenseCategories.map(([category, data]) => 
  `- ${category}: ${formatCurrency(data.expense)}`
).join('\n')}

Tren Bulanan (6 bulan terakhir):
${financialSummary.monthlyTrends.map(data => 
  `- ${data.month}: Pemasukan ${formatCurrency(data.income)}, Pengeluaran ${formatCurrency(data.expense)}, Tabungan ${formatCurrency(data.savings)}`
).join('\n')}

Transaksi Terbaru:
${financialSummary.recentTransactions.map(t => 
  `- ${t.date || 'N/A'}: ${t.type} ${formatCurrency(parseFloat(t.amount || 0))} (${t.description})`
).join('\n')}
`;
        
        enhancedSystemPrompt = 'Anda adalah asisten keuangan yang membantu menganalisis dan memberikan wawasan tentang data keuangan dalam bahasa Indonesia. Berikan jawaban yang spesifik berdasarkan data keuangan pengguna. Sertakan angka dan fakta konkret dari data yang tersedia. Jika ada pola atau tren, tolong sorot dan jelaskan. Berikan saran praktis jika relevan.';
      }

      // Enhanced user query
      const enhancedQuery = financialSummary 
        ? `${dataContext}\n\nPertanyaan pengguna: ${query}\n\nBerikan analisis berdasarkan data keuangan saya di atas.` 
        : query;
      
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: enhancedSystemPrompt
            },
            {
              role: 'user',
              content: enhancedQuery
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      
      // Menampilkan respons karakter per karakter dengan efek mengetik
      setResponse(data.choices[0].message.content);
    } catch (err) {
      setError(`Error: ${err.message || 'Something went wrong'}`);
      console.error('Groq API error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Suggested prompts to help users
  const suggestedPrompts = [
    "Berapa total pemasukan dan pengeluaran saya?",
    "Apa kategori pengeluaran terbesar saya?",
    "Bagaimana tren keuangan saya dalam 6 bulan terakhir?",
    "Berapa persentase pendapatan yang saya simpan?",
    "Berikan saran untuk mengoptimalkan keuangan saya"
  ];

  return (
    <>
      <Navbar/>
      <div className="max-w-[480px] mx-auto bg-black text-white p-6 font-bold flex flex-col min-h-screen overflow-auto">
        <div className="w-full">
          <h1 className="text-2xl text-center text-blue-500 mb-6">Tanya AI</h1>
          
          {/* Financial Data Status */}
          <div className="mb-4 text-center">
            {financialSummary ? (
              <div className="mb-6 text-xs text-gray-400">
                <p>Data keuangan Anda berhasil dimuat • {financialSummary.transactionCount} transaksi</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="bg-gray-800 p-2 rounded">
                    <p className="text-green-400">Pemasukan</p>
                    <p className="text-sm">{formatCurrency(financialSummary.totalIncome)}</p>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <p className="text-red-400">Pengeluaran</p>
                    <p className="text-sm">{formatCurrency(financialSummary.totalExpense)}</p>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <p className="text-blue-400">Saldo</p>
                    <p className="text-sm">{formatCurrency(financialSummary.balance)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-yellow-500 text-sm mb-2">
                  {transactions.length === 0 ? "Tidak ada data keuangan ditemukan" : "Memuat data keuangan..."}
                </p>
                {transactions.length === 0 && (
                  <button 
                    className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg" 
                    onClick={loadFinancialData}
                  >
                    Muat Ulang Data
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Suggested Prompts */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Contoh pertanyaan:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button 
                  key={index}
                  className="bg-gray-800 hover:bg-gray-700 text-xs py-1 px-2 rounded-full text-blue-300"
                  onClick={() => setQuery(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-20 mt-10">
            <p className="text-sm text-gray-400 mb-3">Tanyakan Apa saja tentang Financial</p>
            <textarea 
              className="w-full p-4 rounded-lg bg-gray-800 text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Jelaskan tren pengeluaran saya selama 3 bulan terakhir"
              rows="4"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:bg-gray-500"
              onClick={askGroq}
              disabled={loading || !query.trim()}
            >
              {loading ? 'Memproses...' : 'Tanyakan Asisten AI'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-700 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          
          {/* Menampilkan animasi mengetik saat loading */}
          {loading && <TypingAnimation />}
          
          {/* Menampilkan respons AI */}
          {!loading && response && (
            <div className="mt-[-50px] mb-20">
              <h2 className="text-lg mb-2 text-blue-300">Jawab AI:</h2>
              <div className="p-6 bg-gray-800 rounded-lg text-sm font-normal whitespace-pre-wrap border-l-4 border-blue-500 max-h-96 overflow-y-auto">
                {response}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Statistics;