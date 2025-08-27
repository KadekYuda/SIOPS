import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  Package,
  DollarSign,
  ClipboardList,
  Check,
  ShoppingCart,
  Filter,
} from "lucide-react";
import AlertModal from "../../modal/AlertModal";
import SuccessModal from "../../modal/SuccessModal";
import api from "../../../service/api";
import Pagination from "../Product/Pagination";
import ProductSelect from "./ProductSelect";
import SalesDetails from "./SalesDetails";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [activeTab, setActiveTab] = useState("manual"); // "manual" or "import"
  const [selectedSaleId, setSelectedSaleId] = useState(null); // For modal
  const fileInputRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    sort_by: "sales_date",
    sort_dir: "DESC", // Keep this for backend sorting direction
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Apply filters function
  const applyFilters = () => {
    console.log("Applying filters:", filters);
    setCurrentPage(0); // Reset pagination when applying filters
    fetchSales(filters);
  };

  // Reset filters function
  const resetFilters = () => {
    const resetFilterState = {
      start_date: "",
      end_date: "",
      sort_by: "sales_date",
      sort_dir: "DESC",
    };
    setFilters(resetFilterState);
    setCurrentPage(0); // Reset pagination when resetting filters
    fetchSales(resetFilterState);
  };

  const [manualSale, setManualSale] = useState({
    sales_date: new Date().toISOString().split("T")[0],
    total_amount: 0,
    items: [
      {
        code_product: "",
        product_name: "",
        quantity: "",
        selling_price: "",
        subtotal: 0,
        available_batches: [],
      },
    ],
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const getCurrentPageItems = () => {
    // IMPORTANT: Don't override backend sorting!
    // Backend already handles sorting based on user's filter choice
    // We only need to add running numbers and paginate

    // Calculate proper running numbers based on pagination and total data
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const currentPageData = sales.slice(start, end);

    // Add running numbers that reflect reverse order (newest gets highest number)
    const salesWithNumber = currentPageData.map((item, idx) => ({
      ...item,
      running_number: sales.length - (start + idx), // Reverse numbering
    }));

    return salesWithNumber;
  };

  // Fetch sales with useCallback to prevent dependency loop in useEffect
  const fetchSales = useCallback(
    async (filterParams = {}) => {
      try {
        setIsLoading(true);

        // Build query string from filter parameters
        const queryParams = new URLSearchParams();

        // Use the filterParams directly if provided, otherwise use current filters
        const paramsToUse =
          Object.keys(filterParams).length > 0 ? filterParams : filters;
        console.log("Parameters being used for API call:", paramsToUse);

        Object.entries(paramsToUse).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });

        console.log(
          "Query params being sent to backend:",
          queryParams.toString()
        );

        // Get sales with user data included from backend
        const response = await api.get(`/sales?${queryParams.toString()}`);

        console.log(
          "Backend response received:",
          response.data.length,
          "items"
        );

        // Optimize date processing - avoid redundant operations
        const salesWithDates = response.data.map((sale) => {
          const user = sale.User || { name: sale.user?.name || "Unknown" };

          // Only parse date once and format it
          const saleDate = new Date(sale.sales_date);
          const formattedDate = saleDate.toLocaleString("id-ID", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });

          return {
            ...sale,
            sales_date: sale.sales_date,
            User: user,
            user: user,
            formattedDate: formattedDate,
          };
        });

        // Let backend handle sorting instead of frontend
        setSales(salesWithDates);
        console.log("Sales state updated with", salesWithDates.length, "items");
      } catch (error) {
        console.error("Error fetching sales:", error);
        setAlertMessage(error.response?.data?.msg || "Error fetching sales");
        setShowAlert(true);
      } finally {
        setIsLoading(false);
      }
    },
    [filters] // Include filters dependency
  );

  // Function to check if user is admin
  const checkUserRole = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      const userRole = response.data.user?.role;
      setIsAdmin(userRole === "admin");
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.result || []);
    } catch (error) {
      setAlertMessage(error.response?.data?.msg || "Error fetching products");
      setShowAlert(true);
    }
  }, []);

  useEffect(() => {
    // Initial fetch with default filters
    fetchSales(filters);
    fetchProducts();
    checkUserRole();
  }, [fetchSales, filters, fetchProducts, checkUserRole]); // Include all dependencies

  const fetchBatchesForProduct = async (code_product, index) => {
    try {
      const response = await api.get(`/batch/product/${code_product}`);
      const batches = response.data.result || [];
      const batchesWithTotalStock = batches.map((batch) => ({
        ...batch,
        totalStock: batch.stock_quantity || 0,
      }));

      handleItemChange(index, "available_batches", batchesWithTotalStock);

      const product = products.find((p) => p.code_product === code_product);
      if (product && !manualSale.items[index].selling_price) {
        handleItemChange(index, "selling_price", product.sell_price);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const handleProductSelect = async (index, code_product) => {
    if (!code_product || code_product === "") {
      // Handle clearing/removing product selection
      handleItemChange(index, "code_product", "");
      handleItemChange(index, "product_name", "");
      handleItemChange(index, "selling_price", "");
      handleItemChange(index, "available_batches", []);
      // Reset subtotal when product is cleared
      handleItemChange(index, "subtotal", 0);
    } else {
      // Handle selecting a product
      const product = products.find((p) => p.code_product === code_product);
      if (product) {
        handleItemChange(index, "code_product", product.code_product);
        handleItemChange(index, "product_name", product.name_product);
        await fetchBatchesForProduct(product.code_product, index);
      }
    }
  };
  const handleUpload = async () => {
    if (!csvFile) {
      setAlertMessage("Please select a CSV file");
      setShowAlert(true);
      return;
    }

    if (!csvFile.name.endsWith(".csv")) {
      setAlertMessage("Please select a valid CSV file");
      setShowAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", csvFile);

      // Add timestamp to prevent caching
      const response = await api.post(
        `/sales/import?t=${Date.now()}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // Increase timeout to 30 seconds for larger files
        }
      );

      let successMsg = `✅ Import successful!\n${
        response.data.msg || "Sales data imported successfully"
      }`;

      // Add information about skipped inactive products
      if (response.data.skipped_inactive_count > 0) {
        successMsg += `\n\n⚠️ ${response.data.skipped_inactive_count} inactive products were skipped:`;
        if (response.data.skipped_inactive_items) {
          response.data.skipped_inactive_items.forEach((item) => {
            successMsg += `\n• ${item.name_product} (${item.code_product})`;
          });
        }
      }

      setSuccessMessage(successMsg);
      setShowSuccess(true);
      fetchSales();
      clearCsvFile();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      let errorMessage =
        error.response?.data?.msg || error.message || "Error importing sales";

      if (error.response?.data?.details) {
        const details = error.response.data.details;
        const sortedDetails = [...details].sort((a, b) => {
          const productA = products.find(
            (p) => p.code_product === a.code_product
          );
          const productB = products.find(
            (p) => p.code_product === b.code_product
          );
          return (productA?.name_product || a.code_product).localeCompare(
            productB?.name_product || b.code_product
          );
        });

        errorMessage =
          "❌ Insufficient stock for these products:\n\n" +
          sortedDetails
            .map((detail) => {
              const product = products.find(
                (p) => p.code_product === detail.code_product
              );
              const name = product ? product.name_product : "Unknown Product";
              return `📦 ${name}\n   Product Code: ${detail.code_product}\n   Stock Available: ${detail.available}\n   Quantity Requested: ${detail.requested}`;
            })
            .join("\n\n") +
          "\n\nPlease check the quantities in your CSV file.";
      }

      setAlertMessage(errorMessage);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle CSV file selection with proper reset
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // First clear any previous file to reset state
      clearCsvFile();
      // Then set the new file
      setTimeout(() => {
        // Small timeout to ensure DOM is updated
        setCsvFile(file);
      }, 10);
    }
  };

  const handleItemChange = (index, field, value) => {
    setManualSale((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "selling_price") {
            const quantity =
              field === "quantity" ? Number(value) : Number(item.quantity);
            const price =
              field === "selling_price"
                ? Number(value)
                : Number(item.selling_price);
            updatedItem.subtotal = quantity * price;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const handleAddItem = () => {
    setManualSale((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          code_product: "",
          product_name: "",
          quantity: "",
          selling_price: "",
          subtotal: 0,
          available_batches: [],
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setManualSale((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    await recordSale();
  };

  const recordSale = async () => {
    try {
      setIsLoading(true);

      // Prepare sale data with proper date and time
      const currentDateTime = new Date();
      const saleDateTime = new Date(
        manualSale.sales_date + "T" + currentDateTime.toTimeString().slice(0, 8)
      );

      const saleData = {
        sales_date: saleDateTime.toISOString(), // Send full ISO string with time
        items: manualSale.items.map((item) => ({
          code_product: item.code_product,
          quantity: parseInt(item.quantity, 10),
          selling_price: parseFloat(item.selling_price),
          subtotal: item.subtotal,
        })),
      };

      // Log the request payload for debugging
      console.log("Sending sale data with proper time:", saleData);

      // Make the API call
      const response = await api.post("/sales", saleData);

      // Log the response for debugging
      console.log("Response from backend:", response.data);

      // Handle successful response
      if (response.data && response.data.sales_id) {
        // Show success message
        setSuccessMessage(
          `Sale #${response.data.sales_id} recorded successfully`
        );
        setShowSuccess(true);

        // Reset the form
        setManualSale({
          sales_date: new Date().toISOString().split("T")[0],
          items: [
            {
              code_product: "",
              product_name: "",
              quantity: "",
              selling_price: "",
              subtotal: 0,
              available_batches: [],
            },
          ],
        });

        // Refresh the sales list
        await fetchSales();
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      // Enhanced error logging
      console.error("Sale recording error:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
      });

      // Show user-friendly error message
      const errorMsg =
        error.response?.data?.msg ||
        error.message ||
        "An error occurred while recording the sale";
      setAlertMessage(errorMsg);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateUrl = "/sales_import_template.csv";
    const link = document.createElement("a");
    link.href = templateUrl;
    link.download = "sales_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Completely reset the file input and state
  const clearCsvFile = () => {
    setCsvFile(null);
    // Reset file input value to ensure we can upload the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatPrice = (price) => {
    if (!price) return "Rp 0";
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  const viewSaleDetails = (sale) => {
    setSelectedSaleId(sale.sales_id);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="px-4">
        {/* Sales Management Card Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center">
            <ShoppingCart className="text-white mr-3" size={36} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Sales Management
              </h1>
              <p className="text-indigo-100 text-sm">
                Create, import, and manage sales transactions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium ${
                activeTab === "manual"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "bg-indigo-500 text-white hover:bg-indigo-600 border border-indigo-400"
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium ${
                activeTab === "import"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "bg-indigo-500 text-white hover:bg-indigo-600 border border-indigo-400"
              }`}
            >
              Import Sales
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {/* Import CSV Section */}
          {activeTab === "import" && (
            <div className="bg-white border-gray-200 border rounded-xl shadow-lg mb-6 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full mr-4">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Import Sales from CSV
                    </h2>
                    <p className="text-sm text-gray-500">
                      Upload POS data or use our template
                    </p>
                  </div>
                </div>

                <div
                  className={`border-2 border-dashed ${
                    isLoading
                      ? "border-indigo-300 bg-indigo-50"
                      : csvFile
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-indigo-50"
                  } rounded-lg p-8 text-center cursor-pointer transition-all duration-200`}
                  onClick={() => fileInputRef.current.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type === "text/csv") {
                      // Clear any previous file first to reset state
                      clearCsvFile();
                      // Then set the new file
                      handleCSVUpload({ target: { files: [file] } });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <RefreshCw className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
                      <p className="text-sm text-indigo-600 font-medium">
                        Processing your file...
                      </p>
                    </div>
                  ) : csvFile ? (
                    <div className="flex flex-col items-center">
                      <Upload className="w-16 h-16 text-green-500 mb-4" />
                      <p className="text-sm text-gray-600 font-medium mb-1">
                        {csvFile.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {(csvFile.size / 1024).toFixed(1)}KB • CSV File
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCsvFile();
                          }}
                          className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpload();
                          }}
                          disabled={isLoading}
                          className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                              Importing...
                            </span>
                          ) : (
                            "Import Data"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 font-medium mb-1">
                        Drag and drop your CSV file here
                      </p>
                      <p className="text-xs text-gray-500">
                        or click to browse
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="rounded-lg p-4 bg-indigo-50 border-l-4 border-indigo-500">
                    <h3 className="font-medium mb-2">Supported Formats</h3>
                    <p className="text-sm text-gray-600">
                      CSV files with column headers. Must include date, product,
                      quantity, and price.
                    </p>
                  </div>
                  <div className="rounded-lg p-4 bg-indigo-50 border-l-4 border-indigo-500">
                    <h3 className="font-medium mb-2">Data Rows</h3>
                    <p className="text-sm text-gray-600">
                      System can handle up to 5,000 rows in a single import.
                    </p>
                  </div>
                  <div className="rounded-lg p-4 bg-indigo-50 border-l-4 border-indigo-500">
                    <h3 className="font-medium mb-2">Duplicate Detection</h3>
                    <p className="text-sm text-gray-600">
                      System uses "NO.Nota" column as unique identifier. Same
                      products with different receipt numbers will be imported
                      as separate entries.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center px-6 py-4 bg-indigo-600 text-white text-base font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="mr-2" size={18} />
                    Download Template
                  </button>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-indigo-50">
                  <div className="flex items-center mb-2">
                    <Upload className="w-5 h-5 mr-2 text-indigo-500" />
                    <h3 className="font-medium">Tips for Successful Import</h3>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 pl-7 list-disc">
                    <li>
                      Include "NO.Nota" column with unique receipt numbers to
                      avoid duplicates
                    </li>
                    <li>Ensure date column is in YYYY-MM-DD format</li>
                    <li>Use comma (,) as separator for your CSV file</li>
                    <li>
                      Ensure all products are already registered in the system
                    </li>
                    <li>Avoid special characters in product names</li>
                    <li>Use dot (.) as decimal separator for prices</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Manual Input Section */}
          {activeTab === "manual" && (
            <div className="bg-white rounded-none shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ClipboardList className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Manual Sales Entry
                  </h2>
                  <p className="text-sm text-gray-500">
                    Create a new sale transaction
                  </p>
                </div>
              </div>

              <form onSubmit={handleManualSubmit}>
                <div className="space-y-6">
                  {/* Date Input */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="text-gray-500" />
                      <label
                        htmlFor="saleDate"
                        className="text-sm font-medium text-gray-700"
                      >
                        Sale Date
                      </label>
                      {!isAdmin && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Only editable by admin)
                        </span>
                      )}
                    </div>
                    <input
                      id="saleDate"
                      type="date"
                      value={manualSale.sales_date}
                      onChange={(e) =>
                        setManualSale((prev) => ({
                          ...prev,
                          sales_date: e.target.value,
                        }))
                      }
                      className={`block w-full sm:w-64 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        !isAdmin ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      disabled={!isAdmin}
                      required
                    />
                  </div>

                  {/* Sale Items */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800">
                        Sale Items
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="mr-2" />
                        Add Item
                      </button>
                    </div>

                    {/* Item List */}
                    {manualSale.items.map((item, index) => (
                      <div
                        key={`sale-item-${index}`}
                        className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                      >
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <Package className="text-gray-400" />
                            Item #{index + 1}
                          </h4>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              <Trash2 className="text-xs" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ProductSelect
                              index={index}
                              item={item}
                              products={products}
                              onChange={handleProductSelect}
                            />

                            {/* Quantity, Price, Subtotal Fields */}
                            <div>
                              <label
                                htmlFor={`quantity-${index}`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Quantity
                              </label>
                              <div className="relative">
                                <input
                                  id={`quantity-${index}`}
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  min="1"
                                  required
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                  pcs
                                </span>
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor={`price-${index}`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Price
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                  Rp
                                </span>
                                <input
                                  id={`price-${index}`}
                                  type="text"
                                  value={
                                    item.selling_price
                                      ? Number(
                                          item.selling_price
                                        ).toLocaleString("id-ID")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /[^\d]/g,
                                      ""
                                    );
                                    handleItemChange(
                                      index,
                                      "selling_price",
                                      value
                                    );
                                  }}
                                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  min="0"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                                <DollarSign className="text-gray-500 text-xs" />
                                Subtotal
                              </label>
                              <div className="block w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900">
                                {new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(item.subtotal || 0)}
                              </div>
                            </div>
                          </div>

                          {/* Available Batches */}
                          {item.available_batches.length > 0 && (
                            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                              <h5 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-1">
                                <Package className="text-blue-500" />
                                Available Batches
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {item.available_batches.map((batch) => (
                                  <div
                                    key={batch.batch_id}
                                    className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm"
                                  >
                                    <div className="font-medium text-sm text-gray-800 mb-1">
                                      {batch.batch_code}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="text-gray-600">
                                        Stock: {batch.totalStock || 0}
                                      </div>
                                      <div className="text-gray-600">
                                        Expires:{" "}
                                        {new Date(
                                          batch.exp_date
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Total Amount */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-lg font-semibold text-gray-800">
                          Total Amount:{" "}
                          <span className="text-blue-700">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(
                              manualSale.items.reduce(
                                (sum, item) => sum + (item.subtotal || 0),
                                0
                              )
                            )}
                          </span>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center text-sm transition-colors"
                          >
                            <Plus className="mr-2" size={14} />
                            Add Item
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center text-sm transition-colors"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw
                                  className="animate-spin mr-2"
                                  size={14}
                                />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2" size={14} />
                                Save Sale
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-b-xl shadow-md border border-gray-100 border-t-0">
          <div className="bg-indigo-600 px-4 sm:px-6 py-4 sm:py-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="text-white mr-2 sm:mr-3" size={24} />

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Sales List
                  </h2>
                  <p className="text-sm text-gray-200">
                    View and manage your sales transactions
                  </p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  className="flex items-center text-xs font-medium bg-white/20 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Filter size={12} className="mr-1 sm:mr-1.5" /> Filter
                </button>
                {filterMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-xl p-3 sm:p-4 z-10 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar size={12} className="mr-1.5" /> Filter by Date
                      Range
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
                            setFilters({
                              ...filters,
                              start_date: e.target.value,
                            })
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
                            setFilters({ ...filters, end_date: e.target.value })
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
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          filters.sort_by === "sales_date"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                            : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                        }`}
                        onClick={() => {
                          console.log("Date sort button clicked");
                          const newFilters = {
                            ...filters,
                            sort_by: "sales_date",
                            sort_dir: "DESC",
                          };
                          setFilters(newFilters);
                          setCurrentPage(0); // Reset pagination when sorting
                          console.log(
                            "Setting filters for date sort:",
                            newFilters
                          );
                          fetchSales(newFilters); // Apply immediately
                        }}
                      >
                        Date
                      </button>
                      <button
                        className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          filters.sort_by === "user_name"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                            : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                        }`}
                        onClick={() => {
                          console.log("User sort button clicked");
                          const newFilters = {
                            ...filters,
                            sort_by: "user_name",
                            sort_dir: "ASC",
                          };
                          setFilters(newFilters);
                          setCurrentPage(0); // Reset pagination when sorting
                          console.log(
                            "Setting filters for user sort:",
                            newFilters
                          );
                          fetchSales(newFilters); // Apply immediately
                        }}
                      >
                        User
                      </button>
                      <button
                        className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          filters.sort_by === "total_amount"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                            : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                        }`}
                        onClick={() => {
                          console.log("Total sort button clicked");
                          const newFilters = {
                            ...filters,
                            sort_by: "total_amount",
                            sort_dir: "DESC",
                          };
                          setFilters(newFilters);
                          setCurrentPage(0); // Reset pagination when sorting
                          console.log(
                            "Setting filters for total sort:",
                            newFilters
                          );
                          fetchSales(newFilters); // Apply immediately
                        }}
                      >
                        Total
                      </button>
                    </div>

                    <div className="flex justify-between space-x-2 mt-4">
                      {(filters.start_date ||
                        filters.end_date ||
                        filters.sort_by !== "sales_date") && (
                        <button
                          onClick={() => {
                            resetFilters();
                          }}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center"
                        >
                          <RefreshCw size={12} className="mr-1" /> Reset
                        </button>
                      )}
                      <button
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md ml-auto"
                        onClick={() => {
                          console.log("Apply clicked, filters:", filters);
                          applyFilters();
                          setFilterMenuOpen(false);
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {sales.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full bg-white">
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
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                          TOTAL
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getCurrentPageItems().map((sale) => (
                        <tr key={sale.sales_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-indigo-600 font-medium">
                            #{sale.running_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {sale.user?.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {sale.formattedDate ||
                              new Date(sale.sales_date).toLocaleString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: false,
                                }
                              )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatPrice(sale.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => viewSaleDetails(sale)}
                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100"
                              >
                                <Eye size={12} className="inline mr-1" />
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Card View */}{" "}
                <div className="md:hidden space-y-4">
                  {getCurrentPageItems().map((sale) => (
                    <div
                      key={sale.sales_id}
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          {" "}
                          <div className="flex items-center mb-1">
                            <span className="text-indigo-600 font-medium">
                              #{sale.running_number}
                            </span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="text-sm text-black font-semibold">
                              {sale.User?.name || sale.user?.name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {sale.formattedDate ||
                              new Date(sale.sales_date).toLocaleString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: false,
                                }
                              )}
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {formatPrice(sale.total_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewSaleDetails(sale)}
                          className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 flex items-center"
                        >
                          <Eye size={12} className="mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(sales.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={sales.length}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart
                  size={48}
                  className="mx-auto text-gray-300 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-500 mb-1">
                  No sales found
                </h3>
                <p className="text-gray-400 text-sm">
                  There are no recorded sales yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AlertModal
          isOpen={showAlert}
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
        <SuccessModal
          isOpen={showSuccess}
          message={successMessage}
          onClose={() => {
            setShowSuccess(false);
            // Ensure file input is completely reset after successful import
            clearCsvFile();
          }}
        />
        {selectedSaleId && (
          <SalesDetails
            isOpen={true}
            saleId={selectedSaleId}
            onClose={() => setSelectedSaleId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Sales;
