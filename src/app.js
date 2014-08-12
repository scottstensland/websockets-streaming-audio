
var fs = require('fs');

var flavor_socket = process.env.FLAVOR_SOCKET || "ws";

console.log("here is flavor_socket ", flavor_socket);


var path = require('path');

console.log("here is __dirname ", __dirname);

var parent_dir = path.join(__dirname, "/../");

console.log("here is parent_dir ", parent_dir);

var dir_suffix;

// value of process.env.FLAVOR_SOCKET determines where we pull code for both server + client
// this enables us to try out various npm Libraries as our Web Socket implementation

switch (flavor_socket) {		// choices :   ws  websocket  nodejs-websocket

	case "ws" : {

		dir_suffix = "src_ws"; // this is the active flavor - other socket implementations set aside for now
		break;
	};

	case "websocket" : {

		dir_suffix = "src_websocket";
		break;
	};

	case "nodejs-websocket" : {

		dir_suffix = "src_nodejs-websocket";
		break;
	};

	default : {

		dir_suffix = "src_ws"; // just default to using ws

		console.log("NOTICE - just using default Web Socket lib : ws");
		break;
	};
}

var working_dir = path.join(parent_dir, dir_suffix, "/");

console.log("here is working_dir ", working_dir);

if (! fs.existsSync(working_dir)) {

	console.error("ERROR - failed to find working_dir ", working_dir);
	process.exit(8);
}

var working_app = path.join(working_dir, "local_app");

console.log("here is working_app ", working_app);

var app_obj = require(working_app);

console.log("app_obj ", app_obj);

app_obj.connect_to_server(working_dir);

// app_obj.inside_local_app();


console.log("version:   0.2.6-5  ");

