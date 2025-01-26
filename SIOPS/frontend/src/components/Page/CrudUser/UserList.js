import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FilePlus, Edit, Trash2 } from 'lucide-react';
import CrudButton from '../../Button/CrudButton';
import UserModal from '../../modal/UserModal';
import SuccessModal from '../../modal/SuccessModal';
import AlertModal from '../../modal/AlertModal';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  
  // Modal state for feedback
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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
      setModalMessage('Gagal mengambil data staff');
      setErrorModalOpen(true);
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
      // Show success modal
      setModalMessage('Staff berhasil ditambahkan');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Error adding user:', error.response ? error.response.data : error.message);
      // Show error modal
      setModalMessage(error.response?.data?.msg || 'Gagal menambahkan staff');
      setErrorModalOpen(true);
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
      // Show success modal
      setModalMessage('Staff berhasil diperbarui');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Error updating user:', error.response ? error.response.data : error.message);
      // Show error modal
      setModalMessage(error.response?.data?.msg || 'Gagal memperbarui staff');
      setErrorModalOpen(true);
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
      // Show success modal
      setModalMessage('Staff berhasil dihapus');
      setSuccessModalOpen(true);
    } catch (error) {
      console.log(error.response ? error.response.data : error.message);
      // Show error modal
      setModalMessage(error.response?.data?.msg || 'Gagal menghapus staff');
      setErrorModalOpen(true);
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

      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message={modalMessage}
      />

      <AlertModal
        show={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default UserList;
