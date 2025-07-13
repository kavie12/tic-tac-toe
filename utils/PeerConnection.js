class PeerConnection {
    constructor(receiveDataHandler) {
        this.peer = new Peer();
        this.conn = null;
        this.receiveDataHandler = receiveDataHandler;

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
            this.conn.on("data", data => this.receiveDataHandler(data));
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