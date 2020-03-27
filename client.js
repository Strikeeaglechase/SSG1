const PING_MS = 1000;
const TIMEOUT = 10000;
const Perms = require("./perms.js");
const Actions = require("./actions.js");
const ID = require("./id.js");
const msgpack = require("msgpack-lite");

class Client {
	constructor(socket, network) {
		this.id = ID();
		this.socket = socket;
		this.network = network;
		this.permLevel = Perms.USER;
		this.lastPingSent = Date.now();
		this.lastPingRecived = Date.now();
		this.ownedObjects = [];
		this.ready = false;
		this.waitingForPing = false;
		this.lastPingDelay = 0;
		this.initHandlers();
	}
	initHandlers() {
		this.ready = true;
		this.callAction(Actions["connect"]);
		this.socket.addEventListener("message", event => {
			var packet = msgpack.decode(event.data);
			this.handleData(packet);
		});
		this.socket.addEventListener("close", event => {
			this.callAction(Actions["disconnect"]);
		});
	}
	handleData(packet) {
		if (packet.type != "pong") {
			console.log(this.id, packet);
		}
		if (packet.type == "action") {
			var action = Actions[packet.action];
			if (typeof action != "undefined") {
				this.callAction(action, packet.params);
			} else {
				console.log("%s sent an invalid action", this.id, data);
			}
		}
		if (packet.type == "broadcast") {
			this.broadcast(packet.data);
		}
		if (packet.type == "pong") {
			this.lastPingRecived = Date.now();
			this.lastPingDelay = Date.now() - packet.val;
			this.waitingForPing = false;
		}
	}
	run() {
		if (Date.now() - this.lastPingSent > PING_MS && !this.waitingForPing) {
			this.send({
				type: "ping",
				val: Date.now()
			});
			this.waitingForPing = true;
			this.lastPingSent = Date.now();
		}
		if (Date.now() - this.lastPingRecived > TIMEOUT) {
			console.log("%s timed out (%sms)", this.id, TIMEOUT);
			this.socket.terminate();
		}
	}
	callAction(action, params) {
		if (this.permLevel < action.permLevel) {
			console.log(
				"Permission error, %s attempted to execute '%s' but only has permLevel %s (Needs %s)",
				this.id,
				action.name,
				this.permLevel,
				action.authLevel
			);
		} else {
			action.execute(this, params);
			if (action.informClients) {
				this.broadcast({
					type: "action",
					action: action.name,
					params: params,
					owner: this.id
				});
			}
		}
	}
	broadcast(packet) {
		this.network.clients.forEach(client => {
			if (client.id != this.id) {
				client.send(packet);
			}
		});
	}
	send(data) {
		if (data.type != "ping") {
			console.log("Sending: ", data);
		}
		this.socket.send(msgpack.encode(data));
	}
}
module.exports = Client;
