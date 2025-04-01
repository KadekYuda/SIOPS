import jwt from 'jsonwebtoken';
import User from "../models/UserModel.js";

// Store blacklisted tokens (logged out tokens)
const tokenBlacklist = new Set();

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Ambil token dari cookie

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ msg: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifikasi token

    const user = await User.findOne({
      where: { user_id: decoded.user_id },
      attributes: ['user_id', 'name', 'email', 'role', 'status'],
    });

    if (!user) {
      console.log("User not found for user_id:", decoded.user_id);
      return res.status(404).json({ msg: "User not found!" });
    }

    if (user.status === 'inactive') {
      console.log("Inactive account for user_id:", decoded.user_id);
      return res.status(403).json({ msg: "Account is inactive. Please contact the admin." });
    }

    req.user = user; // Simpan data pengguna ke dalam request object
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(403).json({ msg: "Invalid token" });
  }
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
  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // Hanya jika pakai HTTPS
    sameSite: "None", // Jika frontend dan backend berbeda origin
  });
  res.status(200).json({ message: "Logged out successfully" });
}

export const verifyToken = (req, res) => {
  // Ambil token dari cookie
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ valid: false, msg: "No token provided" });
  }

  // Periksa apakah token ada di blacklist
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ valid: false, msg: "Token has been invalidated" });
  }

  // Verifikasi token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err.message);
      return res.status(403).json({ valid: false, msg: "Invalid token" });
    }

    // Periksa waktu kedaluwarsa token
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTimestamp) {
      return res.status(401).json({ valid: false, msg: "Token has expired" });
    }
    
    // Token valid, kembalikan data pengguna
    res.status(200).json({
      valid: true,
      user: {
        user_id: decoded.user_id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        phone_number: decoded.phone_number
      }
    });
  });
};

export const authorizeUserOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Authentication required" });
  }

  if (req.user.status === 'inactive') {
    return res.status(403).json({ 
      msg: "Account is inactive. Please contact the admin." 
    });
  }
  
  const requestedUserId = parseInt(req.params.user_id, 10);
  const currentUserId = parseInt(req.user.user_id, 10);
  
  const isAdmin = req.user.role === 'admin';
  const isSelfUpdate = currentUserId === requestedUserId;
  
  if (isAdmin || isSelfUpdate) {
    next();
  } else {
    res.status(403).json({ msg: "Access denied" });
  }
};