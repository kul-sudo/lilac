import { jwtVerify } from 'jose'

export default async (req, res) => {
  const { token } = req.cookies

  if (token) {
    try {
      const decodedToken = await verifyToken(token)
      const username = decodedToken.username
      res.status(200).json({ username })
    } catch (error) {
      console.error('Failed to verify token:', error)
      res.status(500).json({ error: 'Failed to verify token' })
    }
  } else {
    res.status(401).json({ error: 'Token cookie not found' })
  }
}

const verifyToken = async token => {
  const { payload } = await jwtVerify(token, process.env.JWT_SECRET_KEY)
  return payload
}
