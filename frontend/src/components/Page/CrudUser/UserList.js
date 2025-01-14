import React, { useState, useEffect } from 'react';
import { useNavigate  } from 'react-router-dom';
import axios from 'axios';
import { FilePlus, Edit, Trash2  } from 'lucide-react';
import CrudButton from '../../Button/CrudButton';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [role, setRole] = useState(''); // Menyimpan role pengguna
  const navigate = useNavigate();

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

  const handleEdit = (userId) => {
    navigate(`/edit/${userId}`)
  }

  const deleteUser = async (id) => {
    try {
      const token = localStorage.getItem('token'); // Mendapatkan token dari localStorage
      await axios.delete(`http://localhost:5000/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Menyertakan token dalam header
        },
      });
      getUsers();
    } catch (error) {
      console.log(error.response ? error.response.data : error.message);
    }
  };

 
  
  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-base font-bold lg:text-3xl ">User Management</h1>

        {/* Hanya tampilkan tombol tambah user jika role adalah admin */}
        {role === 'admin' && (
            <CrudButton
            icon={FilePlus} 
            label="Tambah User" 
            onClick={() => navigate("/add")} 
            buttonStyle="secondary" 
            className="p-2 rounded-md" 
          />
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
                    <CrudButton
                    icon={Edit} 
                    label="Edit" 
                    onClick={() => handleEdit(user.id)} 
                    actionType="edit" 
                    buttonStyle="primary" 
                    className="p-2 rounded-md" 
                  />
                   <CrudButton
                  icon={Trash2}
                  label="Delete"
                  onConfirm={() => deleteUser(user.id)}
                  confirmMessage="Apakah Anda yakin ingin menghapus User ini?"
                  title="Hapus User"
                  actionType="delete"
                  buttonStyle="danger" 
                />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default UserList;
