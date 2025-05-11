import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import {
  Trash2,
  Eye,
  Check,
  X,
  AlertTriangle,
  Plus,
  Package,
  Filter,
  ShoppingCart,
  Clock,
  Calendar,
  RefreshCw,
  DollarSign,
  Tag,
  Inbox,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../service/api";
import OrderDetails from "../OrderDetails";

const statusOptions = [
  { value: "", label: "All Statuses" },
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
    start_date: "",
    end_date: "",
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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [showExpDateModal, setShowExpDateModal] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [expDateInputs, setExpDateInputs] = useState({});

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

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.order_status)
        queryParams.append("order_status", filters.order_status);
      if (filters.start_date)
        queryParams.append("start_date", filters.start_date);
      if (filters.end_date) queryParams.append("end_date", filters.end_date);

      const response = await api.get(`/orders?${queryParams.toString()}`);
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

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/details`);
      return response.data.result || [];
    } catch (error) {
      showAlert(
        "error",
        "Failed to fetch order details",
        error.response?.data?.msg || "Network error"
      );
      return [];
    }
  };

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
    setTimeout(() => setAlert(null), 5000);
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

      const order = orders.find((order) => order.order_id === orderId);
      if (!order) {
        showAlert("error", "Error", "Order not found");
        return;
      }

      if (order.order_status !== "pending" && newStatus !== "received") {
        showAlert(
          "error",
          "Status update failed",
          "Only pending orders can be updated, except for receiving approved orders"
        );
        return;
      }

      if (newStatus === "received" && order.order_status !== "approved") {
        showAlert(
          "error",
          "Status update failed",
          "Only approved orders can be marked as received"
        );
        return;
      }

      const expiration_dates = {};

      if (newStatus === "received") {
        // Get order details for this order
        const orderDetails = await fetchOrderDetails(orderId);

        // For each product in the order, ask about expiration date
        for (const detail of orderDetails) {
          const hasExpDate = window.confirm(
            `Does the product "${detail.product_name}" have an expiration date?`
          );

          if (hasExpDate) {
            const expDateInput = document.createElement("input");
            expDateInput.type = "date";
            expDateInput.style.display = "none";
            document.body.appendChild(expDateInput);

            const expDate = await new Promise((resolve) => {
              expDateInput.addEventListener("change", (e) => {
                document.body.removeChild(expDateInput);
                resolve(e.target.value);
              });

              expDateInput.addEventListener("cancel", () => {
                document.body.removeChild(expDateInput);
                resolve(null);
              });

              expDateInput.click();
            });

            if (expDate) {
              expiration_dates[detail.order_detail_id] = expDate;
            }
          }
        }
      }

      await api.patch(`/orders/${orderId}/status`, {
        order_status: newStatus,
        expiration_dates,
      });

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

  const handleReceive = async (orderId) => {
    try {
      if (!isAdmin) {
        showAlert("error", "Access Denied", "Only admin can receive orders");
        return;
      }

      const orderToUpdate = orders.find((order) => order.order_id === orderId);
      if (!orderToUpdate || orderToUpdate.order_status !== "approved") {
        showAlert(
          "error",
          "Invalid Operation",
          "Only approved orders can be received"
        );
        return;
      }

      // First mark as received
      await api.patch(`/orders/${orderId}/status`, {
        order_status: "received",
      });

      // Then get order details and show exp date modal
      const orderDetailsResponse = await api.get(`/orders/${orderId}/details`);
      const orderDetails = orderDetailsResponse.data.result;
      setProcessingOrderId(orderId);

      // Initialize exp date inputs state
      const initialExpDateInputs = {};
      orderDetails.forEach((detail) => {
        initialExpDateInputs[detail.order_detail_id] = {
          hasExpDate: false,
          expDate: "",
        };
      });
      setExpDateInputs(initialExpDateInputs);

      setOrderDetails(orderDetails);
      setShowExpDateModal(true);
    } catch (error) {
      showAlert(
        "error",
        "Failed to update status",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  const handleExpDateSubmit = async () => {
    try {
      const expiration_dates = {};
      Object.entries(expDateInputs).forEach(([detailId, input]) => {
        if (input.hasExpDate && input.expDate) {
          expiration_dates[detailId] = input.expDate;
        }
      });

      // Create batches with expiration dates
      await api.post(`/orders/${processingOrderId}/create-batches`, {
        expiration_dates,
      });

      showAlert(
        "success",
        "Order Processed",
        "Order has been received and batches created successfully"
      );
      setShowExpDateModal(false);
      setProcessingOrderId(null);
      setExpDateInputs({});
      fetchOrders();
    } catch (error) {
      showAlert(
        "error",
        "Failed to create batches",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  const handleDelete = async () => {
    try {
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

  const handleFilterChange = (field, option) => {
    setFilters((prev) => ({
      ...prev,
      [field]: option ? option.value : "",
    }));
  };

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
      const updatedDetails = await fetchOrderDetails(selectedOrder.order_id);
      setOrderDetails(updatedDetails);
      fetchOrders();
    } catch (error) {
      showAlert(
        "error",
        "Failed to update item",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  const formatPrice = (price) => {
    if (!price) return "Rp 0";
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  const canModifyOrder = (order) => {
    return order.order_status === "pending";
  };

  const getStatusClassName = (status) => {
    if (status === "received") return "bg-green-100 text-green-800";
    if (status === "approved") return "bg-blue-100 text-blue-700";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusIcon = (status) => {
    if (status === "received") return <Check size={14} />;
    if (status === "approved") return <Clock size={14} />;
    if (status === "cancelled") return <Trash2 size={14} />;
    return <RefreshCw size={14} />;
  };

  const handleEditClick = async (orderDetail) => {
    await fetchAvailableBatches(orderDetail.code_product);
    setEditingOrderDetail(orderDetail);
    setShowEditModal(true);
  };

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

  const removeOrderDetail = (index) => {
    setOrderForm((prev) => ({
      ...prev,
      order_details: prev.order_details.filter((_, i) => i !== index),
    }));
  };

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

  const handleProductSelect = (index, selectedOption) => {
    if (!selectedOption) {
      // Handle clearing the selection
      handleDetailChange(index, "code_product", "");
      handleDetailChange(index, "ordered_price", "");
      return;
    }
    const selectedProduct = products.find(
      (p) => p.code_product === selectedOption.value
    );

    // Fetch batch information to get purchase_price
    api
      .get(`/orders/${selectedOption.value}/batches`)
      .then((response) => {
        const batches = response.data;
        handleDetailChange(index, "code_product", selectedOption.value);
        // Use purchase_price from the first batch if available
        if (batches && batches.length > 0) {
          handleDetailChange(index, "ordered_price", batches[0].purchase_price);
        }
      })
      .catch((error) => {
        console.error("Error fetching batch data:", error);
        showAlert(
          "error",
          "Failed to fetch batch data",
          error.response?.data?.msg || "Network error"
        );
      });
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

  const calculateTotal = () => {
    return formatPrice(
      orderForm.order_details
        .reduce(
          (total, detail) => total + (parseFloat(detail.subtotal) || 0),
          0
        )
        .toFixed(0)
    );
  };

  useEffect(() => {
    const restockProduct = sessionStorage.getItem("restockProduct");
    const shouldOpenCreateOrder = sessionStorage.getItem("openCreateOrder");
    if (restockProduct && shouldOpenCreateOrder === "true") {
      const product = JSON.parse(restockProduct);
      sessionStorage.removeItem("restockProduct");
      sessionStorage.removeItem("openCreateOrder");
      setOrderForm((prev) => ({
        ...prev,
        order_details: [
          {
            code_product: product.code_product,
            name_product: product.name_product,
            stock_quantity: "",
            ordered_price: product.sell_price,
            subtotal: "",
          },
        ],
      }));
      setShowCreateOrderModal(true);
      fetchProducts();
    }
  }, [fetchProducts]);

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : !isAdmin ? (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="mb-4 text-red-500">
              <AlertTriangle size={48} className="mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              You do not have permission to access this page.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 min-h-screen py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center pt-10 pb-2">
              <div className="flex items-center space-x-4">
                <ShoppingCart />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Admin Order Management
                </h1>
              </div>
              <button
                onClick={() => {
                  fetchProducts();
                  setShowCreateOrderModal(true);
                }}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus size={18} className="mr-2" /> Create New Order
              </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full">
                <div className="bg-white rounded-xl shadow-md border border-gray-100">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Inbox className="text-white mr-3" size={24} />
                        <h2 className="text-xl font-bold text-white">
                          Orders List
                        </h2>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                          className="flex items-center text-xs font-medium bg-white/20 text-white px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                        >
                          <Filter size={14} className="mr-1.5" /> Filter
                        </button>
                        {filterMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl p-4 z-10 border border-gray-200"
                          >
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                              <Tag size={14} className="mr-2" /> Filter by
                              Status
                            </h4>
                            <Select
                              value={
                                filters.order_status
                                  ? statusOptions.find(
                                      (option) =>
                                        option.value === filters.order_status
                                    )
                                  : null
                              }
                              onChange={(option) =>
                                handleFilterChange("order_status", option)
                              }
                              options={statusOptions}
                              className="mb-4"
                              placeholder="Select status"
                              isClearable
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderRadius: "0.5rem",
                                  borderColor: "#e5e7eb",
                                  boxShadow: "none",
                                  "&:hover": { borderColor: "#4f46e5" },
                                  padding: "1px",
                                }),
                              }}
                            />
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                              <Calendar size={14} className="mr-2" /> Filter by
                              Date Range
                            </h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={filters.start_date}
                                  onChange={(e) =>
                                    handleFilterChange("start_date", {
                                      value: e.target.value,
                                    })
                                  }
                                  className="p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={filters.end_date}
                                  onChange={(e) =>
                                    handleFilterChange("end_date", {
                                      value: e.target.value,
                                    })
                                  }
                                  className="p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                              <button
                                className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                                onClick={() => {
                                  setFilters({
                                    order_status: "",
                                    start_date: "",
                                    end_date: "",
                                  });
                                  setFilterMenuOpen(false);
                                }}
                              >
                                Reset
                              </button>
                              <button
                                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                                onClick={() => setFilterMenuOpen(false)}
                              >
                                Apply
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div
                            key={order.order_id}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-4">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3">
                                <div className="flex items-center mb-2 md:mb-0">
                                  <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full px-2.5 py-1 mr-2">
                                    #{order.order_id}
                                  </span>
                                  <span className="text-sm text-gray-500 mr-2">
                                    {order.user?.name || order.user_id}
                                  </span>
                                  <span
                                    className={`flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusClassName(
                                      order.order_status
                                    )}`}
                                  >
                                    {getStatusIcon(order.order_status)}
                                    <span className="ml-1 capitalize">
                                      {order.order_status}
                                    </span>
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  {new Date(order.created_at).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-800">
                                  {formatPrice(order.total_amount)}
                                </span>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => viewOrderDetails(order)}
                                    className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                  >
                                    <Eye size={14} className="mr-1" /> View
                                  </button>
                                  {canModifyOrder(order) && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleStatusChange(
                                            order.order_id,
                                            "approved"
                                          )
                                        }
                                        className="flex items-center text-xs font-medium text-green-600 hover:text-green-800 transition-colors"
                                      >
                                        <Check size={14} className="mr-1" />{" "}
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleStatusChange(
                                            order.order_id,
                                            "cancelled"
                                          )
                                        }
                                        className="flex items-center text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                                      >
                                        <X size={14} className="mr-1" /> Cancel
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDeleteOrderId(order.order_id);
                                          setShowDeleteModal(true);
                                        }}
                                        className="flex items-center text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                                      >
                                        <Trash2 size={14} className="mr-1" />{" "}
                                        Delete
                                      </button>
                                    </>
                                  )}
                                  {order.order_status === "approved" && (
                                    <button
                                      onClick={() =>
                                        handleReceive(order.order_id)
                                      }
                                      className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <Check size={14} className="mr-1" />{" "}
                                      Receive
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingCart
                          size={48}
                          className="mx-auto text-gray-300 mb-4"
                        />
                        <h3 className="text-lg font-medium text-gray-500 mb-1">
                          No orders found
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {Object.values(filters).some((filter) => filter)
                            ? "Try changing your filters"
                            : "Create a new order to get started"}
                        </p>
                        {Object.values(filters).some((filter) => filter) && (
                          <button
                            onClick={() => {
                              setFilters({
                                order_status: "",
                                start_date: "",
                                end_date: "",
                              });
                            }}
                            className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center mx-auto"
                          >
                            <RefreshCw size={14} className="mr-1" /> Reset
                            Filters
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Toast */}
          <AnimatePresence>
            {alert && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`fixed top-4 right-4 z-50 w-96 max-w-full bg-white rounded-lg shadow-lg border ${
                  alert.type === "success"
                    ? "border-green-500"
                    : alert.type === "error"
                    ? "border-red-500"
                    : "border-yellow-500"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                        alert.type === "success"
                          ? "bg-green-100 text-green-600"
                          : alert.type === "error"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {alert.type === "success" ? (
                        <Check size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                    </div>
                    <div className="ml-3 w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {alert.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {alert.message}
                      </p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <button
                        onClick={() => setAlert(null)}
                        className="inline-flex bg-white rounded-md p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <span className="sr-only">Close</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
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
                  onEdit={handleEditClick}
                />
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
                            {batch.batch_code} - {formatPrice(batch.price)}{" "}
                            (Stock: {batch.stock_quantity})
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
                        className="p-4 border rounded-xl bg-white shadow-sm relative"
                      >
                        <div className="absolute -top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Item #{index + 1}
                        </div>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeOrderDetail(index)}
                            className="absolute -top-3 right-3 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <div className="mb-4 mt-4">
                          <label
                            htmlFor={`product-${index}`}
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Select Product
                          </label>
                          <Select
                            id={`product-${index}`}
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
                            options={products.map((product) => ({
                              value: product.code_product,
                              label: `${product.name_product} (${product.code_product})`,
                            }))}
                            placeholder="Search or select product..."
                            isClearable
                            className="text-sm"
                            classNames={{
                              control: (state) =>
                                `rounded-lg border ${
                                  state.isFocused
                                    ? "border-indigo-500 ring-2 ring-indigo-500"
                                    : "border-gray-300"
                                } hover:border-indigo-500 p-0.5`,
                              option: (state) =>
                                `${
                                  state.isSelected
                                    ? "bg-indigo-500 text-white"
                                    : state.isFocused
                                    ? "bg-indigo-50 text-gray-700"
                                    : "text-gray-700"
                                } cursor-pointer`,
                              menu: () =>
                                "rounded-lg border border-gray-200 shadow-lg",
                              menuList: () => "rounded-lg py-1",
                              input: () => "text-sm",
                              placeholder: () => "text-gray-500 text-sm",
                              singleValue: () => "text-gray-700 text-sm",
                            }}
                          />
                        </div>
                        {detail.code_product && (
                          <div className="flex items-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 mb-4">
                            <Package
                              size={14}
                              className="inline mr-2 flex-shrink-0"
                            />
                            <span>
                              A new batch will be created if no existing batch
                              matches the purchase price.
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label
                              htmlFor={`quantity-${index}`}
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Quantity
                            </label>
                            <div className="relative">
                              <input
                                id={`quantity-${index}`}
                                type="number"
                                value={detail.stock_quantity}
                                onChange={(e) =>
                                  handleDetailChange(
                                    index,
                                    "stock_quantity",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                min="1"
                                placeholder="Enter quantity"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                pcs
                              </span>
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor={`price-${index}`}
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Purchase Price
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                Rp
                              </span>
                              <input
                                id={`price-${index}`}
                                type="text"
                                value={
                                  detail.ordered_price
                                    ? Number(
                                        detail.ordered_price
                                      ).toLocaleString("id-ID")
                                    : ""
                                }
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /[^\d]/g,
                                    ""
                                  );
                                  handleDetailChange(
                                    index,
                                    "ordered_price",
                                    value
                                  );
                                }}
                                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                        {detail.subtotal && (
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">
                                Subtotal:
                              </span>
                              <span className="font-semibold text-indigo-700">
                                {formatPrice(detail.subtotal || 0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOrderDetail}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
                    >
                      <Plus size={18} className="mr-2" /> Add Another Product
                    </button>
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                        <DollarSign size={20} className="mr-2" /> Order Summary
                      </h3>
                      <div className="flex justify-between mb-3 text-sm">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-medium">
                          {orderForm.order_details.length}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t border-indigo-200 pt-3 mt-3">
                        <span className="text-gray-800">Total Amount:</span>
                        <span className="text-indigo-700">
                          {calculateTotal()}
                        </span>
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

          {/* Expiration Date Modal */}
          <AnimatePresence>
            {showExpDateModal && (
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
                  className="bg-white rounded-lg p-6 max-w-2xl w-full"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">
                      Set Product Expiration Dates
                    </h3>
                    <button
                      onClick={() => setShowExpDateModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {orderDetails.map((detail) => (
                      <div
                        key={detail.order_detail_id}
                        className="p-4 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{detail.product_name}</h4>
                          <span className="text-sm text-gray-500">
                            Quantity: {detail.quantity}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={
                                expDateInputs[detail.order_detail_id]
                                  ?.hasExpDate
                              }
                              onChange={(e) => {
                                setExpDateInputs((prev) => ({
                                  ...prev,
                                  [detail.order_detail_id]: {
                                    ...prev[detail.order_detail_id],
                                    hasExpDate: e.target.checked,
                                  },
                                }));
                              }}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                            <span className="text-sm text-gray-700">
                              Has expiration date
                            </span>
                          </label>

                          {expDateInputs[detail.order_detail_id]
                            ?.hasExpDate && (
                            <input
                              type="date"
                              value={
                                expDateInputs[detail.order_detail_id]
                                  ?.expDate || ""
                              }
                              onChange={(e) => {
                                setExpDateInputs((prev) => ({
                                  ...prev,
                                  [detail.order_detail_id]: {
                                    ...prev[detail.order_detail_id],
                                    expDate: e.target.value,
                                  },
                                }));
                              }}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowExpDateModal(false);
                        setProcessingOrderId(null);
                        setExpDateInputs({});
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExpDateSubmit}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Create Batches
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default OrderAdmin;
