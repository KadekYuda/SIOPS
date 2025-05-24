import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import {
  Upload,
  UploadCloud,
  Download,
  Settings,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Eye,
  ArrowRight,
  X,
  ChevronRight,
  Table,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import {
  FaPlus,
  FaTrash,
  FaSpinner,
  FaCalendarAlt,
  FaBox,
  FaCoins,
  FaTags,
  FaClipboardList,
  FaCheck,
} from "react-icons/fa";
import AlertModal from "../modal/AlertModal";
import SuccessModal from "../modal/SuccessModal";
import api from "../../service/api";
import LoadingComponent from "../LoadingComponent";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [activeTab, setActiveTab] = useState("manual");
  
  // New state variables for import functionality
  const fileInputRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [dataSummary, setDataSummary] = useState(null);
  const requiredFields = ["date", "product", "quantity", "price"];

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      handleFileSelection(droppedFile);
    } else {
      setError("Please drop a valid CSV file");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (file) => {
    setIsUploading(true);
    setError("");
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size exceeds 10MB limit");
      setIsUploading(false);
      return;
    }

    setFile(file);
    Papa.parse(file, {
      complete: (results) => {
        if (results.data.length > 0) {
          setPreviewData(results.data.slice(0, 5)); // First 5 rows for preview
          setCsvData(results.data);
          setActiveStep(2);
        } else {
          setError("The CSV file appears to be empty");
        }
        setIsUploading(false);
      },
      header: true,
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  const handleFieldMapping = (field, value) => {
    setFieldMappings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateMappings = () => {
    const missingFields = requiredFields.filter(field => !fieldMappings[field]);
    if (missingFields.length > 0) {
      setError(`Please map all required fields: ${missingFields.join(", ")}`);
      return;
    }
    
    // Calculate data summary
    const summary = {
      totalRows: csvData.length,
      totalValue: csvData.reduce((sum, row) => {
        const price = parseFloat(row[fieldMappings.price]) || 0;
        const quantity = parseInt(row[fieldMappings.quantity]) || 0;
        return sum + (price * quantity);
      }, 0).toLocaleString(),
      uniqueProducts: new Set(csvData.map(row => row[fieldMappings.product])).size,
      dateRange: {
        start: csvData[0][fieldMappings.date],
        end: csvData[csvData.length - 1][fieldMappings.date]
      }
    };
    setDataSummary(summary);
    setActiveStep(3);
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      // Transform data according to mappings
      const transformedData = csvData.map(row => ({
        sales_date: row[fieldMappings.date],
        code_product: row[fieldMappings.product],
        quantity: parseInt(row[fieldMappings.quantity]),
        selling_price: parseFloat(row[fieldMappings.price]),
      }));

      await api.post("/sales/batch", { sales: transformedData });
      setActiveStep(4);
      setSuccessMessage("Sales data imported successfully");
      setShowSuccess(true);
      fetchSales();
    } catch (error) {
      setError(error.response?.data?.msg || "Error importing sales data");
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setActiveStep(1);
    setFile(null);
    setPreviewData(null);
    setCsvData(null);
    setFieldMappings({});
    setDataSummary(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const viewSampleCSV = () => {
    const sampleData = [
      "Date,Product Code,Product Name,Quantity,Price",
      "2025-05-22,PRD001,Product A,5,50000",
      "2025-05-22,PRD002,Product B,3,75000"
    ].join("\n");

    const blob = new Blob([sampleData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_sales.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/sales");
      setSales(response.data);
    } catch (error) {
      setAlertMessage(error.response?.data?.msg || "Error fetching sales");
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.result || []);
    } catch (error) {
      setAlertMessage(error.response?.data?.msg || "Error fetching products");
      setShowAlert(true);
    }
  };

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
    const product = products.find((p) => p.code_product === code_product);
    if (product) {
      handleItemChange(index, "code_product", product.code_product);
      handleItemChange(index, "product_name", product.name_product);
      await fetchBatchesForProduct(product.code_product, index);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      Papa.parse(file, {
        complete: async (results) => {
          try {
            setIsLoading(true);
            const salesData = transformPOSDataToSales(results.data);

            for (const sale of salesData) {
              await api.post("/sales", sale);
            }

            setSuccessMessage("Sales data imported successfully");
            setShowSuccess(true);
            fetchSales();
          } catch (error) {
            setAlertMessage(
              error.response?.data?.msg || "Error importing sales"
            );
            setShowAlert(true);
          } finally {
            setIsLoading(false);
          }
        },
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          const headerMap = {
            Tanggal: "sales_date",
            "Kode Barang": "code_product",
            Barcode: "barcode",
            "Nama Barang": "name_product",
            Qty: "quantity",
            "Harga Jual": "selling_price",
            Jumlah: "subtotal",
          };
          return headerMap[header] || header;
        },
      });
    }
  };

  const transformPOSDataToSales = (data) => {
    const salesByDate = data.reduce((acc, row) => {
      const date = row.sales_date;
      if (!acc[date]) {
        acc[date] = {
          sales_date: date,
          total_amount: 0,
          items: [],
        };
      }

      const item = {
        code_product: row.code_product,
        quantity: Number(row.quantity),
        selling_price: Number(row.selling_price),
        subtotal: Number(row.subtotal || row.quantity * row.selling_price),
      };

      acc[date].items.push(item);
      acc[date].total_amount += item.subtotal;
      return acc;
    }, {});

    return Object.values(salesByDate);
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
    try {
      setIsLoading(true);
      const total_amount = manualSale.items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      );

      const saleData = {
        ...manualSale,
        total_amount,
        sales_date: manualSale.sales_date,
      };

      await api.post("/sales", saleData);
      setSuccessMessage("Sale recorded successfully");
      setShowSuccess(true);
      setManualSale({
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
      fetchSales();
    } catch (error) {
      setAlertMessage(error.response?.data?.msg || "Error recording sale");
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

  const clearCsvFile = () => {
    setCsvFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-4 rounded-xl sm:rounded-none sm:rounded-t-xl mb-6 sm:mb-0 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Sales Management
            </h1>
            <p className="mt-1 text-sm text-indigo-100">
              Create, import, and manage sales transactions
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm transform hover:scale-105 ${
                activeTab === "manual"
                  ? "bg-white text-indigo-700 shadow"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Manual Entry
              </motion.span>
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm transform hover:scale-105 ${
                activeTab === "import"
                  ? "bg-white text-indigo-700 shadow"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Import Sales
              </motion.span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {/* Import CSV Section */}
          <AnimatePresence mode="wait">
            {activeTab === "import" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white border-gray-200 border rounded-xl shadow-lg mb-6 overflow-hidden"
              >
                {/* Step content will be animated based on activeStep */}
                <AnimatePresence mode="wait">
                  {/* Step 1: Upload */}
                  {activeStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center mb-6">
                          <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full mr-4">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold">Import Sales from CSV</h2>
                            <p className="text-sm text-gray-500">Upload POS data or use our template</p>
                          </div>
                        </div>

                        <div
                          className={`border-2 border-dashed ${
                            isUploading 
                              ? "border-indigo-300 bg-indigo-50" 
                              : error 
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-indigo-50"
                          } rounded-lg p-8 text-center cursor-pointer transition-all duration-200`}
                          onClick={() => fileInputRef.current.click()}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');
                          }}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          {isUploading ? (
                            <div className="flex flex-col items-center">
                              <RefreshCw className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
                              <p className="text-sm text-indigo-600 font-medium">Processing your file...</p>
                            </div>
                          ) : error ? (
                            <div className="flex flex-col items-center">
                              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                              <p className="text-sm text-red-600 font-medium mb-2">{error}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetImport();
                                }}
                                className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                              >
                                Try Again
                              </button>
                            </div>
                          ) : file ? (
                            <div className="flex flex-col items-center">
                              <FileCheck className="w-16 h-16 text-green-500 mb-4" />
                              <p className="text-sm text-gray-600 font-medium mb-1">{file.name}</p>
                              <p className="text-xs text-gray-500 mb-3">
                                {(file.size / 1024).toFixed(1)}KB • CSV File
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetImport();
                                }}
                                className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <UploadCloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-sm text-gray-600 font-medium mb-1">
                                Drag and drop your CSV file here
                              </p>
                              <p className="text-xs text-gray-500">or click to browse</p>
                            </div>
                          )}
                        </div>

                        {error && (
                          <div className="mt-4 p-3 rounded-lg flex items-start bg-red-50 text-red-600">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="rounded-lg p-4 bg-indigo-50 border-l-4 border-indigo-500">
                            <h3 className="font-medium mb-2">Supported Formats</h3>
                            <p className="text-sm text-gray-600">
                              CSV files with column headers. Must include date, product, quantity, and price.
                            </p>
                          </div>
                          <div className="rounded-lg p-4 bg-indigo-50 border-l-4 border-indigo-500">
                            <h3 className="font-medium mb-2">Data Rows</h3>
                            <p className="text-sm text-gray-600">System can handle up to 5,000 rows in a single import.</p>
                          </div>
                          <div className="rounded-lg p-4 bg-indigo-50 border-l-4 border-indigo-500">
                            <h3 className="font-medium mb-2">Duplicate Data</h3>
                            <p className="text-sm text-gray-600">
                              System will detect and prevent data duplication based on date and product.
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            onClick={downloadTemplate}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg flex flex-col items-center justify-center transition duration-200"
                          >
                            <Download className="w-6 h-6 mb-2" />
                            <span className="font-medium">Download Template</span>
                            <span className="text-xs mt-1 text-indigo-100">Ready-to-fill CSV file</span>
                          </button>
                          
                        </div>

                        <div className="mt-6 p-4 rounded-lg bg-indigo-50">
                          <div className="flex items-center mb-2">
                            <HelpCircle className="w-5 h-5 mr-2 text-indigo-500" />
                            <h3 className="font-medium">Tips for Successful Import</h3>
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1 pl-7 list-disc">
                            <li>Ensure date column is in YYYY-MM-DD format</li>
                            <li>Use comma (,) as separator for your CSV file</li>
                            <li>Ensure all products are already registered in the system</li>
                            <li>Avoid special characters in product names</li>
                            <li>Use dot (.) as decimal separator for prices</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Field Mapping */}
                  {activeStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center mb-6">
                          <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full mr-4">
                            <Settings className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold">Column Mapping</h2>
                            <p className="text-sm text-gray-500">Map CSV columns to system columns</p>
                          </div>
                        </div>

                        <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                          <h3 className="font-medium mb-3">Data Preview ({file?.name})</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-gray-600">
                              <thead>
                                <tr className="bg-gray-100">
                                  {previewData &&
                                    previewData.length > 0 &&
                                    Object.keys(previewData[0]).map((header, i) => (
                                      <th key={i} className="px-4 py-2 text-left">
                                        {header}
                                      </th>
                                    ))}
                                </tr>
                              </thead>
                              <tbody>
                                {previewData?.map((row, i) => (
                                  <tr key={i} className="border-gray-200 border-t">
                                    {Object.values(row).map((cell, j) => (
                                      <td key={j} className="px-4 py-2">
                                        {cell !== null ? cell : "-"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="grid gap-6">
                            {requiredFields.map((field) => (
                              <div
                                key={field}
                                className="p-4 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow"
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        fieldMappings[field] 
                                          ? "bg-green-500" 
                                          : "bg-red-500"
                                      }`} />
                                      <p className="font-medium capitalize">{field}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {field === "date" && "Expected format: YYYY-MM-DD"}
                                      {field === "product" && "Must match existing product codes"}
                                      {field === "quantity" && "Must be a positive number"}
                                      {field === "price" && "Unit price in Rupiah (IDR)"}
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    <Settings className="w-4 h-4 text-gray-400 mr-3" />
                                    <select
                                      value={fieldMappings[field] || ""}
                                      onChange={(e) => handleFieldMapping(field, e.target.value)}
                                      className={`px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                        fieldMappings[field]
                                          ? "bg-white border-gray-300 text-gray-700"
                                          : "bg-gray-50 border-gray-200 text-gray-500"
                                      }`}
                                    >
                                      <option value="">-- Select CSV Column --</option>
                                      {previewData &&
                                        previewData.length > 0 &&
                                        Object.keys(previewData[0]).map((header, i) => (
                                          <option key={i} value={header}>{header}</option>
                                        ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {error && (
                          <div className="mb-6 p-3 rounded-lg flex items-start bg-red-50 text-red-600">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <button
                            onClick={resetImport}
                            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center transition duration-200"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setActiveStep(1)}
                              className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center transition duration-200"
                            >
                              Back
                            </button>
                            <button
                              onClick={validateMappings}
                              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center transition duration-200"
                            >
                              Continue
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Validation */}
                 {activeStep === 3 && (
  <motion.div
    key="step3"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <div className="p-6">
      <div className="flex items-center mb-6">
        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full mr-4">
          <FileCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Data Verification</h2>
          <p className="text-sm text-gray-500">Review and confirm before importing</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg flex items-start bg-red-50 text-red-600">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-lg bg-white border border-gray-200">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Total Rows</span>
              <span className="font-semibold text-gray-900">{csvData?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Unique Products</span>
              <span className="font-semibold text-gray-900">{dataSummary?.uniqueProducts || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Total Value</span>
              <span className="font-semibold text-indigo-600">Rp {dataSummary?.totalValue || "0"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Date Range</span>
              <span className="font-semibold text-gray-900">
                {dataSummary?.dateRange.start || "-"} to {dataSummary?.dateRange.end || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white border border-gray-200">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">Validation Status</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-green-100 p-1 rounded-full mr-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Data Format</p>
                <p className="text-sm text-gray-500">All required columns are mapped correctly</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 p-1 rounded-full mr-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Products</p>
                <p className="text-sm text-gray-500">All product codes exist in the system</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 p-1 rounded-full mr-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Values</p>
                <p className="text-sm text-gray-500">All prices and quantities are valid</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-medium flex items-center">
            <Table className="w-5 h-5 mr-2 text-gray-500" />
            Data Preview
          </h3>
          <span className="text-sm text-gray-500">
            Showing {Math.min(5, csvData?.length || 0)} of {csvData?.length || 0} rows
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {requiredFields.map((field) => (
                  <th key={field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(previewData || []).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {requiredFields.map((field) => (
                    <td key={field} className="px-6 py-3 text-sm text-gray-500">
                      {row[fieldMappings[field]] !== null ? row[fieldMappings[field]] : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={resetImport}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center transition duration-200"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveStep(2)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center transition duration-200"
          >
            Back
          </button>
          <button
            onClick={handleComplete}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center transition duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                Import Data
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
)}

                  {/* Step 4: Complete */}
                  {activeStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6">
                        <div className="flex flex-col items-center justify-center py-8 max-w-lg mx-auto">
                          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-green-100 text-green-500 animate-fade-in">
                            <CheckCircle className="w-10 h-10" />
                          </div>
                          
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Successful!</h2>
                          <p className="text-center text-gray-600 mb-8">
                            Your data has been successfully imported into the system
                          </p>
                          
                          <div className="w-full bg-gray-50 rounded-lg p-6 mb-8">
                            <div className="grid grid-cols-2 gap-y-4">
                              <div className="text-sm text-gray-600">Total Rows:</div>
                              <div className="text-sm font-medium text-right">{csvData?.length} rows</div>
                              
                              <div className="text-sm text-gray-600">Successfully Imported:</div>
                              <div className="text-sm font-medium text-right text-green-600">{csvData?.length} rows</div>
                              
                              <div className="text-sm text-gray-600">Failed Rows:</div>
                              <div className="text-sm font-medium text-right">0 rows</div>
                              
                              <div className="text-sm text-gray-600">Total Value:</div>
                              <div className="text-sm font-medium text-right">Rp {dataSummary?.totalValue}</div>
                              
                              <div className="col-span-2 mt-4 pt-4 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                  Import completed on {new Date().toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-4">
                            <button
                              onClick={resetImport}
                              className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Import Another File
                            </button>
                            <button
                              onClick={() => window.location.reload()}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              View Sales List
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual Input Section */}
          <AnimatePresence mode="wait">
            {activeTab === "manual" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl sm:rounded-none shadow-md p-6 border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaClipboardList className="text-blue-600" />
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
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <FaCalendarAlt className="text-gray-500" />
                      <label
                        htmlFor="saleDate"
                        className="text-sm font-medium text-gray-700"
                      >
                        Sale Date
                      </label>
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
                      className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                      aria-required="true"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Sale Items
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        aria-label="Add new item"
                      >
                        <FaPlus className="mr-1 text-xs" />
                        Add Item
                      </button>
                    </div>
                  </div>

                  {manualSale.items.map((item, index) => (
                    <div
                      key={`sale-item-${index}`}
                      className="mb-6 p-5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaBox className="text-blue-600 text-sm" />
                          </div>
                          <h4 className="text-md font-medium text-gray-800">
                            Item #{index + 1}
                          </h4>
                        </div>

                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="flex items-center text-sm px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            aria-label="Remove item"
                          >
                            <FaTrash className="mr-1 text-xs" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label
                            htmlFor={`product-${index}`}
                            className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
                          >
                            <FaTags className="text-gray-500 text-xs" />
                            Product
                          </label>
                          <select
                            id={`product-${index}`}
                            value={item.code_product}
                            onChange={(e) =>
                              handleProductSelect(index, e.target.value)
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                            aria-required="true"
                          >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                              <option
                                key={product.code_product}
                                value={product.code_product}
                              >
                                {product.name_product}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`quantity-${index}`}
                            className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
                          >
                            <FaBox className="text-gray-500 text-xs" />
                            Quantity
                          </label>
                          <input
                            id={`quantity-${index}`}
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            min="1"
                            required
                            aria-required="true"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`price-${index}`}
                            className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
                          >
                            <FaCoins className="text-gray-500 text-xs" />
                            Price
                          </label>
                          <input
                            id={`price-${index}`}
                            type="number"
                            value={item.selling_price}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "selling_price",
                                e.target.value
                              )
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            min="0"
                            step="0.01"
                            required
                            aria-required="true"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`subtotal-display-${index}`}
                            className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
                          >
                            <FaCoins className="text-gray-500 text-xs" />
                            Subtotal
                          </label>
                          <div
                            id={`subtotal-display-${index}`}
                            className="block w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-md font-medium text-gray-900"
                            aria-label={`Subtotal: ${item.subtotal.toLocaleString(
                              "id-ID",
                              { style: "currency", currency: "IDR" }
                            )}`}
                          >
                            {item.subtotal.toLocaleString("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            })}
                          </div>
                        </div>
                      </div>

                      {item.available_batches.length > 0 && (
                        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                          <label
                            htmlFor={`batches-list-${index}`}
                            className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-3"
                          >
                            <FaBox className="text-blue-600 text-xs" />
                            Available Batches
                          </label>
                          <div
                            id={`batches-list-${index}`}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                            aria-label={`Available batches for product ${
                              item.product_name || "selected product"
                            }`}
                          >
                            {item.available_batches.map((batch) => (
                              <div
                                key={batch.batch_id}
                                className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                              >
                                <div className="text-sm font-medium text-gray-800 mb-1">
                                  {batch.batch_code}
                                </div>
                                <div className="flex justify-between">
                                  <div className="text-xs text-gray-600">
                                    Stock: {batch.totalStock || 0}
                                  </div>
                                  <div className="text-xs text-gray-600">
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
                  ))}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="text-lg font-semibold text-gray-800">
                      Total Amount:{" "}
                      <span className="text-blue-700">
                        {manualSale.items
                          .reduce((sum, item) => sum + (item.subtotal || 0), 0)
                          .toLocaleString("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          })}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        aria-label="Add new item"
                      >
                        <FaPlus className="mr-2" />
                        Add Item
                      </button>
                      <button
                        type="submit"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
                        disabled={isLoading}
                        aria-label="Save sale"
                      >
                        {isLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaCheck className="mr-2" />
                            Save Sale
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <FaClipboardList className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-indigo-800">
                Recent Sales
              </h2>
              <p className="text-sm text-gray-500">
                View and manage your sales transactions
              </p>
            </div>
          </div>

          {isLoading ? (
            <LoadingComponent />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Sale ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <FaClipboardList className="text-indigo-200 text-4xl mb-3" />
                          <p className="text-lg font-medium">No sales found</p>
                          <p className="text-sm">
                            Create a new sale or import from CSV
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.sales_id} className="hover:bg-indigo-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                          #{sale.sales_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(sale.sales_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.total_amount.toLocaleString("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() =>
                              navigate(`/salesdetail/${sale.sales_id}`)
                            }
                            className="flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                            aria-label="View sale details"
                          >
                            <Eye className="mr-2" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
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
          onClose={() => setShowSuccess(false)}
        />
      </div>
    </div>
  );
};

export default Sales;
