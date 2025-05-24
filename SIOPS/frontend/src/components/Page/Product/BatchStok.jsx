import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "./Pagination";
import api from "../../../service/api";
import {
  Search,
  ArrowLeft,
  Calendar,
  Package,
  AlertCircle,
  Clipboard,
  X,
  ChevronDown,
  ChevronUp,
  Package2,
  FileText,
} from "lucide-react";
import LoadingComponent from "../../LoadingComponent";

const BatchStok = () => {
  const navigate = useNavigate();
  const [batchStok, setBatchStok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState("staff");

  const fetchUserRole = async () => {
    try {
      setIsRoleLoading(true);
      const response = await api.get("/users/profile");
      if (response.data && response.data.user) {
        setUserRole(response.data.user.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("staff"); // Default to staff if error
    } finally {
      setIsRoleLoading(false);
    }
  };

  // Add useEffect to fetch user role when component mounts
  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchBatchStok = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/batch/stock?page=${page}&limit=${limit}&search=${encodeURIComponent(
          searchTerm
        )}`
      );

      // Get batches from response
      let filteredBatches = response.data.result || [];

      // Filter batches based on activeTab
      if (activeTab !== "all") {
        filteredBatches = filteredBatches.filter((batch) => {
          const today = new Date();
          const expDate = batch.exp_date ? new Date(batch.exp_date) : null;
          const diffDays = expDate
            ? Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
            : null;
          const stockQuantity = parseInt(batch.stock_quantity) || 0;

          switch (activeTab) {
            case "expiring":
              return diffDays !== null && diffDays > 0 && diffDays <= 30;
            case "expired":
              return diffDays !== null && diffDays <= 0;
            case "low":
              return stockQuantity > 0 && stockQuantity < 5;
            case "good":
              return diffDays !== null && diffDays > 30;
            default:
              return true;
          }
        });
      }

      setBatchStok(filteredBatches);
      setTotalItems(response.data.totalRows);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching batch stock:", error);
      setLoading(false);
    }
  }, [page, limit, searchTerm, activeTab]);

  useEffect(() => {
    fetchBatchStok();
  }, [fetchBatchStok]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const formatLargeNumber = (number) => {
    if (!number) return "";
    const str = String(number);
    if (str.includes("E+")) {
      const [mantissa, exponent] = str.split("E+");
      const decimalPoints = mantissa.includes(".")
        ? mantissa.split(".")[1].length
        : 0;
      const num = parseFloat(mantissa);
      const exp = parseInt(exponent);
      let result = num.toString().replace(".", "");
      const zerosToAdd = exp - decimalPoints;
      result += "0".repeat(Math.max(0, zerosToAdd));
      return result;
    }
    return str;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getExpirationStatus = (expDate) => {
    if (!expDate) return { status: "none", text: "-" };

    const exp = new Date(expDate);
    const today = new Date();
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        status: "expired",
        text: "Expired",
        color: "text-red-500 bg-red-50",
      };
    } else if (diffDays <= 30) {
      return {
        status: "warning",
        text: `${diffDays} days left`,
        color: "text-amber-500 bg-amber-50",
      };
    } else if (diffDays <= 90) {
      return {
        status: "attention",
        text: `${diffDays} days left`,
        color: "text-blue-500 bg-blue-50",
      };
    } else {
      return {
        status: "good",
        text: new Date(expDate).toLocaleDateString(),
        color: "text-green-500 bg-green-50",
      };
    }
  };

  const getStockStatus = (stockQuantity) => {
    const stockValue = parseInt(stockQuantity || 0);
    if (stockValue === 0) {
      return {
        color: "bg-red-50 text-red-500",
        text: `${stockValue} pcs`,
      };
    } else if (stockValue < 10) {
      return {
        color: "bg-amber-50 text-amber-500",
        text: `${stockValue} pcs`,
      };
    } else {
      return {
        color: "bg-green-50 text-green-500",
        text: `${stockValue} pcs`,
      };
    }
  };

  const handleAddNewOrder = () => {
    if (isRoleLoading) return; // Prevent action while loading

    console.log("Current user role:", userRole); // Debug log

    if (userRole === "admin") {
      navigate("/orderadmin");
    } else {
      navigate("/order");
    }
  };

  return (
    
      <div className="container mx-auto px-4 py-6 pt-20">
        {/* Header Section */}
        <div className="mb-6">
          {/* mobile view */}
          <div className="block md:hidden bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-4 rounded-xl mb-4">
            <div className="flex flex-col md:flex-row justify-start items-start gap-4">
              <div className="flex items-center">
                <Package2 className="text-white mr-3" size={24} />
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Inventory Management
                  </h1>
                  <p className="text-purple-100 text-md mb-2">
                    Monitor batch stock and inventory levels
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center sm:items-end sm:justify-end ml-4">
              <button
                onClick={() => navigate("/product")}
                className="flex items-center bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors mb-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Products
              </button>
            </div>

            {/* Stats Cards - Grid Layout */}
            <div className="px-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Batch</p>
                      <p className="text-lg font-bold">{totalItems || 2347}</p>
                    </div>
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <Package2 className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Current Stock</p>
                      <p className="text-lg font-bold">
                        {batchStok?.reduce(
                          (acc, batch) =>
                            acc + (parseInt(batch.stock_quantity) || 0),
                          0
                        ) || 363}{" "}
                        pcs
                      </p>
                    </div>
                    <div className="bg-green-100 p-1.5 rounded-full">
                      <Clipboard className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Initial Stock</p>
                      <p className="text-lg font-bold">
                        {batchStok?.reduce(
                          (acc, batch) =>
                            acc + (parseInt(batch.initial_stock) || 0),
                          0
                        ) || 132}{" "}
                        pcs
                      </p>
                    </div>
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border-l-4 border-red-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Out of Stock</p>
                      <p className="text-lg font-bold">
                        {batchStok?.filter(
                          (batch) => parseInt(batch.stock_quantity || 0) === 0
                        )?.length || 10}
                      </p>
                    </div>
                    <div className="bg-red-100 p-1.5 rounded-full">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              {/* Tabs Desktop */}
              <div className="hidden md:flex md:flex-col lg:flex-row md:gap-4 lg:justify-between items-center mb-4">
                <div className="relative w-full lg:w-64">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={20}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-lg p-1 shadow-sm w-full lg:w-auto mt-4 lg:mt-0">
                  <div className="flex justify-center lg:justify-start gap-2">
                    <button
                      onClick={() => handleTabChange("all")}
                      className={`px-4 py-2 rounded-md text-sm whitespace-nowrap flex-1 lg:flex-initial ${
                        activeTab === "all"
                          ? "bg-blue-500 text-white"
                          : "text-blue-900 hover:bg-gray-50"
                      }`}
                    >
                      All Products
                    </button>
                    <button
                      onClick={() => handleTabChange("expiring")}
                      className={`px-4 py-2 rounded-md text-sm whitespace-nowrap flex-1 lg:flex-initial ${
                        activeTab === "expiring"
                          ? "bg-blue-500 text-white"
                          : "text-blue-900 hover:bg-gray-50"
                      }`}
                    >
                      Expiring Soon
                    </button>
                    <button
                      onClick={() => handleTabChange("low")}
                      className={`px-4 py-2 rounded-md text-sm whitespace-nowrap flex-1 lg:flex-initial ${
                        activeTab === "low"
                          ? "bg-blue-500 text-white"
                          : "text-blue-900 hover:bg-gray-50"
                      }`}
                    >
                      Low Stock
                    </button>
                    <button
                      onClick={() => handleTabChange("expired")}
                      className={`px-4 py-2 rounded-md text-sm whitespace-nowrap flex-1 lg:flex-initial ${
                        activeTab === "expired"
                          ? "bg-blue-500 text-white"
                          : "text-blue-900 hover:bg-gray-50"
                      }`}
                    >
                      Expired
                    </button>
                  </div>
                </div>

                <div className="flex items-center mt-4 lg:mt-0">
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(0);
                    }}
                    className="border rounded-md px-3 py-2 text-sm bg-white shadow-sm"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabs and Filters - Mobile */}
            <div className="md:hidden space-y-3 ml-4">
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-1 min-w-max ">
                  <button
                    onClick={() => handleTabChange("all")}
                    className={`px-5 py-3 w-full rounded-md text-xs whitespace-nowrap ${
                      activeTab === "all"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-blue-900"
                    }`}
                  >
                    All Products
                  </button>
                  <button
                    onClick={() => handleTabChange("expiring")}
                    className={`px-5 py-3 w-full rounded-md text-xs whitespace-nowrap ${
                      activeTab === "expiring"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-blue-900"
                    }`}
                  >
                    Expiring Soon
                  </button>
                  <button
                    onClick={() => handleTabChange("low")}
                    className={`px-5 py-3 w-full rounded-md text-xs whitespace-nowrap ${
                      activeTab === "low"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-blue-900"
                    }`}
                  >
                    Low Stock
                  </button>
                  <button
                    onClick={() => handleTabChange("expired")}
                    className={`px-5 py-3 w-full rounded-md text-xs whitespace-nowrap ${
                      activeTab === "expired"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-blue-900"
                    }`}
                  >
                    Expired
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={20}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(0);
                    }}
                    className="border rounded-md px-2 py-2 text-sm bg-white shadow-sm"
                    aria-label="Items per page"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-hidden">
            <div className="hidden md:block bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-4 rounded-t-xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center">
                  <Package2 className="text-white mr-3" size={24} />
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">
                      Inventory Management
                    </h1>
                    <p className="text-purple-100 text-sm mb-2">
                      Monitor batch stock and inventory levels
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/product")}
                  className="flex items-center bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back to Products
                </button>
              </div>

              {/* Stats Cards - Improved Grid Layout */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Batch</p>
                      <p className="text-xl font-bold">{totalItems}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Package2 className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Current Stock</p>
                      <p className="text-xl font-bold">
                        {batchStok.reduce(
                          (acc, batch) =>
                            acc + (parseInt(batch.stock_quantity) || 0),
                          0
                        )}{" "}
                        pcs
                      </p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-full">
                      <Clipboard className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Initial Stock</p>
                      <p className="text-xl font-bold">
                        {batchStok.reduce(
                          (acc, batch) =>
                            acc + (parseInt(batch.initial_stock) || 0),
                          0
                        )}{" "}
                        pcs
                      </p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Out of Stock</p>
                      <p className="text-xl font-bold">
                        {
                          batchStok.filter((batch) =>
                            parseInt(batch.stock_quantity || 0)
                          ).length
                        }
                      </p>
                    </div>
                    <div className="bg-red-100 p-2 rounded-full">
                      <Calendar className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                {/* Tabs Desktop */}
                <div className="hidden md:flex md:flex-col lg:flex-row md:gap-4 lg:justify-between items-center mb-4">
                  <div className="relative w-full lg:w-64">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={20}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-1 shadow-sm w-full lg:w-auto mt-4 lg:mt-0">
                    <div className="flex justify-center lg:justify-start gap-2">
                      <button
                        onClick={() => handleTabChange("all")}
                        className={`px-4 py-2 rounded-md text-sm whitespace-nowrap flex-1 lg:flex-initial ${
                          activeTab === "all"
                            ? "bg-blue-500 text-white"
                            : "text-blue-900 hover:bg-gray-50"
                        }`}
                      >
                        All Products
                      </button>
                      <button
                        onClick={() => handleTabChange("expiring")}
                        className={`px-4 py-2 rounded-md text-sm whitespace-nowrap flex-1 lg:flex-initial ${
                          activeTab === "expiring"
                            ? "bg-blue-500 text-white"
                            : "text-blue-900 hover:bg-gray-50"
                        }`}
                      >
                        Expiring Soon
                      </button>
                      <button
                        onClick={() => handleTabChange("low")}
                        className={`px-4 py-2 rounded-md text-sm whitespace-nowrap flex-1 lg:flex-initial ${
                          activeTab === "low"
                            ? "bg-blue-500 text-white"
                            : "text-blue-900 hover:bg-gray-50"
                        }`}
                      >
                        Low Stock
                      </button>
                      <button
                        onClick={() => handleTabChange("expired")}
                        className={`px-4 py-2 rounded-md text-sm whitespace-nowrap flex-1 lg:flex-initial ${
                          activeTab === "expired"
                            ? "bg-blue-500 text-white"
                            : "text-blue-900 hover:bg-gray-50"
                        }`}
                      >
                        Expired
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center mt-4 lg:mt-0">
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(0);
                      }}
                      className="border rounded-md px-3 py-2 text-sm bg-white shadow-sm"
                    >
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Tabs and Filters - Mobile */}
              <div className="md:hidden space-y-3">
                <div className="overflow-x-auto pb-2">
                  <div className="flex bg-white rounded-lg p-1 shadow-sm ">
                    <button
                      onClick={() => handleTabChange("all")}
                      className={`px-4 py-2 rounded-md whitespace-nowrap ${
                        activeTab === "all"
                          ? "bg-blue-500 text-white"
                          : "text-blue-900"
                      }`}
                    >
                      All Products
                    </button>
                    <button
                      onClick={() => handleTabChange("expiring")}
                      className={`px-4 py-2 rounded-md whitespace-nowrap ${
                        activeTab === "expiring"
                          ? "bg-blue-500 text-white"
                          : "text-blue-900"
                      }`}
                    >
                      Expiring Soon
                    </button>
                    <button
                      onClick={() => handleTabChange("low")}
                      className={`px-4 py-2 rounded-md whitespace-nowrap ${
                        activeTab === "low"
                          ? "bg-blue-500 text-white"
                          : "text-blue-900"
                      }`}
                    >
                      Low Stock
                    </button>
                    <button
                      onClick={() => handleTabChange("expired")}
                      className={`px-4 py-2 rounded-md whitespace-nowrap ${
                        activeTab === "expired"
                          ? "bg-blue-500 text-white"
                          : "text-blue-900"
                      }`}
                    >
                      Expired
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={20}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(0);
                      }}
                      className="border rounded-md px-2 py-2 text-sm bg-white shadow-sm"
                      aria-label="Items per page"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Table Desktop*/}
          <div className="hidden md:block bg-white  shadow-md overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Initial Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrival Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiration
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {" "}
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="p-4">
                        <div className="flex justify-center items-center py-8">
                          <div className="flex items-center space-x-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="text-gray-500 text-sm">
                              Loading inventory data...
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : batchStok.length > 0 ? (
                    batchStok.map((batch, index) => {
                      const stockStatus = getStockStatus(batch.stock_quantity);
                      const expStatus = getExpirationStatus(batch.exp_date);

                      return (
                        <tr key={batch.batch_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1 + page * limit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {formatLargeNumber(
                                batch.code_product ||
                                  (batch.Product && batch.Product.code_product)
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {batch.Product && batch.Product.name_product}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {batch.batch_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">
                              Rp {Number(batch.purchase_price).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {batch.initial_stock || 0} pcs
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                            >
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {batch.arrival_date
                              ? new Date(
                                  batch.arrival_date
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {batch.exp_date
                              ? new Date(batch.exp_date).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${expStatus.color}`}
                            >
                              {expStatus.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <Package className="h-10 w-10 text-gray-400" />
                          <p className="text-gray-500">No batch stock found</p>
                          <button
                            onClick={handleAddNewOrder}
                            disabled={isRoleLoading}
                            className={`text-sm bg-blue-50 text-blue-600 px-4 py-1 rounded-full mt-2 hover:bg-blue-100 ${
                              isRoleLoading
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            Add New Order
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="hidden md:block">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                itemsPerPage={limit}
                totalItems={totalItems}
              />
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <LoadingComponent />
            ) : batchStok.length === 0 ? (
              <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
                No batch stock found
              </div>
            ) : (
              batchStok.map((batch) => {
                const stockStatus = getStockStatus(batch.stock_quantity);
                return (
                  <div
                    key={batch.batch_id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl"
                  >
                    <div
                      className="flex items-center p-4 space-x-3 cursor-pointer"
                      onClick={() => toggleRow(batch.batch_id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {batch.batch_code}
                          </h3>
                          <span className="text-sm font-bold text-emerald-600 ml-2">
                            Rp {Number(batch.purchase_price).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full ">
                            {formatLargeNumber(batch.code_product)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-gray-400">
                        {expandedRow === batch.batch_id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    {expandedRow === batch.batch_id && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 pt-3">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Initial Stock
                            </p>
                            <p className="text-sm text-gray-700">
                              {batch.initial_stock || 0} pcs
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Stock Quantity
                            </p>
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}
                            >
                              {stockStatus.text}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Arrival Date
                            </p>
                            <p className="text-sm text-gray-700">
                              {batch.arrival_date
                                ? new Date(
                                    batch.arrival_date
                                  ).toLocaleDateString()
                                : "-"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Expiration Date
                            </p>
                            <p className="text-sm text-gray-700">
                              {batch.exp_date
                                ? new Date(batch.exp_date).toLocaleDateString()
                                : "-"}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 uppercase">
                                Status
                              </p>
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                                  getExpirationStatus(batch.exp_date).color
                                }`}
                              >
                                {getExpirationStatus(batch.exp_date).text}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 md:hidden">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={limit}
              totalItems={totalItems}
            />
          </div>
        </div>
      </div>
    
  );
};

export default BatchStok;
