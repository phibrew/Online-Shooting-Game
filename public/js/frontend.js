 
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')
var socket = io() // this basically try to make the connection with the backend files

const  devicePixelRatio = window.devicePixelRatio || 1
canvas.width = innerWidth*devicePixelRatio
canvas.height = innerHeight*devicePixelRatio

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}
const frontEndProjectiles = {}

socket.on('updateProjectiles', (backEndProjectiles)=>{
  for(const id in backEndProjectiles){
    const backEndProjectile = backEndProjectiles[id]
    if(!frontEndProjectiles[id]){
      frontEndProjectiles[id] = 
          new Projectile({
            x: backEndProjectile.x,
            y: backEndProjectile.y,
            radius: 5,
            color: frontEndPlayers[backEndProjectile.playerId]?.color,
            velocity: backEndProjectile.velocity
          })
        
    }
    else {
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y
    }

    for(const frontEndProjectileId in frontEndProjectiles){
      if(!backEndProjectiles[frontEndProjectileId]){
        delete frontEndProjectiles[frontEndProjectileId]
      }
    }
  }
})

socket.on('updatePlayers', (backEndPlayers)=>{//front end object that updates the 
//joined player state...  
  for(const id in backEndPlayers){//calls the backend Players object to be drawn 
    const backEndPlayer = backEndPlayers[id];
    if(!frontEndPlayers[id]){
      frontEndPlayers[id] = new Player({
        x: backEndPlayer.x, 
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color
      })

      document.querySelector('#playerLabels').innerHTML +=
      `<div data-id="${id}" data-score="${backEndPlayer.score}">
       ${backEndPlayer.username}: ${backEndPlayer.score} </div>`
    }else {
      //if a player already exits
      document.querySelector(`div[data-id="${id}"]`).innerHTML =
      ` ${backEndPlayer.username}: ${backEndPlayer.score}`
      document.querySelector(`div[data-id="${id}"]`).setAttribute
      ('data-score', backEndPlayer.score)

      const parentDiv = document.querySelector('#playerLabels')
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))

      childDivs.sort((a, b)=>{
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))

        return scoreB - scoreA
      })

      childDivs.forEach((div) => {
        parentDiv.removeChild(div)
      })
      childDivs.forEach(div => {
        parentDiv.append(div)
      })
      frontEndPlayers[id].x = backEndPlayer.x
      frontEndPlayers[id].y = backEndPlayer.y

      const lastBackEndIndex = playerInputs.findIndex(input => {
        return backEndPlayer.sequenceId === input.sequenceId
      })
      if(lastBackEndIndex > -1){
        playerInputs.splice(0, lastBackEndIndex+1)

        playerInputs.forEach(input => {
          frontEndPlayers[id].x += input.dx
          frontEndPlayers[id].y += input.dy
        })
      } else{
        gsap.to(frontEndPlayers[id] ,{
          x: backEndPlayer.x,
          y: backEndPlayer.y,
          duration: 0.015,
          ease: "linear"
        })
      }
    }
  }
  //deleting in the players disconnected
  for(const id in frontEndPlayers){
    if(!backEndPlayers[id]){
      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      divToDelete.parentNode.removeChild(divToDelete)

      if(id === socket.id){
        document.querySelector('#usernameForm').style.display = "block"
      }

      delete frontEndPlayers[id]//this deletes the extra players...
    }
  } 
  // console.log(frontEndPlayers)
})

let animationId

function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for(const id in frontEndPlayers){//this basically draws out the players in the front end
    const frontEndPlayer = frontEndPlayers[id]
    frontEndPlayer.draw(); 
  }

  for(const id in frontEndProjectiles){
    const frontEndProjectile = frontEndProjectiles[id]
    frontEndProjectile.draw();
  }

  // for(let i = frontEndProjectiles.length - 1; i>-1; --i){
  //   const frontEndProjectile = frontEndProjectiles[i];
  //   frontEndProjectile.update();
  // }
}
animate()
const keys = {
  w:{
    isPressed: false
  },
  a:{
    isPressed: false
  },
  s:{
    isPressed: false
  },
  d:{
    isPressed: false
  }
}
const speed = 5
const playerInputs = []
let sequenceId = 0
setInterval(()=>{
  if(keys.w.isPressed){
    ++sequenceId
    playerInputs.push({sequenceId, dx: 0, dy: -speed})
    frontEndPlayers[socket.id].y -= speed
    socket.emit('keydown', {keyCode: 'KeyW', sequenceId})
  } 
  
  if(keys.a.isPressed){
    ++sequenceId
    playerInputs.push({sequenceId, dx: -speed, dy: 0})
    frontEndPlayers[socket.id].x -= speed
    socket.emit('keydown', {keyCode: 'KeyA', sequenceId})
  }
  
  if(keys.s.isPressed){
    ++sequenceId 
    playerInputs.push({sequenceId, dx: 0, dy: speed})
    frontEndPlayers[socket.id].y += speed
    socket.emit('keydown', {keyCode: 'KeyS', sequenceId})
  }
  
  if(keys.d.isPressed){
    ++sequenceId
    playerInputs.push({sequenceId, dx: speed, dy: 0})
    frontEndPlayers[socket.id].x += speed  
    socket.emit('keydown', {keyCode: 'KeyD', sequenceId})
  }
  // console.log(playerInputs)
}, 15)

window.addEventListener('keydown', (event)=>{
  if(!frontEndPlayers[socket.id]) return;
  //to access our player from all the players, 
  //we have socket available who stores our player with given id
  switch (event.code){
    case 'KeyW':
      keys.w.isPressed = true
      break
    case 'KeyA':
      keys.a.isPressed = true
      break
    case 'KeyS':
      keys.s.isPressed = true
      break
    case 'KeyD':
      keys.d.isPressed = true
      break    
  }
})

window.addEventListener('keyup', (event)=>{
  if(!frontEndPlayers[socket.id]) return;
  //to access our player from all the players, 
  //we have socket available who stores our player with given id
  switch (event.code){
    case 'KeyW':
      keys.w.isPressed = false
      break 
    case 'KeyA':
      keys.a.isPressed = false
      break
    case 'KeyS':
      keys.s.isPressed = false
      break
    case 'KeyD':
      keys.d.isPressed = false
      break    
  }
})

document.querySelector('#usernameForm').addEventListener('submit',
  (event)=>{
  document.querySelector('#usernameForm').style.display = "none"
  event.preventDefault()
  socket.emit('initGame', {
    username: document.querySelector('#usernameInput').value,
    width: canvas.width, 
    height: canvas.height,
    devicePixelRatio
  })
})