const fRate = 60;
const backgroundColor = 0;
var keys = [];
var network;
var game;
var craft;
function k(k) {
	return keys[k.toUpperCase().charCodeAt(0)];
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(fRate);
	network = new Network("192.168.1.224", 8000);
	network.init();
	game = new Game(network);
}

function draw() {
	background(backgroundColor);
	fill(255);
	const runningTime = Date.now() - network.startTime;
	const kbs = network.totalSentBytes / runningTime;
	if (runningTime > 10000) {
		network.startTime = Date.now();
		network.totalSentBytes = 0;
	}
	var y = 10;
	text(kbs.toFixed(2) + "KB/s", 10, y);
	y += 15;
	for (var i in network.actionTotalBytes) {
		var data = network.actionTotalBytes[i];
		var bytesPerPacket = (data.total / data.sent).toFixed(2);
		var packetsSecond = (
			(data.sent / (Date.now() - data.started)) *
			1000
		).toFixed(2);
		text(
			i +
				": " +
				bytesPerPacket +
				" bytes/packet  " +
				packetsSecond +
				" packets/second",
			10,
			y
		);
		y += 12;
	}
	game.run();
	network.run();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {}

function mouseReleased() {}

function keyPressed() {
	keys[keyCode] = true;
}

function keyReleased() {
	keys[keyCode] = false;
}
