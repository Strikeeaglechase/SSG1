const BLANK = () => {};
const DEFAULT_UPDATE_RATE = 500;
const newId = () => Math.floor(Math.random() * 1e9).toString();
var LOG_ALL = false;
var LOG_NET = false;
class Network {
	constructor(ip, port, opts) {
		opts = opts || {};
		this.ip = ip;
		this.port = port;
		this.id;
		this.socket = new WebSocket("ws://" + ip + ":" + port);
		this.ready = false;
		this.syncObjects = [];
		this.netObjects = [];
		this.events = {
			onConnect: opts.onConnect || BLANK,
			onDisconnect: opts.onDisconnect || BLANK,
		};
		this.objectEvents = [];
		this.sendBuffer = [];
		this.startTime = Date.now();
		this.totalSentBytes = 0;
		this.actionTotalBytes = {};
	}
	init() {
		this.socket.addEventListener("open", (event) => {
			console.log("Socket Connected");
			this.ready = true;
			this.events.onConnect(event);
		});
		this.socket.addEventListener("message", async (event) => {
			var asBuffer = await event.data.arrayBuffer();
			var packet = msgpack.decode(new Uint8Array(asBuffer));
			this.handleData(packet);
		});
		this.socket.addEventListener("close", (event) => {
			console.log("Socket Disconnected");
			this.ready = false;
			this.events.onDisconnect(event);
		});
		this.addAction("newSyncObject", this.newSyncObject, this);
		this.addAction("despawnNetObject", this.despawnNetObject, this);
		this.addAction("connect", this.handleNewClient, this);
		this.addAction("syncData", this.handelSyncData, this);
	}
	handleData(packet) {
		if (
			((packet.type != "ping" && packet.action != "syncData") || LOG_ALL) &&
			LOG_NET
		) {
			console.log("In: ", packet);
		}
		switch (packet.type) {
			case "action":
				const action = this.events[packet.action];
				if (action) {
					action.function.call(action.scope, packet.params);
				} else {
					console.log("Unknown action %s", packet.action);
				}
				break;
			case "ping":
				this.send({
					type: "pong",
					val: packet.val,
				});
				break;
			case "assignNetId":
				this.id = packet.id;
				break;
			default:
				throw new Error(
					'Error: Unknown packet with type "' + packet.type + '"'
				);
		}
	}
	handleNewClient(packet) {
		this.syncObjects.forEach((object) => {
			this.send({
				type: "action",
				action: "newSyncObject",
				params: object.definition,
			});
		});
	}
	handelSyncData(packet) {
		packet.forEach((syncData) => {
			const netObject = this.netObjects.find((obj) => obj.id == syncData.id);
			if (!netObject) {
				console.log(
					"Sync data for unknown object with id of %s",
					syncData.id
				);
			} else {
				netObject.object.deserialize(syncData.data);
			}
		});
	}
	newSyncObject(packet) {
		if (this.netObjects.find((obj) => obj.id == packet.id)) {
			console.log("New object %s already exists. Disregarding", packet.id);
		} else {
			var objEvents = this.objectEvents[packet.name];
			if (!objEvents || typeof objEvents.spawn == undefined) {
				console.log("Error missing object events for %s", packet.name);
				return;
			}
			var obj = objEvents.spawn.call(objEvents.scope, packet.spawnParams);
			obj.id = packet.id;
			this.netObjects.push({
				object: obj,
				despawn: objEvents.despawn,
				despawnScope: objEvents.scope,
				id: packet.id,
			});
		}
	}
	despawnNetObject(id) {
		var object = this.netObjects.find((object) => object.id == id);
		if (!object) {
			return;
		}
		debugger;
		object.despawn.call(object.despawnScope, object.id);
		this.netObjects = this.netObjects.filter((obj) => obj.id != object.id);
	}
	disconnect() {
		this.socket.disconnect();
	}
	addAction(name, func, scope) {
		this.events[name] = {
			function: func,
			scope: scope || undefined,
		};
		console.log("Added new action %s", name);
	}
	bindObjectEvents(name, events) {
		this.objectEvents[name] = events;
		console.log("Bound events to %s", name);
	}
	syncObject(name, object, { updateRate, syncOnChange, spawnParams }) {
		object.id = object.id || newId();
		const packet = {
			name: name,
			id: object.id,
			spawnParams: spawnParams,
		};
		this.send({
			type: "action",
			action: "newSyncObject",
			params: packet,
		});
		this.syncObjects.push({
			object: object,
			definition: packet,
			updateRate: updateRate || DEFAULT_UPDATE_RATE,
			syncOnChange: syncOnChange,
			lastUpdate: Date.now(),
			lastPacket: undefined,
			id: object.id,
		});
	}
	run() {
		if (this.socket.readyState == 1) {
			this.sendBuffer.forEach((packet) => this.send(packet));
			this.sendBuffer = [];
		}
		var syncPacket = [];
		var t = Date.now();
		this.syncObjects.forEach((syncObj) => {
			const serialData = syncObj.object.serialize();
			const jsonString = JSON.stringify(serialData);
			if (
				t - syncObj.lastUpdate > syncObj.updateRate ||
				(jsonString != syncObj.lastPacket && syncObj.syncOnChange) ||
				syncObj.object._forceNetSync
			) {
				syncObj.lastUpdate = t;
				syncObj.lastPacket = jsonString;
				syncPacket.push({
					id: syncObj.id,
					data: serialData,
				});
			}
			if (syncObj.object._toBeDeleted) {
				this.send({
					type: "action",
					action: "despawnNetObject",
					params: {
						id: syncObj.id,
					},
				});
			}
		});
		this.syncObjects = this.syncObjects.filter(
			(obj) => !obj.object._toBeDeleted
		);
		if (syncPacket.length) {
			this.send({
				type: "action",
				action: "syncData",
				params: syncPacket,
			});
		}
	}
	send(data) {
		if (this.socket.readyState != 1) {
			this.sendBuffer.push(data);
			return;
		}
		if (
			((data.type != "pong" && data.action != "syncData") || LOG_ALL) &&
			LOG_NET
		) {
			console.log("Out: ", data);
		}
		const byteArray = msgpack.encode(data);
		this.totalSentBytes += byteArray.byteLength;
		if (data.type == "action") {
			if (!this.actionTotalBytes[data.action]) {
				this.actionTotalBytes[data.action] = {
					sent: 0,
					total: 0,
					started: Date.now(),
				};
			}
			this.actionTotalBytes[data.action].total += byteArray.byteLength;
			this.actionTotalBytes[data.action].sent++;
		}
		this.socket.send(byteArray);
	}
}

class NetworkSyncObject {
	constructor() {
		this.id = newId();
		this._forceNetSync = false;
		this._toBeDeleted = false;
	}
	serialize() {
		return JSON.stringify(this);
	}
	deserialize(jsonData) {
		const obj = JSON.parse(jsonData);
		for (var i in obj) {
			this[i] = obj[i];
		}
	}
	sync() {
		this._forceNetSync = true;
	}
	desync() {
		this._toBeDeleted = true;
	}
}
