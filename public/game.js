const VEL_CUT_OFF = 0.01;
const THROTTLE_RATE = 0.01;
const SHIP_WID = 25;
const SHIP_HEI = 5;
class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	add(oVec) {
		this.x += oVec.x;
		this.y += oVec.y;
		return this;
	}
	sub(oVec) {
		this.x -= oVec.x;
		this.y -= oVec.y;
		return this;
	}
	mult(val) {
		this.x *= val;
		this.y *= val;
		return this;
	}
	div(val) {
		this.x /= val;
		this.y /= val;
		return this;
	}
	clone() {
		return new Vector(this.x, this.y);
	}
	toAngle() {
		return Math.atan2(this.y, this.x);
	}
	fromAngle(ang) {
		this.x = Math.cos(radians(ang));
		this.y = Math.sin(radians(ang));
		return this;
	}
	normalize() {
		const mag = this.mag();
		this.x /= mag;
		this.y /= mag;
		return this;
	}
	mag() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	toObject() {
		return {
			x: this.x,
			y: this.y
		};
	}
	fromObject(obj) {
		return new Vector(obj.x, obj.y);
	}
}
class Game {
	constructor(network) {
		this.player = new Ship();
		this.player.isLocal = true;
		this.players = [this.player];
		network.bindObjectEvents("Player", {
			spawn: () => {
				var newPlayer = new Ship();
				this.players.push(newPlayer);
				return newPlayer;
			},
			despawn: id => {
				this.players = this.players.filter(player => player.id != id);
			},
			scope: this
		});
		network.syncObject("Player", this.player);
	}
	run() {
		this.players.forEach(player => player.run());
	}
}

class Ship {
	constructor() {
		this.primaryDrag = 0.99;
		this.maxAcel = 0.1;
		this.currentThrottle = 0;
		this.perpDrag = 0.97;
		this.liftCoef = 0.7;
		this.turnDrag = 0.98;
		this.turnRate = 1;
		this.speedTurnMult = 0.01;
		this.pos = new Vector(200, 200);
		this.vel = new Vector(0, 0);
		this.rot = 0;
		this.forwardVector = new Vector(0, 0);
		this.isLocal = false;
	}
	run() {
		this.forwardVector = this.forwardVector.fromAngle(this.rot);
		this.currentThrottle = Math.max(0, Math.min(1, this.currentThrottle));
		if (this.vel.mag() < 0.01) {
			this.vel.mult(0);
		}
		this.move();
		if (this.isLocal) {
			this.handleKeys();
		}
		this.draw();
	}
	draw() {
		push();
		translate(this.pos.x, this.pos.y);
		rotate(radians(this.rot));
		noStroke();
		fill(51);
		rect(-SHIP_WID / 2, -SHIP_HEI / 2, SHIP_WID, SHIP_HEI);
		pop();
	}
	move() {
		this.pos.add(this.vel);
		this.vel.mult(this.primaryDrag);
		const acelVec = this.forwardVector
			.clone()
			.mult(this.currentThrottle * this.maxAcel);
		this.vel.add(acelVec);
	}
	handleKeys() {
		if (k("w")) {
			this.currentThrottle += THROTTLE_RATE;
		}
		if (k("s")) {
			this.currentThrottle -= THROTTLE_RATE;
		}
		if (k("a")) {
			this.rot -= this.turnRate * (this.speedTurnMult * this.vel.mag() + 1);
			this.vel.mult(this.turnDrag);
		}
		if (k("d")) {
			this.rot += this.turnRate * (this.speedTurnMult * this.vel.mag() + 1);
			this.vel.mult(this.turnDrag);
		}
	}
	deserialize(data) {
		this.pos = Vector.prototype.fromObject(data.pos);
		this.vel = Vector.prototype.fromObject(data.vel);
		this.rot = data.rot;
		this.currentThrottle = data.currentThrottle;
	}
	serialize() {
		return {
			pos: this.pos.toObject(),
			vel: this.vel.toObject(),
			rot: this.rot,
			currentThrottle: this.currentThrottle
		};
	}
}
