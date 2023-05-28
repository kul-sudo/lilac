export default (req, res) => {
  const { token } = req.cookies
  if (token) {
    res.status(200).json({ tokenExists: true })
  } else {
    res.status(200).json({ tokenExists: false })
  }
}
