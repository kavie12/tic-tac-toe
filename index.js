// Important Note
// X acts like the host and O is the other peer

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
const winnerNameTxt = document.getElementById("winnerName");


const PeerDataType = Object.freeze({
    REG_PLAYER_O: 0,
    JOIN_O: 1,
    GAME_UI_STATE: 2
});

class PeerConnection {
    constructor() {
        this.peer = new Peer();
        this.conn = null;

        this.peer.on("connection", conn => {
            this.conn = conn;
            this.receiveData();
        });
    }

    getInviteLink(playerName) {
        return new Promise(resolve => {
            if (this.peer.id) {
                resolve(`${window.location.origin}?name=${playerName}&id=${this.peer.id}`);
            } else {
                this.peer.on("open", id => {
                    resolve(`${window.location.origin}?name=${playerName}&id=${id}`);
                });
            }
        });
    }

    connect(id) {
        this.conn = this.peer.connect(id);
        this.receiveData();
    }

    receiveData() {
        this.conn.on("open", () => {
            this.conn.on("data", data => {

                // Handle data according to the type of data
                
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

            });
        });
    }

    sendData(data) {
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        } else {
            this.conn.on("open", () => {
                this.conn.send(data);
            });
        }
    }
}


// ENTITIES

class Player {
    constructor(playerId, playerName, playerSymbol) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.playerSymbolElement = document.createElement("span");
        this.playerSymbolElement.classList.add("cell-symbol");
        this.playerSymbolElement.appendChild(document.createTextNode(playerSymbol));
    }

    getSymbolElement() {
        return this.playerSymbolElement.cloneNode(true);
    }
};

class Cell {
    constructor(cellIndex, element) {
        this.cellIndex = cellIndex;
        this.element = element;
        this.isChecked = false;
        this.playerId = null;
        this.clickHandler = null;
    }

    draw(player) {
        if (!this.isChecked) {
            this.element.appendChild(player.getSymbolElement());
            this.isChecked = true;
            this.playerId = player.playerId;
        }
    }

    setClickHandler(handler) {
        this.clickHandler = () => {
            if (!this.isChecked) {
                handler(this);
            }
        }
        this.element.addEventListener("click", this.clickHandler);
    }

    removeClickHandler() {
        if (this.clickHandler) {
            this.element.removeEventListener("click", this.clickHandler);
        }
    }
};

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


// DATA

const PlayerId = Object.freeze({
    PLAYER_X: 0,
    PLAYER_O: 1
});
const players = [];

const cellIds = [
    "cell0", "cell1", "cell2",
    "cell3", "cell4", "cell5",
    "cell6", "cell7", "cell8"
];
const cells = cellIds.map((id, cellIndex) => new Cell(cellIndex, document.getElementById(id)));


let peerConnection = null;
let appState = null;
let gameUiState = null;


// ENTRY POINT
connect();

function connect() {
    peerConnection = new PeerConnection();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("name") && urlParams.has("id")) {
        handleInvitationLink(urlParams.get("name"));
        handleJoin(urlParams.get("name"), urlParams.get("id"), peerConnection);
    } else {
        handleInvite(peerConnection);
    }
}

function initGame(players, cells) {
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
    
            // Hanlde win
            checkWin(gameUiState);
            if (gameUiState.isWin) {
                handleWin(gameUiState);

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

function removeCellClickHandlers(cells) {
    cells.forEach(cell => cell.removeClickHandler());
}

function setIndicator(playerName) {
    playerIndicator.innerHTML = playerName;
}

function refreshUpdatedState(gameUiState) {

    // Draw moves
    for (const move of gameUiState.moves[PlayerId.PLAYER_X]) {
        gameUiState.cells[move].draw(gameUiState.getPlayerById(PlayerId.PLAYER_X));
    }
    for (const move of gameUiState.moves[PlayerId.PLAYER_O]) {
        gameUiState.cells[move].draw(gameUiState.getPlayerById(PlayerId.PLAYER_O));
    }

    if (gameUiState.isWin) {
        handleWin(gameUiState);
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

function checkWin(gameUiState) {
    for (const [a, b, c] of winningLines) {
        const playerMoves = gameUiState.moves[gameUiState.currentPlayerId];
        if (playerMoves.has(a) && playerMoves.has(b) && playerMoves.has(c)) {
            gameUiState.isWin = true;
            gameUiState.winner = cells[a].playerId;
            gameUiState.winningLine = [a, b, c];
            return;
        }
    }
}

function handleWin(gameUiState) {
    removeCellClickHandlers(gameUiState.cells);
    highlightWinningLine(gameUiState.getWinningLine());

    winnerNameTxt.innerHTML = gameUiState.getWinner().playerName;
    setTimeout(() => {
        changeScreen(Screens.GAME_OVER_SCREEN);
    }, 2000);
}

function highlightWinningLine(winningLine) {
    winningLine.forEach(cell => {
        cell.element.firstElementChild.classList.add("winning-cell-symbol");
    });
}

function handleInvite(peerConnection) {
    inviteForm.classList.remove("hidden");

    btnInvite.addEventListener("click", () => {
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
    });

    btnCopy.addEventListener("click", () => {
        navigator.clipboard.writeText(linkTxt.value);
    });
}

function handleInvitationLink(name) {
    joinForm.classList.remove("hidden");
    invitedByTxt.innerHTML = `Invited by ${name}`;
}

function handleJoin(playerNameX, id, peerConnection) {
    btnJoin.addEventListener("click", () => {
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
    });
}