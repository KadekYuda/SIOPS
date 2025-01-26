import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SuccessModal from "../../modal/SuccessModal";

const AddUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [role, setRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post("http://localhost:5000/users", {
        name,
        email,
        password,
        confPassword,
        role,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setShowModal(true);
    } catch (error) {
      console.log("Error saving user:", error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      navigate("/users");
    }, 200); // Delay navigation slightly to allow modal animation
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-white mb-6">Add New User</h2>
      <form onSubmit={saveUser} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-white text-sm font-bold mb-2">
            Name
          </label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-white text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-white text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-white text-sm font-bold mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={confPassword}
            onChange={(e) => setConfPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-white text-sm font-bold mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Save
          </button>
        </div>
      </form>

      {showModal && (
        <SuccessModal
          open={showModal}
          message="User berhasil ditambahkan!"
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AddUser;
