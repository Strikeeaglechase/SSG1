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
	normalize() {
		let mag = this.mag();
		mag = mag == 0 ? 1 : mag;
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
	static fromObject(obj) {
		return new Vector(obj.x, obj.y);
	}
	static fromAngle(ang) {
		return new Vector(Math.cos(radians(ang)), Math.sin(radians(ang)));
	}
}
