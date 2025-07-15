class PeerConnection {
    constructor(receiveDataHandler) {
        this.peer = new Peer();
        this.conn = null;
        this.receiveDataHandler = receiveDataHandler;

        this.playerId = null;

        this.peer.on("connection", conn => {
            this.conn = conn;
            this.receiveData();
            receiveDataHandler({
                type: PeerSignal.JOIN_O,
                data: {
                    playerName: this.conn.metadata.playerName
                }
            });
        });
    }

    getInviteLink() {
        return new Promise(resolve => {
            if (this.peer.id) {
                resolve(`${BASE_URL}#${this.peer.id}`);
            } else {
                this.peer.on("open", id => {
                    resolve(`${BASE_URL}#${id}`);
                });
            }
        });
    }

    connect(id, playerName) {
        this.conn = this.peer.connect(id, {
            metadata: {
                playerName: playerName
            }
        });
        this.receiveData();
    }

    receiveData() {
        this.conn.on("open", () => {
            this.conn.on("data", data => {
                this.receiveDataHandler(data);
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