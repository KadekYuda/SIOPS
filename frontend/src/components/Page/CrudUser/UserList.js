import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import { FilePlus, Edit,  } from 'lucide-react';
import Trash from '../../Button/Trash';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [role, setRole] = useState(''); // Menyimpan role pengguna

  useEffect(() => {
    getUsers();
    getRole(); // Mendapatkan role pengguna
  }, []);

  // Mendapatkan role dari token atau local storage
  const getRole = () => {
    const token = localStorage.getItem('token'); // Token dari local storage
    if (token) {
      // Contoh sederhana ekstrak role dari token (gunakan jwt-decode atau proses sesuai server Anda)
      const userData = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      setRole(userData.role); // Ambil role dari payload token
    }
  };

  const getUsers = async () => {
    try {
      const token = localStorage.getItem('token'); // Mendapatkan token dari localStorage
      console.log("Token:", token); 
      const response = await axios.get('http://localhost:5000/users', {
        headers: {
          Authorization: `Bearer ${token}`, // Menyertakan token dalam header
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error.response ? error.response.data : error.message);
    }
  };

  const deleteUser = async (id) => {
    try {
      const token = localStorage.getItem('token'); // Mendapatkan token dari localStorage
      await axios.delete(`http://localhost:5000/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Menyertakan token dalam header
        },
      });
      getUsers();
      addToHistory(id, 'Deleted');
    } catch (error) {
      console.log(error.response ? error.response.data : error.message);
    }
  };

  const addToHistory = (userId, action) => {
    const user = users.find(u => u.id === userId);
    setHistory([...history, { userId, action, userName: user.name, timestamp: new Date().toLocaleString() }]);
  };
  
  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-base font-bold lg:text-3xl ">User Management</h1>

        {/* Hanya tampilkan tombol tambah user jika role adalah admin */}
        {role === 'admin' && (
          <Link
            to="/add"
            className="bg-green-500 text-white font-bold py-2 px-4 rounded flex items-center space-x-2 hover:bg-green-600"
          >
            <FilePlus className="w-5 h-5" />
            <span>Tambah User</span>
          </Link>
        )}
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm">No</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Created At</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Updated At</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>

              {/* Hanya tampilkan kolom Actions jika role adalah admin */}
              {role === 'admin' && (
                <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4">{user.name}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">{new Date(user.createdAt).toLocaleString()}</td>
                <td className="py-3 px-4">{new Date(user.updatedAt).toLocaleString()}</td>
                <td className="py-3 px-4">{user.role}</td>

                {/* Hanya tampilkan action buttons jika role adalah admin */}
                {role === 'admin' && (
                  <td className="py-3 px-4 flex space-x-2">
                    <Link to={`/edit/${user.id}`} className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
                      <Edit className="w-4 h-4" />
                    </Link>
                    {/* <button onClick={() => deleteUser(user.id)} className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600">
                      <Trash2 className="w-4 h-4" /> delete
                    </button> */}
                    <Trash 
                    onConfirm={() => deleteUser(user.id)} 
                    confirmMessage="Apakah Anda yakin ingin menghapus pengguna ini?" 
                    title="Hapus Pengguna" 
                  />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Histori Perubahan</h2>
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm">No</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Nama User</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Aksi</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{entry.userName}</td>
                  <td className="py-3 px-4">{entry.action}</td>
                  <td className="py-3 px-4">{entry.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserList;
