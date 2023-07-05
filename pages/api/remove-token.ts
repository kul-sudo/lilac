import type { NextApiRequest, NextApiResponse } from 'next'

const removeToken = (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT')
  res.status(200).json({ message: 'Token removed successfully' })
}

export default removeToken
