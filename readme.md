# voxel-client

Enable an app based on voxel-engine to be a client for [voxel-server](https://github.com/maxogden/voxel-server)

# Example

    var client = createClient(opts.server || "ws://localhost:8080/")
    
# Run the demo

Run the start script:

```
npm start
```

This launches demo.js using beefy on port 9966.

Modify demo.js and replace hello-world.js with share-game.js to view how to share a game.

# Integrate it with your game

Follow the instructions for [voxel-server](https://github.com/maxogden/voxel-server) and get it running.

You can delete any lines in your app that create settings or the game; the server emits the settings to the client(s) and
voxel-client creates the instance of the game. View www/hello-world.js for a working example.

Replace the settings in Voxel-server if you wish your game to have different settings.

Use avatarInitialPosition to set the initial position of your avatar, based on 
settings sent from the server. If you don't use these, you might end up in the middle of some blocks!

``` js
var settings = game.settings.avatarInitialPosition
avatar.position.set(settings[0],settings[1],settings[2])
```  
# Sharing your own game

If you wish to share a game you've created but don't want to modify the voxel-server code, view www/share-game.js for an example.

To run the share demo, run 

    beefy share.js:share-bundle.js 9968 
    
and view it at http://localhost:9968/share.html

Remove the code that creates an instance of game (var game = createGame(opts)). Create an empty game object and populate it with your settings. 
If you are using a generator function from voxel, serialize it and add it to the generatorToString settings property.

``` js
var settings = {
	generate: voxel.generator['Valley'],
	chunkDistance: 2,
	materials: [
	['grass', 'dirt', 'grass_dirt'],
	'obsidian',
	'brick',
	'grass'
	],
	texturePath: texturePath,
	worldOrigin: [0, 0, 0],
	controls: { discreteFire: true },
	avatarInitialPosition: [2, 20, 2],  // sets the avatar in the right place.
	resetSettings: true // When you want to force the server to reset the game.
}

var game = {}
```    
If you are using a generator function from voxel, serialize it and add it to the generatorToString settings property.

    settings.generatorToString = settings.generate.toString()

Add settings to this empty game object

    game.settings = settings

Add game to the createClient paramaeters:

    var client = createClient(opts.server || "ws://localhost:8080/", game)

# API

## createClient(server, game)

server is typically "ws://localhost:8080/"

If game is null, voxel-client will create a game instance using settings from the server.


BSD LICENSE