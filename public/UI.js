const buttonSpacer = 10;
var textBoxes = [];

var Cam = function() {
	this.x = 0;
	this.y = 0;
	this.xOff = 0;
	this.yOff = 0;
	this.xWant = 0;
	this.yWant = 0;
	this.speed = 0.5;
	this.scl = 1;
	this.boundTo = 'unset';
	this.isBound = false;
	this.boundAttrName = '';
	this.windowWidth = 0;
	this.windowHeight = 0;
	this.offsetMode = 'api';
	this.run = function(x, y) {
		if (!this.isBound) {
			this.setTarget(x, y);
		} else {
			var x;
			var y;
			if (this.boundAttrName) {
				x = this.boundTo[this.boundAttrName].x;
				y = this.boundTo[this.boundAttrName].y;
			} else {
				x = this.boundTo.x;
				y = this.boundTo.y;
			}
			this.setTarget(-x, -y);
		}
		this.checkOffset();
		this.x = lerp(this.x, this.xWant, this.speed);
		this.y = lerp(this.y, this.yWant, this.speed);
		scale(this.scl);
		translate(this.x + this.xOff, this.y + this.yOff);
	};
	this.checkOffset = function() {
		if (this.offsetMode == 'winCenter') {
			this.setOffset(
				(windowWidth / 2) / this.scl,
				(windowHeight / 2) / this.scl
			);
		} else if (this.offsetMode == 'none') {
			this.setOffset(0, 0);
		}
	}
	this.setOffset = function(xOffset, yOffset) {
		this.xOff = xOffset;
		this.yOff = yOffset;
	}
	this.setOffsetMode = function(mode) {
		if (mode == 'default' || mode == 'api') {
			this.offsetMode = 'api';
		} else if (mode == 'winCenter') {
			this.offsetMode = 'winCenter';
		} else if (mode == '0Bound' || mode == 'none') {
			this.offsetMode = 'none';
		}
	}
	this.setTarget = function(x, y) {
		this.xWant = x;
		this.yWant = y;
	}
	this.bind = function(obj, attrName) {
		if (obj == undefined) {
			this.isBound = false;
		} else {
			this.boundAttrName = attrName;
			this.boundTo = obj;
			this.isBound = true;
		}
	}
};

var Overlay = function(r, g, b, rate) {
	this.col = {
		r: r,
		g: g,
		b: b,
		a: 0
	};
	this.rate = rate;
	this.run = function() {
		this.col.a -= this.rate;
		this.col.a = constrain(this.col.a, 0, 255);
		fill(this.col.r, this.col.g, this.col.b, this.col.a);
		// console.log(this.col.levels);
		rect(-10, -10, windowWidth + 20, windowHeight + 20);
	}
	this.trigger = function(alpha) {
		this.col.a = alpha || 255;
	}
}

var InputFeild = function(x, y, w, h, opts) {
	//lable,initText,trigger
	this.x = x;
	this.y = y;
	this.w = w;
	this.addWidth = 0;
	this.h = h;
	this.trigger = opts.trigger || function() {};
	this.active = false;
	this.killed = false;
	var txt = (opts.initText || opts.initText == 0) ? opts.initText.toString() : '';
	this.input = txt;
	this.lable = opts.lable || '';
	this.maxLen = opts.maxLen || Infinity;
	this.sanitize = opts.sanitize || false;
	this.tabTo = opts.tabTo || undefined;
	this.allowCaps = true;
	this.draw = function() {
		textSize(12);
		if (typeof this.input == 'boolean') {
			if (this.input) {
				this.input = 1;
			} else {
				this.input = 0;
			}
		}
		if (this.active) {
			stroke(100, 0, 0);
		} else {
			stroke(0);
		}
		this.addWidth = max(0, textWidth(this.input) + 5 - this.w);
		fill(51);
		rect(this.x, this.y, this.w + this.addWidth, this.h, 4);
		noStroke(0);
		fill(255);
		text(this.input, x + 2, y + (this.h / 2) - 5, this.w + this.addWidth, this.h);
		text(this.lable, x - textWidth(this.lable), y + (this.h / 2) + 5);
		while (this.input.length > this.maxLen) {
			this.input = this.input.slice(0, -1);
		}
	}
	this.checkActive = function() {
		if (mouseIsPressed) {
			if (this.checkHit(mouseX, mouseY)) {
				this.active = true;
			} else {
				this.active = false;
			}
		}
	}
	this.checkHit = function(x, y) {
		return x > this.x && x < this.x + this.w + this.addWidth && y > this.y && y < this.y + this.h;
	}
	this.keyHandle = function() {
		if (!this.active || this.killed) {
			return;
		}
		if (keyCode == 9 && this.tabTo) {
			this.active = false;
			// textBoxes[this.tabTo].active = true;
			makeActive = this.tabTo;
			setTimeout(setTextActive, 0);
			return;
		}
		if (keyCode == 16 || keyCode == 20 || keyCode == 17 || keyCode == 18) {
			return;
		}
		if (keyCode == 10 || keyCode == 13) {
			this.trigger();
			return;
		}
		if (keyCode == 190) {
			this.input += '.';
			return;
		}
		if (keyCode === 8) {
			this.input = this.input.slice(0, -1);
		} else {
			var toAdd = String.fromCharCode(keyCode);
			if (this.allowCaps && keys[16]) {
				toAdd = toAdd.toUpperCase();
			} else {
				toAdd = toAdd.toLowerCase();
			}
			if (this.sanitize) {
				toAdd = this.clean(toAdd);
			}
			this.input += toAdd;
		}
	}
	this.clean = function(txt) {
		// 48 - 57
		// 65 - 90
		var code = txt.toUpperCase().charCodeAt(0);
		var accept = false;
		if (code >= 48 && code <= 57) {
			accept = true;
		}
		if (code >= 65 && code <= 90) {
			accept = true;
		}
		if (code == 32) {
			accept = true;
		}
		return accept ? txt : '';
	}
	this.run = function() {
		if (this.killed) {
			return;
		}
		this.draw();
		this.checkActive();
	}
}

function btn(x, y, w, h, txt, needUp) {
	var needW = textWidth(txt);
	var acW = max(w, needW + buttonSpacer);
	fill(51);
	rect(x, y, acW, h);
	fill(255);
	text(txt, x + 5, y + h / 2 + 4);
	if (mouseX > x && mouseX < x + acW && mouseY > y && mouseY < y + h) {
		if (mouseIsPressed) {
			if (needUp && !mouseUp) {
				return false;
			}
			if (needUp) {
				mouseUp = false;
			}
			return true;
		} else {
			fill(0, 100);
			rect(x, y, acW, h);
			return false;
		}
	}
}

function setTextActive() {
	textBoxes[makeActive].active = true;
}

function niceBar(x, y, w, h, val, valMin, valMax, txt, barCol) {
	noStroke();
	fill(255);
	text(txt, x + w / 2 - textWidth(txt), y - 5);
	noFill();
	strokeWeight(2);
	stroke(100)
	rect(x - 10, y, w, h, 5);
	noStroke();
	fill(barCol);
	var len = map(val, valMin, valMax, 0, w - 10);
	rect(x - 5, y + 3, len, h - 6);
}

function hitbox(x, y, w, h, ox, oy) {
	return (ox > x && ox < x + w && oy > y && oy < y + h)
}