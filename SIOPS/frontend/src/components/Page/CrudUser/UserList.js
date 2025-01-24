import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FilePlus, Edit, Trash2 } from 'lucide-react';
import CrudButton from '../../Button/CrudButton';
import UserModal from '../../modal/UserModal';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('add');

  useEffect(() => {
    getUsers();
    getRole();
  }, []);

  const getRole = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = JSON.parse(atob(token.split('.')[1]));
      setRole(userData.role);
    }
  };

  const getUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Filter to show only staff users
      const staffUsers = response.data.filter(user => user.role === 'staff');
      setUsers(staffUsers);
    } catch (error) {
      console.error('Error fetching users:', error.response ? error.response.data : error.message);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/users', { ...userData, role: 'staff' }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIsModalOpen(false);
      getUsers();
    } catch (error) {
      console.error('Error adding user:', error.response ? error.response.data : error.message);
      alert(error.response?.data?.msg || 'Error adding user');
    }
  };

  const handleEditUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const dataToUpdate = { ...userData };
      if (!dataToUpdate.password) {
        delete dataToUpdate.password; // Don't send password if it wasn't changed
      }
      await axios.put(`http://localhost:5000/users/${selectedUser.id}`, dataToUpdate, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIsModalOpen(false);
      getUsers();
    } catch (error) {
      console.error('Error updating user:', error.response ? error.response.data : error.message);
      alert(error.response?.data?.msg || 'Error updating user');
    }
  };

  const deleteUser = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getUsers();
    } catch (error) {
      console.log(error.response ? error.response.data : error.message);
      alert(error.response?.data?.msg || 'Error deleting user');
    }
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser({
      ...user,
      password: '' // Clear password for security
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-base font-bold lg:text-3xl">Staff Management</h1>

        {role === 'admin' && (
          <CrudButton
            icon={FilePlus}
            label="Add Staff"
            onClick={openAddModal}
            buttonStyle="secondary"
            className="p-2 rounded-md"
          />
        )}
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm">No</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
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
                {role === 'admin' && (
                  <td className="py-3 px-4 flex space-x-2">
                    <CrudButton
                      icon={Edit}
                      label="Edit"
                      onClick={() => openEditModal(user)}
                      actionType="edit"
                      buttonStyle="primary"
                      className="p-2 rounded-md"
                    />
                    <CrudButton
                      icon={Trash2}
                      label="Delete"
                      onConfirm={() => deleteUser(user.id)}
                      confirmMessage="Apakah Anda yakin ingin menghapus Staff ini?"
                      title="Hapus Staff"
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

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'add' ? handleAddUser : handleEditUser}
        user={selectedUser}
        title={modalMode === 'add' ? 'Add Staff' : 'Edit Staff'}
        mode={modalMode}
      />
    </div>
  );
};

export default UserList;
