import User from "../models/UserModel.js"
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Get user profile using the token
export const getUserProfile = async(req, res) => {
    try {
        const response = await User.findOne({
            attributes: ['user_id', 'name', 'email', 'role'],
            where: {
                user_id: req.userId // This comes from the verifyToken middleware
            }
        });
        if (!response) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }
        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: error.message });
    }
}

export const getUsers = async(req, res) => {
    try {
        const response = await User.findAll({
            attributes: ['user_id', 'name', 'email', 'role']
        });
        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: error.message });
    }
}

export const getUserById = async(req, res) => {
    try {
        const response = await User.findOne({
            attributes: ['user_id', 'name', 'email', 'role'],
            where:{
                user_id: req.params.user_id
            }
        });
        if (!response) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }
        res.status(200).json(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: error.message });
    }
}

export const createUser = async (req, res) => {
    const { name, email, password, role} = req.body;
    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ msg: "User dengan email ini sudah ada" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ 
            name, 
            email, 
            password: hashedPassword, 
            role 
        });
        
        res.status(201).json({ 
            msg: "User berhasil dibuat", 
            user: {
                user_id: newUser.user_id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.log("Error saat membuat user:", error);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
};

export const updateUser = async (req, res) => {
    const { user_id } = req.params;
    const { name, email, password, role } = req.body;
  
    try {
        // Cari user berdasarkan ID
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }
  
        // Validasi email uniqueness
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ msg: "Email sudah digunakan oleh user lain" });
            }
        }
  
        // Update nama dan role
        user.name = name || user.name;
        user.role = role || user.role;
  
        // Update email jika berbeda
        if (email && email !== user.email) {
            user.email = email;
        }
  
        // Hash password jika diubah
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }
  
        await user.save();
        res.status(200).json({ 
            msg: "User berhasil diupdate", 
            user: { 
                user_id: user.user_id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            }
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                user_id: req.params.user_id
            }
        });
        
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }
        
        await User.destroy({
            where: {
                user_id: req.params.user_id
            }
        });
        
        res.status(200).json({ msg: "User berhasil dihapus" });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ 
            where: { email }
        });
        
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ msg: "Password salah" });
        }
        
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                name: user.name,
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({ 
            msg: "Login berhasil",
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
};
