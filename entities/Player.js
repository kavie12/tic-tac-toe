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