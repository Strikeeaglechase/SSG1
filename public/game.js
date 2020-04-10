const MIN_VEL = 0.01;
const THROTTLE_RATE = 0.01;
const SHIP_WID = 25;
const SHIP_HEI = 5;
const BULLET_SPEED = 15;
const BULLET_LIFETIME = 750;
const DEAD_ZONE = 0;
const MOVER_DATA = {
	base: {
		primaryDrag: 0.99,
		maxAcel: 0.1,
		liftCoef: 0.05,
		turnDrag: 0.98,
		turnDragDegs: 5,
		turnRate: 1,
		speedTurnMult: 0,
	},
	test: {
		primaryDrag: 1,
		maxAcel: 0.1,
		liftCoef: 0,
		turnDrag: 1,
		turnDragDegs: 5,
		turnRate: 2,
		speedTurnMult: 0,
	},
};
var player;

function fixAngle(ang) {
	ang %= 360;
	return ang < 0 ? ang + 360 : ang;
}

class Game {
	constructor(network) {
		this.player = new Aircraft("test", this);
		player = this.player;
		this.player.isLocal = true;
		this.players = [this.player];
		this.bullets = [];
		this.initNetworkEvents();
		network.syncObject("Player", this.player, { syncOnChange: true });
	}
	initNetworkEvents() {
		network.bindObjectEvents("Player", {
			spawn: () => {
				var newPlayer = new Aircraft("test");
				this.players.push(newPlayer);
				return newPlayer;
			},
			despawn: (id) => {
				this.players = this.players.filter((player) => player.id != id);
			},
			scope: this,
		});
		network.bindObjectEvents("Bullet", {
			spawn: (params) => {
				var newBullet = new Bullet(params);
				this.Bullet.push(params.pos, params.vel);
				return newBullet;
			},
			despawn: (id) => {},
			scope: this,
		});
	}
	run() {
		this.players.forEach((player) => player.run());
		this.bullets.forEach((bullet) => bullet.run());
		this.bullets = this.bullets.filter((bullet) => !bullet.killed);
	}
}

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
		this.rot = fixAngle(this.rot);
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
	turnLeft() {
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
			currentThrottle: this.currentThrottle,
		};
	}
}

class Aircraft extends Mover {
	constructor(type, game) {
		super(MOVER_DATA[type]);
		this.isLocal = false;
		this.game = game;
	}
	draw() {
		push();
		translate(this.pos.x, this.pos.y);
		rotate(radians(this.rot));
		noStroke();
		fill(51);
		rect(-SHIP_WID / 2, -SHIP_HEI / 2, SHIP_WID, SHIP_HEI);
		pop();
		const velVector = this.vel.clone().normalize().mult(120);
		const frontVector = this.forwardVector.clone().normalize().mult(120);
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
		if (this.isLocal) {
			this.handleKeys();
		}
	}
	handleKeys() {
		if (k("w")) {
			this.currentThrottle += THROTTLE_RATE;
		}
		if (k("s")) {
			this.currentThrottle -= THROTTLE_RATE;
		}
		if (k("a")) {
			this.turnLeft();
		}
		if (k("d")) {
			this.turnRight();
		}
		if (k(" ")) {
			const newBullet = new Bullet({
				pos: this.pos,
				vel: this.forwardVector.clone().mult(BULLET_SPEED),
			});
			network.syncObject("Bullet", newBullet, { syncOnChange: false });
			this.game.bullets.push(newBullet);
		}
		if (k("r")) {
			const rot = fixAngle((degrees(this.vel.toAngle()) + 180) % 360);
			const retVector = Vector.fromAngle(rot).mult(150);
			stroke(255, 0, 0);
			line(
				this.pos.x,
				this.pos.y,
				this.pos.x + retVector.x,
				this.pos.y + retVector.y
			);
			const delta = fixAngle(this.rot - rot);
			if (delta < 180 - DEAD_ZONE) {
				this.turnLeft();
			} else if (delta > 180 + DEAD_ZONE) {
				this.turnRight();
			}
		}
	}
}

class Bullet extends NetworkSyncObject {
	constructor({ pos, vel }, ownerId) {
		super();
		this.pos = Vector.fromObject(pos);
		this.vel = Vector.fromObject(vel);
		this.killAt = Date.now() + BULLET_LIFETIME;
		this.killed = false;
	}
	run() {
		this.pos.add(this.vel);
		point(this.pos.x, this.pos.y);
		if (Date.now() > this.killAt) {
			this.desync();
			this.killed = true;
		}
	}
	serialize() {
		return {
			pos: this.pos.toObject(),
			vel: this.vel.toObject(),
		};
	}
	deserialize(obj) {
		this.pos = Vector.fromObject(obj.pos);
		this.vel = Vector.fromObject(obj.vel);
	}
}
