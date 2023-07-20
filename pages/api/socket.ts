import type { NextApiRequest } from 'next'
import type { ClientToServerEvents, InterServerEvents, NextApiResponseWithSocket, ServerToClientEvents, SocketData } from '../../types/socket'
import { Server } from 'socket.io'

let socketsData = new Map()

const socket = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    res.status(404).send('The socket has already been run.')
    return
  }

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(res.socket.server, {
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

      socketsData.set(socket.id, { username: data.username, uid: data.uid })
    })

    socket.on('leaveRoom', data => {
      socket.leave(data.uid)

      io.to(data.uid).emit('userLeft', `${data.username} has left the room`)
    
      socketsData.delete(socket.id)
    })

    socket.on('sendMessage', data => {
      socket.broadcast.to(data.uid).emit('messageReceived', { message: data.message, username: data.username, color: data.color, image: data.image })
    })
  })

  res.status(200).send('Setting up the socket.')
}

export default socket
