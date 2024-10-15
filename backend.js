const express = require('express')
const app = express()

const http =require('http')
const server = http.createServer(app)//this is for the socket.io

const { Server } = require('socket.io')
const io = new Server(server, {pingInterval: 2000, pingTimeout: 5000})

const port = 3000

app.use(express.static('public')) //this line of code helps in making the files of the public be available to the index.js
//or any other accessing the files.

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')//this passes the index.html whenever the home page is accessed
})

const backEndPlayers = {} //this is efficient with o(1)
const backEndProjectiles = {}
const speed = 10
const RADIUS = 10 
let projectileId = 0

io.on('connection', (socket)=>{//basically connection to make
  //also broadcasts the event
  console.log('a user just connected') 

  
  socket.on('initGame', ({username, width, height, devicePixelRatio})=>{
    backEndPlayers[socket.id] = {
      x: 500 * Math.random(), 
      y: 500 * Math.random(),
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceId: 0,
      score: 0,
      username
    }
    
    //below is the canvas 
    backEndPlayers[socket.id].canvas = {
      width, 
      height
    }
    backEndPlayers[socket.id].radius = RADIUS 
    if(devicePixelRatio > 1){
      backEndPlayers[socket.id].radius = 2*RADIUS
    }
  })
  io.emit('updatePlayers', backEndPlayers)//throws the event who joined the game

  // shoot comes from the eventlisteners
  socket.on('shoot', ({x, y, angle}) => {
    ++projectileId

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    backEndProjectiles[projectileId] = {
      x: x,
      y: y,
      velocity,
      playerId: socket.id
    }
  })
  

  socket.on('disconnect', (reason)=>{
    console.log(reason)
    delete backEndPlayers[socket.id]
  })

  socket.on('keydown', ({keyCode, sequenceId})=>{
    switch (keyCode ){
      case 'KeyW':
  io.emit('updatePlayers', backEndPlayers)//this sends the list to the front end
        backEndPlayers[socket.id].sequenceId = sequenceId
        backEndPlayers[socket.id].y -= speed 
        break
      case 'KeyA':
        backEndPlayers[socket.id].sequenceId = sequenceId
        backEndPlayers[socket.id].x -= speed
        break
      case 'KeyS':
        backEndPlayers[socket.id].sequenceId = sequenceId
        backEndPlayers[socket.id].y += speed
        break
      case 'KeyD':
        backEndPlayers[socket.id].sequenceId = sequenceId
        backEndPlayers[socket.id].x += speed
        break    
    }
  })
  // console.log(backEndPlayers);

})

setInterval(() => {
  //update the backEndProjectile
  for(const id in backEndProjectiles){
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    const PROJECTILE_RADIUS = 5
    if(backEndProjectiles[id].x - PROJECTILE_RADIUS >=
      backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width ||
      backEndProjectiles[id].x - PROJECTILE_RADIUS <= 0 ||
      backEndProjectiles[id].y - PROJECTILE_RADIUS >=
      backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height ||
      backEndProjectiles[id].y - PROJECTILE_RADIUS <= 0
    ){
      delete backEndProjectiles[id]
      continue  
    }

    for(const playerId in backEndPlayers){
      const backEndPlayer = backEndPlayers[playerId]

      const DISTANCE = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x, 
        backEndProjectiles[id].y - backEndPlayer.y 
      )

      //collision detection
      if(DISTANCE <= PROJECTILE_RADIUS+backEndPlayer.radius
        && backEndProjectiles[id].playerId !== playerId
      ){
        if(backEndPlayer[backEndProjectiles[id].playerId]){
          backEndPlayer[backEndProjectiles[id].playerId].score+=1
        }
        delete backEndPlayers[playerId]
        delete backEndProjectiles[id]
        break 
      }
      console.log(DISTANCE)
    }
  }
  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)
}, 15);

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`) //this basically listens at the port 3000
})
