import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import HomePage from './components/home'; // Your existing HomePage component
import Game from './components/game'; // Import your Game component

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game" element={<Game />} />
            </Routes>
        </Router>
    );
};

export default App;
