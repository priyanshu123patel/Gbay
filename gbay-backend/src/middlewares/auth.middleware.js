const jwt = require('jsonwebtoken');
// const token = req.headers.authorization?.split(" ")[1];

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // if (user.is_locked) {
  //   return res.status(403).json({ message: "Account locked" });
  // }

  if (!authHeader)
    return res.status(401).json({ message: 'Token missing' });

  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: 'Invalid token format' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }

};
