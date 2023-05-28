import io from '@/lib/server'

export default (req, res) => {
  if (res.socket.server.io) {
    console.log('The socket has already been run.')
    res.end()
    return
  }

  res.socket.server.io = io

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

  console.log('Setting up the socket.')
  res.end()
}
