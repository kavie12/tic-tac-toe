const playerIndicator = document.getElementById("player");


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

    getCurrentPlayer() {
        return this.players.find(player => player.playerId === this.currentPlayerId) ?? null;
    }

    getWinner() {
        return this.players.find(player => player.playerId === this.winner) ?? null;
    }

    getWinningLine() {
        return this.winningLine.map(cellIndex => this.cells[cellIndex]);
    }
};


// DATA

const PlayerId = Object.freeze({
    PLAYER_X: 0,
    PLAYER_O: 1
});

const players = [
    new Player(PlayerId.PLAYER_X, "Player 1", "X"),
    new Player(PlayerId.PLAYER_O, "Player 2", "O")
];

const cellIds = [
    "cell0", "cell1", "cell2",
    "cell3", "cell4", "cell5",
    "cell6", "cell7", "cell8"
];
const cells = cellIds.map((id, cellIndex) => new Cell(cellIndex, document.getElementById(id)));


let gameUiState;


// ENTRY POINT
play(players, cells);

function play(players, cells) {
    gameUiState = new GameUiState(players, cells);
    setIndicator(gameUiState.getCurrentPlayer().playerName);
    setCellClickHandlers(gameUiState);
}

function setCellClickHandlers(gameUiState) {
    gameUiState.cells.forEach(cell => {        
        cell.setClickHandler(clickedCell => {

            // Register player move
            gameUiState.moves[gameUiState.getCurrentPlayer().playerId].add(clickedCell.cellIndex);

            clickedCell.draw(gameUiState.getCurrentPlayer());
    
            // Hanlde win
            checkWin(gameUiState);
            if (gameUiState.isWin) {
                handleWin(gameUiState);
                return;
            }
    
            // Switch player
            gameUiState.switchPlayer();
            setIndicator(gameUiState.getCurrentPlayer().playerName);
        });
    });
}

function removeCellClickHandlers(cells) {
    cells.forEach(cell => cell.removeClickHandler());
}

function setIndicator(playerName) {
    playerIndicator.innerHTML = playerName;
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
    console.log("Winner is " + gameUiState.getWinner().playerName);
    removeCellClickHandlers(gameUiState.cells);
    highlightWinningLine(gameUiState.getWinningLine());
}

function highlightWinningLine(winningLine) {
    winningLine.forEach(cell => {
        cell.element.firstElementChild.classList.add("winning-cell-symbol");
    });
}