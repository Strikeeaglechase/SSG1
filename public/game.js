class User {
	constructor(id, username) {
		this.gameId = id;
		this.username = username;
	}
	deserialize(data) {
		this.gameId = data.gameId;
		this.username = data.username;
	}
	serialize() {
		return {
			gameId: this.gameId,
			username: this.username
		};
	}
}
