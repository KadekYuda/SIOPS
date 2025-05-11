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
  ShoppingCart,
  Clock,
  Calendar,
  RefreshCw,
  ArrowLeft,
  Inbox,
  DollarSign,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../service/api";
import OrderDetails from "../OrderDetails";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [activeTab, setActiveTab] = useState("create");
  const [alert, setAlert] = useState(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    code_product: "",
    order_status: "",
    start_date: "",
    end_date: "",
  });
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const checkUserRole = useCallback(async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const fetchOrders = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.order_status) {
        queryParams.append("order_status", filters.order_status);
      }
      if (filters.start_date) {
        queryParams.append("start_date", filters.start_date);
      }
      if (filters.end_date) {
        queryParams.append("end_date", filters.end_date);
      }

      const response = await api.get(`/orders?${queryParams.toString()}`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showAlert(
        "error",
        "Failed to fetch orders",
        error.response?.data?.msg || "Network error"
      );
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    const details = await fetchOrderDetails(order.order_id);
    setOrderDetails(details);
    setShowOrderDetail(true);
  };

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

  useEffect(() => {
    const handleRestockProduct = async () => {
      const restockProduct = sessionStorage.getItem("restockProduct");
      if (restockProduct) {
        const product = JSON.parse(restockProduct);

        try {
          if (products.length === 0) {
            const productsResponse = await api.get("/products");
            setProducts(productsResponse.data.result);
          }

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

          sessionStorage.removeItem("restockProduct");
        } catch (error) {
          console.error("Error handling restock product:", error);
          showAlert(
            "error",
            "Failed to load product data",
            error.response?.data?.msg || "Network error"
          );
        }
      }
    };

    handleRestockProduct();
  }, [products]);

  const handleProductSelect = async (index, selectedOption) => {
    if (!selectedOption) {
      handleDetailChange(index, "code_product", "");
      handleDetailChange(index, "name_product", "");
      handleDetailChange(index, "ordered_price", "");
      handleDetailChange(index, "available_batches", []);
      return;
    }

    const selectedProduct = products.find(
      (p) => p.code_product === selectedOption
    );
    if (selectedProduct) {
      try {
        const batchResponse = await api.get(
          `/orders/${selectedProduct.code_product}/batches`
        );
        const batches = batchResponse.data || [];

        handleDetailChange(index, "code_product", selectedProduct.code_product);
        handleDetailChange(index, "name_product", selectedProduct.name_product);
        handleDetailChange(
          index,
          "ordered_price",
          batches.length > 0 ? batches[0].purchase_price : ""
        );
        handleDetailChange(index, "available_batches", batches);
      } catch (error) {
        console.error("Error fetching batch data:", error);
        showAlert(
          "error",
          "Failed to fetch batch data",
          error.response?.data?.msg || "Network error"
        );
      }
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

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

      const newOrderForm = {
        ...orderForm,
        user_id: orderForm.user_id,
        order_status: "pending",
        order_details: orderForm.order_details.map((detail) => ({
          code_product: detail.code_product,
          stock_quantity: detail.stock_quantity || "0",
          ordered_price: detail.ordered_price,
          subtotal: detail.subtotal,
        })),
      };

      await api.post("/orders", newOrderForm);

      showAlert("success", "Success", "Order created successfully");
      setOrderForm({
        user_id: orderForm.user_id,
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
      setActiveTab("list");
    } catch (error) {
      console.error("Error creating order:", error);
      showAlert(
        "error",
        "Failed to create order",
        error.response?.data?.msg || "Network error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAlert = (type, title, message) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const formatPrice = (price) => {
    if (!price) return "Rp 0";
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  const calculateTotal = () => {
    return formatPrice(
      orderForm.order_details
        .reduce((total, detail) => {
          return total + (parseFloat(detail.subtotal) || 0);
        }, 0)
        .toFixed(0)
    );
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "cancelled", label: "Cancelled" },
    { value: "received", label: "Received" },
  ];

  const getLastMonthDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toISOString().split("T")[0];
      const displayDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dates.push({ value: formattedDate, label: displayDate });
    }
    return [{ value: "", label: "All Dates" }, ...dates];
  };

  const handleFilterChange = (field, option) => {
    setFilters((prev) => ({
      ...prev,
      [field]: option ? option.value : "",
    }));
  };

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : !isStaff ? (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="mb-4 text-yellow-500">
              <AlertTriangle size={48} className="mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-yellow-600 mb-4">
              Access Warning
            </h1>
            <p className="text-gray-600 mb-6">
              Please use the appropriate order management page for your role.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
                  Order Management
                </h1>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-1/2">
                <div className="bg-white rounded-xl shadow-md border border-gray-100 h-full">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center">
                      <ShoppingCart className="text-white mr-3" size={24} />
                      <h2 className="text-xl font-bold text-white">
                        Create New Order
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-6">
                      {orderForm.order_details.map((detail, index) => {
                        const detailId = `order-detail-${
                          detail.code_product || Date.now()
                        }-${index}`;
                        return (
                          <div
                            key={detailId}
                            className="p-4 border rounded-xl bg-white shadow-sm relative"
                          >
                            <div className="absolute -top-3 left-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                              Item #{index + 1}
                            </div>
                            {index > 0 && (
                              <button
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
                                  products.find(
                                    (p) =>
                                      p.code_product === detail.code_product
                                  )
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
                                  handleProductSelect(
                                    index,
                                    option ? option.value : ""
                                  )
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
                                        ? "border-blue-500 ring-2 ring-blue-500"
                                        : "border-gray-300"
                                    } hover:border-blue-500 p-0.5`,
                                  option: (state) =>
                                    `${
                                      state.isSelected
                                        ? "bg-blue-500 text-white"
                                        : state.isFocused
                                        ? "bg-blue-50 text-gray-700"
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
                              <div className="flex items-center p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 mb-4">
                                <Package
                                  size={14}
                                  className="inline mr-2 flex-shrink-0"
                                />
                                <span>
                                  A new batch will be created if no existing
                                  batch matches the purchase price.
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
                                    className="w-full p-2 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                  <span className="font-semibold text-blue-700">
                                    {formatPrice(detail.subtotal || 0)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        onClick={addOrderDetail}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
                      >
                        <Plus size={18} className="mr-2" /> Add Another Product
                      </button>

                      <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                          <DollarSign size={20} className="mr-2" /> Order
                          Summary
                        </h3>
                        <div className="flex justify-between mb-3 text-sm">
                          <span className="text-gray-600">Total Items:</span>
                          <span className="font-medium">
                            {orderForm.order_details.length}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t border-blue-200 pt-3 mt-3">
                          <span className="text-gray-800">Total Amount:</span>
                          <span className="text-blue-700">
                            {calculateTotal()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleCreateOrder}
                        disabled={isSubmitting}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors ${
                          isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw
                              size={20}
                              className="mr-2 animate-spin"
                            />{" "}
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={20} className="mr-2" /> Submit
                            Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="bg-white rounded-xl shadow-md border border-gray-100 h-full">
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
                                  "&:hover": {
                                    borderColor: "#3b82f6",
                                  },
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
                                  className="p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                                  className="p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button
                                className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                                onClick={() => {
                                  setFilters({
                                    code_product: "",
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
                                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold rounded-full px-2.5 py-1 mr-2">
                                    #{order.order_id}
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
                                <button
                                  onClick={() => viewOrderDetails(order)}
                                  className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <Eye size={14} className="mr-1" /> View
                                  Details
                                </button>
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
                            : "Create your first order to get started"}
                        </p>
                        {Object.values(filters).some((filter) => filter) && (
                          <button
                            onClick={() => {
                              setFilters({
                                code_product: "",
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
                        {!Object.values(filters).some((filter) => filter) && (
                          <button
                            onClick={() => setActiveTab("create")}
                            className="mt-4 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center mx-auto"
                          >
                            <Plus size={14} className="mr-1" /> Create New Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showOrderDetail && selectedOrder && (
              <OrderDetails
                selectedOrder={selectedOrder}
                orderDetails={orderDetails}
                setShowOrderDetail={setShowOrderDetail}
                formatPrice={formatPrice}
                isAdmin={isStaff}
              />
            )}
          </AnimatePresence>

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
                      ) : alert.type === "error" ? (
                        <AlertTriangle size={16} />
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
        </div>
      )}
    </>
  );
};

export default Order;
