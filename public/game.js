class User {
	constructor(id, username) {
		this.id = id;
		this.username = username;
	}
	deserialize(data) {
		this.id = data.id;
		this.username = data.username;
	}
	serialize() {
		return {
			id: this.id,
			username: this.username
		}
	}
}