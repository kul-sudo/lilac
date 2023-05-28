import { SignJWT } from 'jose'

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }
  try {
    const { username } = req.body

    const token = await new SignJWT({ username })
      .setExpirationTime('1h')
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(
        new TextEncoder().encode(process.env.JWT_SECRET_KEY)
      )

    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict;`);

    res.status(200).json({ token })
  } catch (error) {
    console.error('Authentication failed:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}
