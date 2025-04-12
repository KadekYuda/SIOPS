  import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {  
  Trash2, 
  Edit,
  Check,
  AlertTriangle,

  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const Order = () => {
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    kdbar: "",
    jumlah: "",
    harga: "",
    tipe_order: "Masuk", // Default to 'Masuk'
    tgl_order: new Date().toISOString().split('T')[0]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortConfig,] = useState({
    key: 'tgl_order',
    direction: 'desc'
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    kdbar: '',
    tipe_order: '',
    tgl_order: '',
    harga: '',
    jumlah: ''
  });

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showAlert('error', 'Failed to fetch orders', error.response?.data?.message || 'Network error');
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Create new order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/orders', {
        ...orderForm,
        jumlah: parseInt(orderForm.jumlah),
        harga: parseFloat(orderForm.harga)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showAlert('success', 'Success', 'Order created successfully');
      setOrderForm({
        kdbar: "",
        jumlah: "",
        harga: "",
        tipe_order: "Masuk",
        tgl_order: new Date().toISOString().split('T')[0]
      });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      showAlert('error', 'Failed to create order', error.response?.data?.message || 'Network error');
    }
  };

  // Update order
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/orders/${editingOrder.order_id}`, {
        ...orderForm,
        jumlah: parseInt(orderForm.jumlah),
        harga: parseFloat(orderForm.harga)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showAlert('success', 'Success', 'Order updated successfully');
      setIsEditing(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      showAlert('error', 'Failed to update order', error.response?.data?.message || 'Network error');
    }
  };

  // Delete order
  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/orders/${deleteOrderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showAlert('success', 'Success', 'Order deleted successfully');
      setShowDeleteModal(false);
      setDeleteOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      showAlert('error', 'Failed to delete order', error.response?.data?.message || 'Network error');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit button click
  const handleEditClick = (order) => {
    setEditingOrder(order);
    setOrderForm({
      kdbar: order.kdbar,
      jumlah: order.jumlah.toString(),
      harga: order.harga.toString(),
      tipe_order: order.tipe_order,
      tgl_order: new Date(order.tgl_order).toISOString().split('T')[0]
    });
    setIsEditing(true);
  };

  // Handle delete button click
  const handleDeleteClick = (orderId) => {
    setDeleteOrderId(orderId);
    setShowDeleteModal(true);
  };

  // Show alert message
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 500000000);
  };

  

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortConfig.key === 'tgl_order') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.tgl_order) - new Date(b.tgl_order)
        : new Date(b.tgl_order) - new Date(a.tgl_order);
    }
    return sortConfig.direction === 'asc'
      ? a[sortConfig.key] > b[sortConfig.key] ? 1 : -1
      : b[sortConfig.key] > a[sortConfig.key] ? 1 : -1;
  });

  // Filter orders
  const filteredOrders = sortedOrders.filter(order => {
    return Object.keys(filters).every(key => {
      if (!filters[key]) return true;
      const orderValue = order[key]?.toString().toLowerCase();
      return orderValue?.includes(filters[key].toLowerCase());
    });
  });

  return (
    <div className="p-4 pt-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Order Stock</h2>
        
        {/* Order Form */}
        <form onSubmit={isEditing ? handleUpdateOrder : handleCreateOrder} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Code</label>
              <input
                type="text"
                name="kdbar"
                value={orderForm.kdbar}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                name="jumlah"
                value={orderForm.jumlah}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                name="harga"
                value={orderForm.harga}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Order Type</label>
              <select
                name="tipe_order"
                value={orderForm.tipe_order}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="Masuk">Masuk</option>
                <option value="Keluar">Keluar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Order Date</label>
              <input
                type="date"
                name="tgl_order"
                value={orderForm.tgl_order}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {isEditing ? 'Update Order' : 'Create Order'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingOrder(null);
                  setOrderForm({
                    kdbar: "",
                    jumlah: "",
                    harga: "",
                    tipe_order: "Masuk",
                    tgl_order: new Date().toISOString().split('T')[0]
                  });
                }}
                className="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <button
          onClick={() => setFilterMenuOpen(!filterMenuOpen)}
          className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
        >
          <Filter size={20} />
          <span>Filters</span>
        </button>
        
        {filterMenuOpen && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded shadow">
            {Object.keys(filters).map(key => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={filters[key]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    [key]: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder={`Filter by ${key}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.order_id}>
                <td className="px-6 py-4 whitespace-nowrap">{order.kdbar}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.jumlah}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.harga}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.tipe_order}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(order.tgl_order).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEditClick(order)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(order.order_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this order?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
              alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            <div className="flex items-center space-x-2">
              {alert.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
              <div>
                <h4 className="font-bold">{alert.title}</h4>
                <p>{alert.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Order;
