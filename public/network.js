const BLANK = () => {};
const DEFAULT_UPDATE_RATE = 1;
const newId = () => Math.floor(Math.random() * 1e9).toString();
class Network {
	constructor(ip, port, opts) {
		opts = opts || {};
		this.ip = ip;
		this.port = port;
		this.socket = new WebSocket("ws://" + ip + ":" + port);
		this.ready = false;
		this.syncObjects = [];
		this.netObjects = [];
		this.events = {
			onConnect: opts.onConnect || BLANK,
			onDisconnect: opts.onDisconnect || BLANK
		};
		this.objectEvents = [];
		this.sendBuffer = [];
		this.t = 0;
	}
	init() {
		this.socket.addEventListener("open", event => {
			console.log("Socket Connected");
			this.ready = true;
			this.events.onConnect(event);
		});
		this.socket.addEventListener("message", async event => {
			var asBuffer = await event.data.arrayBuffer();
			var packet = msgpack.decode(new Uint8Array(asBuffer));
			this.handleData(packet);
		});
		this.socket.addEventListener("close", event => {
			console.log("Socket Disconnected");
			this.ready = false;
			this.events.onDisconnect(event);
		});
		this.addAction("newSyncObject", this.newSyncObject, this);
		this.addAction("despawnNetObject", this.despawnNetObject, this);
		this.addAction("connect", this.handleNewClient, this);
	}
	handleData(packet) {
		if (packet.type != "ping") {
			console.log(packet);
		}
		if (packet.type == "action") {
			const action = this.events[packet.action];
			if (action) {
				action.function.call(action.scope, packet.params);
			} else {
				console.log("Unknown action %s", packet.action);
			}
		}
		if (packet.type == "ping") {
			this.send({
				type: "pong",
				val: packet.val
			});
		}
	}
	handleNewClient(packet) {
		this.syncObjects.forEach(object => {
			this.send({
				type: "action",
				action: "newSyncObject",
				params: object.definition
			});
		});
	}
	newSyncObject(packet) {
		if (this.netObjects.find(obj => obj.id == packet.id)) {
			console.log("New object %s already exists. Disregarding", packet.id);
		} else {
			var objEvents = this.objectEvents[packet.name];
			if (!objEvents || typeof objEvents.spawn == undefined) {
				console.log("Error missing object events for %s", packet.name);
				return;
			}
			var obj = objEvents.spawn();
			obj._id = packet.id;
			this.netObjects.push({
				object: obj,
				despawn: objEvents.despawn,
				id: packet.id
			});
		}
	}
	despawnNetObject(id) {
		var object = this.netObjects.find(object => object.id == id);
		if (!object) {
			return;
		}
		object.despawn();
		this.netObjects = this.netObjects.filter(obj => obj.id != object.id);
	}
	disconnect() {
		this.socket.disconnect();
	}
	addAction(name, func, scope) {
		this.events[name] = {
			function: func,
			scope: scope || undefined
		};
		console.log("Added new action %s", name);
	}
	bindObjectEvents(name, events) {
		this.objectEvents[name] = events;
		console.log("Bound events to %s", name);
	}
	syncObject(name, object) {
		object._id = newId();
		const packet = {
			name: name,
			id: object._id
		};
		this.send({
			type: "action",
			action: "newSyncObject",
			params: packet
		});
		this.syncObjects.push({
			object: object,
			definition: packet
		});
	}
	run() {
		if (this.socket.readyState == 1) {
			this.sendBuffer.forEach(packet => this.send(packet));
			this.sendBuffer = [];
		}
	}
	send(data) {
		if (this.socket.readyState != 1) {
			this.sendBuffer.push(data);
			return;
		}
		this.socket.send(msgpack.encode(data));
	}
}
