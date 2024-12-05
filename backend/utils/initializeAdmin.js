import User from '../models/UserModel.js'; 
import bcrypt from "bcryptjs";

const initializeAdmin = async () => {
  try {
    const adminExists = await User.findOne({ where: { role: "admin" } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
      await User.create({
        name: process.env.DEFAULT_ADMIN_NAME,
        email: process.env.DEFAULT_ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
      });
      console.log("Admin default berhasil dibuat.");
    } else {
      console.log("Admin sudah ada, tidak perlu membuat ulang.");
    }
  } catch (error) {
    console.error("Gagal membuat admin default:", error);
  }
};

export default initializeAdmin;
