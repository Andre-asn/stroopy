import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './pages/home'; 
import Game from './pages/soloGame'; 
import Versus from './pages/versus';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game" element={<Game />} />
                <Route path="/versus" element={<Versus />} />
            </Routes>
        </Router>
    );
};

export default App;
