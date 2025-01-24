import { Sequelize } from "sequelize";
import mysql from "mysql2";

// Nama database yang ingin Anda buat
const dbName = "siops_db"; // Ganti dengan nama database yang sesuai

// Membuat koneksi untuk MySQL menggunakan mysql2
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",   // ganti dengan user yang sesuai
  password: "",   // ganti dengan password yang sesuai
});

// Membuat database jika belum ada
connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
  if (err) {
    console.error("Error creating database:", err);
  } else {
    console.log(`Database ${dbName} created or already exists.`);
  }
});

// Setelah memastikan database ada, buat koneksi Sequelize ke database tersebut
const db = new Sequelize(dbName, 'root', '', {
  host: 'localhost',
  dialect: 'mysql',  // Sesuaikan jika menggunakan database lain
});

export default db;
