import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState(""); // State untuk pesan error
  const navigate = useNavigate();

  const saveUser = async (e) => {
    e.preventDefault();

    // Cek jika ada field yang kosong
    if (!name || !email || !password) {
      setError("Semua form wajib diisi.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userData = { name, email, password, role };

      await axios.post("http://localhost:5000/users", userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/users");
    } catch (error) {
      console.log("Error saving user:", error);
      console.log("Error response:", error.response); 
    }
    if (error.response && error.response.data && error.response.data.msg) {
      setError(error.response.data.msg); // Tampilkan pesan error dari backend
    } else {
      setError("User dengan email ini sudah ada"); // Pesan default jika tidak ada msg
    }

  };

  return (
    <div className="min-w-full min-h-screen p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-20">Tambah User</h2>

      {/* Tampilkan pesan error jika ada */}
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={saveUser} className="space-y-4">
        {/* Name */}
        <div className="flex items-center space-x-4">
          <label htmlFor="name" className="w-1/4 text-gray-700 font-medium">
            Name:
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-3/4 p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>

        {/* Email */}
        <div className="flex items-center space-x-4">
          <label htmlFor="email" className="w-1/4 text-gray-700 font-medium">
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-3/4 p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>

        {/* Password */}
        <div className="flex items-center space-x-4">
          <label htmlFor="password" className="w-1/4 text-gray-700 font-medium">
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-3/4 p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>

        {/* Role */}
        <div className="flex items-center space-x-4">
          <label htmlFor="role" className="w-1/4 text-gray-700 font-medium">
            Role:
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-3/4 p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="user">User</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {/* Tombol Simpan dan Batal */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
