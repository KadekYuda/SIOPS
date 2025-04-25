import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import {
  Trash2,
  Check,
  AlertTriangle,
  Filter,
  Plus,
  Package,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../service/api";
import OrderDetails from "../OrderDetails";

const Order = () => {
  const [orders, setOrders] = useState([]);
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
  const [isStaff, setIsStaff] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");

      // Update orderForm with user_id directly without setting user state
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

  // Add status class name helper
  const getStatusClassName = (status) => {
    if (status === "received") return "bg-green-100 text-green-800";
    if (status === "approved") return "bg-blue-100 text-blue-700";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  // Add user role check
  const checkUserRole = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      const userRole = response.data.user?.role;
      setIsStaff(userRole === "staff");

      if (userRole === "admin") {
        showAlert(
          "warning",
          "Wrong Access",
          "Please use the admin order management page"
        );
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsStaff(false);
    }
  }, []);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const [alert, setAlert] = useState(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    code_product: "",
    order_status: "",
    created_at: "",
  });
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get("/orders");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showAlert(
        "error",
        "Failed to fetch orders",
        error.response?.data?.msg || "Network error"
      );
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.result);
    } catch (error) {
      console.error("Error fetching products:", error);
      showAlert(
        "error",
        "Failed to fetch products",
        error.response?.data?.msg || "Network error"
      );
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  // View order details
  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    const details = await fetchOrderDetails(order.order_id);
    setOrderDetails(details);
    setShowOrderDetail(true);
  };

  // Add order detail
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

  // Remove order detail
  const removeOrderDetail = (index) => {
    setOrderForm((prev) => ({
      ...prev,
      order_details: prev.order_details.filter((_, i) => i !== index),
    }));
  };

  // Handle order detail change
  const handleDetailChange = (index, field, value) => {
    setOrderForm((prev) => {
      const newDetails = [...prev.order_details];
      newDetails[index] = {
        ...newDetails[index],
        [field]: value,
      };
      // Calculate subtotal if quantity and price are present
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

  // Handle product selection
  const handleProductSelect = async (index, code_product) => {
    const selectedProduct = products.find(
      (p) => p.code_product === code_product
    );

    handleDetailChange(index, "code_product", code_product);
    handleDetailChange(
      index,
      "ordered_price",
      selectedProduct?.sell_price || ""
    );
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      // Ensure all required fields are filled
      const isValid = orderForm.order_details.every(
        (detail) =>
          detail.code_product && detail.stock_quantity && detail.ordered_price
      );

      if (!isValid) {
        showAlert("error", "Error", "Please fill all required fields");
        return;
      }

      if (!orderForm.user_id) {
        showAlert("error", "Error", "User not authenticated properly");
        return;
      }

      // Prepare order data with user_id
      const newOrderForm = {
        ...orderForm,
        user_id: orderForm.user_id, // Make sure it's included
        order_status: "pending",
        // Clean up order details to match API expectations
        order_details: orderForm.order_details.map((detail) => ({
          code_product: detail.code_product,
          stock_quantity: detail.stock_quantity || "0",
          ordered_price: detail.ordered_price,
          subtotal: detail.subtotal,
        })),
      };

      console.log("Submitting order with data:", newOrderForm); // Debug log

      // Create order - cookies will be automatically sent with request
      await api.post("/orders", newOrderForm);

      showAlert("success", "Success", "Order created successfully");
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
      console.error("Error creating order:", error);
      showAlert(
        "error",
        "Failed to create order",
        error.response?.data?.msg || "Network error"
      );
    }
  };

  // Show alert message
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Format price to include Rp symbol and thousands separator
  const formatPrice = (price) => {
    if (!price) return "Rp 0";
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  // Calculate total for current order details
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
      {!isStaff ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-yellow-600 mb-4">
              Access Warning
            </h1>
            <p className="text-gray-600">
              Please use the appropriate order management page for your role.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 p-4 my-14">
          {/* Left Section - Create Order */}
          <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Create Order</h2>

            {orderForm.order_details.map((detail, index) => {
              const detailId = `order-detail-${
                detail.code_product || Date.now()
              }-${index}`;
              return (
                <div
                  key={detailId}
                  className="mb-8 p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Item #{index + 1}</h3>
                    {index > 0 && (
                      <button
                        onClick={() => removeOrderDetail(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* Product Selection Section */}
                  <div className="mb-4">
                    <label
                      htmlFor={`product-${index}`}
                      className="block text-sm font-medium mb-2"
                    >
                      Product
                    </label>
                    <Select
                      id={`product-${index}`}
                      value={
                        products.find(
                          (p) => p.code_product === detail.code_product
                        )
                          ? {
                              value: detail.code_product,
                              label: `${
                                products.find(
                                  (p) => p.code_product === detail.code_product
                                )?.name_product
                              } (${detail.code_product})`,
                            }
                          : null
                      }
                      onChange={(option) =>
                        handleProductSelect(index, option ? option.value : "")
                      }
                      options={products.map((product) => ({
                        value: product.code_product,
                        label: `${product.name_product} (${product.code_product})`,
                      }))}
                      placeholder="Select Product"
                      isClearable
                    />
                  </div>

                  {/* Batch automatic selection notice */}
                  {detail.code_product && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700">
                      <Package size={14} className="inline mr-1" />
                      Batches will be automatically selected by the system based
                      on expiration date.
                    </div>
                  )}

                  {/* Quantity and Price Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor={`quantity-${index}`}
                        className="block text-sm font-medium mb-2"
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
                          className="w-full p-2 border rounded"
                          min="1"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">
                          pcs
                        </span>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor={`price-${index}`}
                        className="block text-sm font-medium mb-2"
                      >
                        Purchase Price
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
                            const value = e.target.value.replace(/[^\d]/g, "");
                            handleDetailChange(index, "ordered_price", value);
                          }}
                          className="w-full p-2 pl-8 border rounded"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtotal Section */}
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-bold">
                        {formatPrice(detail.subtotal || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Item Button */}
            <button
              onClick={addOrderDetail}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded font-medium mb-6 flex items-center justify-center"
            >
              <Plus size={18} className="mr-2" /> Add Another Product
            </button>

            {/* Order Summary */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

              {/* Items Count */}
              <div className="flex justify-between mb-2">
                <span>Items:</span>
                <span>{orderForm.order_details.length}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total Amount:</span>
                <span>{calculateTotal()}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              onClick={handleCreateOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-medium"
            >
              Submit Order
            </button>
          </div>

          {/* Right Section - Order List */}
          <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Order List</h2>

            {/* Filter Section */}
            <div className="mb-4 relative">
              <button
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <Filter size={16} className="mr-1" /> Filter Orders
              </button>

              {filterMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-10 border">
                  <h4 className="font-medium mb-2">Filter by Status</h4>
                  <select
                    className="w-full p-2 border rounded mb-3"
                    value={filters.order_status}
                    onChange={(e) =>
                      setFilters({ ...filters, order_status: e.target.value })
                    }
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="received">Received</option>
                  </select>

                  <h4 className="font-medium mb-2">Filter by Date</h4>
                  <input
                    type="date"
                    className="w-full p-2 border rounded mb-3"
                    value={filters.created_at}
                    onChange={(e) =>
                      setFilters({ ...filters, created_at: e.target.value })
                    }
                  />

                  <button
                    className="w-full bg-blue-500 text-white py-2 rounded"
                    onClick={() => {
                      // Apply filters logic here
                      setFilterMenuOpen(false);
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.length > 0 ? (
                    orders.map((order) => {
                      const statusClassName = getStatusClassName(
                        order.order_status
                      );
                      return (
                        <tr key={order.order_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{order.order_id}</td>
                          <td className="px-4 py-3">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {formatPrice(order.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusClassName}`}
                            >
                              {order.order_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewOrderDetails(order)}
                                className="inline-flex items-center px-2.5 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                              >
                                <Eye size={14} className="mr-1" /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                  isAdmin={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Alert Message */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              alert.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            <div className="flex items-center">
              {alert.type === "success" ? (
                <Check size={20} className="mr-2" />
              ) : (
                <AlertTriangle size={20} className="mr-2" />
              )}
              <div>
                <p className="font-medium">{alert.title}</p>
                <p className="text-sm">{alert.message}</p>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="ml-4 hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Order;
