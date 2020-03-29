var express, app, webServer;
const Network = require("./network.js");
var network;

function initServer(ip, port) {
	console.log("Starting...");
	express = require("express");
	app = express();
	app.use(express.static("public"));
	webServer = app.listen(port, ip, () => console.log("Done!"));
	network = new Network(webServer);
	network.start();
}

initServer("192.168.1.224", 8000);
