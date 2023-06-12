import initializeSocketServer from '@/lib/server'

export default (req, res) => {
  initializeSocketServer(res.socket.server)
  
  res.end()
}