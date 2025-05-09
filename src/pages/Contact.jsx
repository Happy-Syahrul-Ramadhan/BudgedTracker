import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar/NavbarBottom';

const Statistics = () => {
  return (
    <>
      <Navbar/>
      <div className="max-w-[480px] mx-auto bg-black text-white p-6 font-bold justify-center flex flex-col min-h-screen overflow-auto">
        <h1 className="text-2xl text-center -mt-20 text-blue-500">Syahrul x AI ☕</h1>
      </div>
    </>
  );
};

export default Statistics;