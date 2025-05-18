import React, { useState, useEffect } from "react";
import { 
  ChevronDown, 
  Calendar, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  FileText, 
  Eye, 
  Upload, 
  Download, 
  DollarSign, 
  Package,
  Tag,
  Layers,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw
} from "lucide-react";

// Mocked API for demonstration
const api = {
  get: async () => ({
    data: {
      result: mockProducts,
    }
  }),
  post: async () => ({
    data: { success: true }
  })
};

// Mock Data
const mockProducts = [
  { code_product: "P001", name_product: "Paracetamol 500mg", sell_price: 10000 },
  { code_product: "P002", name_product: "Amoxicillin 500mg", sell_price: 15000 },
  { code_product: "P003", name_product: "Vitamin C 1000mg", sell_price: 25000 },
];

const mockSales = [
  { sales_id: 1001, sales_date: "2025-05-15", total_amount: 150000 },
  { sales_id: 1002, sales_date: "2025-05-16", total_amount: 75000 },
  { sales_id: 1003, sales_date: "2025-05-17", total_amount: 230000 },
  { sales_id: 1004, sales_date: "2025-05-18", total_amount: 45000 },
  { sales_id: 1005, sales_date: "2025-05-19", total_amount: 190000 },
];

const Sales = () => {
  const [activeTab, setActiveTab] = useState("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");

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

  // Simulated fetch calls
  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSales(mockSales);
    } catch (error) {
      showNotification("Error fetching sales data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // In a real app, this would be an API call
      const response = await api.get("/products");
      setProducts(response.data.result || []);
    } catch (error) {
      showNotification("Error fetching products", "error");
    }
  };

  const handleProductSelect = async (index, code_product) => {
    const product = products.find((p) => p.code_product === code_product);
    if (product) {
      handleItemChange(index, "code_product", product.code_product);
      handleItemChange(index, "product_name", product.name_product);
      handleItemChange(index, "selling_price", product.sell_price);
      
      // Simulate fetching batches
      const batches = [
        { batch_id: `B${Math.floor(Math.random() * 1000)}`, batch_code: `BATCH-${Math.floor(Math.random() * 1000)}`, exp_date: "2025-12-31", totalStock: Math.floor(Math.random() * 50) + 10 },
        { batch_id: `B${Math.floor(Math.random() * 1000)}`, batch_code: `BATCH-${Math.floor(Math.random() * 1000)}`, exp_date: "2026-03-15", totalStock: Math.floor(Math.random() * 50) + 10 }
      ];
      handleItemChange(index, "available_batches", batches);
    }
  };

  const handleItemChange = (index, field, value) => {
    setManualSale((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "selling_price") {
            const quantity = field === "quantity" ? Number(value) : Number(item.quantity);
            const price = field === "selling_price" ? Number(value) : Number(item.selling_price);
            updatedItem.subtotal = quantity * price || 0;
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
    setIsLoading(true);
    try {
      const total_amount = manualSale.items.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      );

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Clear form and refresh data
      showNotification("Sale recorded successfully", "success");
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
      
      // Add the new sale to the list for demo purposes
      const newSale = {
        sales_id: Math.floor(1000 + Math.random() * 9000),
        sales_date: manualSale.sales_date,
        total_amount: total_amount
      };
      setSales([newSale, ...sales]);
    } catch (error) {
      showNotification("Error recording sale", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      setIsLoading(true);
      
      // Simulate processing
      setTimeout(() => {
        setIsLoading(false);
        showNotification("Sales data imported successfully", "success");
        
        // Add mock imported sales
        const newSales = [
          { sales_id: Math.floor(1000 + Math.random() * 9000), sales_date: "2025-05-19", total_amount: 120000 },
          { sales_id: Math.floor(1000 + Math.random() * 9000), sales_date: "2025-05-19", total_amount: 85000 }
        ];
        setSales([...newSales, ...sales]);
        setCsvFile(null);
      }, 1500);
    }
  };

  const downloadTemplate = () => {
    showNotification("Template download started", "info");
  };

  const clearCsvFile = () => {
    setCsvFile(null);
  };

  const showNotification = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  const calculateTotal = () => {
    return manualSale.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {showAlert && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-500 ease-in-out ${
          alertType === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
          alertType === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
          'bg-blue-50 border-l-4 border-blue-500'
        }`}>
          {alertType === 'success' ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : alertType === 'error' ? (
            <AlertCircle className="text-red-500" size={20} />
          ) : (
            <AlertCircle className="text-blue-500" size={20} />
          )}
          <span className={`font-medium ${
            alertType === 'success' ? 'text-green-800' :
            alertType === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {alertMessage}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-white">Sales Dashboard</h1>
              <p className="mt-1 text-indigo-100">Manage your sales transactions efficiently</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setActiveTab("manual")}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                  activeTab === "manual"
                    ? "bg-white text-indigo-700"
                    : "bg-indigo-500/50 text-white hover:bg-indigo-500/80"
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setActiveTab("import")}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                  activeTab === "import"
                    ? "bg-white text-indigo-700"
                    : "bg-indigo-500/50 text-white hover:bg-indigo-500/80"
                }`}
              >
                Import Sales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left sidebar with stats */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-8">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-indigo-600" />
                Sales Summary
              </h2>
              
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Today's Sales</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(750000)}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Monthly Total</p>
                  <p className="text-xl font-bold text-gray-800">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(12500000)}
                  </p>
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-600 mb-2">Top Product</p>
                  <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
                    <Package size={18} className="text-green-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-800">Vitamin C 1000mg</p>
                      <p className="text-xs text-gray-500 mt-1">42 units sold this month</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  className="w-full mt-4 flex items-center justify-center gap-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 px-4 rounded-lg transition-colors"
                  onClick={() => showNotification("Refreshing sales data...", "info")}
                >
                  <RefreshCw size={16} />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-4 space-y-6">
            {/* Import CSV Section */}
            {activeTab === "import" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Upload className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Import Sales</h2>
                      <p className="text-sm text-gray-500">Upload your sales data from CSV files</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100 mb-6">
                    <h3 className="font-medium text-indigo-800 mb-3">Instructions</h3>
                    <ol className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">1</span>
                        <span>Download our template or prepare your POS export file</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">2</span>
                        <span>Make sure your CSV has the correct headers (Date, Product Code, Quantity, Price)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">3</span>
                        <span>Upload your file and we'll process it automatically</span>
                      </li>
                    </ol>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={downloadTemplate}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-5 rounded-lg transition-colors shadow-sm"
                      >
                        <Download size={16} />
                        Download Template
                      </button>
                      
                      <label className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 rounded-lg cursor-pointer transition-colors shadow-sm">
                        <Upload size={16} />
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
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="text-blue-600" size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{csvFile.name}</p>
                            <p className="text-xs text-gray-500">{Math.round(csvFile.size / 1024)} KB</p>
                          </div>
                        </div>
                        <button
                          onClick={clearCsvFile}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    
                    {isLoading && (
                      <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                        <div className="animate-spin">
                          <RefreshCw className="text-yellow-600" size={18} />
                        </div>
                        <p className="text-sm text-yellow-800">Processing your file, please wait...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Entry Section */}
            {activeTab === "manual" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">New Sale</h2>
                      <p className="text-sm text-gray-500">Create a new sales transaction</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleManualSubmit}>
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-gray-500" size={16} />
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
                        className="block w-full sm:w-64 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                          <Package size={16} className="text-indigo-600" />
                          Sale Items
                        </h3>
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="flex items-center gap-1 text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Plus size={14} />
                          Add Item
                        </button>
                      </div>
                    </div>
                    
                    {manualSale.items.map((item, index) => (
                      <div
                        key={`sale-item-${index}`}
                        className="mb-5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Tag className="text-indigo-600" size={15} />
                            </div>
                            <h4 className="font-medium text-gray-800">
                              Item #{index + 1}
                            </h4>
                          </div>

                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="flex items-center gap-1 text-sm px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <label
                                htmlFor={`product-${index}`}
                                className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
                              >
                                <Package className="text-gray-500" size={14} />
                                Product
                              </label>
                              <select
                                id={`product-${index}`}
                                value={item.code_product}
                                onChange={(e) =>
                                  handleProductSelect(index, e.target.value)
                                }
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                required
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
                                <Layers className="text-gray-500" size={14} />
                                Quantity
                              </label>
                              <input
                                id={`quantity-${index}`}
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(index, "quantity", e.target.value)
                                }
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                min="1"
                                required
                              />
                            </div>

                            <div>
                              <label
                                htmlFor={`price-${index}`}
                                className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
                              >
                                <DollarSign className="text-gray-500" size={14} />
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
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                min="0"
                                step="0.01"
                                required
                              />
                            </div>

                            <div>
                              <label
                                htmlFor={`subtotal-display-${index}`}
                                className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1"
                              >
                                <DollarSign className="text-gray-500" size={14} />
                                Subtotal
                              </label>
                              <div
                                id={`subtotal-display-${index}`}
                                className="block w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900"
                              >
                                {new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0
                                }).format(item.subtotal)}
                              </div>
                            </div>
                          </div>

                          {item.available_batches && item.available_batches.length > 0 && (
                            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                              <div className="flex items-center gap-2 mb-3">
                                <Layers className="text-blue-600" size={16} />
                                <label className="text-sm font-medium text-gray-700">
                                  Available Batches
                                </label>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {item.available_batches.map((batch) => (
                                  <div
                                    key={batch.batch_id}
                                    className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm"
                                  >
                                    <div className="text-sm font-medium text-gray-800 mb-1">
                                      {batch.batch_code}
                                    </div>
                                    <div className="flex justify-between">
                                      <div className="text-xs text-gray-600">
                                        Stock: {batch.totalStock}
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
                      </div>
                    ))}

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between p-5 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <div className="font-medium text-lg text-gray-800 mb-4 sm:mb-0">
                        Total: <span className="text-indigo-700 font-bold">{new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(calculateTotal())}</span>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                          <Plus size={16} />
                          Add Item
                        </button>
                        
                       <button
                          type="submit"
                          disabled={isLoading}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:bg-indigo-300"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="animate-spin" size={16} />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Complete Sale
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Recent Sales Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Recent Sales</h2>
                      <p className="text-sm text-gray-500">Displaying your latest {sales.length} sales transactions</p>
                    </div>
                  </div>
                  
                  <div className="relative w-64 hidden md:block">
                    <input
                      type="text"
                      placeholder="Search sales..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.map((sale) => (
                      <tr key={sale.sales_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">#{sale.sales_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{new Date(sale.sales_date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0
                            }).format(sale.total_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => showNotification("Viewing sale details", "info")}
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              onClick={() => showNotification("Downloading receipt", "info")}
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {sales.length === 0 && (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
                    <ShoppingBag className="text-indigo-600" size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">No sales found</h3>
                  <p className="text-gray-500">Create a new sale to see it appear here</p>
                </div>
              )}
              
              {sales.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{sales.length}</span> entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded">
                      1
                    </button>
                    <button className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;