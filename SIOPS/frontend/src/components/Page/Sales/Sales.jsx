import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import AlertModal from "../../modal/AlertModal";
import SuccessModal from "../../modal/SuccessModal";
import LoadingComponent from "../../LoadingComponent";
import SalesDetails from "./SalesDetails";
import ProductSelect from "./ProductSelect";
import api from "../../../service/api";

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

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/users/profile");
      setUserData(response.data.user);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/sales");
      const salesWithUserDetails = await Promise.all(
        response.data.map(async (sale) => {
          if (sale.user_id && !sale.user) {
            try {
              const userResponse = await api.get(`/users/${sale.user_id}`);
              return {
                ...sale,
                user: userResponse.data,
              };
            } catch (error) {
              console.error(
                `Error fetching user data for sale ${sale.sales_id}:`,
                error
              );
              return sale;
            }
          }
          return sale;
        })
      );
      setSales(salesWithUserDetails);
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
  const handleUpload = async () => {
    if (!csvFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await api.post("/sales/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage(
        `✅ Import successful!\n${
          response.data.msg || "Sales data imported successfully"
        }`
      );
      setShowSuccess(true);
      fetchSales();
      clearCsvFile();
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

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
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

      // Prepare sale data
      const saleData = {
        sales_date: manualSale.sales_date,
        items: manualSale.items.map((item) => ({
          code_product: item.code_product,
          quantity: parseInt(item.quantity, 10),
          selling_price: parseFloat(item.selling_price),
          subtotal: item.subtotal,
        })),
      };

      // Log the request payload for debugging
      console.log("Sending sale data:", saleData);

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

  const clearCsvFile = () => {
    setCsvFile(null);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="px-4">
        {/* Sales Management Card Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center">
            <ClipboardList className="text-white mr-3" size={24} />
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
                      handleCSVUpload({ target: { files: [file] } });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
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
                    <h3 className="font-medium mb-2">Duplicate Data</h3>
                    <p className="text-sm text-gray-600">
                      System will detect and prevent data duplication based on
                      date and product.
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
                      className="block w-full sm:w-64 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                                      Batch #{batch.batch_code}
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
          <div className="bg-white px-4 sm:px-6 py-4 sm:py-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <ClipboardList className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sales List
                  </h2>
                  <p className="text-sm text-gray-500">
                    View and manage your sales transactions
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {isLoading ? (
              <LoadingComponent />
            ) : (
              <div className="overflow-x-auto">
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
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                        TOTAL
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardList className="text-gray-300 text-4xl mb-2" />
                            <p className="text-lg font-medium text-gray-500">
                              No sales found
                            </p>
                            <p className="text-sm text-gray-400">
                              Create a new sale or import from CSV
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sales.map((sale) => (
                        <tr
                          key={sale.sales_id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-indigo-600 font-medium">
                            #{sale.sales_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {sale.user?.name || sale.user_id || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(sale.sales_date).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(sale.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <button
                                onClick={() => setSelectedSaleId(sale.sales_id)}
                                className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                              >
                                <Eye className="mr-1.5" size={12} />
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
          onClose={() => setShowSuccess(false)}
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
