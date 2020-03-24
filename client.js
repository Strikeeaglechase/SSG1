const PING_RATE = 1;
const PING_MS = 1000 / PING_RATE;
const TIMEOUT = 10000;
const Perms = require('./perms.js');
const Actions = require('./actions.js');
class Client {
	constructor(socket) {
		this.id = socket.id;
		this.socket = socket;
		this.permLevel = Perms.USER;
		this.lastPingSent = Date.now();
		this.lastPingRecived = Date.now();
		this.waitingForPing = false;
		this.lastPingDelay = 0;
		this.initHandlers();
	}
	initHandlers() {
		const self = this;
		this.socket.on('action', data => {
			var action = Actions[data.action];
			if (typeof action != 'undefined') {
				action.run(self, data);
			} else {
				console.log('%s sent an invalid action', self.id, data);
			}
		});
		this.socket.on('pong', t => {
			self.lastPingRecived = Date.now();
			self.lastPingDelay = Date.now() - t;
			self.waitingForPing = false;
		});
		this.socket.on('broadcast', packet => {
			self.socket.broadcast.emit(packet.event, packet.data);
		});
	}
	run() {
		if (Date.now() - this.lastPingSent > PING_MS && !this.waitingForPing) {
			this.socket.emit('ping', Date.now());
			this.waitingForPing = true;
			this.lastPingSent = Date.now();
		}
		if (Date.now() - this.lastPingRecived > TIMEOUT) {
			console.log('%s timed out (%sms)', this.socket.id, TIMEOUT);
			this.socket.disconnect();
		}
	}
}
module.exports = Client;