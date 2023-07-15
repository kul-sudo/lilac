import { NextApiRequest, NextApiResponse } from 'next'

const ifCookieExists = (req: NextApiRequest, res: NextApiResponse) => {
  const { token } = req.cookies

  if (token) {
    res.status(200).json({ tokenExists: true })
  } else {
    res.status(200).json({ tokenExists: false })
  }
}

export default ifCookieExists
