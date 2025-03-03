import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './pages/home'; 
import Game from './pages/soloGame'; 
import Versus from './pages/versus';
import VersusGame from './pages/versusGame';
import HowTo from './pages/howTo';
import GameOver from './pages/gameOver';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game" element={<Game />} />
                <Route path="/versus" element={<Versus />} />
                <Route path="/versusGame" element={<VersusGame />} />
                <Route path="/gameOver" element={<GameOver />} />
                <Route path="/HowTo" element={<HowTo />} />
            </Routes>
        </Router>
    );
};

export default App;
