import type { NextApiResponse } from 'next'
import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'
import type { Server as IOServer } from 'socket.io'

export type DataProps = {
  message: string;
  username: string;
  color: string;
  image: string
}

export type SendMessageData = {
  uid: string;
  message: string;
  username: string;
  color: string;
  image: string
}

export type LeaveRoomData = {
  username: string;
  uid: string
}

export type CreateRoomData = LeaveRoomData

export type ServerToClientEvents = {
  connect: () => void;
  messageReceived: (data: DataProps) => void;
  userConnected: (message: string) => void
  userLeft: (message: string) => void
}

export type ClientToServerEvents = {
  sendMessage: (data: SendMessageData) => void;
  leaveRoom: (data: LeaveRoomData) => void;
  createRoom: (data: CreateRoomData) => void;
}

interface SocketServer extends HTTPServer {
  io?: IOServer
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export type InterServerEvents = {
  ping: () => void;
}

export type SocketData = {
  username?: string;
  uid?: string;
  message?: string;
  color?: string;
  image?: string
}
