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
  ShoppingBag,
  ClipboardList,
  ShoppingCart,
  Clock,
  Calendar,
  RefreshCw,
  DollarSign,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../service/api";
import CrudButton from "../../../Button/CrudButton.jsx";
import OrderDetails from "../OrderDetails";
import LoadingComponent from "../../../../components/LoadingComponent";
import Pagination from "../../Product/Pagination";
import SuccessModal from "../../../modal/SuccessModal";
import AlertModal from "../../../modal/AlertModal";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import OrderCharts from "./OrderCharts.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
  { value: "received", label: "Received" },
];

const OrderAdmin = () => {
  // State declarations
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    receivedOrders: 0,
    cancelledOrders: 0,
    totalValue: 0,
    monthlyStats: [],
  });

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [sortOption, setSortOption] = useState("id"); // 'id' or 'date'
  const [isAdmin, setIsAdmin] = useState(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [orderForm, setOrderForm] = useState({
    user_id: "",
    order_status: "pending",
    // Remove order_date - let backend use current timestamp
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
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [expandedBatchDetails, setExpandedBatchDetails] = useState({});

  // New state for status change modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [statusModalMessage, setStatusModalMessage] = useState("");

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      setOrderForm((prev) => ({
        ...prev,
        user_id: response.data.user?.user_id,
      }));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      showAlert(
        "error",
        "Failed to fetch user profile",
        error.response?.data?.msg || "Network error"
      );
    }
  }, []);

  const checkUserRole = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/profile");
      const userRole = response.data.user?.role;
      setIsAdmin(userRole === "admin");

      if (userRole === "staff") {
        showAlert(
          "error",
          "Access Denied",
          "You do not have permission to access this page"
        );
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    checkUserRole();
  }, [checkUserRole]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.order_status)
        queryParams.append("order_status", filters.order_status);
      if (filters.start_date)
        queryParams.append("start_date", filters.start_date);
      if (filters.end_date) queryParams.append("end_date", filters.end_date);

      console.log("Fetching orders with filters:", filters);
      const response = await api.get(`/orders?${queryParams.toString()}`);
      console.log("Received orders:", response.data.length);
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
    setStatusModalMessage(message);
    if (type === "success") {
      setShowSuccessModal(true);
    } else {
      setShowErrorModal(true);
    }
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

      // Special validation for different status changes
      if (newStatus === "approved" && order.order_status !== "pending") {
        showAlert(
          "error",
          "Status update failed",
          "Only pending orders can be approved"
        );
        return;
      }

      if (newStatus === "cancelled" && order.order_status !== "pending") {
        showAlert(
          "error",
          "Status update failed",
          "Only pending orders can be cancelled"
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

      // Check current order status
      const orderResponse = await api.get(`/orders/${orderId}`);
      const currentOrder = orderResponse.data;

      if (!currentOrder || currentOrder.order_status !== "approved") {
        showAlert(
          "error",
          "Invalid Operation",
          "Only approved orders can be received"
        );
        await fetchOrders();
        return;
      }

      // Get order details for expiry dates
      const detailsResponse = await api.get(`/orders/${orderId}/details`);
      const details = detailsResponse.data.result;

      // Initialize expiration date inputs
      const initialExpDateInputs = {};
      details.forEach((detail) => {
        initialExpDateInputs[detail.order_detail_id] = {
          hasExpDate: false,
          expDate: "",
          adjustQuantity: false,
          actualQuantity: detail.quantity,
          adjustPrice: false,
          actualPrice: detail.ordered_price,
        };
      });

      // Set up the expiry date modal
      setProcessingOrderId(orderId);
      setOrderDetails(details);
      setExpDateInputs(initialExpDateInputs);
      setShowExpDateModal(true);
    } catch (error) {
      showAlert(
        "error",
        "Failed to process order",
        error.response?.data?.msg || "Network error"
      );
      await fetchOrders();
    }
  };

  const handleExpDateSubmit = async () => {
    try {
      if (!processingOrderId) {
        setStatusModalMessage("No order is being processed");
        setShowErrorModal(true);
        return;
      }

      // Validate inputs
      const hasInvalidInputs = Object.entries(expDateInputs).some(
        ([detailId, input]) => {
          if (input.hasExpDate && !input.expDate) {
            setStatusModalMessage(
              "Please set expiration date for all checked products"
            );
            setShowErrorModal(true);
            return true;
          }
          if (
            input.adjustQuantity &&
            (!input.actualQuantity || input.actualQuantity <= 0)
          ) {
            setStatusModalMessage(
              "Please enter valid actual quantity for all checked products"
            );
            setShowErrorModal(true);
            return true;
          }
          if (
            input.adjustPrice &&
            (!input.actualPrice || input.actualPrice <= 0)
          ) {
            setStatusModalMessage(
              "Please enter valid actual price for all checked products"
            );
            setShowErrorModal(true);
            return true;
          }
          return false;
        }
      );

      if (hasInvalidInputs) {
        return;
      }

      // Check if order is still in approved status before proceeding
      const orderResponse = await api.get(`/orders/${processingOrderId}`);
      const currentOrder = orderResponse.data;

      if (!currentOrder || currentOrder.order_status !== "approved") {
        setStatusModalMessage(
          "Order must be in approved status to be received"
        );
        setShowErrorModal(true);
        setShowExpDateModal(false);
        setProcessingOrderId(null);
        setExpDateInputs({});
        await fetchOrders();
        return;
      }

      // Create batches with expiration dates and adjustments
      // This will also update the order status to received
      const expiration_dates = {};
      const quantity_adjustments = {};
      const price_adjustments = {};

      Object.entries(expDateInputs).forEach(([detailId, input]) => {
        if (input.hasExpDate && input.expDate) {
          expiration_dates[detailId] = input.expDate;
        }
        if (input.adjustQuantity) {
          quantity_adjustments[detailId] = input.actualQuantity;
        }
        if (input.adjustPrice) {
          price_adjustments[detailId] = input.actualPrice;
        }
      });

      await api.post(`/orders/${processingOrderId}/create-batches`, {
        expiration_dates,
        quantity_adjustments,
        price_adjustments,
      });

      // Show success modal instead of toast
      const hasAdjustments = Object.values(expDateInputs).some(
        (input) => input.adjustQuantity || input.adjustPrice
      );

      setStatusModalMessage(
        hasAdjustments
          ? "Order received successfully with quantity/price adjustments and batches created"
          : "Order has been received and batches created successfully"
      );
      setShowSuccessModal(true);

      // Close all related modals
      setShowExpDateModal(false);
      setProcessingOrderId(null);
      setExpDateInputs({});
      setShowOrderDetail(false); // Close the order details modal too
      await fetchOrders();
    } catch (error) {
      setStatusModalMessage(error.response?.data?.msg || "Network error");
      setShowErrorModal(true);
      await fetchOrders();
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

  const handleDeleteClick = (order) => {
    setDeleteOrderId(order.order_id);
    setShowDeleteModal(true);
  };

  const handleFilterChange = (field, option) => {
    const value = option && typeof option === "object" ? option.value : option;
    setFilters((prev) => ({
      ...prev,
      [field]: value || "",
    }));

    // We don't need to call fetchOrders here since it will be triggered by the useEffect
    // that has filters in its dependency array
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

  const handleOrderDateChange = (e) => {
    setOrderForm((prev) => ({
      ...prev,
      order_date: e.target.value,
    }));
  };

  const toggleBatchDetails = (index) => {
    setExpandedBatchDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleProductSelect = async (index, option) => {
    if (!option) {
      handleDetailChange(index, "code_product", "");
      handleDetailChange(index, "ordered_price", "");
      handleDetailChange(index, "available_batches", []);
      return;
    }

    const selectedProduct = products.find(
      (p) => p.code_product === option.value
    );
    if (selectedProduct) {
      try {
        const batchResponse = await api.get(
          `/orders/${selectedProduct.code_product}/batches`
        );
        const batches = batchResponse.data || [];

        handleDetailChange(index, "code_product", selectedProduct.code_product);
        handleDetailChange(
          index,
          "ordered_price",
          batches.length > 0
            ? batches[0].purchase_price
            : selectedProduct.purchase_price
        );
        handleDetailChange(index, "available_batches", batches);
      } catch (error) {
        console.error("Error fetching batch data:", error);
        showAlert(
          "error",
          "Failed to fetch batch data",
          error.response?.data?.msg || "Network error"
        );
      } finally {
        // Add this finally block to ensure the function completes
      }
    }
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
        // Remove order_date to let backend use current timestamp like staff does
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
        // Remove order_date - let backend use current timestamp
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
            available_batches: product.available_batches || [],
          },
        ],
      }));
      setShowCreateOrderModal(true);
      fetchProducts();
    }
  }, [fetchProducts]);

  const fetchOrderStats = useCallback(async () => {
    try {
      const pendingCount = orders.filter(
        (o) => o.order_status === "pending"
      ).length;
      const approvedCount = orders.filter(
        (o) => o.order_status === "approved"
      ).length;
      const receivedCount = orders.filter(
        (o) => o.order_status === "received"
      ).length;
      const cancelledCount = orders.filter(
        (o) => o.order_status === "cancelled"
      ).length;
      const totalValue = orders.reduce(
        (sum, o) => sum + parseFloat(o.total_amount || 0),
        0
      );

      // Calculate monthly stats for the last 6 months
      const monthlyStats = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0
        );

        const monthOrders = orders.filter((order) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= month && orderDate <= nextMonth;
        });

        monthlyStats.push({
          date: month.toISOString(),
          count: monthOrders.length,
        });
      }

      setOrderStats({
        totalOrders: orders.length,
        pendingOrders: pendingCount,
        approvedOrders: approvedCount,
        receivedOrders: receivedCount,
        cancelledOrders: cancelledCount,
        totalValue: totalValue,
        monthlyStats: monthlyStats,
      });
    } catch (error) {
      console.error("Error calculating order stats:", error);
    }
  }, [orders]);

  useEffect(() => {
    fetchOrderStats();
  }, [fetchOrderStats]);

  const getCurrentPageItems = () => {
    // Sort orders based on the selected sort option
    const sortedOrders = [...orders].sort((a, b) => {
      if (sortOption === "id") {
        return b.order_id - a.order_id; // Sort by ID (newest first)
      } else {
        // Sort by date (newest first)
        return new Date(b.order_date) - new Date(a.order_date);
      }
    });
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedOrders.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto">
        {isLoading || isAdmin === null ? (
          <LoadingComponent />
        ) : !isAdmin ? (
          <div className="flex items-center justify-center h-scree">
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
          <div>
            <div className="px-4">
              {/* Order Management Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-700  rounded-t-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center">
                  <ShoppingBag className="text-white mr-3" size={36} />
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">
                      Order Management
                    </h1>
                    <p className="text-indigo-100 text-sm">
                      Manage and track all orders
                    </p>
                  </div>
                </div>
                <CrudButton
                  icon={Plus}
                  onClick={() => {
                    fetchProducts();
                    setShowCreateOrderModal(true);
                  }}
                  label="Create Order"
                  buttonStyle="secondary"
                  className="flex items-center  text-indigo-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                />
              </div>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full">
                  <div className="bg-white rounded-xl shadow-md border border-gray-100">
                    <div className="bg-white px-5 py-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <ClipboardList
                              className="text-indigo-600"
                              size={22}
                            />
                          </div>
                          <h2 className="text-xl font-bold text-gray-800">
                            Orders List
                          </h2>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                            className="flex items-center text-xs font-medium bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
                          >
                            <Filter size={12} className="mr-1 sm:mr-1.5" />{" "}
                            Filter
                          </button>
                          {filterMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-xl p-3 sm:p-4 z-10 border border-gray-200"
                            >
                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Tag size={12} className="mr-1.5" /> Filter by
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
                                className="mb-3"
                                placeholder="Select status"
                                isClearable
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    borderRadius: "0.5rem",
                                    borderColor: "#e5e7eb",
                                    boxShadow: "none",
                                    "&:hover": {
                                      borderColor: "#3b82f6",
                                    },
                                    minHeight: "32px",
                                    padding: "0px",
                                  }),
                                  valueContainer: (base) => ({
                                    ...base,
                                    padding: "0 8px",
                                  }),
                                  input: (base) => ({
                                    ...base,
                                    margin: "0",
                                    padding: "0",
                                  }),
                                  dropdownIndicator: (base) => ({
                                    ...base,
                                    padding: "4px",
                                  }),
                                  clearIndicator: (base) => ({
                                    ...base,
                                    padding: "4px",
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    fontSize: "0.75rem",
                                  }),
                                }}
                              />

                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Calendar size={12} className="mr-1.5" /> Filter
                                by Date Range
                              </h4>
                              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    value={filters.start_date || ""}
                                    onChange={(e) =>
                                      handleFilterChange(
                                        "start_date",
                                        e.target.value
                                      )
                                    }
                                    className="p-1 sm:p-2 w-full border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    End Date
                                  </label>
                                  <input
                                    type="date"
                                    value={filters.end_date || ""}
                                    onChange={(e) =>
                                      handleFilterChange(
                                        "end_date",
                                        e.target.value
                                      )
                                    }
                                    className="p-1 sm:p-2 w-full border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                  />
                                </div>
                              </div>

                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 mr-1.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                  />
                                </svg>{" "}
                                Sort By
                              </h4>
                              <div className="flex space-x-2 mb-3">
                                <button
                                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    sortOption === "id"
                                      ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                                  }`}
                                  onClick={() => {
                                    setSortOption("id");
                                    setCurrentPage(0); // Reset to first page when changing sort
                                  }}
                                >
                                  ID
                                </button>
                                <button
                                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    sortOption === "date"
                                      ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                                  }`}
                                  onClick={() => {
                                    setSortOption("date");
                                    setCurrentPage(0); // Reset to first page when changing sort
                                  }}
                                >
                                  Date
                                </button>
                              </div>

                              <div className="flex justify-end space-x-2">
                                <button
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                                  onClick={() => {
                                    setFilters({
                                      code_product: "",
                                      order_status: "",
                                      start_date: "",
                                      end_date: "",
                                    });
                                    setTimeout(() => fetchOrders(), 0); // Fetch orders after reset
                                    setFilterMenuOpen(false);
                                  }}
                                >
                                  Reset
                                </button>
                                <button
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                                  onClick={() => {
                                    setTimeout(() => fetchOrders(), 0); // Fetch orders with the current filters
                                    setFilterMenuOpen(false);
                                  }}
                                >
                                  Apply
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                          <span className="ml-3 text-gray-600">Loading...</span>
                        </div>
                      ) : orders.length > 0 ? (
                        <>
                          {/* Desktop View */}
                          <div className="hidden md:block">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                                    NO
                                  </th>
                                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                                    USER
                                  </th>
                                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                                    DATE
                                  </th>
                                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                                    STATUS
                                  </th>
                                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                                    TOTAL
                                  </th>
                                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                                    ACTIONS
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {getCurrentPageItems().map((order) => (
                                  <tr
                                    key={order.order_id}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                  >
                                    <td className="px-4 py-3 text-indigo-600 font-medium">
                                      #{order.order_id}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {order.user?.name || order.user_id}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {new Date(
                                        order.order_date
                                      ).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(
                                          order.order_status
                                        )}`}
                                      >
                                        {getStatusIcon(order.order_status)}
                                        <span className="ml-1 capitalize">
                                          {order.order_status}
                                        </span>
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                      {formatPrice(order.total_amount)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() =>
                                            viewOrderDetails(order)
                                          }
                                          className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100"
                                        >
                                          <Eye
                                            size={12}
                                            className="inline mr-1"
                                          />
                                          View Details
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
                                              className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                                            >
                                              <Check
                                                size={12}
                                                className="inline mr-1"
                                              />
                                              Approve
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleStatusChange(
                                                  order.order_id,
                                                  "cancelled"
                                                )
                                              }
                                              className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                                            >
                                              <X
                                                size={12}
                                                className="inline mr-1"
                                              />
                                              Cancel
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleDeleteClick(order)
                                              }
                                              className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                                            >
                                              <Trash2
                                                size={12}
                                                className="inline mr-1"
                                              />
                                              Delete
                                            </button>
                                          </>
                                        )}
                                        {order.order_status === "approved" && (
                                          <button
                                            onClick={() =>
                                              handleReceive(order.order_id)
                                            }
                                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                                          >
                                            <Check
                                              size={12}
                                              className="inline mr-1"
                                            />
                                            Receive
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile View */}
                          <div className="md:hidden space-y-4">
                            {getCurrentPageItems().map((order) => (
                              <div
                                key={order.order_id}
                                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center mb-1">
                                      <span className="text-indigo-600 font-medium">
                                        #{order.order_id}
                                      </span>
                                      <span className="mx-2 text-gray-300">
                                        |
                                      </span>
                                      <span className="text-sm text-black font-semibold">
                                        {order.user?.name || order.user_id}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(
                                        order.created_at
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="mb-4">
                                    <div className="flex flex-col items-start gap-2">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(
                                          order.order_status
                                        )}`}
                                      >
                                        {getStatusIcon(order.order_status)}
                                        <span className="ml-1 capitalize">
                                          {order.order_status}
                                        </span>
                                      </span>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {formatPrice(order.total_amount)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => viewOrderDetails(order)}
                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100"
                                  >
                                    <Eye size={12} className="inline mr-1" />
                                    View Details
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
                                        className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                                      >
                                        <Check
                                          size={12}
                                          className="inline mr-1"
                                        />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleStatusChange(
                                            order.order_id,
                                            "cancelled"
                                          )
                                        }
                                        className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                                      >
                                        <X size={12} className="inline mr-1" />
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick(order)}
                                        className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                                      >
                                        <Trash2
                                          size={12}
                                          className="inline mr-1"
                                        />
                                        Delete
                                      </button>
                                    </>
                                  )}
                                  {order.order_status === "approved" && (
                                    <button
                                      onClick={() =>
                                        handleReceive(order.order_id)
                                      }
                                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                                    >
                                      <Check
                                        size={12}
                                        className="inline mr-1"
                                      />
                                      Receive
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-20">
                          <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                            <ShoppingCart
                              size={60}
                              className="mx-auto text-gray-300 mb-4"
                            />
                            <h3 className="text-xl font-medium text-gray-700 mb-2">
                              No orders found
                            </h3>
                            <p className="text-gray-500 mb-4">
                              {Object.values(filters).some((filter) => filter)
                                ? "No orders match your current filter criteria. Try adjusting your filters or clear them to see all orders."
                                : "You haven't created any orders yet. Create your first order to get started."}
                            </p>
                            {Object.values(filters).some(
                              (filter) => filter
                            ) && (
                              <button
                                onClick={() => {
                                  setFilters({
                                    code_product: "",
                                    order_status: "",
                                    start_date: "",
                                    end_date: "",
                                  });
                                }}
                                className="mt-3 sm:mt-4 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center mx-auto"
                              >
                                <RefreshCw size={12} className="mr-1" /> Reset
                                Filters
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pagination Section */}
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={orders.length}
                        className="rounded-t-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert and Success modals are now rendered at the bottom of the component */}

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
                                            p.code_product ===
                                            detail.code_product
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
                            <div className="space-y-4">
                              <div className="flex items-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700">
                                <Package
                                  size={14}
                                  className="inline mr-2 flex-shrink-0"
                                />
                                <span>
                                  A new batch will be created if no existing
                                  batch matches the purchase price.
                                </span>
                              </div>

                              {detail.available_batches?.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Package
                                        size={16}
                                        className="text-gray-600"
                                      />
                                      <span className="text-sm font-medium text-gray-700">
                                        Available Batches
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleBatchDetails(index)}
                                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                      {expandedBatchDetails[index] ? (
                                        <>
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="m18 15-6-6-6 6" />
                                          </svg>
                                          Hide Details
                                        </>
                                      ) : (
                                        <>
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="m6 9 6 6 6-6" />
                                          </svg>
                                          Show Details
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {expandedBatchDetails[index] && (
                                    <div className="space-y-2 mt-2">
                                      {detail.available_batches.map((batch) => (
                                        <div
                                          key={batch.batch_id}
                                          className="bg-white p-3 rounded-lg border border-gray-200 text-sm"
                                        >
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-900">
                                              {batch.batch_code}
                                            </span>
                                            <span className="text-indigo-600 font-medium">
                                              {formatPrice(
                                                batch.purchase_price
                                              )}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                              <span className="text-gray-500">
                                                Stock:{" "}
                                              </span>
                                              <span className="text-gray-900 font-medium">
                                                {batch.stock_quantity} pcs
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">
                                                Expiry:{" "}
                                              </span>
                                              <span className="text-gray-900 font-medium">
                                                {batch.exp_date
                                                  ? new Date(
                                                      batch.exp_date
                                                    ).toLocaleDateString()
                                                  : "N/A"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
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

                      {/* Order Date Selection */}
                      <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-4">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                          <Calendar size={20} className="mr-2" /> Order Date &
                          Time
                        </h3>
                        <div className="flex flex-col space-y-3">
                          <label
                            htmlFor="order_date"
                            className="text-sm text-gray-600"
                          >
                            Select Order Date:
                          </label>
                          <input
                            type="date"
                            id="order_date"
                            name="order_date"
                            value={orderForm.order_date}
                            onChange={handleOrderDateChange}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex items-center space-x-2 mt-2">
                            <input
                              type="checkbox"
                              id="use_current_time"
                              checked={true}
                              readOnly
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <label
                              htmlFor="use_current_time"
                              className="text-sm text-gray-700"
                            >
                              Use current time when creating order
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">
                            Order date can be modified if needed. Time will be
                            automatically set to current time when the order is
                            created.
                          </p>
                        </div>
                      </div>

                      <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                        <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                          <DollarSign size={20} className="mr-2" /> Order
                          Summary
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
                    className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">
                        Receive Order & Set Product Details
                      </h3>
                      <button
                        onClick={() => setShowExpDateModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-4 pr-2">
                        {orderDetails.map((detail) => (
                          <div
                            key={detail.order_detail_id}
                            className="p-4 border rounded-lg bg-gray-50 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-lg text-gray-800">
                                {detail.product_name}
                              </h4>
                              <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg">
                                <div className="font-medium">
                                  Ordered: {detail.quantity} pcs @{" "}
                                  {formatPrice(detail.ordered_price)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Subtotal:{" "}
                                  {formatPrice(
                                    detail.quantity * detail.ordered_price
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Grid layout for all options */}
                            <div className="space-y-4">
                              {/* Expiration Date Section */}
                              <div className="bg-white p-4 rounded-lg border-2 shadow-sm">
                                <div className="flex items-center space-x-3 mb-3">
                                  <input
                                    type="checkbox"
                                    id={`exp-${detail.order_detail_id}`}
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
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <label
                                    htmlFor={`exp-${detail.order_detail_id}`}
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                  >
                                    Has expiration date
                                  </label>
                                </div>

                                {expDateInputs[detail.order_detail_id]
                                  ?.hasExpDate && (
                                  <div className="ml-7">
                                    <label
                                      htmlFor={`exp-date-${detail.order_detail_id}`}
                                      className="block text-xs font-medium text-gray-700 mb-1"
                                    >
                                      Expiration Date:
                                    </label>
                                    <input
                                      id={`exp-date-${detail.order_detail_id}`}
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
                                      className="w-full max-w-xs p-2 rounded-lg border-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Quantity Adjustment Section */}
                              <div className="bg-white p-4 rounded-lg border-2  shadow-sm">
                                <div className="flex items-center space-x-3 mb-3">
                                  <input
                                    type="checkbox"
                                    id={`qty-${detail.order_detail_id}`}
                                    checked={
                                      expDateInputs[detail.order_detail_id]
                                        ?.adjustQuantity
                                    }
                                    onChange={(e) => {
                                      setExpDateInputs((prev) => ({
                                        ...prev,
                                        [detail.order_detail_id]: {
                                          ...prev[detail.order_detail_id],
                                          adjustQuantity: e.target.checked,
                                        },
                                      }));
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`qty-${detail.order_detail_id}`}
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                  >
                                    Adjust quantity
                                  </label>
                                </div>

                                {expDateInputs[detail.order_detail_id]
                                  ?.adjustQuantity && (
                                  <div className="ml-7">
                                    <label
                                      htmlFor={`qty-input-${detail.order_detail_id}`}
                                      className="block text-xs font-medium text-gray-700 mb-1"
                                    >
                                      Actual received quantity:
                                    </label>
                                    <div className="relative max-w-xs">
                                      <input
                                        id={`qty-input-${detail.order_detail_id}`}
                                        type="number"
                                        min="0"
                                        value={
                                          expDateInputs[detail.order_detail_id]
                                            ?.actualQuantity || ""
                                        }
                                        onChange={(e) => {
                                          setExpDateInputs((prev) => ({
                                            ...prev,
                                            [detail.order_detail_id]: {
                                              ...prev[detail.order_detail_id],
                                              actualQuantity:
                                                parseInt(e.target.value) || 0,
                                            },
                                          }));
                                        }}
                                        placeholder="Enter quantity"
                                        className="w-full p-2 pr-10 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                      />
                                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                                        pcs
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Price Adjustment Section */}
                              <div className="bg-white p-4 rounded-lg border-2 shadow-sm">
                                <div className="flex items-center space-x-3 mb-3">
                                  <input
                                    type="checkbox"
                                    id={`price-${detail.order_detail_id}`}
                                    checked={
                                      expDateInputs[detail.order_detail_id]
                                        ?.adjustPrice
                                    }
                                    onChange={(e) => {
                                      setExpDateInputs((prev) => ({
                                        ...prev,
                                        [detail.order_detail_id]: {
                                          ...prev[detail.order_detail_id],
                                          adjustPrice: e.target.checked,
                                        },
                                      }));
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <label
                                    htmlFor={`price-${detail.order_detail_id}`}
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                  >
                                    Adjust price
                                  </label>
                                </div>

                                {expDateInputs[detail.order_detail_id]
                                  ?.adjustPrice && (
                                  <div className="ml-7">
                                    <label
                                      htmlFor={`price-input-${detail.order_detail_id}`}
                                      className="block text-xs font-medium text-gray-700 mb-1"
                                    >
                                      Actual purchase price:
                                    </label>
                                    <div className="relative max-w-xs">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-xs">
                                        Rp
                                      </span>
                                      <input
                                        id={`price-input-${detail.order_detail_id}`}
                                        type="text"
                                        value={
                                          expDateInputs[detail.order_detail_id]
                                            ?.actualPrice
                                            ? Number(
                                                expDateInputs[
                                                  detail.order_detail_id
                                                ]?.actualPrice
                                              ).toLocaleString("id-ID")
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const value = e.target.value.replace(
                                            /[^\d]/g,
                                            ""
                                          );
                                          setExpDateInputs((prev) => ({
                                            ...prev,
                                            [detail.order_detail_id]: {
                                              ...prev[detail.order_detail_id],
                                              actualPrice: value
                                                ? parseInt(value)
                                                : 0,
                                            },
                                          }));
                                        }}
                                        placeholder="0"
                                        className="w-full p-2 pl-8 rounded-lg border-2 r shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Show summary if adjustments are made */}
                            {(expDateInputs[detail.order_detail_id]
                              ?.adjustQuantity ||
                              expDateInputs[detail.order_detail_id]
                                ?.adjustPrice) && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="font-medium text-blue-900 mb-2">
                                  Adjustment Summary:
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      Quantity:
                                    </span>
                                    <div className="font-medium">
                                      {detail.quantity} →{" "}
                                      {expDateInputs[detail.order_detail_id]
                                        ?.adjustQuantity
                                        ? expDateInputs[detail.order_detail_id]
                                            ?.actualQuantity
                                        : detail.quantity}{" "}
                                      pcs
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Unit Price:
                                    </span>
                                    <div className="font-medium">
                                      {formatPrice(detail.ordered_price)} →{" "}
                                      {expDateInputs[detail.order_detail_id]
                                        ?.adjustPrice
                                        ? formatPrice(
                                            expDateInputs[
                                              detail.order_detail_id
                                            ]?.actualPrice
                                          )
                                        : formatPrice(detail.ordered_price)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      New Subtotal:
                                    </span>
                                    <div className="font-bold text-blue-700">
                                      {formatPrice(
                                        (expDateInputs[detail.order_detail_id]
                                          ?.adjustQuantity
                                          ? expDateInputs[
                                              detail.order_detail_id
                                            ]?.actualQuantity
                                          : detail.quantity) *
                                          (expDateInputs[detail.order_detail_id]
                                            ?.adjustPrice
                                            ? expDateInputs[
                                                detail.order_detail_id
                                              ]?.actualPrice
                                            : detail.ordered_price)
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowExpDateModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExpDateSubmit}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Submit
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={statusModalMessage}
        />

        {/* Error Modal */}
        <AlertModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message={statusModalMessage}
        />

        <OrderCharts
          orderStats={orderStats}
          formatPrice={formatPrice}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};

export default OrderAdmin;
