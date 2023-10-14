const socketIo = require("socket.io");
let chessGames = require('./state');
const { processMove, joinExistingGame, playerResign, handleDisconnect, createChessGame} = require('./chess.functions');

module.exports = (io) => {
    const chessSocket = io.of('/chess');

    chessSocket.on("connection", (socket) => {
        console.log("New client connected", socket.id);
    
        socket.on("viewGame", (gameId) => {
            const game = chessGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            socket.join(gameId);
        });

        socket.on("disconnect", (reason) => {
            console.log("Client disconnected", socket.id, "Reason:", reason);
        
            const result = handleDisconnect(chessGames, socket.id);
        
            if (result.gameUpdated) {
                chessSocket.to(result.gameId).emit("gameUpdated", chessGames[result.gameId]);
                chessSocket.to(result.gameId).emit("notify", result.disconnectedColor + " disconnected, waiting for reconnect.");
            }
        });

        socket.on("checkTime", (gameId) => {
            const game = chessGames[gameId];
            if (!game) return;
            console.log("checking time");
            
            const currentPlayer = game.players.find(player => player.color === game.currentPlayer);
            if (!currentPlayer) return; // Ensure a current player is found
        
            // Check if the current player's time has run out and update the game state accordingly
            const currentTime = Date.now();
            const timeElapsed = currentTime - game.lastActivity;
            if (currentPlayer.timeLeft <= timeElapsed) {
                currentPlayer.timeLeft = 0;
                game.state = `${currentPlayer.color === "white" ? "black" : "white"}-wins`;
                socket.emit("gameUpdated", game); // Notify about the updated game state
                game.lastActivity = currentTime;
            }
        });
        

        socket.on("joinGame", (gameId, joinKey) => {
            const game = chessGames[gameId];
            const result = joinExistingGame(game, socket.id, joinKey);
            
            if (result.error) {
                socket.emit("error", result.error);
            } else {
                socket.join(gameId);
                chessSocket.to(gameId).emit("gameUpdated", game);
                socket.emit("playerColor", result.playerColor);
            }
        });
    
        socket.on("makeMove", (gameId, move) => {
            const game = chessGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            const player = game.players.find(p => p.id === socket.id);
            if (!player) return socket.emit("error", "Not a player in this game");
        
            const result = processMove(game, move, socket.id);
            if (result.error) {
                socket.emit("error", result.error);
            } else {
                chessSocket.to(gameId).emit("notify", player.color + " made a move from " + move["from"] + " to " + move["to"]);
                chessSocket.to(gameId).emit("gameUpdated", game);
            }
        });

        socket.on("resign", (gameId) => {
            const game = chessGames[gameId];
            const result = playerResign(game, socket.id);
        
            if (result.error) {
                socket.emit("error", result.error);
            } else {
                chessSocket.to(gameId).emit("notify", result.resignedPlayer + " resigned, " + result.winningPlayer + " wins!");
                chessSocket.to(gameId).emit("gameUpdated", game);
            }
        });        


    });
};
