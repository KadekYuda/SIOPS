import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.sendStatus(401); // Jika tidak ada token, kirim 401 (Unauthorized)
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        console.log("Token verification error:", err); // Logging error token
        return res.sendStatus(403); // Jika token tidak valid, kirim 403 (Forbidden)
      }
      req.user = user; // Simpan user di req untuk digunakan di route
      console.log("Authenticated user:", user); // Logging user informasi
      next();
    });
  };
  

export const authorizeRole = (role) => {
    return (req, res, next) => {
      if (req.user.role !== role) {
        return res.status(403).json({ msg: "Akses ditolak" }); // Jika bukan role yang diizinkan, kirim 403 (Forbidden)
      }
      next();
    };
  };

  