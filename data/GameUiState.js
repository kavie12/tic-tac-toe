class GameUiState {
    constructor(players, cells) {
        this.players = players;
        this.cells = cells;

        this.currentPlayerId = PlayerDetails.PlayerX.id;
        
        this.isWin = false;
        this.isDraw = false;
        this.winner = null;
        this.winningLine = [];

        this.moves = {
            [PlayerDetails.PlayerX.id]: new Set(),
            [PlayerDetails.PlayerO.id]: new Set()
        }
    }

    switchPlayer() {
        if (this.currentPlayerId === PlayerDetails.PlayerX.id) {
            this.currentPlayerId = PlayerDetails.PlayerO.id;
        } else {
            this.currentPlayerId = PlayerDetails.PlayerX.id;
        }
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
                [PlayerDetails.PlayerX.id]: Array.from(this.moves[PlayerDetails.PlayerX.id]),
                [PlayerDetails.PlayerO.id]: Array.from(this.moves[PlayerDetails.PlayerO.id])
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
        this.moves[PlayerDetails.PlayerX.id] = new Set(state.moves[PlayerDetails.PlayerX.id]);
        this.moves[PlayerDetails.PlayerO.id] = new Set(state.moves[PlayerDetails.PlayerO.id]);
    }

    resetState() {
        for (const cell of this.cells) {
            cell.reset();
        }
        this.currentPlayerId = PlayerDetails.PlayerX.id;
        this.isWin = false;
        this.isDraw = false;
        this.winner = null;
        this.winningLine = [];
        this.moves[PlayerDetails.PlayerX.id].clear();
        this.moves[PlayerDetails.PlayerO.id].clear();
    }
};