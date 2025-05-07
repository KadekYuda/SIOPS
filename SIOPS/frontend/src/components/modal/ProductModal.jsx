import { useState, useRef, useEffect, useMemo } from "react";
import { X, Check, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import PropTypes from "prop-types";

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
  const modalRef = useRef(null);
  const categoryDropdownRef = useRef(null);

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

      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
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

      // Allow body scrolling when modal is closed
      document.body.style.overflow = '';
    }

    return () => {
      // Cleanup - restore scrolling
      document.body.style.overflow = '';
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
      sell_price: Number(formData.sell_price.replace(/,/g, "") || 0),
      min_stock: Number(formData.min_stock || 0),
    };

    console.log("Submitted sell_price:", processedData.sell_price);
    onSubmit(processedData);
  };

  const handleCategorySelect = (category) => {
    setFormData({
      ...formData,
      code_categories: category.code_categories,
      category_name: category.name_categories,
    });
    setCategoryDropdownOpen(false);
    setCategorySearch("");
    setIsFormEdited(true);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name_categories?.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setUploadLoading(true);
    const processedData = {
      file: csvFile,
      type: "csv",
    };

    try {
      await onSubmit(processedData);
      setCsvFile(null);
    } catch (error) {
      console.error("Error uploading CSV:", error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setCsvFile(e.target.files[0]);
    }
  };

  const toggleMode = () => {
    setCsvMode(!csvMode);
    setFormErrors({});
    setCsvFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-2xl w-full shadow-xl transform transition-all animate-fadeIn flex flex-col max-h-screen md:max-h-[90vh] my-0 md:my-auto"
      >
        {/* Header - Fixed at top */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg z-10">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {modalMode === "add" ? "Add New Product" : "Edit Product"}
            </h2>
            {modalMode === "add" && (
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full transition-all"
                >
                  {csvMode ? (
                    <>
                      <ChevronLeft size={16} />
                      <span className="text-sm">Form</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">CSV</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 px-4 py-4">
          {csvMode ? (
            <form onSubmit={handleCsvUpload}>
              <div className="mb-6">
                <label
                  htmlFor="csvFile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select CSV File
                </label>
                <input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-sm text-gray-500">
                  File should be in CSV format with headers: code_product,
                  barcode, name_product, code_categories, sell_price, min_stock
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || uploadLoading}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 ${
                    !csvFile || uploadLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload CSV</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="code_product"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Product Code<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code_product"
                    name="code_product"
                    type="text"
                    value={formData.code_product}
                    onChange={handleInputChange}
                    disabled={modalMode === "edit"}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      formErrors.code_product
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter product code"
                  />
                  {formErrors.code_product && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.code_product}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="barcode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Barcode
                  </label>
                  <input
                    id="barcode"
                    name="barcode"
                    type="text"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter barcode (optional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="name_product"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Product Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name_product"
                    name="name_product"
                    type="text"
                    value={formData.name_product}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      formErrors.name_product
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter product name"
                  />
                  {formErrors.name_product && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.name_product}
                    </p>
                  )}
                </div>

                <div className="relative" ref={categoryDropdownRef}>
                  <label
                    htmlFor="categories"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Categories
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-lg text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <span
                      className={
                        formData.code_categories
                          ? "text-gray-900"
                          : "text-gray-500"
                      }
                    >
                      {formData.category_name || formData.code_categories
                        ? formData.category_name
                        : "Select category"}
                    </span>
                    <span className="text-gray-400">▼</span>
                  </button>

                  {categoryDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 flex flex-col">
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
                              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${
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
                          <div className="px-4 py-2 text-gray-500 text-center">
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
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Selling Price<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">
                      Rp
                    </span>
                    <input
                      id="sell_price"
                      name="sell_price"
                      type="text"
                      inputMode="numeric"
                      value={formatNumber(formData.sell_price)}
                      onChange={handlePriceChange}
                      className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        formErrors.sell_price
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {formErrors.sell_price && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.sell_price}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="min_stock"
                    className="block text-sm font-medium text-gray-700 mb-1"
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      formErrors.min_stock
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  {formErrors.min_stock && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.min_stock}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Footer - Fixed at bottom */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {modalMode === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

ProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  modalMode: PropTypes.oneOf(["add", "edit"]),
  initialData: PropTypes.shape({
    code_product: PropTypes.string,
    barcode: PropTypes.string,
    name_product: PropTypes.string,
    code_categories: PropTypes.string,
    category_name: PropTypes.string,
    sell_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    min_stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      code_categories: PropTypes.string.isRequired,
      name_categories: PropTypes.string.isRequired,
    })
  ),
};

export default ProductModal;