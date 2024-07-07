import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavPage from './NavPage';
import TileMatching from './TileMatching';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/zhanghanjiao-react-games" element={<TileMatching />} />
          <Route path="/Tile-matching" element={<TileMatching />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
