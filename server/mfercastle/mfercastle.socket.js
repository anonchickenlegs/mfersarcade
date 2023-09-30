// mfercastle.socket.js
const socketIo = require("socket.io");
const { games, initializePlayer} = require('./state');
const { cards, generateDeck } = require('./cards');
function checkGameState(game) {
    let draw = true;
    let winner = null;
    
    game.players.forEach((player) => {
        if (player.castleStrength > 0) {
            if (winner === null) {
                winner = player.symbol; // assuming player has a property 'symbol' which could be 'X' or 'O'
                draw = false;
            } else {
                // If we find another player with castleStrength > 0, the game is ongoing
                draw = false;
                winner = null;
                return "ongoing";
            }
        }
    });
    
    if (draw) {
        return "draw";
    } else if (winner !== null) {
        return `${winner}-wins`;
    } else {
        return "ongoing";
    }
}


function maskGameForPlayer(game, playerSymbol) {
    const maskedGame = JSON.parse(JSON.stringify(game)); // deep copy
    maskedGame.players.forEach((player) => {
        delete maskedGame.decks[player.symbol]["cards"];
        if (player.symbol !== playerSymbol) {
            delete maskedGame.hands[player.symbol]["cards"];
        }
    });
    return maskedGame;
}


module.exports = (io) => {
    const mfercastle = io.of('/mfercastle');

    mfercastle.on("connection", (socket) => {
        console.log("New client connected", socket.id);
    
        socket.on("joinGame", (gameId) => {
            console.log("joinGame emitted for gameID", gameId);
            const game = games[gameId];
    
            if (!game) return socket.emit("error", "Game does not exist");
            console.log("Game found", game);
    
            if (game.players.length >= 2) return socket.emit("error", "Game is full");
            console.log(`Player ${socket.id} joined game ${gameId}`);
            const playerSymbol = game.players.length === 0 ? "X" : "O";
    
            initializePlayer(30, game, playerSymbol, socket.id);
            
            if (game.players.length == 2) {
                game.state = "ongoing";
            }
            game.lastActivity = Date.now(),
            socket.join(gameId);
            //smfercastle.to(gameId).emit("gameUpdated", game);
            socket.emit("playerSymbol", playerSymbol);
            game.players.forEach((player) => {
                console.log("emitting to player ", player.id);
                mfercastle.to(player.id).emit("gameUpdated", maskGameForPlayer(game, player.symbol));
            });
        });
    
        socket.on("makeMove", (gameId, moveType, moveDetails) => {
            console.log("handling move ", moveType);
            const game = games[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            
            // Find the player object corresponding to this socket.id
            const player = game.players.find(p => p.id === socket.id);
            if (!player) return socket.emit("error", "Not a player in this game");
            console.log("after socket error");

            if (game.state !== "ongoing") {
                return socket.emit("error", "Game is over");
            }
            
            // Check if it’s this player’s turn
            if (game.currentPlayer !== player.symbol) return socket.emit("error", "Not your turn");
            console.log("it is our turn", game.currentPlayer);
            if (moveType === "draw") {
                console.log(game.decks[player.symbol]);
                if (game.decks[player.symbol] && game.decks[player.symbol].count > 0) {

                    if (player.drawsLeft == 0) {
                        return socket.emit("error", "No more draws left");
                    }

                    if (game.hands[player.symbol].count >= 5) {
                        return socket.emit("error", "Hand is full, cannot draw any more cards");
                    }
                    let card = game.decks[player.symbol]["cards"].pop();
                    game.decks[player.symbol]["count"] = game.decks[player.symbol]["cards"].length;
                    game.hands[player.symbol]["cards"].push(card);
                    game.hands[player.symbol]["count"] += 1;
                    player.drawsLeft -= 1;
                    game.players.forEach((player) => {
                        if (player.id != socket.id) {
                            console.log("emitting to player ", player.id);
                            mfercastle.to(player.id).emit("notify", "Opponent drew a card");
                        }
                    });
                } else {
                    return socket.emit("error", "No more cards");
                }
            } else if (moveType === "yield") {
                console.log("YIELDING TURN!!! on Turn ", game.turnNumber);
                // increment resources for oher player
                const otherPlayerSymbol = game.currentPlayer === "X" ? "O" : "X";
                const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);

                game.players.forEach((player) => {
                    if (player.id != socket.id) {
                        console.log("emitting to player ", player.id);
                        mfercastle.to(player.id).emit("notify", "Opponent has yielded their turn");
                    }
                });
                // clean up move everything from battlefield onto the graveyard
                // Combine the two arrays
                game.graveyards[player.symbol].cards = [...game.graveyards[player.symbol].cards, ...game.battlefields[player.symbol].cards];

                // Update the count
                game.graveyards[player.symbol].count += game.battlefields[player.symbol].count;

                // Reset the battlefield cards and count
                game.battlefields[player.symbol].cards = [];
                game.battlefields[player.symbol].count = 0;
                game.turnNumber += 1;
                otherPlayer.spendingResources += otherPlayer.generators;
                otherPlayer.drawsLeft = 1;
                otherPlayer.discardsLeft = 1;

                game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
                game.delayedEffects.forEach((effect) => {
                    console.log(effect);
                    console.log(game.turnNumber);
                    if (game.turnNumber === effect.turnNumber) {
                        effect.effectFunc(game, game.currentPlayer);
                    }
                });
                game.state = checkGameState(game) || game.state;
                
            } else if (moveType === "discard") {
                const { cardid } = moveDetails;
                console.log(moveDetails);

                if (!cardid) {
                  return socket.emit("error", "Error with discard because cardid does not exist");
                }
                
                const cardIndex = game.hands[player.symbol].cards.findIndex(card => card.id === cardid);
                
                if (cardIndex === -1) {
                  return socket.emit("error", "Error with discard, card not found in hand");
                }

                if (player.discardsLeft == 0) {
                    return socket.emit("error", "No more discards left");
                }
                
                // removing card from hand
                const [card] = game.hands[player.symbol].cards.splice(cardIndex, 1);
                game.hands[player.symbol].count--;
                
                // appending card to graveyard
                game.graveyards[player.symbol].cards.push(card);
                game.graveyards[player.symbol].count++;
                player.discardsLeft -= 1;
                // notify other players
                game.players.forEach((player) => {
                    if (player.id != socket.id) {
                        mfercastle.to(player.id).emit("notify", "Opponent discarded card " + card.name);
                    }
                });
            } else if (moveType === "play") {
                const { cardid } = moveDetails;
                console.log(moveDetails);

                if (!cardid) {
                  return socket.emit("error", "Error with play because cardid does not exist");
                }
                
                const cardIndex = game.hands[player.symbol].cards.findIndex(card => card.id === cardid);
                
                if (cardIndex === -1) {
                  console.group(game.hands[player.symbol]);
                  console.group(cardid);
                  return socket.emit("error", "Error with play, card not found in hand");
                }

                const card = game.hands[player.symbol].cards[cardIndex];
                if (card.cost > player.spendingResources) {
                    return socket.emit("error", "Card " + card.name + " costs " + card.cost + " and you only have " + player.spendingResources + " resources");
                }
                // spend the resources
                player.spendingResources -= card.cost;
                // removing card from hand
                game.hands[player.symbol].cards.splice(cardIndex, 1);
                game.hands[player.symbol].count--;
                
                // appending card to battlefield
                game.battlefields[player.symbol].cards.push(card);
                game.battlefields[player.symbol].count++;

                // notify other players
                game.players.forEach((player) => {
                    if (player.id != socket.id) {
                        mfercastle.to(player.id).emit("notify", "Opponent played card " + card.name);
                    }
                });
                console.log("right before apply effect");
                card.applyEffect(game, player.symbol);

            } else {
                return socket.emit("error", "Unknown move " + moveType);
            }
            
            game.lastActivity = Date.now(),
            game.state = checkGameState(game) || game.state;
            if (game.state != "ongoing") {
                socket.emit("error", "Game has ended!!");              
            }
            game.players.forEach((player) => {
                console.log("emitting to player ", player.id);
                mfercastle.to(player.id).emit("gameUpdated", maskGameForPlayer(game, player.symbol));
            });            
        });
    });
};