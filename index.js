const gameGrid = document.getElementById("gameGrid");
const playerDetails = document.getElementById("playerDetails");
const inviteCard = document.getElementById("inviteCard");
const joinCard = document.getElementById("joinCard");
const btnInvite = document.getElementById("btnInvite");
const btnJoin = document.getElementById("btnJoin");
const txtInvitePlayer = document.getElementById("txtInvitePlayer");
const txtJoinPlayer = document.getElementById("txtJoinPlayer");
const titleSection = document.getElementById("titleSection");
const playerNameX = document.getElementById("playerNameX");
const playerNameO = document.getElementById("playerNameO");
const playerIndicatorX = document.getElementById("playerIndicatorX");
const playerIndicatorO = document.getElementById("playerIndicatorO");
const msgGameOver = document.getElementById("msgGameOver");
const btnPlayAgain = document.getElementById("btnPlayAgain");


let peerConnection = null;
let gameUiState = null;

init(PLAYERS, CELLS);

function init(players, cells) {
    document.addEventListener("DOMContentLoaded", () => {

        gameUiState = new GameUiState(players, cells);
        peerConnection = new PeerConnection(peerDataHandler);

        gameGrid.append(...gameUiState.cells.map(cell => cell.element));
    
        const invitePeerId = window.location.hash.substring(1);
        if (!invitePeerId) {
            inviteCard.classList.remove("hidden");
            peerConnection.playerId = PlayerDetails.PlayerX.id;
        } else {
            joinCard.classList.remove("hidden");
            peerConnection.playerId = PlayerDetails.PlayerO.id;
        }
    
        // Handle Invite button
        btnInvite.addEventListener("click", () => {
            gameUiState.players[PlayerDetails.PlayerX.id].playerName = txtInvitePlayer.value !== "" ? txtInvitePlayer.value : "Player";

            peerConnection.getInviteLink().then(link => {
                navigator.clipboard.writeText(link);
            });

            btnInvite.value = "Link Copied!";
        });
    
        // Handle Join button
        btnJoin.addEventListener("click", () => {
            const playerName = txtJoinPlayer.value !== "" ? txtJoinPlayer.value : "Player";
            gameUiState.players[PlayerDetails.PlayerO.id].playerName = playerName;
            peerConnection.connect(invitePeerId, playerName);
        });

        // Handle Play Again button
        btnPlayAgain.addEventListener("click", () => {
            resetGame();

            peerConnection.sendData({
                type: PeerSignal.RESET_GAME,
                data: null
            });
        });
    });
}

function peerDataHandler(signal) {
    if (signal.type === PeerSignal.JOIN_O) {
        gameUiState.players[PlayerDetails.PlayerO.id].playerName = signal.data.playerName;

        peerConnection.sendData({
            type: PeerSignal.JOIN_X,
            data: {
                playerName: gameUiState.players[PlayerDetails.PlayerX.id].playerName
            }
        });

        initGame();
    } else if (signal.type === PeerSignal.JOIN_X) {
        gameUiState.players[PlayerDetails.PlayerX.id].playerName = signal.data.playerName;

        initGame();
    } else if (signal.type === PeerSignal.SYNC_GAME_UI_STATE) {
        gameUiState.updateState(signal.data.state);
        refreshUpdatedState();
    } else if (signal.type === PeerSignal.RESET_GAME) {
        resetGame();
    }
}

function initGame() {
    playerNameX.innerHTML = gameUiState.players[PlayerDetails.PlayerX.id].playerName;
    playerNameO.innerHTML = gameUiState.players[PlayerDetails.PlayerO.id].playerName;

    inviteCard.classList.add("hidden");
    joinCard.classList.add("hidden");
    titleSection.classList.add("hidden");
    playerDetails.classList.remove("hidden");

    paintCurrentPlayerIndicator();

    setCellClickHandlers();
}

function setCellClickHandlers() {
    gameUiState.cells.forEach(cell => {        
        cell.setClickHandler(clickedCell => {

            // Only current player can play
            if (peerConnection.playerId !== gameUiState.currentPlayerId) {
                return;
            }

            // Register player move
            gameUiState.moves[gameUiState.currentPlayerId].add(clickedCell.cellIndex);

            // Draw the move
            clickedCell.draw(gameUiState.getCurrentPlayer());
    
            // Hanlde game over
            checkGameOver();
            if (gameUiState.isWin || gameUiState.isDraw) {
                handleGameOver(gameUiState);

                // Sync with the other peer
                peerConnection.sendData({
                    type: PeerSignal.SYNC_GAME_UI_STATE,
                    data: {
                        state: gameUiState.getState()
                    }
                });

                return;
            }
    
            // Switch player
            gameUiState.switchPlayer();
            paintCurrentPlayerIndicator();

            // Sync the UI state
            peerConnection.sendData({
                type: PeerSignal.SYNC_GAME_UI_STATE,
                data: {
                    state: gameUiState.getState()
                }
            });
        });
    });
}

function checkGameOver() {
    // Check win
    for (const [a, b, c] of WINNING_LINES) {
        const playerMoves = gameUiState.moves[gameUiState.currentPlayerId];
        if (playerMoves.has(a) && playerMoves.has(b) && playerMoves.has(c)) {
            gameUiState.isWin = true;
            gameUiState.winner = gameUiState.cells[a].playerId;
            gameUiState.winningLine = [a, b, c];
            return;
        }
    }
    
    // Check draw
    if (gameUiState.cells.length === gameUiState.moves[PlayerDetails.PlayerX.id].size + gameUiState.moves[PlayerDetails.PlayerO.id].size) {
        gameUiState.isDraw = true;
    }
}

function handleGameOver() {
    gameUiState.cells.forEach(cell => cell.removeClickHandler());

    if (gameUiState.isWin) {
        // Highlight winning line
        gameUiState.getWinningLine().forEach(cell => {
            cell.element.firstElementChild.style.color = "#e75e1e";
        });
        
       msgGameOver.innerHTML = `Winner is <span style="color: #e7c555; font-weight: bold;">${gameUiState.getWinner().playerName}!</span>`;
    } else if (gameUiState.isDraw) {
        msgGameOver.innerHTML = "Match is draw!";
    }

    msgGameOver.classList.remove("hidden");
    if (peerConnection.playerId === PlayerDetails.PlayerX.id) {
        btnPlayAgain.classList.remove("hidden");
    }
}

function refreshUpdatedState() {
    paintCurrentPlayerIndicator();

    // Draw moves
    if (peerConnection.playerId === PlayerDetails.PlayerX.id) {
        for (const move of gameUiState.moves[PlayerDetails.PlayerO.id]) {
            gameUiState.cells[move].draw(gameUiState.players[PlayerDetails.PlayerO.id]);
        }
    } else {
        for (const move of gameUiState.moves[PlayerDetails.PlayerX.id]) {
            gameUiState.cells[move].draw(gameUiState.players[PlayerDetails.PlayerX.id]);
        }
    }

    // Handle game over
    if (gameUiState.isWin || gameUiState.isDraw) {
        handleGameOver(gameUiState);
        return;
    }
}

function paintCurrentPlayerIndicator() {
    if (gameUiState.currentPlayerId === PlayerDetails.PlayerX.id) {
        playerIndicatorX.classList.add("active");
        playerIndicatorO.classList.remove("active");
    } else {
        playerIndicatorX.classList.remove("active");
        playerIndicatorO.classList.add("active");
    }
}

function resetGame() {
    gameUiState.resetState();

    msgGameOver.classList.add("hidden");
    btnPlayAgain.classList.add("hidden");

    paintCurrentPlayerIndicator();
}