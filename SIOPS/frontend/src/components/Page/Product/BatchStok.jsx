import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "./Pagination";
import api from "../../../service/api";
import {
  Search,
  ArrowLeft,
  Package,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Package2,
  DollarSign,
} from "lucide-react";
import LoadingComponent from "../../LoadingComponent";

const BatchStok = () => {
  const navigate = useNavigate();
  const [batchStok, setBatchStok] = useState([]);

  // Include custom scrollbar hiding styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      /* Hide scrollbar for Chrome, Safari and Opera */
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      /* Hide scrollbar for IE, Edge and Firefox */
      .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
    `;
    document.head.appendChild(style);

    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showAllData, setShowAllData] = useState(false); // Track if "All Data" is selected
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState("staff");
  const [isStockHovered, setIsStockHovered] = useState(null);

  // Setup scroll shadow effect for table
  useEffect(() => {
    const tableContainer = document.getElementById("batchStockTable");
    const rightShadow = document.getElementById("rightShadow");

    if (tableContainer && rightShadow) {
      const handleScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = tableContainer;

        // Calculate scroll position percentage (0 to 1)
        const scrollPercentage = scrollLeft / (scrollWidth - clientWidth);
        const distanceToEnd = scrollWidth - (scrollLeft + clientWidth);

        // For right shadow:
        // - Hide completely when close to the right edge (last 10% of scroll)
        // - Only show when not near the right edge
        if (scrollPercentage < 0.9 && distanceToEnd > 20) {
          // Fade in based on how far from the end we are
          rightShadow.style.opacity = "1";
        } else {
          rightShadow.style.opacity = "0";
        }
      };

      // Initial check
      handleScroll();

      // Add scroll event listener
      tableContainer.addEventListener("scroll", handleScroll);

      // Cleanup
      return () => {
        tableContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [batchStok]); // Re-run when data changes

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
    fetchAllBatchData(); // Fetch all data for card calculations
  }, []);

  // Function to fetch ALL batch data for card calculations
  const fetchAllBatchData = async () => {
    try {
      const response = await api.get(`/batch/stock?limit=10000`); // Get all data
      const allBatches = response.data.result || [];
      setAllBatchData(allBatches);
    } catch (error) {
      console.error("Error fetching all batch data:", error);
      setAllBatchData([]);
    }
  };

  // State for data cache
  const [dataCache, setDataCache] = useState({});
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // State for all batch data (for card calculations)
  const [allBatchData, setAllBatchData] = useState([]);

  const fetchBatchStok = useCallback(async () => {
    try {
      // Create a cache key based on current filters
      const cacheKey = `${activeTab}-${page}-${limit}-${searchTerm}`;

      // Only show loading on first load or when changing filters that need server fetch
      const needsServerFetch = activeTab === "all" || !initialLoadDone;

      // Check if we have this data in cache
      if (dataCache[cacheKey]) {
        // Use cached data without showing loading indicator
        const cachedData = dataCache[cacheKey];
        setBatchStok(cachedData.data);
        setTotalItems(cachedData.totalItems);
        setTotalPages(cachedData.totalPages);
        return; // Skip API call completely
      }

      // Only show loading if we need to fetch from server
      if (needsServerFetch) {
        setLoading(true);
      }

      // If activeTab is "all", use server-side pagination
      // Otherwise, fetch all data for client-side filtering
      const fetchLimit = activeTab === "all" ? limit : 2500; // Fetch more when filtering
      const fetchPage = activeTab === "all" ? page : 0; // Start from first page when filtering

      const response = await api.get(
        `/batch/stock?page=${fetchPage}&limit=${fetchLimit}&search=${encodeURIComponent(
          searchTerm
        )}`
      );

      // Get batches from response
      let allBatches = response.data.result || [];

      // Filter batches based on activeTab
      let filteredBatches = allBatches;
      let resultData;
      let totalItemsCount;
      let totalPagesCount;

      if (activeTab !== "all") {
        filteredBatches = allBatches.filter((batch) => {
          const today = new Date();
          const expDate = batch.exp_date ? new Date(batch.exp_date) : null;
          const diffDays = expDate
            ? Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
            : null;
          const stockQuantity = parseInt(batch.stock_quantity) || 0;

          switch (activeTab) {
            case "expiring":
              return diffDays !== null && diffDays > 0 && diffDays <= 60;
            case "expired":
              return diffDays !== null && diffDays <= 0;
            case "low":
              // Use product's min_stock if available, otherwise fallback to old value 5
              const minStock = batch.Product?.min_stock
                ? parseInt(batch.Product.min_stock)
                : 5;
              // Ubah definisi low stock: stok sedikit di atas min_stock (1-5 di atas min_stock)
              return stockQuantity > minStock && stockQuantity <= minStock + 5;
            case "good":
              return diffDays !== null && diffDays > 60;
            default:
              return true;
          }
        });

        // Apply client-side pagination for filtered data
        const startIndex = page * limit;
        const paginatedBatches = filteredBatches.slice(
          startIndex,
          startIndex + limit
        );
        resultData = paginatedBatches;
        totalItemsCount = filteredBatches.length;
        totalPagesCount = Math.ceil(filteredBatches.length / limit);
      } else {
        // For "all" tab, use server-side pagination
        resultData = allBatches;
        totalItemsCount = response.data.totalRows;
        totalPagesCount = response.data.totalPages;
      }

      // Ensure every batch has a valid batch_id
      const validatedData = resultData.map((batch, idx) => {
        if (!batch.batch_id) {
          batch.batch_id = `batch-${idx}-${Date.now()}`;
        }

        // Make sure batch is an object with proper structure
        if (typeof batch !== "object") {
          console.warn("Invalid batch item detected and fixed:", batch);
          return {
            batch_id: `fixed-batch-${idx}-${Date.now()}`,
            batch_code: "UNKNOWN",
            stock_quantity: 0,
            initial_stock: 0,
          };
        }

        return batch;
      });

      // Save to state
      setBatchStok(validatedData);
      setTotalItems(totalItemsCount);
      setTotalPages(totalPagesCount);

      // Save to cache using the same cache key from earlier
      setDataCache((prev) => ({
        ...prev,
        [`${activeTab}-${page}-${limit}-${searchTerm}`]: {
          data: resultData,
          totalItems: totalItemsCount,
          totalPages: totalPagesCount,
          timestamp: Date.now(),
        },
      }));

      // Mark that initial load is complete
      setInitialLoadDone(true);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching batch stock:", error);
      setLoading(false);
    }
  }, [page, limit, searchTerm, activeTab, dataCache, initialLoadDone]);

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

  // Stock message utility functions
  const getStockMessage = (stockQuantity, minStock) => {
    const stockValue = parseInt(stockQuantity || 0);
    const minStockValue = parseInt(minStock || 5);

    if (stockValue <= minStockValue) {
      return {
        icon: <AlertTriangle size={16} className="inline mr-1 text-red-600" />,
        message: "Stock is below minimum",
      };
    }

    const difference = stockValue - minStockValue;
    if (difference <= 5) {
      return {
        icon: <AlertCircle size={16} className="inline mr-1 text-yellow-600" />,
        message: "Stock is running low",
      };
    }

    return {
      icon: <CheckCircle size={16} className="inline mr-1 text-green-600" />,
      message: "Stock is sufficient",
    };
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
    } else if (diffDays <= 60) {
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

  const getStockStatus = (stockQuantity, product) => {
    const stockValue = parseInt(stockQuantity || 0);
    const minStock = product?.min_stock ? parseInt(product.min_stock) : 5;
    const lowStockThreshold = minStock + 5;

    if (stockValue <= minStock) {
      return {
        color: "bg-red-100 text-red-800",
        text: `${stockValue} pcs`,
      };
    } else if (stockValue > minStock && stockValue <= lowStockThreshold) {
      return {
        color: "bg-yellow-100 text-yellow-800",
        text: `${stockValue} pcs`,
      };
    } else {
      return {
        color: "bg-green-100 text-green-800",
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
        <div className="block md:hidden bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-4 rounded-t-xl">
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
          <div className="flex items-center sm:items-end sm:justify-end">
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
                    <p className="text-lg font-bold">
                      {showAllData ? allBatchData.length : batchStok.length}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-1.5 rounded-full">
                    <Package2 className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Total Stock</p>
                    <p className="text-lg font-bold">
                      {(showAllData ? allBatchData : batchStok)
                        ?.reduce(
                          (acc, batch) =>
                            acc + (parseInt(batch.stock_quantity) || 0),
                          0
                        )
                        .toLocaleString("id-ID") || 0}{" "}
                      pcs
                    </p>
                  </div>
                  <div className="bg-green-100 p-1.5 rounded-full">
                    <Package className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border-l-4 border-yellow-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-lg font-bold">
                      Rp{" "}
                      {(
                        (showAllData ? allBatchData : batchStok)?.reduce(
                          (acc, batch) => {
                            const qty = parseInt(batch.stock_quantity) || 0;
                            const price = parseFloat(batch.purchase_price) || 0;
                            return acc + qty * price;
                          },
                          0
                        ) || 0
                      ).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-1.5 rounded-full">
                    <DollarSign className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Normal Stock</p>
                    <p className="text-lg font-bold">
                      {(
                        (showAllData ? allBatchData : batchStok)?.reduce(
                          (total, batch) => {
                            const stockQty =
                              parseInt(batch.stock_quantity) || 0;
                            const minStock = batch.Product?.min_stock
                              ? parseInt(batch.Product.min_stock) || 5
                              : 5;
                            const expDate = batch.exp_date
                              ? new Date(batch.exp_date)
                              : null;
                            const today = new Date();
                            const diffDays = expDate
                              ? Math.ceil(
                                  (expDate - today) / (1000 * 60 * 60 * 24)
                                )
                              : null;

                            // Normal stock: tidak low, tidak expired, tidak expiring soon
                            const isNotExpired = !expDate || diffDays > 0;
                            const isNotExpiringSoon = !expDate || diffDays > 60;
                            const isNotLowStock = stockQty > minStock + 5;

                            // If batch is normal, add its quantity to total
                            if (
                              isNotExpired &&
                              isNotExpiringSoon &&
                              isNotLowStock
                            ) {
                              return total + stockQty;
                            }
                            return total;
                          },
                          0
                        ) || 0
                      ).toLocaleString("id-ID")}{" "}
                      pcs
                    </p>
                  </div>
                  <div className="bg-blue-100 p-1.5 rounded-full">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
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
                  value={showAllData ? "all" : limit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "all") {
                      setShowAllData(true);
                      setLimit(10); // Keep limit for pagination logic
                    } else {
                      setShowAllData(false);
                      setLimit(Number(value));
                    }
                    setPage(0);
                  }}
                  className="border rounded-md px-3 py-2 text-sm bg-white shadow-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                  <option value="all">All Data</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs and Filters - Mobile */}
          <div className="md:hidden space-y-3">
            <div className="overflow-x-auto pb-2 px-4">
              <div className="flex gap-1 min-w-max bg-white rounded-t-xl shadow-sm p-1">
                <button
                  onClick={() => handleTabChange("all")}
                  className={`px-5 py-2.5 w-full rounded-md text-xs whitespace-nowrap ${
                    activeTab === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-50 text-blue-900"
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => handleTabChange("expiring")}
                  className={`px-5 py-2.5 w-full rounded-md text-xs whitespace-nowrap ${
                    activeTab === "expiring"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-50 text-blue-900"
                  }`}
                >
                  Expiring Soon
                </button>
                <button
                  onClick={() => handleTabChange("low")}
                  className={`px-5 py-2.5 w-full rounded-md text-xs whitespace-nowrap ${
                    activeTab === "low"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-50 text-blue-900"
                  }`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => handleTabChange("expired")}
                  className={`px-5 py-2.5 w-full rounded-md text-xs whitespace-nowrap ${
                    activeTab === "expired"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-50 text-blue-900"
                  }`}
                >
                  Expired
                </button>
              </div>
            </div>

            <div className="px-4 py-2 bg-white shadow-sm flex items-center gap-2">
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

              <div className="flex-shrink-0">
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
                    <p className="text-xl font-bold">
                      {showAllData ? allBatchData.length : batchStok.length}
                    </p>
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
                      {(
                        (showAllData ? allBatchData : batchStok).reduce(
                          (acc, batch) =>
                            acc + (parseInt(batch.stock_quantity) || 0),
                          0
                        ) || 0
                      ).toLocaleString("id-ID")}{" "}
                      pcs
                    </p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <Package className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-xl font-bold">
                      Rp{" "}
                      {(
                        (showAllData ? allBatchData : batchStok).reduce(
                          (acc, batch) => {
                            const qty = parseInt(batch.stock_quantity) || 0;
                            const price = parseFloat(batch.purchase_price) || 0;
                            return acc + qty * price;
                          },
                          0
                        ) || 0
                      ).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <DollarSign className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Normal Stock</p>
                    <p className="text-xl font-bold">
                      {(
                        (showAllData ? allBatchData : batchStok).reduce(
                          (total, batch) => {
                            const stockQty =
                              parseInt(batch.stock_quantity) || 0;
                            const minStock = batch.Product?.min_stock
                              ? parseInt(batch.Product.min_stock) || 5
                              : 5;
                            const expDate = batch.exp_date
                              ? new Date(batch.exp_date)
                              : null;
                            const today = new Date();
                            const diffDays = expDate
                              ? Math.ceil(
                                  (expDate - today) / (1000 * 60 * 60 * 24)
                                )
                              : null;

                            // Normal stock: tidak low, tidak expired, tidak expiring soon
                            const isNotExpired = !expDate || diffDays > 0;
                            const isNotExpiringSoon = !expDate || diffDays > 60;
                            const isNotLowStock = stockQty > minStock + 5;

                            // If batch is normal, add its quantity to total
                            if (
                              isNotExpired &&
                              isNotExpiringSoon &&
                              isNotLowStock
                            ) {
                              return total + stockQty;
                            }
                            return total;
                          },
                          0
                        ) || 0
                      ).toLocaleString("id-ID")}{" "}
                      pcs
                    </p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <CheckCircle className="h-6 w-6 text-blue-500" />
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
                    value={showAllData ? "all" : limit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "all") {
                        setShowAllData(true);
                        setLimit(10); // Keep limit for pagination logic
                      } else {
                        setShowAllData(false);
                        setLimit(Number(value));
                      }
                      setPage(0);
                    }}
                    className="border rounded-md px-3 py-2 text-sm bg-white shadow-sm"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                    <option value="all">All Data</option>
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
        <div className="hidden md:block bg-white shadow-md overflow-hidden mb-6">
          <div
            className="relative overflow-x-auto scrollbar-hide"
            id="batchStockTable"
          >
            <div
              className="absolute pointer-events-none inset-y-0 right-0 w-24 "
              id="rightShadow"
            ></div>
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-100">
                <tr>
                  <th className="sticky left-0 z-30 bg-gray-100 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[60px] ">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                    Product Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Initial Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Stock Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Arrival Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Expired Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-4 bg-white">
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
                    // Ensure we have a valid batch object
                    if (!batch || typeof batch !== "object") {
                      return null; // Skip invalid batch entries
                    }

                    const stockStatus = getStockStatus(
                      batch.stock_quantity,
                      batch.Product
                    );

                    return (
                      <tr
                        key={batch.batch_id || `batch-${index}-${Date.now()}`}
                        className="group hover:bg-blue-50/40 transition-colors"
                      >
                        <td
                          className="sticky left-0 z-30 bg-white px-6 py-4 whitespace-nowrap text-sm text-gray-500 shadow-[5px_0_8px_-2px_rgba(0,0,0,0.15)]"
                          style={{ isolation: "isolate" }}
                        >
                          {/* Force displaying only number in this column */}
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
                          <div
                            className="relative"
                            onMouseEnter={() =>
                              setIsStockHovered(batch.batch_id)
                            }
                            onMouseLeave={() => setIsStockHovered(null)}
                          >
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                            >
                              {stockStatus.text}
                            </span>

                            {isStockHovered === batch.batch_id && (
                              <div className="absolute z-10 transform -translate-y-full -translate-x-1/4 top-0 left-0 px-3 py-2 bg-white text-sm rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
                                <span
                                  className={`text-sm ${
                                    parseInt(batch.stock_quantity || 0) <=
                                    parseInt(batch.Product?.min_stock || 5)
                                      ? "text-red-600"
                                      : parseInt(batch.stock_quantity || 0) -
                                          parseInt(
                                            batch.Product?.min_stock || 5
                                          ) <=
                                        5
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {
                                    getStockMessage(
                                      batch.stock_quantity,
                                      batch.Product?.min_stock
                                    ).icon
                                  }
                                  {
                                    getStockMessage(
                                      batch.stock_quantity,
                                      batch.Product?.min_stock
                                    ).message
                                  }
                                </span>
                              </div>
                            )}
                          </div>
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
                          {(() => {
                            const today = new Date();
                            const expDate = batch.exp_date
                              ? new Date(batch.exp_date)
                              : null;
                            const diffDays = expDate
                              ? Math.ceil(
                                  (expDate - today) / (1000 * 60 * 60 * 24)
                                )
                              : null;
                            if (!expDate) return "-";
                            if (diffDays <= 0) {
                              return (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-500">
                                  Expired ({expDate.toLocaleDateString()})
                                </span>
                              );
                            } else if (diffDays <= 30) {
                              return (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-500">
                                  {diffDays} days left (
                                  {expDate.toLocaleDateString()})
                                </span>
                              );
                            } else if (diffDays <= 60) {
                              return (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-500">
                                  {diffDays} days left (
                                  {expDate.toLocaleDateString()})
                                </span>
                              );
                            } else {
                              return (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-500">
                                  {expDate.toLocaleDateString()}
                                </span>
                              );
                            }
                          })()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-10 text-center bg-white">
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="h-10 w-10 text-gray-400" />
                        <p className="text-gray-500">No batch stock found</p>
                        <button
                          onClick={handleAddNewOrder}
                          disabled={isRoleLoading}
                          className={`text-sm bg-blue-50 text-blue-600 px-4 py-1 rounded-full mt-2 hover:bg-blue-100 ${
                            isRoleLoading ? "opacity-50 cursor-not-allowed" : ""
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
          <div className="relative hidden md:block border-t border-gray-200 bg-gray-50 px-6 py-2">
            <div className="absolute inset-x-0 -top-4 h-4 bg-gradient-to-b from-transparent to-gray-100/30 pointer-events-none"></div>
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
        <div className="md:hidden space-y-0">
          {loading ? (
            <LoadingComponent />
          ) : batchStok.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
              No batch stock found
            </div>
          ) : (
            batchStok.map((batch, index) => {
              // Skip invalid batch entries
              if (!batch || typeof batch !== "object") {
                return null;
              }

              const stockStatus = getStockStatus(
                batch.stock_quantity,
                batch.Product
              );
              return (
                <div
                  key={batch.batch_id || `batch-mobile-${index}-${Date.now()}`}
                  className={`bg-white shadow-sm overflow-hidden transition-all duration-200 ${
                    index !== 0 ? "border-t border-gray-200" : ""
                  }`}
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
                        <span className="text-xs px-2 py-1 text-gray-600">
                          {formatLargeNumber(batch.code_product)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {batch.Product && batch.Product.name_product}
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
                          <div
                            className="relative"
                            onMouseEnter={() =>
                              setIsStockHovered(`mobile-${batch.batch_id}`)
                            }
                            onMouseLeave={() => setIsStockHovered(null)}
                          >
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}
                            >
                              {stockStatus.text}
                            </span>

                            {isStockHovered === `mobile-${batch.batch_id}` && (
                              <div className="absolute z-10 transform -translate-y-full left-0 px-3 py-2 bg-white text-sm rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
                                <span
                                  className={`text-sm ${
                                    parseInt(batch.stock_quantity || 0) <=
                                    parseInt(batch.Product?.min_stock || 5)
                                      ? "text-red-600"
                                      : parseInt(batch.stock_quantity || 0) -
                                          parseInt(
                                            batch.Product?.min_stock || 5
                                          ) <=
                                        5
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {
                                    getStockMessage(
                                      batch.stock_quantity,
                                      batch.Product?.min_stock
                                    ).icon
                                  }
                                  {
                                    getStockMessage(
                                      batch.stock_quantity,
                                      batch.Product?.min_stock
                                    ).message
                                  }
                                </span>
                              </div>
                            )}
                          </div>
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

        <div className="md:hidden bg-gray-50 border border-gray-200 rounded-b-xl shadow-sm">
          <div className="px-4 py-3">
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
    </div>
  );
};

export default BatchStok;
