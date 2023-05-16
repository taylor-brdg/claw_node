
configuration

	edit config.json

	"http_port" -- port to use for http + websocket server
	"max_idle" -- terminate client if idle for this many seconds
	"unique_length" -- number of characters in unique identifier


execution

	node server.js
		or
	npm start


WebSocket -- Client

	connection url:

		/?where=location

	inbound messages:

		{
			"action": "connect",
			"unique": "1A2B3C4D"
		}

		{ "action": "start" }

	outbound message:

		{
			"action": "control",
			"up": true,
			"down": false,
			"left": false,
			"right": false,
			"claw": false
		}


WebSocket -- Machine

	connection url:

		/?where=location&unique=1A2B3C4D&machine=1

	inbound messages:

		{ "action": "start" }

		{
			"action": "control",
			"up": true,
			"down": false,
			"left": false,
			"right": false,
			"claw": false
		}


files

	index.js -- http + websocket server running atop express
		localhost port specified by 'http_port' in config.json

	public/test.html -- client reference implementation
		served by http server at path /test

	public/code128.js -- to display barcodes
		minified CODE128 generator, from https://lindell.me/JsBarcode/

	config.json -- configuration

	package.json -- manifest and dependencies


files to ignore (do not copy/share)

	package-lock.json -- created by npm install
	node_modules/ -- installed libraries
