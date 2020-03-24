const BLANK = () => {};
const DEFAULT_UPDATE_RATE = 1;
const newId = () => Math.floor(Math.random() * 1e9).toString();
class Network {
	constructor(ip, port, opts) {
		opts = opts || {};
		this.ip = ip;
		this.port = port;
		this.socket = new WebSocket('ws://' + ip + ':' + port);
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
		this.init();
	}
	init() {
		this.socket.addEventListener('open', (event) => {
			console.log('open', event);
			this.ready = true;
			this.events.onConnect(event);
		});
		this.socket.addEventListener('message', (event) => {
			console.log('message', event);
			this.handleData(event);
		});
		this.socket.addEventListener('close', (event) => {
			console.log('close', event);
			this.ready = false;
			this.events.onDisconnect();
		});
	}
	handleData(event) {
		const packet = event.data;
		if (packet.type == 'action') {

		}
	}
	disconnect() {
		this.socket.disconnect();
	}
	run() {}
	bindSyncObject(objectName, objectConst, opts) {}
	syncObject(name, object, opts) {}
}