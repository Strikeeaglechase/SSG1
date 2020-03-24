const BLANK = () => {};
const DEFAULT_UPDATE_RATE = 1;
const newId = () => Math.floor(Math.random() * 1e9).toString();
class Network {
	constructor(ip, port, opts) {
		opts = opts || {};
		this.ip = ip;
		this.port = port;
		this.socket = {
			connected: false
		};
		this.trackedObjects = [];
		this.inObjects = [];
		this.trackedArrays = [];
		this.boundObjects = [];
		this.ready = false;
		this.events = {
			onConnect: opts.onConnect || BLANK,
			onDisconnect: opts.onDisconnect || BLANK
		};
		this.t = 0;
	}
	connect() {
		this.socket = io.connect(this.ip + ':' + this.port);
		const self = this;
		this.socket.on('connect', function() {
			self.setupNetwork();
		});
	}
	setupNetwork() {
		this.events.onConnect();
		this.ready = true;
		const self = this;
		this.socket.on('action', data => {
			console.log(data);
		});
		this.socket.on('disconnect', data => {
			self.events.onDisconnect();
			self.ready = false;
		});
		this.socket.on('newSyncObject', data => {
			const objectDef = self.boundObjects.find(o => o.name == data);
			if (!objectDef) {
				console.log('No object definition for synced object', data);
				return;
			}
			const obj = new objectDef.constructor();
			obj._id = data._id;
			this.syncsIn.push(obj)
			self.events[objectDef.name].onSpawn(obj);
		});
		this.socket.on('syncData', data => {
			data.forEach(update => {
				var obj = self.inObjects.find(obj => obj.id == update.id);
				if (!obj) {
					console.log('Got data for unknown object', update);
				} else {
					obj.deserialize(data.data);
				}
			});
		});
	}
	disconnect() {
		this.socket.disconnect();
	}
	run() {
		if (!this.read) {
			return;
		}
		var syncData = [];
		this.trackedObjects.forEach(obj => {
			if (this.t - obj.lastUpdate > obj.updateRate) {
				var data = obj.serialize();
				if (data) {
					syncData.push({
						data: data,
						id: obj._id
					});
				}
				obj.lastUpdate = this.t;
			}
		});
		if (sycnData.length > 0) {
			console.log(syncData);
			this.socket.emit('broadcast', {
				event: 'syncData',
				data: syncData
			});
		}
		this.t++;
	}
	bindSyncObject(objectName, objectConst, opts) {
		opts = opts || {};
		this.boundObjects.push({
			const: objectConst,
			name: objectName,
			updateRate: opts.updateRate || DEFAULT_UPDATE_RATE
		});
		this.events[objectName] = {
			onSpawn: opts.onSpawn || BLANK,
			onSpawn: opts.onDespawn || BLANK
		};
	}
	syncObject(name, object, opts) {
		var bound = this.boundObjects.find(o => o.name == name);
		if (!bound) {
			console.log('Attempted to sync object without bound definition');
			return;
		}
		object._id = newId();
		this.trackedObjects.push({
			object: object,
			lastUpdate: 0,
			updateRate: bound.updateRate
		});
		this.socket.emit('broadcast', {
			event: 'newSyncObject',
			data: {
				name: name,
				id: object._id
			}
		});
	}
}