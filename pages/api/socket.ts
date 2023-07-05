import type { NextApiRequest, NextApiResponse } from 'next'
import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'
import type { Server as IOServer } from 'socket.io'
import { Server } from 'socket.io'

interface SocketServer extends HTTPServer {
  io?: IOServer
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void
}

interface DataProps {
  message: string;
  username: string;
  color: string;
  image: string
}

interface SendMessageData {
  uid: string;
  message: string;
  username: string;
  color: string;
  image: string
}

interface LeaveRoomData {
  username: string;
  uid: string
}

type CreateRoomData = LeaveRoomData

interface ServerToClientEvents {
  connect: () => void;
  messageReceived: (data: DataProps) => void;
  userConnected: (message: string) => void
  userLeft: (message: string) => void
}


interface ClientToServerEvents {
  sendMessage: (data: SendMessageData) => void;
  leaveRoom: (data: LeaveRoomData) => void;
  createRoom: (data: CreateRoomData) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  username?: string;
  uid?: string;
  message?: string;
  color?: string;
  image?: string
}

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

export default socket
