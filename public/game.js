const VEL_CUT_OFF = 0.01;
class Game {
	constructor(network) {
		this.player = new Player(network);
		this.player.isLocal = true;
		this.players = [this.player];
		network.bindObjectEvents("Player", {
			spawn: () => {
				var newPlayer = new Player();
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

class Player {
	constructor() {
		this.x = 200;
		this.y = 200;
		this.vx = 0;
		this.vy = 0;
		this.isLocal = false;
		this.speed = 1;
		this.speedMult = 0.95;
	}
	run() {
		if (this.isLocal) {
			fill(0, 100, 0);
			this.handleKeys();
		} else {
			fill(100, 0, 0);
		}
		this.x += this.vx;
		this.y += this.vy;
		this.vx *= this.speedMult;
		this.vy *= this.speedMult;
		this.vx = Math.abs(this.vx) < VEL_CUT_OFF ? 0 : this.vx;
		this.vy = Math.abs(this.vy) < VEL_CUT_OFF ? 0 : this.vy;
		ellipse(this.x, this.y, 10, 10);
	}
	handleKeys() {
		if (k("w")) {
			this.vy -= this.speed;
		}
		if (k("s")) {
			this.vy += this.speed;
		}
		if (k("a")) {
			this.vx -= this.speed;
		}
		if (k("d")) {
			this.vx += this.speed;
		}
	}
	serialize() {
		return {
			x: this.x,
			y: this.y,
			vx: this.vx,
			vy: this.vy
		};
	}
	deserialize(data) {
		this.x = data.x;
		this.y = data.y;
		this.vx = data.vx;
		this.vy = data.vy;
	}
}

class Ship {
	constructor() {
		this.primaryDrag = 0.95;
		this.acel = 1;
		this.perpDrag = 0.97;
		this.liftCoef = 0.7;
		this.turnDrag = 0.95;
		this.turnRate = 1;
		this.speedTurnMult = 1;
		this.pos = { x: 200, y: 200 };
		this.vel = { x: 0, y: 0 };
	}
	run() {}
}
