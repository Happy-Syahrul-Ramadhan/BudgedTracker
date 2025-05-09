import React, { useState } from 'react';
import Navbar from '../components/navbar/NavbarBottom';

const Statistics = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askGroq = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', // You can also use 'mixtral-8x7b-32768' or other available models
          messages: [
            {
              role: 'system',
              content: 'Anda adalah asisten keuangan yang membantu menganalisis dan memberikan wawasan tentang data keuangan dalam bahasa Indonesia.'
            },
            {
              role: 'user',
              content: query
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
      setResponse(data.choices[0].message.content);
    } catch (err) {
      setError(`Error: ${err.message || 'Something went wrong'}`);
      console.error('Groq API error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar/>
      <div className="max-w-[480px] mx-auto bg-black text-white p-6 font-bold flex flex-col min-h-screen overflow-auto">
        <div className="w-full">
          <h1 className="text-2xl text-center text-blue-500 mb-6">AI Asisten</h1>
          
          <div className="mb-8">
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
          
          {response && (
            <div className="mt-6 mb-20"> {/* Added margin bottom here */}
              <h2 className="text-lg mb-2 text-blue-300">Respon AI:</h2>
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
