import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from "../../assets/images/logo.png"


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className={`navbar md:sticky ${isSticky ? 'navbar-fixed' : 'absolute'}`}>
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
        <Link to="/">
          <img src={Logo} alt="Logo" className='w-28 md:w-40' />
        </Link>
        </div>
        <div className="hidden md:flex space-x-4 font-bold font-spaceGrotesk">
          <Link to="/" className={`nav-link ${isSticky ? 'text-white' : 'text-white'}`}>Home</Link>
          <Link to="/program" className={`nav-link ${isSticky ? 'text-white' : 'text-white'}`}>Program</Link>
          <Link to="/author" className={`nav-link ${isSticky ? 'text-white' : 'text-white'}`}>Author</Link>
          <Link to="/committee" className={`nav-link ${isSticky ? 'text-white' : 'text-white'}`}>Committee</Link>
          <Link to="/information" className={`nav-link ${isSticky ? 'text-white' : 'text-white'}`}>Information</Link>
        </div>
        <div className="hidden md:flex space-x-4 font-spaceGrotesk font-bold">
          <Link to="/login" className={`mt-2 nav-link ${isSticky ? 'text-colorGreen' : 'text-colorGreen'}`}>Login</Link>
          <Link to="/signup" className={`nav-link ${isSticky ? 'bg-colorGreen text-black' : 'bg-colorGreen text-black'} px-4 py-2 rounded-full`}>Sign Up</Link>
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className={`nav-link ${isSticky ? 'text-white' : 'text-white'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div className={`md:hidden p-2 font-spaceGrotesk font-medium ${isSticky ? 'bg-green-900 bg-opacity-40 font-bold text-white' : 'bg-green-900 font-bold text-white'}`}>
          <Link to="/" className="block nav-link py-2 mx-4">Home</Link>
          <Link to="/program" className="block nav-link py-2 mx-4">Program</Link>
          <Link to="/author" className="block nav-link py-2 mx-4">Author</Link>
          <Link to="/information" className="block nav-link py-2 mx-4">Information</Link>
          <Link to="/login" className="block nav-link py-2 mx-4">Login</Link>
          <Link to="/signup" className="block nav-link bg-colorGreen mx-4 px-4 py-2 text-black rounded-full my-3">Sign Up</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
