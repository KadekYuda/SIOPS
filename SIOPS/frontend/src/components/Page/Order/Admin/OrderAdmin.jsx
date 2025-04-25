import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import { Trash2, Eye, Check, X, AlertTriangle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../service/api";
import OrderDetails from "../OrderDetails";

const statusOptions = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
  { value: "received", label: "Received" },
];

const OrderAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [orderForm, setOrderForm] = useState({
    user_id: "",
    order_status: "pending",
    order_details: [
      {
        code_product: "",
        stock_quantity: "",
        ordered_price: "",
        subtotal: "",
      },
    ],
  });

  // Add user role check
  const checkUserRole = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      const userRole = response.data.user?.role;
      setIsAdmin(userRole === "admin");

      if (userRole !== "admin") {
        showAlert(
          "error",
          "Access Denied",
          "You do not have permission to access this page"
        );
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

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
      if (!isAdmin) {
        showAlert(
          "error",
          "Access Denied",
          "Only administrators can update order status"
        );
        return;
      }

      const orderToUpdate = orders.find((order) => order.order_id === orderId);

      if (orderToUpdate && orderToUpdate.order_status !== "pending") {
        showAlert(
          "error",
          "Status update failed",
          "Only orders with 'Pending' status can be updated"
        );
        return;
      }

      await api.patch(`/orders/${orderId}/status`, { order_status: newStatus });
      showAlert(
        "success",
        "Status updated",
        "Order status updated successfully"
      );
      fetchOrders();
    } catch (error) {
      showAlert(
        "error",
        "Failed to update status",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  // Add handleReceive function
  const handleReceive = async (orderId) => {
    try {
      if (!isAdmin) {
        showAlert(
          "error",
          "Access Denied",
          "Only administrators can mark orders as received"
        );
        return;
      }

      const orderToUpdate = orders.find((order) => order.order_id === orderId);

      if (!orderToUpdate || orderToUpdate.order_status !== "approved") {
        showAlert(
          "error",
          "Status update failed",
          "Only approved orders can be marked as received"
        );
        return;
      }

      await api.patch(`/orders/${orderId}/status`, {
        order_status: "received",
      });
      showAlert(
        "success",
        "Order Received",
        "Order has been marked as received and stock has been updated"
      );
      fetchOrders();
      setShowOrderDetail(false);
    } catch (error) {
      showAlert(
        "error",
        "Failed to update status",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  const handleDelete = async () => {
    try {
      // Find the order to check its status
      const orderToDelete = orders.find(
        (order) => order.order_id === deleteOrderId
      );

      if (orderToDelete && orderToDelete.order_status !== "pending") {
        showAlert(
          "error",
          "Delete failed",
          "Only orders with 'Pending' status can be deleted"
        );
        setShowDeleteModal(false);
        return;
      }

      await api.delete(`/orders/${deleteOrderId}`);
      showAlert("success", "Order deleted", "Order deleted successfully");
      setShowDeleteModal(false);
      fetchOrders();
    } catch (error) {
      showAlert(
        "error",
        "Failed to delete order",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusFilterChange = (option) => {
    setFilters((prev) => ({
      ...prev,
      order_status: option ? option.value : "",
    }));
  };

  // Fetch orders when filters change
  useEffect(() => {
    fetchOrders();
  }, [filters, fetchOrders]);

  const applyDateFilter = (date) => {
    setFilters((prev) => ({
      ...prev,
      created_at: date,
    }));
  };

  // Modify viewOrderDetails to include order details
  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    const details = await fetchOrderDetails(order.order_id);
    setOrderDetails(details);
    setShowOrderDetail(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingOrderDetail((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 0 : value,
    }));
  };

  const handleBatchChange = (batchId) => {
    // Find the selected batch to get its price
    const selectedBatch = availableBatches.find(
      (batch) => batch.batch_id === parseInt(batchId)
    );

    if (selectedBatch) {
      setEditingOrderDetail((prev) => ({
        ...prev,
        batch_id: selectedBatch.batch_id,
        batch_code: selectedBatch.batch_code,
        ordered_price: selectedBatch.price,
      }));
    }
  };

  const saveOrderItemChanges = async () => {
    try {
      // Calculate the new subtotal
      const subtotal =
        editingOrderDetail.quantity * editingOrderDetail.ordered_price;

      await api.put(
        `/orders/${selectedOrder.order_id}/details/${editingOrderDetail.order_detail_id}`,
        {
          batch_id: editingOrderDetail.batch_id,
          quantity: editingOrderDetail.quantity,
          ordered_price: editingOrderDetail.ordered_price,
          subtotal: subtotal,
        }
      );

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
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  // Check if an order can be modified (status is pending)
  const canModifyOrder = (order) => {
    return order.order_status === "pending";
  };

  const getStatusClassName = (status) => {
    if (status === "received") return "bg-green-100 text-green-800";
    if (status === "approved") return "bg-blue-100 text-blue-700";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getAlertClassName = (type) => {
    if (type === "success")
      return "bg-green-50 text-green-800 border-l-4 border-green-500";
    if (type === "error")
      return "bg-red-50 text-red-800 border-l-4 border-red-500";
    return "bg-blue-50 text-blue-800 border-l-4 border-blue-500";
  };

  const getSelectOptionStyle = (state) => {
    let bgColor = null;
    if (state.isSelected) bgColor = "#4F46E5";
    else if (state.isFocused) bgColor = "#EEF2FF";

    return {
      backgroundColor: bgColor,
      color: state.isSelected ? "white" : "#374151",
      "&:active": {
        backgroundColor: "#4F46E5",
      },
    };
  };

  // Add handleEditClick function
  const handleEditClick = async (orderDetail) => {
    await fetchAvailableBatches(orderDetail.code_product);
    setEditingOrderDetail(orderDetail);
    setShowEditModal(true);
  };

  // Fetch products for create order
  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.result);
    } catch (error) {
      showAlert(
        "error",
        "Failed to fetch products",
        error.response?.data?.msg || "Network error"
      );
    }
  }, []);

  // Add order detail for create order
  const addOrderDetail = () => {
    setOrderForm((prev) => ({
      ...prev,
      order_details: [
        ...prev.order_details,
        {
          code_product: "",
          stock_quantity: "",
          ordered_price: "",
          subtotal: "",
        },
      ],
    }));
  };

  // Remove order detail for create order
  const removeOrderDetail = (index) => {
    setOrderForm((prev) => ({
      ...prev,
      order_details: prev.order_details.filter((_, i) => i !== index),
    }));
  };

  // Handle order detail change for create order
  const handleDetailChange = (index, field, value) => {
    setOrderForm((prev) => {
      const newDetails = [...prev.order_details];
      newDetails[index] = {
        ...newDetails[index],
        [field]: value,
      };
      if (field === "stock_quantity" || field === "ordered_price") {
        const quantity =
          field === "stock_quantity" ? value : newDetails[index].stock_quantity;
        const price =
          field === "ordered_price" ? value : newDetails[index].ordered_price;
        if (quantity && price) {
          newDetails[index].subtotal = (
            parseFloat(quantity) * parseFloat(price)
          ).toString();
        }
      }
      return { ...prev, order_details: newDetails };
    });
  };

  // Handle product selection for create order
  const handleProductSelect = (index, selectedOption) => {
    const selectedProduct = products.find(
      (p) => p.code_product === selectedOption.value
    );

    handleDetailChange(index, "code_product", selectedOption.value);
    handleDetailChange(
      index,
      "ordered_price",
      selectedProduct?.sell_price || ""
    );
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const isValid = orderForm.order_details.every(
        (detail) =>
          detail.code_product && detail.stock_quantity && detail.ordered_price
      );

      if (!isValid) {
        showAlert("error", "Error", "Please fill all required fields");
        return;
      }

      const response = await api.get("/users/profile");
      const newOrderForm = {
        ...orderForm,
        user_id: response.data.user?.user_id,
        order_status: "pending",
        order_details: orderForm.order_details.map((detail) => ({
          code_product: detail.code_product,
          stock_quantity: detail.stock_quantity,
          ordered_price: detail.ordered_price,
          subtotal: detail.subtotal,
        })),
      };

      await api.post("/orders", newOrderForm);
      showAlert("success", "Success", "Order created successfully");
      setShowCreateOrderModal(false);
      setOrderForm({
        order_status: "pending",
        order_details: [
          {
            code_product: "",
            stock_quantity: "",
            ordered_price: "",
            subtotal: "",
          },
        ],
      });
      fetchOrders();
    } catch (error) {
      showAlert(
        "error",
        "Failed to create order",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  // Calculate total for current order
  const calculateTotal = () => {
    return formatPrice(
      orderForm.order_details
        .reduce((total, detail) => {
          return total + (parseFloat(detail.subtotal) || 0);
        }, 0)
        .toFixed(0)
    );
  };

  return (
    <>
      {!isAdmin ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto my-20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Order Management</h2>
            <button
              onClick={() => {
                fetchProducts();
                setShowCreateOrderModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Plus size={20} className="mr-2" /> Create New Order
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex space-x-4 mb-4 md:mb-0">
              <div>
                <label
                  htmlFor="status-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <div className="relative w-48">
                  <Select
                    id="status-filter"
                    options={statusOptions}
                    placeholder="Status"
                    value={
                      statusOptions.find(
                        (opt) => opt.value === filters.order_status
                      ) || null
                    }
                    onChange={handleStatusFilterChange}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="date-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date
                </label>
                <input
                  id="date-filter"
                  type="date"
                  name="created_at"
                  value={filters.created_at}
                  onChange={handleFilterChange}
                  className="w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Order ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500"
                    >
                      <div className="flex justify-center items-center">
                        <svg
                          className="animate-spin h-5 w-5 text-indigo-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="ml-2">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
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
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(
                            order.order_status
                          )}`}
                        >
                          {order.order_status.charAt(0).toUpperCase() +
                            order.order_status.slice(1)}
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
                                onClick={() =>
                                  handleStatusChange(order.order_id, "approved")
                                }
                                className="inline-flex items-center px-2.5 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                <Check size={14} className="mr-1" /> Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    order.order_id,
                                    "cancelled"
                                  )
                                }
                                className="inline-flex items-center px-2.5 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                <X size={14} className="mr-1" /> Cancel
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteOrderId(order.order_id);
                                  setShowDeleteModal(true);
                                }}
                                className="inline-flex items-center px-2.5 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}

                          {order.order_status === "approved" && (
                            <button
                              onClick={() => handleReceive(order.order_id)}
                              className="inline-flex items-center px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              <Check size={14} className="mr-1" /> Receive
                            </button>
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
                className={`fixed top-4 right-4 flex items-center p-4 rounded-lg shadow-lg ${getAlertClassName(
                  alert.type
                )}`}
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
                  <h4 className="text-lg font-medium mb-4">
                    Are you sure you want to delete this order?
                  </h4>
                  <p className="text-gray-500 mb-6">
                    This action cannot be undone.
                  </p>
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
                <OrderDetails
                  selectedOrder={selectedOrder}
                  orderDetails={orderDetails}
                  setShowOrderDetail={setShowOrderDetail}
                  formatPrice={formatPrice}
                  isAdmin={isAdmin}
                  onReceive={() => handleReceive(selectedOrder.order_id)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ...rest of the existing JSX... */}
        </div>
      )}

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
                  <label
                    htmlFor="edit-product"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Product
                  </label>
                  <input
                    id="edit-product"
                    type="text"
                    value={editingOrderDetail?.product_name || ""}
                    disabled
                    className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-batch"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Batch
                  </label>
                  <select
                    id="edit-batch"
                    name="batch_id"
                    value={editingOrderDetail?.batch_id || ""}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select batch</option>
                    {availableBatches.map((batch) => (
                      <option key={batch.batch_id} value={batch.batch_id}>
                        {batch.batch_code} - {formatPrice(batch.price)} (Stock:{" "}
                        {batch.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Price
                  </label>
                  <input
                    id="edit-price"
                    type="text"
                    name="ordered_price"
                    value={editingOrderDetail?.ordered_price || ""}
                    onChange={handleEditChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quantity
                  </label>
                  <input
                    id="edit-quantity"
                    type="number"
                    name="quantity"
                    min="1"
                    value={editingOrderDetail?.quantity || ""}
                    onChange={handleEditChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-subtotal"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subtotal
                  </label>
                  <input
                    id="edit-subtotal"
                    type="text"
                    value={formatPrice(
                      (editingOrderDetail?.quantity || 0) *
                        (editingOrderDetail?.ordered_price || 0)
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

      {/* Create Order Modal */}
      <AnimatePresence>
        {showCreateOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Create New Order</h3>
                <button
                  onClick={() => setShowCreateOrderModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-6">
                {orderForm.order_details.map((detail, index) => (
                  <div
                    key={`order-detail-${
                      detail.code_product || Date.now()
                    }-${index}`}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-lg">
                        Item #{index + 1}
                      </h4>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeOrderDetail(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`product-${index}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Product
                        </label>
                        <Select
                          id={`product-${index}`}
                          options={products.map((product) => ({
                            value: product.code_product,
                            label: `${product.name_product} (${product.code_product})`,
                          }))}
                          value={
                            detail.code_product
                              ? {
                                  value: detail.code_product,
                                  label: `${
                                    products.find(
                                      (p) =>
                                        p.code_product === detail.code_product
                                    )?.name_product
                                  } (${detail.code_product})`,
                                }
                              : null
                          }
                          onChange={(option) =>
                            handleProductSelect(index, option)
                          }
                          placeholder="Select Product"
                          className="basic-select"
                          classNamePrefix="select"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`quantity-${index}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Quantity
                        </label>
                        <input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={detail.stock_quantity}
                          onChange={(e) =>
                            handleDetailChange(
                              index,
                              "stock_quantity",
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Enter quantity"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`price-${index}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Price per Unit
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">
                            Rp
                          </span>
                          <input
                            id={`price-${index}`}
                            type="text"
                            value={
                              detail.ordered_price
                                ? Number(detail.ordered_price).toLocaleString(
                                    "id-ID"
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^\d]/g,
                                ""
                              );
                              handleDetailChange(index, "ordered_price", value);
                            }}
                            className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Enter price"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`subtotal-${index}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Subtotal
                        </label>
                        <input
                          id={`subtotal-${index}`}
                          type="text"
                          value={formatPrice(detail.subtotal || 0)}
                          disabled
                          className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addOrderDetail}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus size={16} className="inline-block mr-2" />
                  Add Another Item
                </button>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-indigo-600">{calculateTotal()}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateOrderModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Order
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OrderAdmin;
