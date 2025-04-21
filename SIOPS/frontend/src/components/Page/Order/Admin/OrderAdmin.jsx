import React, { useState, useEffect, useCallback } from "react";
import Select from 'react-select';
import { Trash2, Eye, Check, X, AlertTriangle, Filter, Edit, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../service/api";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
  { value: "received", label: "received" },
];

const OrderAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrderDetail, setEditingOrderDetail] = useState(null);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [filters, setFilters] = useState({
    user: "",
    order_status: "",
    created_at: "",
  });

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/orders", { params: filters });
      setOrders(response.data);
    } catch (error) {
      showAlert(
        "error",
        "Failed to fetch orders",
        error.response?.data?.msg || "Network error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/details`);
      return response.data.result || [];
    } catch (error) {
      console.error("Error fetching order details:", error);
      showAlert(
        "error",
        "Failed to fetch order details",
        error.response?.data?.msg || "Network error"
      );
      return [];
    }
  };

  // Fetch available batches for a product
  const fetchAvailableBatches = async (code_product) => {
    try {
      const response = await api.get(`/orders/${code_product}/batches`);
      setAvailableBatches(response.data);
    } catch (error) {
      showAlert(
        "error",
        "Failed to fetch available batches",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Find the order to check its current status
      const orderToUpdate = orders.find(order => order.order_id === orderId);
      
      if (orderToUpdate && orderToUpdate.order_status !== "pending") {
        showAlert("error", "Status update failed", "Only orders with 'Pending' status can be updated");
        return;
      }
      
      await api.patch(`/orders/${orderId}/status`, { order_status: newStatus });
      showAlert("success", "Status updated", "Order status updated successfully");
      fetchOrders();
    } catch (error) {
      showAlert("error", "Failed to update status", error.response?.data?.msg || "Network error");
    }
  };

  const handleDelete = async () => {
    try {
      // Find the order to check its status
      const orderToDelete = orders.find(order => order.order_id === deleteOrderId);
      
      if (orderToDelete && orderToDelete.order_status !== "pending") {
        showAlert("error", "Delete failed", "Only orders with 'Pending' status can be deleted");
        setShowDeleteModal(false);
        return;
      }
      
      await api.delete(`/orders/${deleteOrderId}`);
      showAlert("success", "Order deleted", "Order deleted successfully");
      setShowDeleteModal(false);
      fetchOrders();
    } catch (error) {
      showAlert("error", "Failed to delete order", error.response?.data?.msg || "Network error");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusFilterChange = (option) => {
    setFilters((prev) => ({ ...prev, order_status: option ? option.value : "" }));
  };

  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    const details = await fetchOrderDetails(order.order_id);
    setOrderDetails(details);
    setShowOrderDetail(true);
  };

  const startEditOrderItem = async (orderDetail) => {
    // Only allow editing if the order status is pending
    if (selectedOrder.order_status !== "pending") {
      showAlert("error", "Edit failed", "Only orders with 'Pending' status can be edited");
      return;
    }
    
    setEditingOrderDetail({
      ...orderDetail,
      quantity: orderDetail.stock_quantity
    });
    
    // Fetch available batches for this product
    if (orderDetail.product_id) {
      await fetchAvailableBatches(orderDetail.product_id);
    }
    
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingOrderDetail(prev => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 0 : value
    }));
  };

  const handleBatchChange = (batchId) => {
    // Find the selected batch to get its price
    const selectedBatch = availableBatches.find(batch => batch.batch_id === parseInt(batchId));
    
    if (selectedBatch) {
      setEditingOrderDetail(prev => ({
        ...prev,
        batch_id: selectedBatch.batch_id,
        batch_code: selectedBatch.batch_code,
        ordered_price: selectedBatch.price
      }));
    }
  };

  const saveOrderItemChanges = async () => {
    try {
      // Calculate the new subtotal
      const subtotal = editingOrderDetail.quantity * editingOrderDetail.ordered_price;
      
      await api.put(`/orders/${selectedOrder.order_id}/details/${editingOrderDetail.order_detail_id}`, {
        batch_id: editingOrderDetail.batch_id,
        quantity: editingOrderDetail.quantity,
        ordered_price: editingOrderDetail.ordered_price,
        subtotal: subtotal
      });
      
      showAlert("success", "Item updated", "Order item updated successfully");
      setShowEditModal(false);
      
      // Refresh order details
      const updatedDetails = await fetchOrderDetails(selectedOrder.order_id);
      setOrderDetails(updatedDetails);
      
      // Refresh orders list to update totals
      fetchOrders();
    } catch (error) {
      showAlert(
        "error",
        "Failed to update item",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  // Format price to include Rp symbol and thousands separator
  const formatPrice = (price) => {
    if (!price) return "Rp 0";
    return `Rp ${Number(price).toLocaleString('id-ID')}`;
  };

  // Check if an order can be modified (status is pending)
  const canModifyOrder = (order) => {
    return order.order_status === "pending";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto my-20">
      <h2 className="text-2xl font-bold mb-6">Order Management</h2>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="relative w-48">
            <Select
              options={statusOptions}
              placeholder="Status"
              value={statusOptions.find(opt => opt.value === filters.order_status) || null}
              onChange={(option) => handleStatusFilterChange(option)}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '0.375rem',
                  borderColor: '#D1D5DB',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#9CA3AF',
                  }
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '0.375rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? '#EEF2FF' : null,
                  color: state.isSelected ? 'white' : '#374151',
                  '&:active': {
                    backgroundColor: '#4F46E5',
                  }
                })
              }}
            />
          </div>
        </div>
        
        <button 
          onClick={() => setFilterMenuOpen(!filterMenuOpen)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter size={16} className="mr-2" />
          More Filters
          <ChevronDown size={16} className="ml-2" />
        </button> 
      </div>
      
      <AnimatePresence>
        {filterMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-4 rounded-lg mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  name="user"
                  placeholder="Search by user ID"
                  value={filters.user}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="created_at"
                  value={filters.created_at}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={fetchOrders} 
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.user?.name || order.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${order.order_status === "approved" ? "bg-green-100 text-green-800" : 
                      order.order_status === "cancelled" ? "bg-red-100 text-red-800" :
                      order.order_status === "received" ? "bg-blue-100 text-blue-800" : 
                      "bg-yellow-100 text-yellow-800"}`}
                    >
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="inline-flex items-center px-2.5 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                      >
                        <Eye size={14} className="mr-1" /> View
                      </button>
                      
                      {canModifyOrder(order) && (
                        <>
                          <button
                            onClick={() => handleStatusChange(order.order_id, "approved")}
                            className="inline-flex items-center px-2.5 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            <Check size={14} className="mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.order_id, "cancelled")}
                            className="inline-flex items-center px-2.5 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            <X size={14} className="mr-1" /> Cancel
                          </button>
                          <button 
                            onClick={() => { setDeleteOrderId(order.order_id); setShowDeleteModal(true); }}
                            className="inline-flex items-center px-2.5 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Alert Toast */}
      <AnimatePresence>
        {alert && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 flex items-center p-4 rounded-lg shadow-lg ${
              alert.type === "success" ? "bg-green-50 text-green-800 border-l-4 border-green-500" : 
              alert.type === "error" ? "bg-red-50 text-red-800 border-l-4 border-red-500" : 
              "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
            }`}
          >
            <AlertTriangle size={20} className="mr-2" /> 
            <div>
              <p className="font-medium">{alert.title}</p>
              <p className="text-sm">{alert.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-sm w-full"
            >
              <h4 className="text-lg font-medium mb-4">Are you sure you want to delete this order?</h4>
              <p className="text-gray-500 mb-6">This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showOrderDetail && selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-bold">Order Details</h4>
                <button 
                  onClick={() => setShowOrderDetail(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Order ID</h5>
                  <p className="text-gray-900">{selectedOrder.order_id}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Date</h5>
                  <p className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">User</h5>
                  <p className="text-gray-900">{selectedOrder.user?.name || selectedOrder.user_id}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Status</h5>
                  <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${selectedOrder.order_status === "approved" ? "bg-green-100 text-green-800" : 
                    selectedOrder.order_status === "cancelled" ? "bg-red-100 text-red-800" :
                    selectedOrder.order_status === "received" ? "bg-blue-100 text-blue-800" : 
                    "bg-yellow-100 text-yellow-800"}`}
                  >
                    {selectedOrder.order_status.charAt(0).toUpperCase() + selectedOrder.order_status.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h5 className="text-lg font-medium mb-4">Order Items</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                        {canModifyOrder(selectedOrder) && (
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.order_details && selectedOrder.order_details.length > 0 ? (
                        selectedOrder.order_details.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.code_product}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.batch_code}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.stock_quantity}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatPrice(item.ordered_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatPrice(item.subtotal)}
                            </td>
                            {canModifyOrder(selectedOrder) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  onClick={() => startEditOrderItem(item)}
                                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <Edit size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : orderDetails && orderDetails.length > 0 ? (
                        orderDetails.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.code_product}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.batch_code}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.stock_quantity}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatPrice(item.ordered_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatPrice(item.subtotal)}
                            </td>
                            {canModifyOrder(selectedOrder) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  onClick={() => startEditOrderItem(item)}
                                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <Edit size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={canModifyOrder(selectedOrder) ? 7 : 6} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                            No items data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
{/* Edit Order Item Modal */}
<AnimatePresence>
        {showEditModal && editingOrderDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-lg w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-bold">Edit Order Item</h4>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <input
                    type="text"
                    value={editingOrderDetail.product_name}
                    disabled
                    className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch
                  </label>
                  <select
                    name="batch_id"
                    value={editingOrderDetail.batch_id || ""}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select batch</option>
                    {availableBatches.map((batch) => (
                      <option key={batch.batch_id} value={batch.batch_id}>
                        {batch.batch_code} - {formatPrice(batch.price)} (Stock: {batch.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="text"
                    name="ordered_price"
                    value={editingOrderDetail.ordered_price || ""}
                    onChange={handleEditChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={editingOrderDetail.quantity || ""}
                    onChange={handleEditChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtotal
                  </label>
                  <input
                    type="text"
                    value={formatPrice(
                      (editingOrderDetail.quantity || 0) * (editingOrderDetail.ordered_price || 0)
                    )}
                    disabled
                    className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveOrderItemChanges}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderAdmin;