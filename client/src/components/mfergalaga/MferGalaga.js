// GalagaGame.js

import React, { useState, useEffect } from 'react';
import { Game } from './GalagaObjects';
import { ShipComponent, EnemyComponent, BlasterComponent } from './GalagaComponents';
import './MferGalaga.css'
import { Howl } from 'howler';
const MferGalaga = () => {

  const [game, setGame] = useState(new Game());
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const handleLeftTouchStart = () => {
    setLeftPressed(true);
};

const bgMusic = new Howl({
  src: ['/audio/Mississippi-Rag.mp3'],
  loop: true, // So it loops continuously
  volume: 0.5, // Adjust as needed
});


const handleLeftTouchEnd = () => {
    setLeftPressed(false);
};

// Function to handle right control touch
const handleRightTouchStart = () => {
    setRightPressed(true);
};

const handleRightTouchEnd = () => {
    setRightPressed(false);
};

  const handleKeyDown = (e) => {
    setIsGameStarted(true);
    switch(e.keyCode) {
        case 37: // Left arrow key
            setLeftPressed(true);
            break;
        case 39: // Right arrow key
            setRightPressed(true);
            break;
        case 32: // Spacebar
            game.playerShoots();
            break;
        default:
            break;
    }
}

const handleKeyUp = (e) => {
    switch(e.keyCode) {
        case 37: // Left arrow key
            setLeftPressed(false);
            break;
        case 39: // Right arrow key
            setRightPressed(false);
            break;
        default:
            break;
    }
}

useEffect(() => {
  if (isGameStarted) {
    bgMusic.play();
  }

  return () => {
    bgMusic.stop();
  };
}, [isGameStarted]);
  
  useEffect(() => {
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const intervalId = setInterval(() => {
        if (!game.gameOver) {
            if (leftPressed) {
                game.ship.move(-10, 0);
            }
            if (rightPressed) {
                game.ship.move(10, 0);
            }
      game.tick();
      setGame(prevGame => {
        const newGame = Object.assign(Object.create(Object.getPrototypeOf(prevGame)), prevGame);
        newGame.tick();
        return newGame;
      
    });}
    }, 1000 / 60);
    console.log(game.gameOver);
    // Cleanup: Remove the event listener on component unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [game, leftPressed, rightPressed]);
  

  return (
    <div className="gameContainer">
      <h2>Mfer Shootout</h2>
      <div className="gameInfo">
        <span style={{ marginRight: '10px' }}>Level: {game.currentLevel}</span>
        <span className="healthInfo">
            Health: 
            {[...Array(game.ship.lives)].map((_, index) => (
                <img 
                    key={index} 
                    src="/images/mfergalaga/redcros.png" 
                    alt="Life Icon" 
                    style={{ 
                        width: '15px',
                        height: '15px',
                        margin: '0 2px 0 2px',
                        backgroundColor: 'white',
                        border: '2px solid red',
                        verticalAlign: 'middle',
                        position: 'relative',
                        top: '0px'  // Adjusts the image downward by 4 pixels
                    }}
                />
            ))}
        </span>
    </div>

      <div className="gameArea">
        <ShipComponent x={game.ship.x} y={game.ship.y} />
        {game.enemies.map((enemy, idx) => <EnemyComponent key={idx} x={enemy.x} y={enemy.y} type={enemy.type} />)}
        {game.blasters.map((blaster, idx) => <BlasterComponent key={idx} x={blaster.x} y={blaster.y} fromEnemy={blaster.fromEnemy}/>)}
      </div>
      <div 
          className="controlPad leftControl"
          onTouchStart={(e) => {
              e.preventDefault();  // Prevent default touch behavior
              handleLeftTouchStart(e);
          }}
          onTouchEnd={(e) => {
              e.preventDefault();  // Prevent default touch behavior
              handleLeftTouchEnd(e);
          }}
      >L</div>

      <div 
          className="controlPad rightControl"
          onTouchStart={(e) => {
              e.preventDefault();  // Prevent default touch behavior
              handleRightTouchStart(e);
          }}
          onTouchEnd={(e) => {
              e.preventDefault();  // Prevent default touch behavior
              handleRightTouchEnd(e);
          }}
      >R</div>

      <div 
          className="controlPad shootControl"
          onTouchStart={(e) => {
              e.preventDefault();  // Prevent default touch behavior
              e.stopPropagation();
              game.playerShoots();
          }}
      >Shoot</div>

      {game.gamestate === "gameover" && (
        <div className="gameOverModal">
          <div className="modalContent">
            <h2>Game Over</h2>
          </div>
        </div>
      )}
      {game.gamestate === "victory" && (
            <h2>VICTORY!!</h2>
      )}

    </div>
);
}

export default MferGalaga;
