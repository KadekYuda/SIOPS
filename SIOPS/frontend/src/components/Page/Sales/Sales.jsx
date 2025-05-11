import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { 
  FaFileImport, 
  FaDownload, 
  FaPlus, 
  FaTrash, 
  FaSpinner, 
  FaEye, 
  FaCalendarAlt, 
  FaBox,
  FaCoins,
  FaTags,
  FaClipboardList,
  FaCheck
} from "react-icons/fa";
import AlertModal from "../../modal/AlertModal";
import SuccessModal from "../../modal/SuccessModal";
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
        totalStock: (batch.stock_quantity || 0),
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
            <p className="mt-1 text-sm text-gray-500">Create, import, and manage sales transactions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                activeTab === "manual" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <FaClipboardList />
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                activeTab === "import" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <FaFileImport />
              Import Sales
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {/* Import CSV Section */}
          {activeTab === "import" && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaFileImport className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Import Sales from CSV</h2>
                  <p className="text-sm text-gray-500">Upload POS data or use our template</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                    <li>Download our template or prepare your POS export</li>
                    <li>Ensure your CSV has the required headers</li>
                    <li>Upload the file using the button below</li>
                  </ol>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    aria-label="Download CSV template"
                  >
                    <FaDownload className="mr-2" />
                    Download Template
                  </button>
                  <label className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                    <FaFileImport className="mr-2" />
                    Select CSV File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                </div>
                
                {csvFile && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FaFileImport className="text-blue-600 text-sm" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{csvFile.name}</p>
                        <p className="text-xs text-gray-500">{Math.round(csvFile.size / 1024)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={clearCsvFile}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      aria-label="Clear selected file"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
                
                {isLoading && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100 flex items-center gap-2">
                    <FaSpinner className="animate-spin text-yellow-600" />
                    <span className="text-sm text-yellow-700">Processing your file, please wait...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Input Section */}
          {activeTab === "manual" && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaClipboardList className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Manual Sales Entry</h2>
                  <p className="text-sm text-gray-500">Create a new sale transaction</p>
                </div>
              </div>
              
              <form onSubmit={handleManualSubmit}>
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FaCalendarAlt className="text-gray-500" />
                    <label htmlFor="saleDate" className="text-sm font-medium text-gray-700">
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
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Sale Items</h3>
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
                        <h4 className="text-md font-medium text-gray-800">Item #{index + 1}</h4>
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
                          onChange={(e) => handleProductSelect(index, e.target.value)}
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
                            handleItemChange(index, "selling_price", e.target.value)
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
                                  Expires: {new Date(batch.exp_date).toLocaleDateString()}
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
                        .toLocaleString("id-ID", { style: "currency", currency: "IDR" })}
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
            </div>
          )}
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FaClipboardList className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Recent Sales</h2>
              <p className="text-sm text-gray-500">View and manage your sales transactions</p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
              <span className="ml-2 text-gray-600">Loading sales data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <FaClipboardList className="text-gray-300 text-4xl mb-3" />
                          <p className="text-lg font-medium">No sales found</p>
                          <p className="text-sm">Create a new sale or import from CSV</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.sales_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
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
                            onClick={() => navigate(`/salesdetail/${sale.sales_id}`)}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            aria-label="View sale details"
                          >
                            <FaEye className="mr-2" />
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