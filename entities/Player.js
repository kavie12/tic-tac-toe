class Player {
    constructor(playerId, playerSymbol, color) {
        this.playerId = playerId;
        
        this.playerName = null;

        this.playerSymbolElement = document.createElement("span");
        this.playerSymbolElement.classList.add("cell-symbol");
        this.playerSymbolElement.style.color = color;
        this.playerSymbolElement.appendChild(document.createTextNode(playerSymbol));
    }

    getSymbolElement() {
        return this.playerSymbolElement.cloneNode(true);
    }
};