const MIN_VEL = 0.01;
const THROTTLE_RATE = 0.01;
const SHIP_WID = 25;
const SHIP_HEI = 5;
const MOVER_DATA = {
	base: {
		primaryDrag: 0.99,
		maxAcel: 0.1,
		liftCoef: 0.05,
		turnDrag: 0.98,
		turnDragDegs: 5,
		turnRate: 1,
		speedTurnMult: 0
	},
	test: {
		primaryDrag: 1,
		maxAcel: 0.1,
		liftCoef: 0,
		turnDrag: 1,
		turnDragDegs: 5,
		turnRate: 2,
		speedTurnMult: 0
	}
};

// class Game {
// 	constructor(network) {
// 		this.player = new Ship();
// 		this.player.isLocal = true;
// 		this.players = [this.player];
// 		network.bindObjectEvents("Player", {
// 			spawn: () => {
// 				var newPlayer = new Ship();
// 				this.players.push(newPlayer);
// 				return newPlayer;
// 			},
// 			despawn: id => {
// 				this.players = this.players.filter(player => player.id != id);
// 			},
// 			scope: this
// 		});
// 		network.syncObject("Player", this.player);
// 	}
// 	run() {
// 		this.players.forEach(player => player.run());
// 	}
// }

class Mover extends NetworkSyncObject {
	constructor(opts) {
		super();
		if (!opts) {
			opts = MOVER_DATA.base;
		}
		this.primaryDrag = opts.primaryDrag;
		this.maxAcel = opts.maxAcel;
		this.liftCoef = opts.liftCoef;
		this.turnDrag = opts.turnDrag;
		this.turnRate = opts.turnRate;
		this.speedTurnMult = opts.speedTurnMult;
		this.pos = new Vector(200, 200);
		this.vel = new Vector(0, 0);
		this.forwardVector = new Vector(0, 0);
		this.rot = 0;
		this.currentThrottle = 0;
		this.turnDragEffective = false;
	}
	run() {
		this.move();
	}
	move() {
		this.forwardVector = Vector.fromAngle(this.rot);
		this.currentThrottle = Math.max(0, Math.min(1, this.currentThrottle));
		if (this.vel.mag() < MIN_VEL) {
			this.vel.mult(0);
		}
		this.pos.add(this.vel);
		this.vel.mult(this.primaryDrag);
		const acelVec = this.forwardVector
			.clone()
			.mult(this.currentThrottle * this.maxAcel);
		this.vel.add(acelVec);
		const v1 = Vector.fromAngle(this.rot);
		const v2 = this.vel.clone().normalize();
		const mag = this.vel.mag();
		v1.mult(mag * this.liftCoef);
		v2.mult(mag * (1 - this.liftCoef));
		this.vel = v1.add(v2);
	}
	tunrLeft() {
		this.rot -= this.turnRate * (this.speedTurnMult * this.vel.mag() + 1);
		this.vel.mult(this.turnDrag);
	}
	turnRight() {
		this.rot += this.turnRate * (this.speedTurnMult * this.vel.mag() + 1);
		this.vel.mult(this.turnDrag);
	}
	deserialize(data) {
		this.pos = Vector.fromObject(data.pos);
		this.vel = Vector.fromObject(data.vel);
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

class Aircraft extends Mover {
	constructor(type) {
		super(MOVER_DATA[type]);
	}
	draw() {
		push();
		translate(this.pos.x, this.pos.y);
		rotate(radians(this.rot));
		noStroke();
		fill(51);
		rect(-SHIP_WID / 2, -SHIP_HEI / 2, SHIP_WID, SHIP_HEI);
		pop();
		const velVector = this.vel
			.clone()
			.normalize()
			.mult(120);
		const frontVector = this.forwardVector
			.clone()
			.normalize()
			.mult(120);
		stroke(0, 200, 0);
		line(
			this.pos.x,
			this.pos.y,
			this.pos.x + velVector.x,
			this.pos.y + velVector.y
		);
		stroke(0, 0, 230);
		line(
			this.pos.x,
			this.pos.y,
			this.pos.x + frontVector.x,
			this.pos.y + frontVector.y
		);
	}
	run() {
		this.move();
		this.draw();
		this.handleKeys();
	}
	handleKeys() {
		if (k("w")) {
			this.currentThrottle += THROTTLE_RATE;
		}
		if (k("s")) {
			this.currentThrottle -= THROTTLE_RATE;
		}
		if (k("a")) {
			this.tunrLeft();
		}
		if (k("d")) {
			this.turnRight();
		}
	}
}
