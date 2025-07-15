const BASE_URL = window.location.origin;
const CELL_COUNT = 9;

const PlayerDetails = Object.freeze({
    PlayerX: {
        id: 0,
        symbol: "X",
        color: "#353535"
    },
    PlayerO: {
        id: 1,
        symbol: "O",
        color: "#c5a243ff"
    }
});

const PeerSignal = Object.freeze({
    JOIN_O: 0,
    JOIN_X: 1,
    SYNC_GAME_UI_STATE: 2,
    RESET_GAME: 3,
    DISABLE_PLAYER_SWAP: 4
});

const PLAYERS = [
    new Player(PlayerDetails.PlayerX.id, PlayerDetails.PlayerX.symbol, PlayerDetails.PlayerX.color),
    new Player(PlayerDetails.PlayerO.id, PlayerDetails.PlayerO.symbol, PlayerDetails.PlayerO.color)
];

const CELLS = [];
for (let i = 0; i < CELL_COUNT; i++) {
    CELLS.push(new Cell(i));
}

const WINNING_LINES = [
    [0, 1, 2], // rows
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6], // columns
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8], // diagonals
    [2, 4, 6]
];