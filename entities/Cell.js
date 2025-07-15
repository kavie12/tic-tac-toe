class Cell {
    constructor(cellIndex) {
        this.cellIndex = cellIndex;
        this.isChecked = false;
        this.playerId = null;
        this.clickHandler = null;

        this.element = document.createElement("div");
        this.element.classList.add("cell");
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

    reset() {
        this.element.innerHTML = "";
        this.isChecked = false;
        this.playerId = null;
        this.element.addEventListener("click", this.clickHandler);
    }
};