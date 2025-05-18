import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/navbar/NavbarBottom';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon, CreditCardIcon, CalendarIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import * as XLSX from 'xlsx'; 
import Swal from 'sweetalert2'; 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'; // Import Recharts components

const Home = () => {
const [transactions, setTransactions] = useState([]);
const [balance, setBalance] = useState(0);
const [income, setIncome] = useState(0);
const [expense, setExpense] = useState(0);
const [showAddModal, setShowAddModal] = useState(false);
const [transactionType, setTransactionType] = useState('');
// const [showBalance, setShowBalance] = useState(true); // New state for balance visibility
const [amount, setAmount] = useState('');
const [displayAmount, setDisplayAmount] = useState(''); // New state for displaying formatted amount
const [description, setDescription] = useState('');
const [periodFilter, setPeriodFilter] = useState('Minggu ini'); // Changed default to 7 days
const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]); // Changed to 7 days ago
const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
const [filteredTransactions, setFilteredTransactions] = useState([]);
const [categoryData, setCategoryData] = useState({ income: [], expense: [] });
const [showIncomeCategoryChart, setShowIncomeCategoryChart] = useState(true);
const [lastExcelOperation, setLastExcelOperation] = useState({ type: '', time: null, status: '' });
const [initialLoadComplete, setInitialLoadComplete] = useState(false);
const [chartData, setChartData] = useState([]); // State for chart data
const [transactionCountData, setTransactionCountData] = useState([]); // New state for transaction count data
const [useCategoryFilter, setUseCategoryFilter] = useState(false); // New state to toggle category filter

// Refs
const fileInputRef = useRef(null);

// Perubahan pada state showBalance
const [showBalance, setShowBalance] = useState(() => {
  // Mengambil setting dari localStorage saat pertama kali load
  const savedShowBalance = localStorage.getItem('showBalance');
  return savedShowBalance !== null ? JSON.parse(savedShowBalance) : true;
});

// Effect untuk menyimpan state showBalance ke localStorage setiap kali berubah
useEffect(() => {
  localStorage.setItem('showBalance', JSON.stringify(showBalance));
}, [showBalance]);

// Format current date and time as YYYY-MM-DD HH:MM:SS for the datetime input
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Initialize transaction date with current date and time
const [transactionDate, setTransactionDate] = useState(getCurrentDateTime());

// Update transaction date every second
useEffect(() => {
  const timer = setInterval(() => {
    setTransactionDate(getCurrentDateTime());
  }, 1000);
  
  return () => clearInterval(timer);
}, []);

// Function to format number with commas
const formatWithCommas = (value) => {
  if (!value) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Handle amount input change with comma formatting
const handleAmountChange = (e) => {
  const rawValue = e.target.value.replace(/,/g, ''); // Remove any existing commas
  if (rawValue === '' || /^\d*$/.test(rawValue)) {
    setAmount(rawValue); // Store the raw value
    setDisplayAmount(formatWithCommas(rawValue)); // Format for display
  }
};

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
    } catch (localError) {
      console.error("Error saving to data:", localError);
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
      
      // Try to load from IndexedDB first
      let loadedTransactions = [];
      try {
        const indexedDBData = await loadFromIndexedDB();
        if (indexedDBData && indexedDBData.length > 0) {
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
          date: t.date || new Date().toISOString()
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
    
    // Save to both storages for redundancy
    try {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
    
    saveToIndexedDB(transactions)
      .then(success => {
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

// Prepare data for multi-line chart - showing 7 days by default
const prepareChartData = () => {
  if (filteredTransactions.length === 0) return [];
  
  // Group transactions by date
  const groupedByDate = {};
  
  filteredTransactions.forEach(transaction => {
    // Extract just the date part for grouping
    const datePart = transaction.date.split('T')[0];
    
    if (!groupedByDate[datePart]) {
      groupedByDate[datePart] = {
        date: datePart,
        Pemasukan: 0,
        Pengeluaran: 0
      };
    }
    
    if (transaction.type === 'Pemasukan') {
      groupedByDate[datePart].Pemasukan += transaction.amount;
    } else {
      groupedByDate[datePart].Pengeluaran += transaction.amount;
    }
  });
  
  // Convert to array and sort by date
  const chartData = Object.values(groupedByDate).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // Format dates for display
  chartData.forEach(item => {
    const date = new Date(item.date);
    item.displayDate = `${date.getDate()}/${date.getMonth() + 1}`;
  });
  
  return chartData;
};

// NEW: Prepare data for transaction count chart
const prepareTransactionCountData = () => {
  if (filteredTransactions.length === 0) return [];
  
  // Group transactions by date
  const groupedByDate = {};
  
  filteredTransactions.forEach(transaction => {
    // Extract just the date part for grouping
    const datePart = transaction.date.split('T')[0];
    
    if (!groupedByDate[datePart]) {
      groupedByDate[datePart] = {
        date: datePart,
        PemasukanCount: 0,
        PengeluaranCount: 0,
        displayDate: ''
      };
    }
    
    if (transaction.type === 'Pemasukan') {
      groupedByDate[datePart].PemasukanCount += 1;
    } else {
      groupedByDate[datePart].PengeluaranCount += 1;
    }
  });
  
  // Convert to array and sort by date
  const countData = Object.values(groupedByDate).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // Format dates for display
  countData.forEach(item => {
    const date = new Date(item.date);
    item.displayDate = `${date.getDate()}/${date.getMonth() + 1}`;
  });
  
  return countData;
};

// Calculate totals and filter transactions when transactions or period filter changes
useEffect(() => {
  if (transactions.length > 0) {
    calculateTotals();
    applyDateFilter();
    prepareCategoryData();
  } else {
    setFilteredTransactions([]);
    setCategoryData({ income: [], expense: [] });
    setChartData([]);
    setTransactionCountData([]);
  }
}, [transactions, periodFilter, startDate, endDate, useCategoryFilter]);

// Update chart data when filtered transactions change
useEffect(() => {
  if (filteredTransactions.length > 0) {
    const newChartData = prepareChartData();
    setChartData(newChartData);
    
    // NEW: Update transaction count data
    const newCountData = prepareTransactionCountData();
    setTransactionCountData(newCountData);
    
    // Update category data if using filtered mode
    if (useCategoryFilter) {
      prepareCategoryData();
    }
  } else {
    setChartData([]);
    setTransactionCountData([]);
  }
}, [filteredTransactions, useCategoryFilter]);

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
      // Changed to last 7 days instead of start of week
      const last7Days = new Date(today);
      last7Days.setDate(today.getDate() - 7);
      last7Days.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(t => new Date(t.date) >= last7Days);
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
      start.setHours(0, 0, 0, 0);
      
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

// Prepare data for category charts - MODIFIED to use either all or filtered transactions
const prepareCategoryData = () => {
  const incomeByCategory = {};
  const expenseByCategory = {};
  
  // Use either filtered transactions or all transactions based on the toggle
  const dataToUse = useCategoryFilter ? filteredTransactions : transactions;
  
  dataToUse.forEach(transaction => {
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
        date: item.Tanggal || new Date().toISOString()
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
      { wch: 20 }  // Tanggal (expanded to accommodate timestamp)
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
  
  // Convert the amount to a number (removing commas if any)
  const numericAmount = parseFloat(amount.replace(/,/g, ''));
  
  const newTransaction = {
    id: Date.now().toString(),
    type: transactionType,
    amount: numericAmount,
    description,
    date: transactionDate // Now includes full timestamp
  };
  
  try {
    // Update state with new transaction
    const updatedTransactions = [...transactions, newTransaction];
    
    // Immediately save to localStorage for redundancy
    try {
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    } catch (localStorageError) {
      console.error("Error saving to localStorage:", localStorageError);
    }
    
    // Save to IndexedDB
    const dbSaveResult = await saveToIndexedDB(updatedTransactions);
    
    // Update state AFTER saving to storage to ensure consistency
    setTransactions(updatedTransactions);
    
    // Reset form
    setAmount('');
    setDisplayAmount('');
    setDescription('');
    setTransactionDate(getCurrentDateTime()); // Reset to current date/time
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

// Delete a transaction
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

// Reset all data
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
      setChartData([]);
      setTransactionCountData([]);
      
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

// Format time
const formatTime = (dateString) => {
  const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  return new Date(dateString).toLocaleTimeString('id-ID', options);
};

// Format date and time for display
const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString);
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);
    return `${formattedDate}, ${formattedTime}`;
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return dateString || "Invalid Date";
  }
};

// Format time for last operation display
const formatOperationTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

// Check if a transaction is from today
const isToday = (dateString) => {
  const today = new Date();
  const transactionDate = new Date(dateString);
  
  return today.getDate() === transactionDate.getDate() &&
    today.getMonth() === transactionDate.getMonth() &&
    today.getFullYear() === transactionDate.getFullYear();
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
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm text-purple-300">Total Saldo</p>
          <button 
            onClick={() => setShowBalance(!showBalance)} 
            className="text-gray-400 hover:text-gray-200 transition-colors"
            title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {showBalance ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            )}
          </button>
        </div>
        <h2 className="text-3xl font-bold mb-3 text-green-300">
          {showBalance ? formatCurrency(balance) : "xxxxxxx"}
        </h2>
        <div className="flex justify-between text-xs">
          <div className="flex items-center text-green-300">
            <ArrowUpIcon className="w-4 h-4 mr-1" />
            <span>Pemasukan: {showBalance ? formatCurrency(income) : "xxxxxxx"}</span>
          </div>
          <div className="flex items-center text-red-300">
            <ArrowDownIcon className="w-4 h-4 mr-1" />
            <span>Pengeluaran: {showBalance ? formatCurrency(expense) : "xxxxxxx"}</span>
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
              disabled onClick={handleImportClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-medium">Import dari Excel</span>
            </button>
            <button 
              className="bg-green-600 hover:bg-green-700 transition-colors p-3 rounded-lg flex flex-col items-center text-white"
              disabled onClick={exportToExcel}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-sm font-medium">Export ke Excel</span>
            </button>
          </div>
          
          {/* Reset Data Button */}
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
                {lastExcelOperation.type === 'import' ? 'Import' : 'Export'} terakhir: {formatDate(lastExcelOperation.time)} {formatOperationTime(lastExcelOperation.time)} - 
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
              setTransactionDate(getCurrentDateTime()); // Update to current time
              setAmount('');
              setDisplayAmount('');
              setDescription('');
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
              setTransactionDate(getCurrentDateTime()); // Update to current time
              setAmount('');
              setDisplayAmount('');
              setDescription('');
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
            <option value="Minggu ini">Minggu ini</option>
            <option value="Bulan ini">Bulan ini</option>
            <option value="Tahun ini">Tahun ini</option>
            <option value="Semua">Semua</option>
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

      {/* Multi-Line Chart */}
      {chartData.length > 0 && (
        <div className="w-full max-w-[460px] mb-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Grafik Pemasukan vs Pengeluaran</h3>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-400">Tren Pemasukan & Pengeluaran per Hari</p>
            </div>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#aaa" 
                    tick={{ fill: '#aaa', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#aaa" 
                    tick={{ fill: '#aaa', fontSize: 12 }}
                    tickFormatter={(value) => new Intl.NumberFormat('id-ID', {
                      notation: 'compact',
                      compactDisplay: 'short'
                    }).format(value)}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), ""]}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="Pemasukan" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#10B981', stroke: '#10B981' }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    name="Pemasukan"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Pengeluaran" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#EF4444', stroke: '#EF4444' }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    name="Pengeluaran"
                  />
                </LineChart>
              </ResponsiveContainer>
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

      {/* Transaction Count Bar Chart - NEW */}
      {transactionCountData.length > 0 && (
        <div className="w-full max-w-[460px] mb-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Jumlah Transaksi per Hari</h3>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-400">Jumlah Transaksi Pemasukan & Pengeluaran</p>
            </div>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={transactionCountData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#aaa" 
                    tick={{ fill: '#aaa', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#aaa" 
                    tick={{ fill: '#aaa', fontSize: 12 }}
                    tickFormatter={(value) => Math.round(value)}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} transaksi`, ""]}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                  <Bar 
                    dataKey="PemasukanCount" 
                    fill="#10B981" 
                    name="Jumlah Pemasukan"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="PengeluaranCount" 
                    fill="#EF4444" 
                    name="Jumlah Pengeluaran"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-between mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 mr-2 rounded"></div>
                <span className="text-xs text-gray-300">Jumlah Pemasukan</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 mr-2 rounded"></div>
                <span className="text-xs text-gray-300">Jumlah Pengeluaran</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown (Simplified) - MODIFIED for sorting and filtering */}
      {(categoryData.income.length > 0 || categoryData.expense.length > 0) && (
        <div className="w-full max-w-[460px] mb-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Breakdown Berdasarkan Kategori</h3>
          
          <div className="bg-gray-700 rounded-lg p-4">
            {/* Added filter toggle */}
            <div className="justify-between mb-3 border-b border-gray-600 pb-2">
              <div className="flex">
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
              
              {/* Added filter toggle switch */}
              <div className="flex items-center justify-center mb-5 text-xs mt-8">
                <span className={`mr-2 ${useCategoryFilter ? 'text-gray-400' : 'text-gray-200'}`}>Semua</span>
                <button 
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${useCategoryFilter ? 'bg-purple-600' : 'bg-gray-600'}`}
                  onClick={() => setUseCategoryFilter(!useCategoryFilter)}
                >
                  <span 
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useCategoryFilter ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </button>
                <span className={`ml-2 ${useCategoryFilter ? 'text-gray-200' : 'text-gray-400'}`}>Filter</span>
              </div>
            </div>
            
            {/* Chart section (simplified bar chart) - MODIFIED with sorting */}
            <div className="flex flex-col">
              {showIncomeCategoryChart && categoryData.income.length > 0 ? (
                <>
                  <h4 className="text-sm font-medium mb-3 text-gray-300">
                    Detail Pemasukan {useCategoryFilter ? '(Periode Terfilter)' : '(Semua Periode)'}
                  </h4>
                  <div className="space-y-3">
                    {categoryData.income
                      .sort((a, b) => b.value - a.value) // Sort from largest to smallest
                      .map((entry, index) => {
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
                  <h4 className="text-sm font-medium mb-3 text-gray-300">
                    Detail Pengeluaran {useCategoryFilter ? '(Periode Terfilter)' : '(Semua Periode)'}
                  </h4>
                  <div className="space-y-3">
                    {categoryData.expense
                      .sort((a, b) => b.value - a.value) // Sort from largest to smallest
                      .map((entry, index) => {
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
            {filteredTransactions
              .slice(0, 10)
              .map((transaction) => (
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
                      <p className="text-xs text-gray-400">{formatDateTime(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className={`${transaction.type === 'Pemasukan' ? 'text-green-300' : 'text-red-300'} font-medium mr-4`}>
                      {transaction.type === 'Pemasukan' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
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
            <p className="text-gray-400 mb-3">Belum ada transaksi</p>
            <button 
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center mx-auto"
              onClick={() => {
                setTransactionType('Pemasukan');
                setAmount('');
                setDisplayAmount('');
                setDescription('');
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

    {/* Modal for adding transaction - MODIFIED for comma formatting */}
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
                type="text" 
                className="w-full bg-gray-700 text-gray-200 p-2 pl-9 rounded border border-gray-600"
                placeholder="0"
                value={displayAmount} 
                onChange={handleAmountChange}
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
            <label className="block text-sm text-gray-300 mb-1">Tanggal & Waktu</label>
            <input 
              type="datetime-local" 
              className="w-full bg-gray-700 text-gray-200 p-2 rounded border border-gray-600"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Waktu saat ini sudah diisi otomatis</p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              onClick={() => {
                setShowAddModal(false);
                setAmount('');
                setDisplayAmount('');
                setDescription('');
              }}
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
              <p>9. Perhatikan grafik multi-line untuk membandingkan tren pemasukan dan pengeluaran</p>
              <p>10. Lihat grafik bar untuk melihat jumlah transaksi per hari</p>
              <p>11. Filter default menampilkan 7 hari terakhir, Anda dapat mengubahnya sesuai kebutuhan</p>
              <p>12. Toggle filter di bagian kategori untuk melihat data kategori berdasarkan period filter</p>
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