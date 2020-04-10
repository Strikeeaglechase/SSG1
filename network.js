const TICK_RATE = 1; //0;
const TICK_MS = 1000 / TICK_RATE;
const Client = require("./client.js");
const WebSocket = require("ws");

class Network {
	constructor(webServer) {
		this.server = new WebSocket.Server({
			server: webServer,
		});
		this.clients = [];
	}
	start() {
		this.server.on("connection", (socket) => {
			this.clients.push(new Client(socket, this));
		});
		setInterval(
			(net) => {
				net.run();
			},
			TICK_MS,
			this
		);
	}
	run() {
		this.clients.forEach((client) => {
			client.run();
		});
		this.clients = this.clients.filter(
			(client) => client.socket.readyState == 1
		);
	}
}
module.exports = Network;
