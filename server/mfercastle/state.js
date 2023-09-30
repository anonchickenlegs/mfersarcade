const { cards, generateDeck } = require('./cards');

let games = {};

const getInitialGameState = () => {
    return {
        players: [],
        decks: {},
        battlefields: {},
        hands: {},
        graveyards: {}, 
        currentPlayer: "X",
        state: "waiting for other player",
        lastActivity: Date.now(),
    };
};

const initializePlayer = (n_cards, game, playerSymbol, socketid) => {
    game.players.push({ id: socketid, symbol: playerSymbol, life: 30 });
    // shuffle a deck of cards for the user
    game.decks[playerSymbol] = {"count": n_cards, "cards": generateDeck(n_cards, socketid)};
    game.hands[playerSymbol] = {"count": 0, "cards": []};
    game.battlefields[playerSymbol] = {"count": 0, "cards": []};
    game.graveyards[playerSymbol] = {"count": 0, "cards": []};
};


module.exports = {
    games,
    getInitialGameState,
    initializePlayer,
};
