'use strict';

import fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const config = JSON.parse( fs.readFileSync( 'config.json' ) );
const port = process.env.PORT || config.http_port;
const app = express();
const server = createServer( app );
const wss = new WebSocketServer( { 'server': server } );

const clients = {};
const locations = {};
const machines = {};
const idle = {};
setInterval( () => {
	for( const uniqueId in idle ) {
		idle[ uniqueId ]++;
		if( config.max_idle == idle[ uniqueId ] ) {
			if( uniqueId in clients ) {
				clients[ uniqueId ].terminate();
				delete( clients[ uniqueId ] );
			}
			delete( locations[ uniqueId ] );
			delete( idle[ uniqueId ] );
			const num = Object.keys( clients ).length;
			console.log( uniqueId + ' -> idle, disconnect; clients: ' + num );
		}
	}
}, 1000 );

const newUniqueId = () => {
	let i = 0;
	while( i != 100 ) {
		let uniqueId = '';
		let i = 0;
		while( config.unique_length > uniqueId.length ) {
			const num = Math.floor( 36 * Math.random() );
			uniqueId += String.fromCharCode( num + ( num < 10 ? 48 : 55 ) );
		}
		if( -1 === Object.keys( clients ).indexOf( uniqueId ) ) {
			return uniqueId;
		}
		i++;
	}
	return null;
};

wss.on( 'connection', ( ws, req ) => {
	let locationName = '';
	let isMachine = false;
	let uniqueId = '';
	const q = req.url.indexOf( '?' );
	const p = -1 === q ? null : new URLSearchParams( req.url.substr( q + 1 ) );
	if( p ) {
		locationName = p.get( 'where' );
		isMachine = '1' === p.get( 'machine' );
		if( isMachine ) {
			uniqueId = p.get( 'unique' );
		}
	}
	ws.on( 'error', console.error );
	if( isMachine ) {
		if( uniqueId && 'undefined' !== typeof locations[ uniqueId ] ) {
			machines[ locations[ uniqueId ] ] = ws;
		}
	} else {
		uniqueId = newUniqueId();
		clients[ uniqueId ] = ws;
		locations[ uniqueId ] = locationName;
	}
	idle[ uniqueId ] = 0;
	ws.send( JSON.stringify( {
		'action': 'connect',
		'unique': uniqueId
	} ) );
	console.log( uniqueId + ' -> connect [' + locationName + ']'
		+ ( isMachine ? ' (machine)' : '' ) );
	ws.on( 'message', ( msg ) => {
		let data = null;
		try { data = JSON.parse( msg.toString() ); }
			catch( ex ) { data = null; }
		if( data && 'undefined' !== typeof data.action ) {
			console.log( JSON.stringify( data ) );
			if( !machines[ locations[ uniqueId ] ] ) {
				console.log( 'no machine at [' + locations[ uniqueId ] + ']' );
				return;
			}
			switch( data.action ) {
				case 'start':
					clients[ uniqueId ].send( JSON.stringify( data ) );
					break;
				case 'control':
					machines[ locations[ uniqueId ] ].send( JSON.stringify( data ) );
					break;
			}
		}
  } );
} );

app.set( 'etag', false );

app.use( ( req, res, next ) => {
  res.set( 'Cache-Control', 'no-store' );
  next();
} );

app.use( express.json() );
	
app.get( '/test', ( req, res ) => {
	res.set( 'Content-Type', 'text/html' );
	res.sendFile( path.join( __dirname, 'public', 'test.html' ) );
} );

app.get( '/', ( req, res ) => {
	res.set( 'Content-Type', 'text/html' );
	res.sendFile( path.join( __dirname, 'public', 'index.html' ) );
} );

app.use( express.static( path.join( __dirname, 'public' ) ) );

server.listen( port, () => {
	console.log( 'running on ' + port );
} );
