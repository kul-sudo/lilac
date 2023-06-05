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
    socket.on('createRoom', roomUid => {
      socket.join(roomUid)
    })

    socket.on('leaveRoom', roomUid => {
      socket.leave(roomUid)
    })

    socket.on('sendMessage', data => {
      io.to(data.uid).emit('messageReceived', { message: data.message, username: data.username })
    })
  })

  socketServerInstance = io
}
