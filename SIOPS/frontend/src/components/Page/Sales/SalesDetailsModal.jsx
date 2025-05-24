import { useState, useRef, useEffect, useMemo } from "react";
import { X, Check, Upload, ChevronLeft, ChevronRight, Download, Info } from "lucide-react";
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
      console.log("initialData.sell_price:", initialData.sell_price);
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
      console.log("Sanitized sell_price:", sanitizedData.sell_price);
      setFormData(sanitizedData);
      setFormErrors({});
      setCategorySearch("");
      setIsFormEdited(false);
      setCsvFile(null);
      setIsDragOver(false);

      // Prevent body scrolling when modal is open
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

      // Allow body scrolling when modal is closed
      document.body.style.overflow = "";
    }

    return () => {
      // Cleanup - restore scrolling
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

  // Update formData when initialData changes, but only if the form hasn't been edited
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
    if (files && files.length > 0 && files[0].name.endsWith('.csv')) {
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
    // Create CSV template
    const csvContent = "code_product,barcode,name_product,code_categories,sell_price,min_stock\nPROD001,1234567890123,Sample Product,CAT001,10000,5";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-4xl w-full shadow-xl transform transition-all animate-fadeIn flex flex-col max-h-screen md:max-h-[90vh] my-0 md:my-auto"
      >
        {/* Header - Fixed at top */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg z-10">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              {csvMode ? "Import Products from CSV" : modalMode === "add" ? "Add New Product" : "Edit Product"}
            </h2>
            {modalMode === "add" && (
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                    !csvMode ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">Manual Entry</span>
                </button>
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                    csvMode ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <span className="text-sm font-medium">Import CSV</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-6">
{csvMode ? (
  <div className="space-y-6">
    <div
      className={`border-2 border-dashed rounded-lg p-8 ${
        isDragOver
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-blue-500"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload size={32} className="text-gray-500" />
                  </div>
                  
                  {csvFile ? (
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        {csvFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xl text-gray-600 mb-2">
                        Drag and drop your CSV file here
                      </p>
                      <p className="text-gray-500 mb-4">
                        or click to browse
                      </p>
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <Info size={16} className="mr-2" />
                    Supported Formats
                  </h3>
                  <p className="text-sm text-blue-800">
                    CSV files with column headers. Must include: code_product, name_product, sell_price, and min_stock.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Data Rows</h3>
                  <p className="text-sm text-green-800">
                    System can handle up to 5,000 rows in a single import.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Duplicate Data</h3>
                  <p className="text-sm text-yellow-800">
                    System will detect and prevent data duplication based on product code.
                  </p>
                </div>
              </div>

              {/* Download Template Button */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download size={20} className="mr-2" />
                  Download Template
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Download a sample CSV template to get started
                </p>
              </div>

              {/* Tips Section */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <Info size={20} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Tips for Successful Import</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Ensure date column is in YYYY-MM-DD format</li>
                      <li>• Use comma (,) as separator for your CSV file</li>
                      <li>• Ensure all products are already registered in the system</li>
                      <li>• Avoid special characters in product names</li>
                      <li>• Use dot (.) as decimal separator for prices</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvUpload}
                  disabled={!csvFile || uploadLoading}
                  className={`px-8 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium ${
                    !csvFile || uploadLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Import Products</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="code_product"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Product Code<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code_product"
                    name="code_product"
                    type="text"
                    value={formData.code_product}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      formErrors.code_product
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter product code"
                    disabled={modalMode === "edit"}
                  />
                  {formErrors.code_product && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.code_product}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="barcode"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Barcode
                  </label>
                  <input
                    id="barcode"
                    name="barcode"
                    type="text"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter barcode (optional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="name_product"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Product Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name_product"
                    name="name_product"
                    type="text"
                    value={formData.name_product}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      formErrors.name_product
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter product name"
                  />
                  {formErrors.name_product && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.name_product}
                    </p>
                  )}
                </div>

                <div className="relative" ref={categoryDropdownRef}>
                  <label
                    htmlFor="categories"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category
                  </label>
                  <div
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg flex justify-between items-center cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() =>
                      setCategoryDropdownOpen(!categoryDropdownOpen)
                    }
                  >
                    <span
                      className={formData.category_name ? "" : "text-gray-400"}
                    >
                      {formData.category_name || "Select category (optional)"}
                    </span>
                    <ChevronRight
                      size={16}
                      className={`transform transition-transform ${
                        categoryDropdownOpen ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {categoryDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col">
                      <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          {categorySearch && (
                            <button
                              type="button"
                              onClick={() => setCategorySearch("")}
                              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="overflow-y-auto flex-1 max-h-40">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat) => (
                            <div
                              key={cat.code_categories}
                              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${
                                formData.code_categories === cat.code_categories
                                  ? "bg-blue-100"
                                  : ""
                              }`}
                              onClick={() => handleCategorySelect(cat)}
                            >
                              <span>{cat.name_categories}</span>
                              {formData.code_categories ===
                                cat.code_categories && (
                                <Check size={16} className="text-blue-600" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No categories found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sell_price"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Selling Price<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-500">
                      Rp
                    </span>
                    <input
                      id="sell_price"
                      name="sell_price"
                      type="text"
                      inputMode="numeric"
                      value={formatNumber(formData.sell_price)}
                      onChange={handlePriceChange}
                      className={`w-full pl-9 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        formErrors.sell_price
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {formErrors.sell_price && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.sell_price}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="min_stock"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Minimum Stock<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="min_stock"
                    name="min_stock"
                    type="number"
                    inputMode="numeric"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      formErrors.min_stock
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  {formErrors.min_stock && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.min_stock}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="mt-8 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  {modalMode === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};


export default ProductModal;
