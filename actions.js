const Perms = require('./perms.js')

module.exports = {
	connect: {
		authLevel: Perms.USER,
		informClients: true,
		name: 'connect',
		execute: (client, data) => {
			console.log('Client %s connected!', client.id);
		}
	},
	disconnect: {
		authLevel: Perms.USER,
		informClients: true,
		name: 'disconnect',
		execute: (client, data) => {
			console.log('Client %s disconnected!', client.id);
		}
	}
};