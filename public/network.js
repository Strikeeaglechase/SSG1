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
		this.trackedObjects = [];
		this.netObjects = [];
		this.events = {
			onConnect: opts.onConnect || BLANK,
			onDisconnect: opts.onDisconnect || BLANK
		};
		this.t = 0;
		this.init();
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
	}
	handleData(packet) {
		console.log(packet);
		if (packet.type == "action") {
		}
		if (packet.type == "ping") {
			this.send({
				type: "pong",
				val: packet.val
			});
		}
	}
	disconnect() {
		this.socket.disconnect();
	}
	bindObjectEvents() {}
	run() {}
	send(data) {
		this.socket.send(msgpack.encode(data));
	}
}
