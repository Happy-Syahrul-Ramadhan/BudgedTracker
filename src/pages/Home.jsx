// Home.jsx with Reset Data and Delete Transaction Features
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/navbar/NavbarBottom';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon, CreditCardIcon, CalendarIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import * as XLSX from 'xlsx'; // Import SheetJS
import Swal from 'sweetalert2'; // Import SweetAlert2

const Home = () => {
// State management
const [transactions, setTransactions] = useState([]);
const [balance, setBalance] = useState(0);
const [income, setIncome] = useState(0);
const [expense, setExpense] = useState(0);
const [showAddModal, setShowAddModal] = useState(false);
const [transactionType, setTransactionType] = useState('');
const [amount, setAmount] = useState('');
const [description, setDescription] = useState('');
// const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
const [periodFilter, setPeriodFilter] = useState('Semua');
const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
const [filteredTransactions, setFilteredTransactions] = useState([]);
const [categoryData, setCategoryData] = useState({ income: [], expense: [] });
const [showIncomeCategoryChart, setShowIncomeCategoryChart] = useState(true);
const [lastExcelOperation, setLastExcelOperation] = useState({ type: '', time: null, status: '' });
const [initialLoadComplete, setInitialLoadComplete] = useState(false);

// Refs
const fileInputRef = useRef(null);

// Format current date as YYYY-MM-DD for the date input
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [transactionDate, setTransactionDate] = useState(formattedDate);

// Fungsi helper untuk alert dengan styling konsisten
const showAlert = (options) => {
  const defaults = {
    confirmButtonColor: '#8B5CF6', // purple-500
    background: '#1F2937', // gray-800
    color: '#E5E7EB', // gray-200
  };
  
  return Swal.fire({
    ...defaults,
    ...options
  });
};

// Fungsi untuk menginisialisasi dan membuka database IndexedDB
const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open("budgetTrackerDB", 1);
      
      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject("Couldn't open IndexedDB");
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Buat object store jika belum ada
        if (!db.objectStoreNames.contains("transactions")) {
          db.createObjectStore("transactions", { keyPath: "id" });
        }
      };
    } catch (error) {
      console.error("Error initializing IndexedDB:", error);
      reject(error);
    }
  });
};

// Fungsi untuk menyimpan transaksi ke IndexedDB
const saveToIndexedDB = async (transactionsData) => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(["transactions"], "readwrite");
    const store = transaction.objectStore("transactions");
    
    // Hapus semua data yang ada
    store.clear();
    
    // Tambahkan semua transaksi
    transactionsData.forEach(t => {
      store.add(t);
    });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log("All transactions saved to IndexedDB");
        resolve(true);
      };
      
      transaction.onerror = (event) => {
        console.error("Error saving to IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error("Failed to save to IndexedDB:", error);
    // Jika gagal menyimpan ke IndexedDB, tetap simpan ke localStorage
    try {
      localStorage.setItem('transactions', JSON.stringify(transactionsData));
      console.log("Fallback: Data saved to localStorage");
    } catch (localError) {
      console.error("Error saving to localStorage:", localError);
    }
    return false;
  }
};

// Fungsi untuk memuat transaksi dari IndexedDB
const loadFromIndexedDB = async () => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(["transactions"], "readonly");
    const store = transaction.objectStore("transactions");
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        console.log("Transactions loaded from IndexedDB:", event.target.result);
        resolve(event.target.result || []);
      };
      
      request.onerror = (event) => {
        console.error("Error loading from IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error("Failed to load from IndexedDB:", error);
    return [];
  }
};

// Load data from storage on component mount
useEffect(() => {
  const loadData = async () => {
    try {
      console.log("Attempting to load data...");
      
      // Try to load from IndexedDB first
      let loadedTransactions = [];
      try {
        const indexedDBData = await loadFromIndexedDB();
        if (indexedDBData && indexedDBData.length > 0) {
          console.log("Data loaded from IndexedDB:", indexedDBData);
          loadedTransactions = indexedDBData;
        }
      } catch (indexedDBError) {
        console.error("Error loading from IndexedDB:", indexedDBError);
      }
      
      // If no data in IndexedDB, try localStorage
      if (loadedTransactions.length === 0) {
        try {
          const savedTransactions = localStorage.getItem('transactions');
          if (savedTransactions) {
            const parsedTransactions = JSON.parse(savedTransactions);
            console.log("Data loaded from localStorage:", parsedTransactions);
            loadedTransactions = parsedTransactions;
            
            // Save to IndexedDB for next time
            await saveToIndexedDB(parsedTransactions);
          }
        } catch (localStorageError) {
          console.error("Error loading from localStorage:", localStorageError);
        }
      }
      
      if (loadedTransactions.length > 0) {
        // Ensure all transactions have proper structure
        const validatedTransactions = loadedTransactions.map(t => ({
          id: t.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
          type: t.type || 'Pengeluaran',
          amount: parseFloat(t.amount || 0),
          description: t.description || 'Tidak ada keterangan',
          date: t.date || new Date().toISOString().split('T')[0]
        }));
        
        setTransactions(validatedTransactions);
      }
      
      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Error in loadData:", error);
      setInitialLoadComplete(true);
    }
  };
  
  loadData();
}, []);

// Save to storage when transactions change
useEffect(() => {
  if (!initialLoadComplete) return; // Skip initial render
  
  if (transactions.length > 0) {
    console.log("Saving transactions:", transactions);
    
    // Save to both storages for redundancy
    try {
      localStorage.setItem('transactions', JSON.stringify(transactions));
      console.log("Data saved to localStorage");
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
    
    saveToIndexedDB(transactions)
      .then(success => {
        if (success) {
          console.log("Data successfully saved to IndexedDB");
        }
      })
      .catch(error => {
        console.error("Error in IndexedDB save:", error);
      });
  } else {
    // If there are no transactions, clear storage
    try {
      localStorage.removeItem('transactions');
      console.log("Data removed from localStorage");
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
    
    try {
      initIndexedDB().then(db => {
        const transaction = db.transaction(["transactions"], "readwrite");
        const store = transaction.objectStore("transactions");
        store.clear();
      });
    } catch (error) {
      console.error("Error clearing IndexedDB:", error);
    }
  }
}, [transactions, initialLoadComplete]);

// Calculate totals and filter transactions when transactions or period filter changes
useEffect(() => {
  if (transactions.length > 0) {
    calculateTotals();
    applyDateFilter();
    prepareCategoryData();
  } else {
    setFilteredTransactions([]);
    setCategoryData({ income: [], expense: [] });
  }
}, [transactions, periodFilter, startDate, endDate]);

// Calculate financial totals
const calculateTotals = () => {
  const totalIncome = transactions
    .filter(t => t.type === 'Pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'Pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  
  setIncome(totalIncome);
  setExpense(totalExpense);
  setBalance(totalIncome - totalExpense);
};

// Apply date filter to transactions
const applyDateFilter = () => {
  let filtered = [...transactions];
  
  if (periodFilter !== 'Semua') {
    const today = new Date();
    
    if (periodFilter === 'Minggu ini') {
      // Start of the week (Monday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      startOfWeek.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(t => new Date(t.date) >= startOfWeek);
    } else if (periodFilter === 'Bulan ini') {
      // Start of the month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      filtered = filtered.filter(t => new Date(t.date) >= startOfMonth);
    } else if (periodFilter === 'Tahun ini') {
      // Start of the year
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      filtered = filtered.filter(t => new Date(t.date) >= startOfYear);
    } else if (periodFilter === 'Kustom') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the end date
      
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= start && transactionDate <= end;
      });
    }
  }
  
  // Sort transactions by date (newest first)
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  setFilteredTransactions(filtered);
};

// Prepare data for category charts
const prepareCategoryData = () => {
  const incomeByCategory = {};
  const expenseByCategory = {};
  
  transactions.forEach(transaction => {
    if (transaction.type === 'Pemasukan') {
      if (incomeByCategory[transaction.description]) {
        incomeByCategory[transaction.description] += transaction.amount;
      } else {
        incomeByCategory[transaction.description] = transaction.amount;
      }
    } else {
      if (expenseByCategory[transaction.description]) {
        expenseByCategory[transaction.description] += transaction.amount;
      } else {
        expenseByCategory[transaction.description] = transaction.amount;
      }
    }
  });
  
  const incomeData = Object.keys(incomeByCategory).map(key => ({
    name: key,
    value: incomeByCategory[key]
  }));
  
  const expenseData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));
  
  setCategoryData({
    income: incomeData,
    expense: expenseData
  });
};

// Function to import data from Excel file
const importFromExcel = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Format data to match application format
      const formattedData = jsonData.map(item => ({
        id: item.ID || Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: item.Tipe,
        amount: parseFloat(item.Jumlah || 0),
        description: item.Keterangan || 'Tidak ada keterangan',
        date: item.Tanggal || new Date().toISOString().split('T')[0]
      }));
      
      // Update state with imported data
      setTransactions(formattedData);
      
      // Update last operation status
      setLastExcelOperation({
        type: 'import',
        time: new Date(),
        status: 'success'
      });
      
      showAlert({
        title: 'Import Berhasil',
        text: 'Data berhasil diimpor dari Excel',
        icon: 'success'
      });
    } catch (error) {
      console.error('Error importing from Excel:', error);
      
      // Update last operation status
      setLastExcelOperation({
        type: 'import',
        time: new Date(),
        status: 'error'
      });
      
      showAlert({
        title: 'Import Gagal',
        text: 'Gagal mengimpor data dari Excel: ' + error.message,
        icon: 'error'
      });
    }
  };
  
  reader.readAsArrayBuffer(file);
  
  // Reset file input
  event.target.value = '';
};

// Function to export data to Excel file
const exportToExcel = (dataToExport = transactions) => {
  try {
    if (dataToExport.length === 0) {
      showAlert({
        title: 'Tidak Ada Data',
        text: 'Tidak ada data transaksi untuk diekspor',
        icon: 'warning',
      });
      return false;
    }
    
    // Prepare data for export
    const exportData = dataToExport.map(t => ({
      ID: t.id,
      Tipe: t.type,
      Jumlah: t.amount,
      Keterangan: t.description,
      Tanggal: t.date
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // ID
      { wch: 12 }, // Tipe
      { wch: 15 }, // Jumlah
      { wch: 25 }, // Keterangan
      { wch: 12 }  // Tanggal
    ];
    ws['!cols'] = colWidths;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    
    // Create summary sheet
    const summaryData = [
      { Kategori: 'Total Pemasukan', Nilai: income },
      { Kategori: 'Total Pengeluaran', Nilai: expense },
      { Kategori: 'Saldo', Nilai: balance }
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");
    
    // Generate Excel file and download
    XLSX.writeFile(wb, "tabungan.xlsx");
    
    // Update last operation status
    setLastExcelOperation({
      type: 'export',
      time: new Date(),
      status: 'success'
    });
    
    showAlert({
      title: 'Ekspor Berhasil',
      text: 'Data berhasil diekspor ke file tabungan.xlsx',
      icon: 'success',
    });
    
    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    
    // Update last operation status
    setLastExcelOperation({
      type: 'export',
      time: new Date(),
      status: 'error'
    });
    
    showAlert({
      title: 'Ekspor Gagal',
      text: 'Gagal mengekspor data ke Excel: ' + error.message,
      icon: 'error',
    });
    
    return false;
  }
};

// Add new transaction
const addTransaction = async () => {
  if (!amount || !description || !transactionDate) {
    showAlert({
      title: 'Form Tidak Lengkap',
      text: 'Harap lengkapi semua data',
      icon: 'warning'
    });
    return;
  }
  
  const newTransaction = {
    id: Date.now().toString(),
    type: transactionType,
    amount: parseFloat(amount),
    description,
    date: transactionDate
  };
  
  try {
    // Update state with new transaction
    const updatedTransactions = [...transactions, newTransaction];
    
    // Immediately save to localStorage for redundancy
    try {
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      console.log("Transaction saved to localStorage");
    } catch (localStorageError) {
      console.error("Error saving to localStorage:", localStorageError);
    }
    
    // Save to IndexedDB
    const dbSaveResult = await saveToIndexedDB(updatedTransactions);
    console.log("IndexedDB save result:", dbSaveResult);
    
    // Update state AFTER saving to storage to ensure consistency
    setTransactions(updatedTransactions);
    
    // Reset form
    setAmount('');
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setShowAddModal(false);
    
    // Show success message
    showAlert({
      title: 'Transaksi Berhasil',
      text: `Transaksi ${transactionType} berhasil ditambahkan.`,
      icon: 'success'
    });
  } catch (error) {
    console.error("Error in addTransaction:", error);
    showAlert({
      title: 'Transaksi Gagal',
      text: `Terjadi kesalahan saat menyimpan transaksi: ${error.message}`,
      icon: 'error'
    });
  }
};

// NEW FUNCTION: Delete a transaction
const deleteTransaction = async (transactionId) => {
  // Show confirmation alert
  const result = await showAlert({
    title: 'Konfirmasi Hapus',
    text: 'Apakah Anda yakin ingin menghapus transaksi ini?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal'
  });
  
  if (result.isConfirmed) {
    try {
      // Filter out the transaction with the given ID
      const updatedTransactions = transactions.filter(t => t.id !== transactionId);
      
      // Save to localStorage
      try {
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        console.log("Updated transactions saved to localStorage after deletion");
      } catch (localStorageError) {
        console.error("Error saving to localStorage after deletion:", localStorageError);
      }
      
      // Save to IndexedDB
      const dbSaveResult = await saveToIndexedDB(updatedTransactions);
      console.log("IndexedDB save result after deletion:", dbSaveResult);
      
      // Update state
      setTransactions(updatedTransactions);
      
      // Show success message
      showAlert({
        title: 'Transaksi Dihapus',
        text: 'Transaksi berhasil dihapus.',
        icon: 'success'
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showAlert({
        title: 'Gagal Menghapus',
        text: `Terjadi kesalahan saat menghapus transaksi: ${error.message}`,
        icon: 'error'
      });
    }
  }
};

// NEW FUNCTION: Reset all data
const resetAllData = async () => {
  // Show confirmation alert with extra warning
  const result = await showAlert({
    title: 'Reset Semua Data?',
    text: 'PERINGATAN: Semua data transaksi akan dihapus secara permanen dan tidak dapat dikembalikan!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Reset Semua',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#DC2626', // red-600
  });
  
  if (result.isConfirmed) {
    try {
      // Clear localStorage
      localStorage.removeItem('transactions');
      
      // Clear IndexedDB
      const db = await initIndexedDB();
      const transaction = db.transaction(["transactions"], "readwrite");
      const store = transaction.objectStore("transactions");
      store.clear();
      
      // Clear state
      setTransactions([]);
      setFilteredTransactions([]);
      setCategoryData({ income: [], expense: [] });
      setBalance(0);
      setIncome(0);
      setExpense(0);
      
      // Show success message
      showAlert({
        title: 'Data Direset',
        text: 'Semua data transaksi telah dihapus.',
        icon: 'success'
      });
    } catch (error) {
      console.error("Error resetting data:", error);
      showAlert({
        title: 'Reset Gagal',
        text: `Terjadi kesalahan saat mereset data: ${error.message}`,
        icon: 'error'
      });
    }
  }
};

// Trigger file input click for import
const handleImportClick = () => {
  fileInputRef.current.click();
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Format time for last operation display
const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

// Generate random colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B88FF'];

return (
  <>
    <Navbar />
    <div className="max-w-[480px] mx-auto bg-gradient-to-b from-gray-800 to-gray-900 text-gray-200 p-5 px-6 flex flex-col min-h-screen overflow-auto shadow-lg">
      {/* Header Section */}
      <div className="w-full max-w-[460px] mb-6">
        <h1 className="text-2xl font-bold text-center mb-2 text-purple-300">Budget Tracker</h1>
        <p className="text-sm text-center text-purple-200">Easy Tracker</p>
      </div>

      {/* Balance Card */}
      <div className="w-full max-w-[460px] bg-gray-700 rounded-xl p-5 mb-6 shadow-md border border-gray-600">
        <p className="text-sm text-purple-300 mb-1">Total Saldo</p>
        <h2 className="text-3xl font-bold mb-3 text-green-300">{formatCurrency(balance)}</h2>
        <div className="flex justify-between text-xs">
          <div className="flex items-center text-green-300">
            <ArrowUpIcon className="w-4 h-4 mr-1" />
            <span>Pemasukan: {formatCurrency(income)}</span>
          </div>
          <div className="flex items-center text-red-300">
            <ArrowDownIcon className="w-4 h-4 mr-1" />
            <span>Pengeluaran: {formatCurrency(expense)}</span>
          </div>
        </div>
      </div>

      {/* Excel Import/Export Section */}
      <div className="w-full max-w-[460px] mb-6">
        <h3 className="text-lg font-semibold mb-3 text-purple-300">Database Excel</h3>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button 
              className="bg-blue-600 hover:bg-blue-700 transition-colors p-3 rounded-lg flex flex-col items-center text-white"
              onClick={handleImportClick}
              disabled
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-medium">Import dari Excel</span>
            </button>
            <button 
              className="bg-green-600 hover:bg-green-700 transition-colors p-3 rounded-lg flex flex-col items-center text-white"
              onClick={exportToExcel}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-sm font-medium">Export ke Excel</span>
            </button>
          </div>
          
          {/* Reset Data Button - NEW */}
          <button 
            className="w-full bg-red-600 hover:bg-red-700 transition-colors p-3 rounded-lg flex justify-center items-center text-white mt-3"
            onClick={resetAllData}
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Reset Semua Data</span>
          </button>
          
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={importFromExcel}
            accept=".xlsx, .xls"
            className="hidden"
          />
          
          {/* Last operation status */}
          {lastExcelOperation.time && (
            <div className={`mt-2 p-2 rounded text-xs ${
              lastExcelOperation.status === 'success' 
                ? 'bg-green-900 text-green-200' 
                : 'bg-red-900 text-red-200'
            }`}>
              <p>
                {lastExcelOperation.type === 'import' ? 'Import' : 'Export'} terakhir: {formatDate(lastExcelOperation.time)} {formatTime(lastExcelOperation.time)} - 
                {lastExcelOperation.status === 'success' ? ' Berhasil' : ' Gagal'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-[460px] mb-6">
        <h3 className="text-lg font-semibold mb-3 text-purple-300">Aksi Cepat</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="bg-gray-700 hover:bg-gray-600 transition-colors p-4 rounded-lg flex flex-col items-center text-green-300 border border-green-500"
            onClick={() => {
              setTransactionType('Pemasukan');
              setShowAddModal(true);
            }}
          >
            <ArrowUpIcon className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Tambah Pemasukan</span>
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 transition-colors p-4 rounded-lg flex flex-col items-center text-red-300 border border-red-500"
            onClick={() => {
              setTransactionType('Pengeluaran');
              setShowAddModal(true);
            }}
          >
            <ArrowDownIcon className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Tambah Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Data Filter */}
      <div className="w-full max-w-[460px] mb-6 bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 text-purple-300">Filter Data</h3>
        <div className="mb-3">
          <label className="text-sm text-gray-300 mb-1 block">Filter berdasarkan periode:</label>
          <select 
            className="w-full bg-gray-800 text-gray-200 p-2 rounded border border-gray-600"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="Semua">Semua</option>
            <option value="Minggu ini">Minggu ini</option>
            <option value="Bulan ini">Bulan ini</option>
            <option value="Tahun ini">Tahun ini</option>
            <option value="Kustom">Kustom</option>
          </select>
        </div>
        
        {periodFilter === 'Kustom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Tanggal mulai:</label>
              <input 
                type="date" 
                className="w-full bg-gray-800 text-gray-200 p-2 rounded border border-gray-600"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Tanggal akhir:</label>
              <input 
                type="date" 
                className="w-full bg-gray-800 text-gray-200 p-2 rounded border border-gray-600"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      {filteredTransactions.length > 0 && (
        <div className="w-full max-w-[460px] mb-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Ringkasan Keuangan</h3>
          <div className="bg-gray-700 rounded-lg p-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-green-300 mb-1">Pemasukan</p>
              <p className="font-bold">{formatCurrency(filteredTransactions
                .filter(t => t.type === 'Pemasukan')
                .reduce((sum, t) => sum + t.amount, 0))}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-red-300 mb-1">Pengeluaran</p>
              <p className="font-bold">{formatCurrency(filteredTransactions
                .filter(t => t.type === 'Pengeluaran')
                .reduce((sum, t) => sum + t.amount, 0))}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-300 mb-1">Saldo</p>
              <p className="font-bold">{formatCurrency(
                filteredTransactions.filter(t => t.type === 'Pemasukan').reduce((sum, t) => sum + t.amount, 0) -
                filteredTransactions.filter(t => t.type === 'Pengeluaran').reduce((sum, t) => sum + t.amount, 0)
              )}</p>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart (Simplified) */}
      {filteredTransactions.length > 1 && (
        <div className="w-full max-w-[460px] mb-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Tren Keuangan</h3>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-400">Statistik Transaksi per Periode</p>
            </div>
            
            <div className="flex justify-between items-end h-40 mt-6 px-2">
              {[...Array(Math.min(5, filteredTransactions.length))].map((_, index) => {
                const transaction = filteredTransactions[index];
                const maxHeight = 120;
                const height = transaction.amount / 
                  Math.max(...filteredTransactions.slice(0, 5).map(t => t.amount)) * maxHeight;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className={`w-8 rounded-t-md ${transaction.type === 'Pemasukan' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ height: `${height}px` }}
                    ></div>
                    <div className="text-xs text-gray-400 mt-2 w-16 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                      {formatDate(transaction.date).split(' ').slice(0, 2).join(' ')}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 mr-2 rounded"></div>
                <span className="text-xs text-gray-300">Pemasukan</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 mr-2 rounded"></div>
                <span className="text-xs text-gray-300">Pengeluaran</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown (Simplified) */}
      {(categoryData.income.length > 0 || categoryData.expense.length > 0) && (
        <div className="w-full max-w-[460px] mb-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Breakdown Berdasarkan Kategori</h3>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex mb-3 border-b border-gray-600 pb-2">
              <button 
                className={`mr-4 px-3 py-1 rounded-md ${showIncomeCategoryChart ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setShowIncomeCategoryChart(true)}
              >
                Pemasukan
              </button>
              <button 
                className={`px-3 py-1 rounded-md ${!showIncomeCategoryChart ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-300'}`}
                onClick={() => setShowIncomeCategoryChart(false)}
              >
                Pengeluaran
              </button>
            </div>
            
            {/* Chart section (simplified bar chart) */}
            <div className="flex flex-col">
              {showIncomeCategoryChart && categoryData.income.length > 0 ? (
                <>
                  <h4 className="text-sm font-medium mb-3 text-gray-300">Detail Pemasukan</h4>
                  <div className="space-y-3">
                    {categoryData.income.map((entry, index) => {
                      // Calculate percentage of total income
                      const totalIncomeValue = categoryData.income.reduce((sum, item) => sum + item.value, 0);
                      const percentage = Math.round((entry.value / totalIncomeValue) * 100);
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-sm">{entry.name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm mr-2">{formatCurrency(entry.value)}</span>
                              <span className="text-xs text-gray-400">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : !showIncomeCategoryChart && categoryData.expense.length > 0 ? (
                <>
                  <h4 className="text-sm font-medium mb-3 text-gray-300">Detail Pengeluaran</h4>
                  <div className="space-y-3">
                    {categoryData.expense.map((entry, index) => {
                      // Calculate percentage of total expense
                      const totalExpenseValue = categoryData.expense.reduce((sum, item) => sum + item.value, 0);
                      const percentage = Math.round((entry.value / totalExpenseValue) * 100);
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-sm">{entry.name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm mr-2">{formatCurrency(entry.value)}</span>
                              <span className="text-xs text-gray-400">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-400">Tidak ada data kategori yang cukup untuk ditampilkan</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="w-full max-w-[460px] mb-20">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-purple-300">Transaksi Terbaru</h3>
        </div>
        
        {filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.slice(0, 10).map((transaction) => (
              <div 
                key={transaction.id} 
                className={`bg-gray-700 rounded-lg p-3 flex justify-between items-center shadow-sm border-l-4 ${
                  transaction.type === 'Pemasukan' ? 'border-green-400' : 'border-red-400'
                }`}
              >
                <div className="flex items-center">
                  <div className="bg-gray-600 p-2 rounded-full mr-3">
                    {transaction.type === 'Pemasukan' ? (
                      <ArrowUpIcon className="w-4 h-4 text-green-300" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4 text-red-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{transaction.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className={`${transaction.type === 'Pemasukan' ? 'text-green-300' : 'text-red-300'} font-medium mr-4`}>
                    {transaction.type === 'Pemasukan' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  {/* Delete Button - NEW */}
                  <button 
                    className="p-1 bg-gray-600 hover:bg-red-600 rounded-full transition-colors"
                    onClick={() => deleteTransaction(transaction.id)}
                    title="Hapus transaksi"
                  >
                    <TrashIcon className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-3">Belum ada transaksi yang tercatat</p>
            <button 
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center mx-auto"
              onClick={() => {
                setTransactionType('Pemasukan');
                setShowAddModal(true);
              }}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Tambah Transaksi Pertama
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Modal for adding transaction */}
    {showAddModal && (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-purple-300">
            {transactionType === 'Pemasukan' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">Jumlah</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">Rp</span>
              <input 
                type="number" 
                className="w-full bg-gray-700 text-gray-200 p-2 pl-9 rounded border border-gray-600"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">Keterangan</label>
            <input 
              type="text" 
              className="w-full bg-gray-700 text-gray-200 p-2 rounded border border-gray-600"
              placeholder="Contoh: Gaji, Belanja, dll"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-1">Tanggal</label>
            <input 
              type="date" 
              className="w-full bg-gray-700 text-gray-200 p-2 rounded border border-gray-600"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              onClick={() => setShowAddModal(false)}
            >
              Batal
            </button>
            <button 
              className={`px-4 py-2 rounded ${
                transactionType === 'Pemasukan' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              onClick={addTransaction}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Help Instructions */}
    <div className="fixed bottom-20 right-4">
      <button 
        className="bg-purple-600 hover:bg-purple-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        onClick={() => showAlert({
          title: 'Cara Menggunakan Aplikasi',
          html: `
            <div class="text-left">
              <p>1. Gunakan tombol 'Tambah Pemasukan' atau 'Tambah Pengeluaran' untuk mencatat transaksi baru</p>
              <p>2. Data secara otomatis disimpan secara lokal dan akan tetap ada saat halaman di-refresh</p>
              <p>3. Gunakan tombol 'Import dari Excel' untuk memuat data dari file Excel</p>
              <p>4. Gunakan tombol 'Export ke Excel' untuk menyimpan data ke file Excel secara manual</p>
              <p>5. Lihat ringkasan keuangan dan grafik untuk melacak pengeluaran Anda</p>
              <p>6. Gunakan filter periode untuk melihat transaksi pada rentang waktu tertentu</p>
              <p>7. Klik ikon sampah di sebelah transaksi untuk menghapus transaksi tersebut</p>
              <p>8. Gunakan tombol 'Reset Semua Data' untuk menghapus seluruh data transaksi</p>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Mengerti'
        })}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  </>
);
};

export default Home;