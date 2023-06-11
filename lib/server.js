import { Server } from 'socket.io'

let socketServerInstance = null

export default server => {
  if (socketServerInstance) {
    console.log('The socket server has already been initialized.')
    return
  }

  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false
  })

  io.on('connection', socket => {
    // createRoom can both create and join a room
    socket.on('createRoom', data => {
      socket.join(data.uid)

      io.to(data.uid).emit('userConnected', `${data.username} has joined the room`)
    })

    socket.on('leaveRoom', data => {
      socket.leave(data.uid)

      io.to(data.uid).emit('userLeft', `${data.username} has left the room`)
    })

    socket.on('sendMessage', data => {
      socket.broadcast.to(data.uid).emit('messageReceived', { message: data.message, username: data.username, color: data.color })
    })
  })

  socketServerInstance = io
}
