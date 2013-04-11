var url = require('url')
var websocket = require('websocket-stream')
var engine = require('voxel-engine')
var duplexEmitter = require('duplex-emitter')
var toolbar = require('toolbar')
var randomName = require('./randomname')
var crunch = require('voxel-crunch')
var emitChat = require('./chat')
var highlight = require('voxel-highlight')
var skin = require('minecraft-skin')
var player = require('voxel-player')
var texturePath = "/textures/"
//var game

module.exports = Client

function Client(server) {
  if(!(this instanceof Client)) {
    return new Client(server)
  }
  // this.blockSelector = toolbar({el: '#tools'})
  this.playerID
  this.lastProcessedSeq = 0
  this.localInputs = []
  this.connected = false
  this.currentMaterial = 1
  this.lerpPercent = 0.1
  this.server = server || 'ws://' + url.parse(window.location.href).host
  this.others = {}
  this.connect(server)
  this.game
  window.others = this.others
}

Client.prototype.connect = function(server) {
  var self = this
  var socket = websocket(server)
  socket.on('end', function() { self.connected = false })
  this.socket = socket
  this.bindEvents(socket)
}

Client.prototype.bindEvents = function(socket) {
  var self = this
  this.emitter = duplexEmitter(socket)
  var emitter = this.emitter
  this.connected = true

  emitter.on('id', function(id) {
    console.log('got id', id)
    self.playerID = id
  })
  
  emitter.on('settings', function(settings) {
	settings.texturePath = texturePath
    settings.generateChunks = false
    self.game = self.createGame(settings)
    emitter.emit('created')
    emitter.on('chunk', function(encoded, chunk) {
      var voxels = crunch.decode(encoded, chunk.length)
      chunk.voxels = voxels
      self.game.showChunk(chunk)
    })
    // emitter.on('noMoreChunks', function() {
//       var createPlayer = player(self.game)
//       self.viking = createPlayer('viking.png')
//       if (settings.startingPosition) self.viking.moveTo(settings.startingPosition)
//       self.viking.possess()
//     })
  })

  // fires when server sends us voxel edits
  emitter.on('set', function(pos, val) {
    self.game.setBlock(pos, val)
  })
}

Client.prototype.createGame = function(options) {
  var self = this
  var emitter = this.emitter
  options.controlsDisabled = false
  window.game = self.game = engine(options)
  function sendState() {
    if (!self.connected) return
    var player = self.game.controls.target()
    var state = {
      position: player.yaw.position,
      rotation: {
        y: player.yaw.rotation.y,
        x: player.pitch.rotation.x
      }
    }
    emitter.emit('state', state)
  }
  
  var name = localStorage.getItem('name')
  if (!name) {
    name = randomName()
    localStorage.setItem('name', name)
  }

  self.game.controls.on('data', function(state) {
    var interacting = false
    Object.keys(state).map(function(control) {
      if (state[control] > 0) interacting = true
    })
    if (interacting) sendState()
  })
    
  emitChat(name, emitter)

  // var container = document.body
//   self.game.appendTo(container)
  // rescue(game)
  
  
  //highlight(self.game)
  
  // blockSelector.on('select', function(material) {
  //   currentMaterial = +material
  // })
  
  // self.game.on('fire', function (target, state) {
  //   var vec = self.game.cameraVector()
  //   var pos = self.game.cameraPosition()
  //   var point = self.game.raycast(pos, vec, 100)
  //   if (!point) return
  //   var erase = !state.firealt && !state.alt
  //   var size = self.game.cubeSize
  //   if (erase) {
  //     emitter.emit('set', {x: point.x, y: point.y, z: point.z}, 0)
  //   } else {
  //     var newBlock = self.game.checkBlock(point)
  //     if (!newBlock) return
  //     var direction = self.game.camera.matrixWorld.multiplyVector3(new self.game.THREE.Vector3(0,0,-1))
  //     var diff = direction.subSelf(self.game.controls.target().yaw.position.clone()).normalize()
  //     diff.multiplySelf({ x: 1, y: 1, z: 1 })
  //     var p = point.clone().addSelf(diff)
  //     emitter.emit('set', p, currentMaterial)
  //   }
  // })
  
  // setTimeout is because three.js seems to throw errors if you add stuff too soon
  setTimeout(function() {
    emitter.on('update', function(updates) {      
      Object.keys(updates.positions).map(function(player) {
        var update = updates.positions[player]
        if (player === self.playerID) return self.onServerUpdate(update) // local player
        self.updatePlayerPosition(player, update) // other players
      })
    })
  }, 1000)

  emitter.on('leave', function(id) {
    if (!self.others[id]) return
    self.game.scene.remove(self.others[id].mesh)
    delete self.others[id]
  })
  
  return self.game
}

Client.prototype.onServerUpdate = function(update) {
  var pos = this.game.controls.target().yaw.position
  var distance = pos.distanceTo(update.position)
  // todo use server sent location
}

Client.prototype.lerpMe = function(position) {
  var to = new this.game.THREE.Vector3()
  to.copy(position)
  var from = this.game.controls.target().yaw.position
  from.copy(from.lerp(to, this.lerpPercent))  
}

Client.prototype.updatePlayerPosition = function(id, update) {
  var pos = update.position
  var player = this.others[id]
  if (!player) {
    var playerSkin = skin(this.game.THREE, 'player.png', {
      scale: new this.game.THREE.Vector3(0.04, 0.04, 0.04)
    })
    var playerMesh = playerSkin.mesh
    this.others[id] = playerSkin
    playerMesh.children[0].position.y = 10
    this.game.scene.add(playerMesh)
  }
  var playerSkin = this.others[id]
  var playerMesh = playerSkin.mesh
  playerMesh.position.copy(playerMesh.position.lerp(pos, this.lerpPercent))
  
  // playerMesh.position.y += 17
  playerMesh.children[0].rotation.y = update.rotation.y + (Math.PI / 2)
  playerSkin.head.rotation.z = scale(update.rotation.x, -1.5, 1.5, -0.75, 0.75)
}

function scale( x, fromLow, fromHigh, toLow, toHigh ) {
  return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow
}
