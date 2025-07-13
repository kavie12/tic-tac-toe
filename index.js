const playerIndicator = document.getElementById("player");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const playerNameXInput = document.getElementById("playerNameX");
const playerNameOInput = document.getElementById("playerNameO");
const btnInvite = document.getElementById("btnInvite");
const linkDetails = document.getElementById("linkDetails");
const linkTxt = document.getElementById("link");
const btnCopy = document.getElementById("btnCopy");
const gameGrid = document.getElementById("gameGrid");
const inviteForm = document.getElementById("inviteForm");
const joinForm = document.getElementById("joinForm");
const btnJoin = document.getElementById("btnJoin");
const invitedByTxt = document.getElementById("invitedBy");
const gameOverMsg = document.getElementById("gameOverMsg");

class AppState {
    constructor(playerId) {
        this.playerId = playerId;
    }
}

class GameUiState {
    constructor(players, cells) {
        this.players = players;
        this.cells = cells;

        this.currentPlayerId = PlayerId.PLAYER_X;
        
        this.isWin = false;
        this.isDraw = false;
        this.winner = null;
        this.winningLine = [];

        this.moves = {
            [PlayerId.PLAYER_X]: new Set(),
            [PlayerId.PLAYER_O]: new Set()
        }
    }

    switchPlayer() {
        if (this.currentPlayerId === PlayerId.PLAYER_X) {
            this.currentPlayerId = PlayerId.PLAYER_O;
        } else {
            this.currentPlayerId = PlayerId.PLAYER_X;
        }
    }

    getPlayerById(id) {
        return this.players[id] ?? null;
    } 

    getCurrentPlayer() {
        return this.players[this.currentPlayerId] ?? null;
    }

    getWinner() {
        return this.players[this.winner] ?? null;
    }

    getWinningLine() {
        return this.winningLine.map(cellIndex => this.cells[cellIndex]);
    }

    getState() {
        return {
            currentPlayerId: this.currentPlayerId,
            isWin: this.isWin,
            isDraw: this.isDraw,
            winner: this.winner,
            winningLine: this.winningLine,
            moves: {
                [PlayerId.PLAYER_X]: Array.from(this.moves[PlayerId.PLAYER_X]),
                [PlayerId.PLAYER_O]: Array.from(this.moves[PlayerId.PLAYER_O])
            }
        };
    }

    updateState(state) {
        this.currentPlayerId = state.currentPlayerId;
        this.isWin = state.isWin;
        this.isDraw = state.isDraw;
        this.winner = state.winner;
        this.winningLine = state.winningLine;
        this.currentPlayerId = state.currentPlayerId;
        this.moves[PlayerId.PLAYER_X] = new Set(state.moves[PlayerId.PLAYER_X]);
        this.moves[PlayerId.PLAYER_O] = new Set(state.moves[PlayerId.PLAYER_O]);
    }
};


// Manage Screens

const Screens = Object.freeze({
    HOME_SCREEN: 0,
    GAME_SCREEN: 1,
    GAME_OVER_SCREEN: 2
});

function changeScreen(screen) {
    switch(screen) {
        case Screens.HOME_SCREEN:
            homeScreen.classList.remove("hidden");
            gameScreen.classList.add("hidden");
            gameOverScreen.classList.add("hidden");
            break;
        
        case Screens.GAME_SCREEN:
            homeScreen.classList.add("hidden");
            gameScreen.classList.remove("hidden");
            gameOverScreen.classList.add("hidden");
            break;

        case Screens.GAME_OVER_SCREEN:
            homeScreen.classList.add("hidden");
            gameScreen.classList.add("hidden");
            gameOverScreen.classList.remove("hidden");
            break;

        default:
            console.log("Invalid screen");
            break;
    }
}


// Peer data handler

const PeerDataType = Object.freeze({
    REG_PLAYER_O: 0,
    JOIN_O: 1,
    GAME_UI_STATE: 2
});

function receiveDataHandler(data) {           
    if (data.type === PeerDataType.REG_PLAYER_O) {

        if (players.length < 2) {
            players.push(new Player(PlayerId.PLAYER_O, data.data, "O"));
        }

    } else if (data.type === PeerDataType.JOIN_O) {

        changeScreen(Screens.GAME_SCREEN);
        initGame(players, cells);

    } else if (data.type === PeerDataType.GAME_UI_STATE) {

        if (gameUiState) {
            gameUiState.updateState(data.data);
            refreshUpdatedState(gameUiState);
        }

    }
}


// Data

const PlayerId = Object.freeze({
    PLAYER_X: 0,
    PLAYER_O: 1
});
const players = [];

const cells = [];
for (let i = 0; i < 9; i++) {
    cells.push(new Cell(i));
}

let peerConnection = null;
let appState = null;
let gameUiState = null;


// ENTRY POINT
main();

function main() {
    peerConnection = new PeerConnection(receiveDataHandler);

    // Display the relavant form (Invite / Join)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("name") && urlParams.has("id")) {
        joinForm.classList.remove("hidden");
        invitedByTxt.innerHTML = `Invited by ${urlParams.get("name")}`;
    } else {
        inviteForm.classList.remove("hidden");
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Handle Join button
        btnJoin.addEventListener("click", () => handleJoin(urlParams.get("name"), urlParams.get("id"), peerConnection));
    
        // Handle Invite button
        btnInvite.addEventListener("click", () => handleInvite(peerConnection));

        // Handle Copy button
        btnCopy.addEventListener("click", () => navigator.clipboard.writeText(linkTxt.value));
    });
}

function initGame(players, cells) {
    gameGrid.append(...cells.map(cell => cell.element));

    gameUiState = new GameUiState(players, cells);
    setIndicator(gameUiState.getCurrentPlayer().playerName);
    setCellClickHandlers(appState, gameUiState, peerConnection);
}

function setCellClickHandlers(appState, gameUiState, peerConnection) {
    gameUiState.cells.forEach(cell => {        
        cell.setClickHandler(clickedCell => {

            if (appState.playerId !== gameUiState.currentPlayerId) {
                return;
            }

            // Register player move
            gameUiState.moves[gameUiState.getCurrentPlayer().playerId].add(clickedCell.cellIndex);

            clickedCell.draw(gameUiState.getCurrentPlayer());
    
            // Hanlde game over
            checkGameOver(gameUiState);
            if (gameUiState.isWin || gameUiState.isDraw) {
                handleGameOver(gameUiState);

                // Sync with the other peer
                peerConnection.sendData({
                    type: PeerDataType.GAME_UI_STATE,
                    data: gameUiState.getState()
                });

                return;
            }
    
            // Switch player
            gameUiState.switchPlayer();
            setIndicator(gameUiState.getCurrentPlayer().playerName);

            // Sync the UI state
            peerConnection.sendData({
                type: PeerDataType.GAME_UI_STATE,
                data: gameUiState.getState()
            });
        });
    });
}

function setIndicator(playerName) {
    playerIndicator.innerHTML = playerName;
}

function refreshUpdatedState(gameUiState) {

    // Draw moves
    if (appState.playerId === PlayerId.PLAYER_X) {
        for (const move of gameUiState.moves[PlayerId.PLAYER_O]) {
            gameUiState.cells[move].draw(gameUiState.getPlayerById(PlayerId.PLAYER_O));
        }
    } else {
        for (const move of gameUiState.moves[PlayerId.PLAYER_X]) {
            gameUiState.cells[move].draw(gameUiState.getPlayerById(PlayerId.PLAYER_X));
        }
    }

    if (gameUiState.isWin || gameUiState.isDraw) {
        handleGameOver(gameUiState);
        return;
    }

    setIndicator(gameUiState.getCurrentPlayer().playerName);
}

const winningLines = [
    [0, 1, 2], // rows
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6], // columns
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8], // diagonals
    [2, 4, 6]
];

function checkGameOver(gameUiState) {
    // Check win
    for (const [a, b, c] of winningLines) {
        const playerMoves = gameUiState.moves[gameUiState.currentPlayerId];
        if (playerMoves.has(a) && playerMoves.has(b) && playerMoves.has(c)) {
            gameUiState.isWin = true;
            gameUiState.winner = cells[a].playerId;
            gameUiState.winningLine = [a, b, c];
            return;
        }
    }
    
    // Check draw
    if (gameUiState.cells.length == gameUiState.moves[PlayerId.PLAYER_X].size + gameUiState.moves[PlayerId.PLAYER_O].size) {
        gameUiState.isDraw = true;
    }
}

function handleGameOver(gameUiState) {
    cells.forEach(cell => cell.removeClickHandler());

    if (gameUiState.isWin) {
        // Highlight winning line
        gameUiState.getWinningLine().forEach(cell => {
            cell.element.firstElementChild.classList.add("winning-cell-symbol");
        });
        
        gameOverMsg.innerHTML = "Winner is " + gameUiState.getWinner().playerName;
    } else if (gameUiState.isDraw) {
        gameOverMsg.innerHTML = "Draw!";
    }

    setTimeout(() => {
        changeScreen(Screens.GAME_OVER_SCREEN);
    }, 2000);
}

function handleInvite(peerConnection) {
    const playerName = playerNameXInput.value;
    if (!playerName) {
        alert("Enter player name");
        return;
    }
    appState = new AppState(PlayerId.PLAYER_X);
    players.push(new Player(PlayerId.PLAYER_X, playerName, "X"));

    peerConnection.getInviteLink(playerName).then(link => {
        linkTxt.value = link;
    });
    linkDetails.classList.remove("hidden");
}

function handleJoin(playerNameX, id, peerConnection) {
    const playerNameO = playerNameOInput.value;
    if (!playerNameO) {
        alert("Enter player name");
        return;
    }
    appState = new AppState(PlayerId.PLAYER_O);

    // Register both players at PLAYER_O peer
    players.push(new Player(PlayerId.PLAYER_X, playerNameX, "X"));
    players.push(new Player(PlayerId.PLAYER_O, playerNameO, "O"));

    // Connect with PLAYER_X
    peerConnection.connect(id);

    // Send PLAYER_O details
    peerConnection.sendData({
        type: PeerDataType.REG_PLAYER_O,
        data: playerNameO
    });

    // Send join message
    peerConnection.sendData({
        type: PeerDataType.JOIN_O,
        data: null
    });

    // Show the game
    changeScreen(Screens.GAME_SCREEN);
    initGame(players, cells);
}