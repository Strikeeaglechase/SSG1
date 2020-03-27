const Perms = require("./perms.js");

module.exports = {
	connect: {
		permLevel: Perms.USER,
		informClients: true,
		name: "connect",
		execute: (client, params) => {
			console.log("Client %s connected!", client.id);
		}
	},
	disconnect: {
		permLevel: Perms.USER,
		informClients: true,
		name: "disconnect",
		execute: (client, params) => {
			console.log("Client %s disconnected!", client.id);
		}
	}
};
