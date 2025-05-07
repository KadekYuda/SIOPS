import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "./Pagination";
import api from "../../../service/api";
import {
  Search,
  ArrowLeft,
  Calendar,
  Package,
  Clock,
  Clipboard,
  X,
  ChevronDown,
  ChevronUp,
  Package2,
} from "lucide-react";

const BatchStok = () => {
  const navigate = useNavigate();
  const [batchStok, setBatchStok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);

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

          switch (activeTab) {
            case "expiring":
              return diffDays !== null && diffDays > 0 && diffDays <= 30;
            case "expired":
              return diffDays !== null && diffDays <= 0;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 pt-20">
        {/* Header with improved styling */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/product")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 shadow-sm transition-all"
              title="Back to Products"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Inventory Management
            </h1>
          </div>
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
                <p className="text-sm text-gray-500">Total Stock</p>
                <p className="text-xl font-bold">
                  {batchStok.reduce(
                    (acc, batch) =>
                      acc +
                      parseInt(batch.stock_quantity || 0) +
                      parseInt(batch.initial_stock || 0),
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

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-xl font-bold">
                  {
                    batchStok.filter((batch) => {
                      const today = new Date();
                      const expDate = batch.exp_date
                        ? new Date(batch.exp_date)
                        : null;
                      const diffDays = expDate
                        ? Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
                        : null;
                      return (
                        diffDays !== null && diffDays > 0 && diffDays <= 30
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="bg-amber-100 p-2 rounded-full">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-xl font-bold">
                  {
                    batchStok.filter(
                      (batch) =>
                        parseInt(batch.stock_quantity || 0) +
                          parseInt(batch.initial_stock || 0) ===
                        0
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
          <div className="hidden md:flex md:justify-between items-center mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-64 pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            <div className="bg-white rounded-lg p-1 shadow-sm">
              <div className="flex gap-3">
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

            <div className="flex items-center gap-3">
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

        {/* Main Table Desktop*/}
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden mb-6">
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
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-10 text-center">
                      <div className="flex flex-col justify-center items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-gray-500">
                          Loading inventory data...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : batchStok.length > 0 ? (
                  batchStok.map((batch, index) => {
                    const stockValue =
                      parseInt(batch.stock_quantity || 0) +
                      parseInt(batch.initial_stock || 0);
                    const stockStatus =
                      stockValue === 0
                        ? "bg-red-50 text-red-500"
                        : stockValue < 10
                        ? "bg-amber-50 text-amber-500"
                        : "bg-green-50 text-green-500";

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
                            className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus}`}
                          >
                            {stockValue} pcs
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.arrival_date
                            ? new Date(batch.arrival_date).toLocaleDateString()
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
                        <button className="text-sm bg-blue-50 text-blue-600 px-4 py-1 rounded-full mt-2 hover:bg-blue-100">
                          Add New Product
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
            <div className="bg-white p-6 rounded-xl shadow-lg flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : batchStok.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
              No batch stock found
            </div>
          ) : (
            batchStok.map((batch) => (
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
                        <p className="text-sm text-gray-700">
                          {batch.stock_quantity || 0} pcs
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Arrival Date
                        </p>
                        <p className="text-sm text-gray-700">
                          {batch.arrival_date
                            ? new Date(batch.arrival_date).toLocaleDateString()
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
            ))
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
