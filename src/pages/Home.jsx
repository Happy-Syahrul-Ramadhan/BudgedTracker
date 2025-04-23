import React from 'react';
import Navbar from '../components/navbar/NavbarBottom';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon, CreditCardIcon } from '@heroicons/react/24/solid';

const Home = () => {
  return (
    <>
      <Navbar/>
      <div className="max-w-[480px] mx-auto bg-gradient-to-b from-gray-800 to-gray-900 text-gray-200 p-5 px-6 flex flex-col min-h-screen overflow-auto shadow-lg">
        {/* Header Section */}
        <div className="w-full max-w-[460px] mb-6">
          <h1 className="text-2xl font-bold text-center mb-2 text-purple-300">Budget Tracker</h1>
          <p className="text-sm text-center text-purple-200">Easy Tracker</p>
        </div>

        {/* Balance Card */}
        <div className="w-full max-w-[460px] bg-gray-700 rounded-xl p-5 mb-6 shadow-md border border-gray-600">
          <p className="text-sm text-purple-300 mb-1">Total Saldo</p>
          <h2 className="text-3xl font-bold mb-3 text-green-300">Rp 2.500.000</h2>
          <div className="flex justify-between text-xs">
            <div className="flex items-center text-green-300">
              <ArrowUpIcon className="w-4 h-4 mr-1" />
              <span>Pemasukan: Rp 4.200.000</span>
            </div>
            <div className="flex items-center text-red-300">
              <ArrowDownIcon className="w-4 h-4 mr-1" />
              <span>Pengeluaran: Rp 1.700.000</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="w-full max-w-[460px] mb-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-gray-700 hover:bg-gray-600 transition-colors p-4 rounded-lg flex flex-col items-center text-green-300 border border-green-500">
              <ArrowUpIcon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Tambah Pemasukan</span>
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 transition-colors p-4 rounded-lg flex flex-col items-center text-red-300 border border-red-500">
              <ArrowDownIcon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">Tambah Pengeluaran</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="w-full max-w-[460px] mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-purple-300">Transaksi Terbaru</h3>
            <button className="text-xs text-purple-200">Lihat Semua</button>
          </div>
          
          <div className="space-y-3">
            {/* Transaction Item */}
            <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center shadow-sm border-l-4 border-green-400">
              <div className="flex items-center">
                <div className="bg-gray-600 p-2 rounded-full mr-3">
                  <ArrowUpIcon className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Gaji Bulanan</p>
                  <p className="text-xs text-gray-400">23 Apr 2025</p>
                </div>
              </div>
              <p className="text-green-300 font-medium">+Rp 3.500.000</p>
            </div>
            
            {/* Transaction Item */}
            <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center shadow-sm border-l-4 border-red-400">
              <div className="flex items-center">
                <div className="bg-gray-600 p-2 rounded-full mr-3">
                  <ArrowDownIcon className="w-4 h-4 text-red-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Belanja Bulanan</p>
                  <p className="text-xs text-gray-400">20 Apr 2025</p>
                </div>
              </div>
              <p className="text-red-300 font-medium">-Rp 850.000</p>
            </div>
            
            {/* Transaction Item */}
            <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center shadow-sm border-l-4 border-red-400">
              <div className="flex items-center">
                <div className="bg-gray-600 p-2 rounded-full mr-3">
                  <ArrowDownIcon className="w-4 h-4 text-red-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Bayar Internet</p>
                  <p className="text-xs text-gray-400">18 Apr 2025</p>
                </div>
              </div>
              <p className="text-red-300 font-medium">-Rp 350.000</p>
            </div>
          </div>
        </div>

        {/* Financial Insights */}
        <div className="w-full max-w-[460px] mb-20">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Wawasan Keuangan</h3>
          <div className="bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-600">
            <div className="flex items-center mb-3">
              <ChartBarIcon className="w-5 h-5 mr-2 text-blue-300" />
              <p className="text-sm font-medium text-gray-200">Pengeluaran Terbesar: Belanja (40%)</p>
            </div>
            <div className="flex items-center">
              <CreditCardIcon className="w-5 h-5 mr-2 text-blue-300" />
              <p className="text-sm font-medium text-gray-200">Sisa anggaran bulan ini: Rp 1.200.000</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
