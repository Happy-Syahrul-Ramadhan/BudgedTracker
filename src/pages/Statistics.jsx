import React from 'react';
import Navbar from '../components/navbar/NavbarBottom';

const Statistics = () => {
  return (
    <>
      <Navbar/>
      <div className="max-w-[480px] mx-auto bg-black text-white p-5 font-bold px-6 items-center flex flex-col min-h-screen overflow-auto">
        <div className="w-full max-w-[360px]">
          <h1 className="text-xl text-center mb-4">Statistics</h1>
          <p className="text-sm mb-2">This is the home page of our application.</p>
          <p className="text-sm">Here you can find various features and functionalities.</p>
        </div>
      </div>
    </>
  );
};

export default Statistics;
