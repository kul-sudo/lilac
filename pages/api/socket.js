import { Server } from 'socket.io'

export default (req, res) => {
  if (res.socket.server.io) {
    res.status(404).send('The socket has already been run.')
    return
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    maxHttpBufferSize: 1e8
  })

  res.socket.server.io = io

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
      socket.broadcast.to(data.uid).emit('messageReceived', { message: data.message, username: data.username, color: data.color, image: data.image })
    })
  })

  res.status(200).send('Setting up the socket.')
}
