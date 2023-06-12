export default (req, res) => {
  const { token } = req.cookies
  res.status(200).json({ token })
}