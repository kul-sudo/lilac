export default (req, res) => {
  res.setHeader('Set-Cookie', 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT')
  res.status(200).json({ message: 'Token removed successfully' })
}