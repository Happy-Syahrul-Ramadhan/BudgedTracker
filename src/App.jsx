import { BrowserRouter as Router,  Routes, Route } from 'react-router-dom'
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import Contact from './pages/Contact';
import './App.css';

const App = () => {

  return (
    <>
      <Router>
        <Routes>
          <Route index element={<Home/>}/>
          <Route path="/statistics" element={<Statistics/>}/>
          <Route path="/contact" element={<Contact/>}/>
        </Routes>
      </Router>
    </>
  );
}

export default App;
