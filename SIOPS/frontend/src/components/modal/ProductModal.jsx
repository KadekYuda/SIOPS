import { useState, useRef, useEffect, useMemo } from "react";
import { X, Check, Upload, ChevronDown, Download, Info } from "lucide-react";
import { createPortal } from "react-dom";

const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  modalMode = "add",
  initialData = {
    code_product: "",
    barcode: "",
    name_product: "",
    code_categories: "",
    category_name: "",
    sell_price: "",
    min_stock: "",
  },
  categories = [],
}) => {
  const [formData, setFormData] = useState(initialData);
  const [formErrors, setFormErrors] = useState({});
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [isFormEdited, setIsFormEdited] = useState(false);
  const [csvMode, setCsvMode] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const modalRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      const sanitizedData = {
        code_product: initialData.code_product ?? "",
        barcode: initialData.barcode ?? "",
        name_product: initialData.name_product ?? "",
        code_categories: initialData.code_categories ?? "",
        category_name: initialData.category_name ?? "",
        sell_price: initialData.sell_price
          ? String(Number(initialData.sell_price)).replace(/,/g, "")
          : "",
        min_stock: initialData.min_stock ?? "",
      };
      setFormData(sanitizedData);
      setFormErrors({});
      setCategorySearch("");
      setIsFormEdited(false);
      setCsvFile(null);
      setIsDragOver(false);
      document.body.style.overflow = "hidden";
    } else {
      setFormData({
        code_product: "",
        barcode: "",
        name_product: "",
        code_categories: "",
        category_name: "",
        sell_price: "",
        min_stock: "",
      });
      setFormErrors({});
      setCategorySearch("");
      setIsFormEdited(false);
      setCsvFile(null);
      setIsDragOver(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    isOpen,
    initialData.code_product,
    initialData.barcode,
    initialData.name_product,
    initialData.code_categories,
    initialData.category_name,
    initialData.sell_price,
    initialData.min_stock,
  ]);

  // Update formData when initialData changes
  useEffect(() => {
    if (!isFormEdited && isOpen) {
      const sanitizedData = {
        code_product: initialData.code_product ?? "",
        barcode: initialData.barcode ?? "",
        name_product: initialData.name_product ?? "",
        code_categories: initialData.code_categories ?? "",
        category_name: initialData.category_name ?? "",
        sell_price: initialData.sell_price
          ? String(Number(initialData.sell_price)).replace(/,/g, "")
          : "",
        min_stock: initialData.min_stock ?? "",
      };
      setFormData(sanitizedData);
    }
  }, [initialData, isOpen, isFormEdited]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setCategoryDropdownOpen(false);
      }
    }

    if (categoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutsideModal(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutsideModal);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideModal);
    };
  }, [isOpen, onClose]);

  const validateForm = () => {
    const errors = {};
    if (!formData.code_product)
      errors.code_product = "Product code is required";
    if (!formData.name_product)
      errors.name_product = "Product name is required";
    if (!formData.sell_price) errors.sell_price = "Selling price is required";
    else if (isNaN(formData.sell_price) || Number(formData.sell_price) <= 0)
      errors.sell_price = "Selling price must be a positive number";
    if (!formData.min_stock) errors.min_stock = "Minimum stock is required";
    else if (isNaN(formData.min_stock) || Number(formData.min_stock) < 0)
      errors.min_stock = "Minimum stock cannot be negative";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsFormEdited(true);

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const formatNumber = (value) => {
    if (value == null || value === "") return "";
    const number = value.toString().replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (/^\d*$/.test(rawValue)) {
      setFormData((prev) => ({
        ...prev,
        sell_price: rawValue,
      }));
      setIsFormEdited(true);
      if (formErrors.sell_price) {
        setFormErrors((prev) => ({
          ...prev,
          sell_price: null,
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const processedData = {
      ...formData,
      sell_price: Number(formData.sell_price),
      min_stock: Number(formData.min_stock),
    };

    onSubmit(processedData, modalMode);
  };

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({
      ...prev,
      code_categories: category.code_categories,
      category_name: category.name_categories,
    }));
    setCategoryDropdownOpen(false);
    setIsFormEdited(true);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name_categories?.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].name.endsWith(".csv")) {
      setCsvFile(files[0]);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }
    if (!csvFile.name.endsWith(".csv")) {
      alert("Please select a valid CSV file");
      return;
    }
    setUploadLoading(true);
    try {
      await onSubmit({ type: "csv", file: csvFile });
      setCsvFile(null);
      onClose();
    } catch (error) {
      console.error("Error uploading CSV:", error);
      alert(error.response?.data?.message || "Failed to import products");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const csvContent = "code_product,barcode,name_product,code_categories,sell_price,min_stock\nPROD001,1234567890123,Sample Product,CAT001,10000,5";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const toggleMode = () => {
    setCsvMode(!csvMode);
    setFormErrors({});
    setCsvFile(null);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-xl w-full max-w-[90vw] sm:max-w-2xl shadow-2xl transform transition-all animate-fadeIn flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
              {csvMode ? "Import Products from CSV" : modalMode === "add" ? "Add New Product" : "Edit Product"}
            </h2>
            {modalMode === "add" && (
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full transition-all text-xs sm:text-sm font-medium ${
                    !csvMode ? "bg-white shadow-sm text-blue-600" : "text-gray-600"
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full transition-all text-xs sm:text-sm font-medium ${
                    csvMode ? "bg-blue-600 text-white shadow-sm" : "text-gray-600"
                  }`}
                >
                  Import CSV
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {csvMode ? (
            <div className="space-y-6 sm:space-y-8">
              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 transition-all duration-300 ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload size={24} className="text-blue-500" />
                  </div>
                  {csvFile ? (
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-semibold text-gray-800">{csvFile.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-medium text-gray-700">
                        Drag and drop your CSV file here
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">or click to browse</p>
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        className="mt-4 px-4 py-2 sm:px-6 sm:py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-medium text-xs sm:text-sm"
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-blue-800 flex items-center text-sm sm:text-base">
                    <Info size={16} className="mr-2" />
                    Supported Formats
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-700 mt-2">
                    CSV files with headers: code_product, name_product, sell_price, min_stock.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-green-800 text-sm sm:text-base">Data Rows</h3>
                  <p className="text-xs sm:text-sm text-green-700 mt-2">
                    Supports up to 5,000 rows per import.
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">Duplicate Data</h3>
                  <p className="text-xs sm:text-sm text-yellow-700 mt-2">
                    Prevents duplicates based on product code.
                  </p>
                </div>
              </div>

              {/* Download Template */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center shadow-sm">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md text-xs sm:text-sm"
                >
                  <Download size={16} className="mr-2" />
                  Download Template
                </button>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Use our sample CSV template to ensure correct formatting.
                </p>
              </div>

              {/* Tips Section */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-start">
                  <Info size={16} className="text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-800 text-sm sm:text-base">Tips for Successful Import</h3>
                    <ul className="text-xs sm:text-sm text-blue-700 mt-2 space-y-1">
                      <li>Ensure dates are in YYYY-MM-DD format</li>
                      <li>Use commas (,) as separators</li>
                      <li>Verify all products are registered</li>
                      <li>Avoid special characters in product names</li>
                      <li>Use dots (.) for decimal prices</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="product-form" className="space-y-6 sm:space-y-8">
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label
                      htmlFor="code_product"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Product Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="code_product"
                      name="code_product"
                      type="text"
                      value={formData.code_product}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm ${
                        formErrors.code_product
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                      placeholder="Enter product code"
                      disabled={modalMode === "edit"}
                    />
                    {formErrors.code_product && (
                      <p className="mt-2 text-xs sm:text-sm text-red-500">{formErrors.code_product}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="barcode"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Barcode
                    </label>
                    <input
                      id="barcode"
                      name="barcode"
                      type="text"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm hover:border-blue-400"
                      placeholder="Enter barcode (optional)"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="name_product"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name_product"
                      name="name_product"
                      type="text"
                      value={formData.name_product}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm ${
                        formErrors.name_product
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                      placeholder="Enter product name"
                    />
                    {formErrors.name_product && (
                      <p className="mt-2 text-xs sm:text-sm text-red-500">{formErrors.name_product}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 relative" ref={categoryDropdownRef}>
                    <label
                      htmlFor="category"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Category
                    </label>
                    <div
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-xs sm:text-sm"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    >
                      <span className={formData.category_name ? "" : "text-gray-400"}>
                        {formData.category_name || "Select category (optional)"}
                      </span>
                      <ChevronDown size={16} className="text-gray-500" />
                    </div>
                    {categoryDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                            autoFocus
                          />
                        </div>
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat) => (
                            <div
                              key={cat.code_categories}
                              className={`px-3 py-2 sm:px-4 sm:py-3 cursor-pointer hover:bg-blue-50 transition-colors text-xs sm:text-sm ${
                                formData.code_categories === cat.code_categories ? "bg-blue-100" : ""
                              }`}
                              onClick={() => {
                                handleCategorySelect(cat);
                                setCategoryDropdownOpen(false);
                              }}
                            >
                              {cat.name_categories}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 sm:px-4 sm:py-3 text-gray-500 text-center text-xs sm:text-sm">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Pricing & Stock</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label
                      htmlFor="sell_price"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 sm:top-3.5 text-gray-500 text-xs sm:text-sm">Rp</span>
                      <input
                        id="sell_price"
                        name="sell_price"
                        type="text"
                        inputMode="numeric"
                        value={formatNumber(formData.sell_price)}
                        onChange={handlePriceChange}
                        className={`w-full pl-8 pr-3 py-2 sm:pl-10 sm:pr-4 sm:py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm ${
                          formErrors.sell_price
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 hover:border-blue-400"
                        }`}
                        placeholder="0"
                      />
                    </div>
                    {formErrors.sell_price && (
                      <p className="mt-2 text-xs sm:text-sm text-red-500">{formErrors.sell_price}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="min_stock"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                    >
                      Minimum Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="min_stock"
                      name="min_stock"
                      type="number"
                      inputMode="numeric"
                      value={formData.min_stock}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-xs sm:text-sm ${
                        formErrors.min_stock
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                      placeholder="0"
                    />
                    {formErrors.min_stock && (
                      <p className="mt-2 text-xs sm:text-sm text-red-500">{formErrors.min_stock}</p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!csvMode && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200 font-medium text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                className="px-6 py-2 sm:px-8 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-xs sm:text-sm"
              >
                {modalMode === "add" ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </div>
        )}
        {csvMode && csvFile && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setCsvFile(null);
                }}
                className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200 font-medium text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCsvUpload}
                disabled={uploadLoading}
                className={`px-6 py-2 sm:px-8 sm:py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium shadow-md transition-all duration-200 text-xs sm:text-sm ${
                  uploadLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                }`}
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Import Products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ProductModal;