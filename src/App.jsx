import { BrowserRouter as Router,  Routes, Route } from 'react-router-dom'
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import './App.css';

const App = () => {

  return (
    <>
      <Router>
        <Routes>
          <Route index element={<Home/>}/>
          <Route path="/statistics" element={<Statistics/>}/>
        </Routes>
      </Router>
    </>
  );
}

export default App;
