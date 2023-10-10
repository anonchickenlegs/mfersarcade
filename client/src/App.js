import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import GameTicTacToe from "./components/GameTicTacToe";
import GameConnect4 from "./components/Connect4";
import Connect4LandingPage from "./components/Connect4LandingPage";
import MferCastle from "./components/MferCastle";
import './App.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/connect4/:gameId" element={<GameConnect4 />} />
        <Route path="/connect4/" element={<Connect4LandingPage />} />
        <Route path="/mfercastle/:gameId" element={<MferCastle />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
