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
			client.ownedObjects.forEach(owned => {
				client.broadcast({
					type: "action",
					action: "despawnNetObject",
					params: owned.id,
					owner: client.id
				});
			});
		}
	},
	newSyncObject: {
		permLevel: Perms.USER,
		informClients: true,
		name: "newSyncObject",
		execute: (client, params) => {
			client.ownedObjects.push(params);
		}
	},
	despawnNetObject: {
		permLevel: Perms.USER,
		informClients: true,
		name: "despawnNetObject",
		execute: (client, params) => {
			client.ownedObjects = client.ownedObjects.filter(
				obj => obj.id != params.id
			);
		}
	}
};
