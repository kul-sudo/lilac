import type { NextApiRequest, NextApiResponse } from 'next'
import { jwtVerify } from 'jose'

const verifyToken = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  try {
    const { token } = req.body
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET_KEY))

    res.status(200).json({ payload })
  } catch (error) {
    console.error('Failed to verify token:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

export default verifyToken
