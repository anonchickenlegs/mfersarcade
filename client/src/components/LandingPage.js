import React, { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.css';
import CastleVisualization from './CastleVisualization';

function LandingPage() {
  const [gameLink, setGameLink] = useState("");
  const navigate = useNavigate();

  const createTicTacToeGame = async () => {
    try {
      const response = await fetch("/api/tictactoe/game", { method: "POST" });
      console.log(response);
      if (!response.ok) throw new Error("Failed to create game");
      const game = await response.json();
      const gameLink = `/mfermfertoe/${game.gameId}`;
      setGameLink(gameLink); // if you need to set the state
      navigate(gameLink); // to redirect
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const createMferCastleGame = async () => {
    try {
      const response = await fetch("/api/mfercastle/game", { method: "POST" });
      console.log(response);
      if (!response.ok) throw new Error("Failed to create game");
      const game = await response.json();
      const gameLink = `/mfercastle/${game.gameId}`;
      setGameLink(gameLink); // if you need to set the state
      navigate(gameLink); // to redirect
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  return (
    <div className="landingPageContainer">
      <h1>Mfers Arcade</h1>

      <div className="games-container">
          <div className="game-item">
            <Link to="https://nngmi.github.io/mfersbeheaded">
              <img src="/images/mfersbeheaded.png" alt="Mfers Beheaded" />
            </Link>
            <p>Mfers Beheaded</p>
          </div>
          <div className="game-item" onClick={createMferCastleGame}>
            <img src="/images/mfercastle.png" alt="Mfers Castle" />
            <p>Mfers Castle</p>
          </div>
      </div>
    </div>
  );
}

export default LandingPage;
