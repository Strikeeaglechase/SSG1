const fRate = 60;
const backgroundColor = 0;
var network = undefined;
var keys = [];
var user;
var users = [];

function k(k) {
	return keys[k.toUpperCase().charCodeAt(0)];
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(fRate);
	angleMode(DEGREES);
	network = new Network('localhost', 8000);
	network.bindObjectEvents('User', {
		onSpawn: (id) => {
			var newUser = new User();
			newUser._id = id;
			users.push();
		},
		onDespawn: (id) => {
			users = users.filter((user) => user._id != id);
		}
	});
	user = new User('test-id', 'test-username');
	network.syncObject('user', user);
}

function run() {}

function draw() {
	background(backgroundColor);
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
