import { SignJWT } from 'jose'

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  try {
    const { username } = req.body
  
    const colors = ['#f56565', '#2b6cb0', '#319795', '#b794f4', '#00A3c4', '#4fd1c5']

    const randomColorIndex = Math.floor(Math.random() * colors.length)
    const randomColorElement = colors[randomColorIndex]

    const token = await new SignJWT({ username, color: randomColorElement })
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
