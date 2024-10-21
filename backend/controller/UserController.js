import User from "../models/UserModel.js"
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const getUsers = async(req, res) => {
    try {
        const response = await User.findAll();
        res.status(200).json(response);
    } catch (error) {
        console.log(error.massage);
    }
}

export const getUserById = async(req, res) => {
    try {
        const response = await User.findOne({
            where:{
                id: req.params.id
            }
        });
        res.status(200).json(response);
    } catch (error) {
        console.log(error.massage);
    }
}

export const createUser = async (req, res) => {
  const { name, email, password, role} = req.body;
  try {
    

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: "User dengan email ini sudah ada" });
    }
    const newUser = await User.create({ name, email, password, role });
    res.status(201).json({ msg: "User berhasil dibuat", user: newUser  });
  } catch (error) {
    console.log("Error saat membuat user:", error);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
  
    try {
      // Cari user berdasarkan ID
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ msg: "User tidak ditemukan" });
      }
  
      
      user.name = name || user.name;
      user.email = email || user.email;
      user.password = password || user.password;
      user.role = role || user.role;
  
      await user.save();
      res.status(200).json({ msg: "User berhasil diupdate", user });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
  };
  

  export const deleteUser = async (req, res) => {
    const { id } = req.params;
  
    try {
      // Cari user berdasarkan ID
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ msg: "User tidak ditemukan" });
      }
  
      // Hapus user
      await user.destroy();
      res.status(200).json({ msg: "User berhasil dihapus" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
  };
  
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
      // Cari user berdasarkan email
      const user = await User.findOne({ where: { email: email } });
  
      if (!user) {
        return res.status(404).json({ msg: "User tidak ditemukan" });
      }
  
      let match = false;
      if (user.password.length < 20) {
        
        match = password === user.password; // Bandingkan langsung dengan plain text
      } else {
        
        match = await bcrypt.compare(password, user.password); // Bandingkan dengan bcrypt
      }
  
      if (!match) {
        return res.status(400).json({ msg: "Password salah" });
      }
  
      // Jika password cocok, buat token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, // Tambahkan informasi lain jika diperlukan
        process.env.ACCESS_TOKEN_SECRET, // Gunakan variabel lingkungan untuk secret key
        { expiresIn: '1h' } // Token berlaku selama 1 jam
      );
  
      res.status(200).json({ msg: "Login berhasil", token, role: user.role });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
  };    
  

  