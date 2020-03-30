const fRate = 60;
const backgroundColor = 0;
var network = undefined;
var keys = [];
var game;
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
	text(kbs.toFixed(2) + "KB/s", 10, 10);
	game.run();
	network.run();
	text((game.player.currentThrottle * 100).toFixed(0) + "%", 100, 100);
	text(game.player.vel.mag().toFixed(2) + "p/f", 100, 130);
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
