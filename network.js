const TICK_RATE = 10;
const TICK_MS = 1000 / TICK_RATE;

const Client = require('./client.js')
const Perms = require('./perms.js');
const Actions = require('./actions.js');
const WebSocket = require('ws');
class Network {
	constructor(webServer) {
		this.server = new WebSocket.Server({
			server: webServer
		});
		this.clients = [];
		const self = this;
		this.server.on('connection', (socket) => {
			this.initSocket(socket);
		});
	}
	initSocket(socket) {
		const client = new Clent();
		socket.on('message', (event) => {
			console.log('Got message.', event);
		});
		socket.on('open', (event) => {
			console.log('Socket open.', event);
		});
		socket.on('close', (event) => {
			console.log('Socket close.', event);
		});
		setInterval((s) => s.send('hi'), 5000, socket);
	}
	callAction() {
		// function runFunc(client, data) {
		if (client.permLevel < this.authLevel) {
			console.log('Permission error, %s attempted to execute \'%s\' but only has permLevel %s (Needs %s)',
				client.id, this.name, client.permLevel, this.authLevel);
			return;
		}
		this.execute(client, data);
		if (this.informClients) {
			client.socket.broadcast.emit('action', {
				action: this.name,
				data: data,
				owner: client.id
			});
		}
	}
	// }
}
module.exports = Network;