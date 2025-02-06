  import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Clipboard,
  FilePlus,
  Edit,
  Trash2
} from 'lucide-react';
import CrudButton from '../../../Button/CrudButton';
import UserModal from '../../../modal/UserModal.jsx';
import SuccessModal from '../../../modal/SuccessModal.jsx';
import AlertModal from '../../../modal/AlertModal.jsx';

const DashboardAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    fetchOrderData();
    fetchUserData();
    getRole();
  }, []);

  const getRole = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = JSON.parse(atob(token.split('.')[1]));
      setRole(userData.role);
    }
  };

  const fetchOrderData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const sortedOrders = response.data.sort((a, b) => new Date(b.tgl_order) - new Date(a.tgl_order));
      setOrders(sortedOrders);  
    } catch (error) {
      console.error('Error fetching order data:', error.response ? error.response.data : error.message);
      setOrders([]);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
  
      const response = await axios.get('http://localhost:5000/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error.response ? error.response.data : error.message);
      setModalMessage('Gagal mengambil data staff');
      setErrorModalOpen(true);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/users', {
        ...userData,
        role: 'staff'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setIsModalOpen(false);
      fetchUserData();
      setModalMessage('Staff berhasil ditambahkan');
      setSuccessModalOpen(true);
    } catch (error) {
      setModalMessage(error.response?.data?.msg || 'Gagal menambahkan staff');
      setErrorModalOpen(true);
    }
  };

  const handleEditUser = async (userData) => {
    if (!selectedUser?.user_id) {
      setModalMessage('ID Staff tidak valid');
      setErrorModalOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const dataToUpdate = { 
        ...userData,
        role: 'staff'
      };
      
      if (!dataToUpdate.password) {
        delete dataToUpdate.password;
      }

      await axios.put(`http://localhost:5000/users/${selectedUser.user_id}`, dataToUpdate, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setIsModalOpen(false);
      fetchUserData();
      setModalMessage('Staff berhasil diperbarui');
      setSuccessModalOpen(true);
    } catch (error) {
      setModalMessage(error.response?.data?.msg || 'Gagal memperbarui staff');
      setErrorModalOpen(true);
    }
  };

  const deleteUser = async (userId) => {
    if (!userId) {
      setModalMessage('ID Staff tidak valid');
      setErrorModalOpen(true);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchUserData();
      setModalMessage('Staff berhasil dihapus');
      setSuccessModalOpen(true);
    } catch (error) {
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
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      password: ''
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const calculateTotalStock = () => {
    return orders.reduce((total, order) => total + (order.quantity || 0), 0);
  };
  
  return (
    <div className="container mx-auto p-5 mt-16 bg-gray-50">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Stock Management Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-600">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
            </div>
            <ShoppingCart className="text-blue-500" size={40} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-600">Total Stock</h3>
              <p className="text-3xl font-bold text-green-600">{calculateTotalStock()}</p>
            </div>
            <Package className="text-green-500" size={40} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-600">Total Staff</h3>
              <p className="text-3xl font-bold text-purple-600">
                {users.filter(user => user.role === 'staff').length}
              </p>
            </div>
            <Clipboard className="text-purple-500" size={40} />
          </div>
        </div>
      </div>

      {/* Recent Orders and User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Recent Orders</h3>
            <TrendingUp className="text-blue-500" size={24} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3">Kode Barang</th>
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3">Jumlah</th>
                  <th className="p-3">Harga</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order, index) => (
                  <tr key={`order-${order.order_id || index}`} className="border-b hover:bg-gray-50">
                    <td className="p-3">{order.kdbar}</td>
                    <td className="p-3">{order.Product?.nmbar || '-'}</td>
                    <td className="p-3">{order.jumlah}</td>
                    <td className="p-3">Rp {Number(order.harga).toLocaleString()}</td>
                    <td className="p-3">{order.tipe_order}</td>
                    <td className="p-3">{new Date(order.tgl_order).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Management */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Staff Management</h3>
            <div className="flex items-center space-x-2">
              {role === 'admin' && (
                <CrudButton
                  icon={FilePlus}
                  label="Add Staff"
                  onClick={openAddModal}
                  buttonStyle="secondary"
                  className="p-2 rounded-md"
                />
              )}
              <Users className="text-green-500" size={24} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  {role === 'admin' && <th className="p-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(user => user.role === 'staff')
                  .map((user, index) => (
                    <tr key={`staff-${user.user_id || index}`} className="border-b hover:bg-gray-50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      {role === 'admin' && (
                        <td className="p-3">
                          <div className="flex space-x-2">
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
                              onConfirm={() => deleteUser(user.user_id)}
                              confirmMessage="Apakah Anda yakin ingin menghapus Staff ini?"
                              title="Hapus Staff"
                              actionType="delete"
                              buttonStyle="danger"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'add' ? handleAddUser : handleEditUser}
        user={selectedUser}
        title={modalMode === 'add' ? 'Add Staff' : 'Edit Staff'}
        mode={modalMode}
      />

      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message={modalMessage}
      />

      <AlertModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default DashboardAdmin;
