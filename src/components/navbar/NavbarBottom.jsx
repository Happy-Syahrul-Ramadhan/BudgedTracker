import React, { useState } from 'react';
import { HomeIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const BottomNavbar = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full max-w-[480px] mx-auto right-0 h-16 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div className="grid h-full grid-cols-3 mx-auto">
        {/* statistics Button */}
        <Link 
          to="/statistics"
          type="button" 
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
          onClick={() => setActiveTab('statistics')}
        >
          <UserIcon 
            className={`w-5 h-5 mb-1 ${
              activeTab === 'statistics' 
                ? 'text-blue-600 dark:text-blue-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`} 
          />
          <span 
            className={`text-xs ${
              activeTab === 'statistics' 
                ? 'text-blue-600 dark:text-blue-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Tanya AI
          </span>
        </Link>
        
        {/* Home Button (Center, Elevated) */}
        <Link 
          to="/"
          type="button" 
          className="inline-flex flex-col items-center justify-center relative"
          onClick={() => setActiveTab('home')}
        >
          <div className="absolute -top-4 p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            <HomeIcon className="w-5 h-5 text-white" />
          </div>
          <span 
            className={`text-xs mt-6 ${
              activeTab === 'home' 
                ? 'text-blue-600 dark:text-blue-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Beranda
          </span>
        </Link>
        
        {/* Contact Button */}
        <Link
          to="/contact"
          type="button" 
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
          onClick={() => setActiveTab('contact')}
        >
          <PhoneIcon 
            className={`w-5 h-5 mb-1 ${
              activeTab === 'contact' 
                ? 'text-blue-600 dark:text-blue-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`} 
          />
          <span 
            className={`text-xs ${
              activeTab === 'contact' 
                ? 'text-blue-600 dark:text-blue-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Hubungi
          </span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavbar;
