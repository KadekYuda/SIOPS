import jwt from 'jsonwebtoken';

// Store blacklisted tokens (logged out tokens)
const tokenBlacklist = new Set();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: "No token provided" });
  }

  // Check if token is blacklisted (logged out)
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ msg: "Token has been invalidated" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log("Token verification error:", err);
      return res.status(403).json({ msg: "Invalid token" });
    }

    // Check token expiration
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (user.exp && user.exp < currentTimestamp) {
      return res.status(401).json({ msg: "Token has expired" });
    }

    req.user = user;
    req.token = token; // Store token for potential blacklisting
    next();
  });
};

export const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  };
};

export const logout = (req, res) => {
  const token = req.token;
  if (token) {
    // Add token to blacklist
    tokenBlacklist.add(token); // Fix: use add() instead of has()
    res.status(200).json({ msg: "Logged out successfully" });
  } else {
    res.status(400).json({ msg: "No token to invalidate" });
  }
};

export const verifyToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false, msg: "No token provided" });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ valid: false, msg: "Token has been invalidated" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ valid: false, msg: "Invalid token" });
    }

    // Check token expiration
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (user.exp && user.exp < currentTimestamp) {
      return res.status(401).json({ valid: false, msg: "Token has expired" });
    }

    res.json({ valid: true, user });
  });
};