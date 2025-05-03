import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Package,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import ProductModal from "../../modal/ProductModal";
import SuccessModal from "../../modal/SuccessModal";
import AlertModal from "../../modal/AlertModal";
import Categories from "./Categories";
import CrudButton from "../../Button/CrudButton";
import Pagination from "./Pagination";
import api from "../../../service/api";

const Product = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    code_product: "",
    barcode: "",
    name_product: "",
    code_categories: "",
    sell_price: "",
    min_stock: "",
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
  });
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    product: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [csvFile, setCsvFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [batchStok, setBatchStok] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [batchStokLoading, setBatchStokLoading] = useState(true);

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

  const validateForm = () => {
    const errors = {};
    if (!formData.code_product)
      errors.code_product = "Product code is required";
    if (!formData.name_product)
      errors.name_product = "Product name is required";
    if (!formData.sell_price) errors.sell_price = "Selling price is required";
    if (!formData.min_stock) errors.min_stock = "Minimum stock is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Add category filter to API request if not "all"
      const params = {
        search: search,
        page,
        limit,
      };

      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }

      const response = await api.get(
        `/products?${new URLSearchParams(params)}`
      );

      setProducts(response.data.result || []);
      setTotalPages(Math.ceil(response.data.totalRows / limit));
      setTotalItems(response.data.totalRows || 0);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Failed to fetch products",
      });
      setLoading(false);
    }
  }, [search, page, limit, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");

      if (response.data && response.data.result) {
        setCategories(response.data.result);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setAlertModal({
        isOpen: true,
        message: error.message || "Failed to fetch categories",
      });
      setCategories([]);
    }
  }, []);

  const fetchBatchStok = useCallback(async () => {
    try {
      setBatchStokLoading(true);
      const response = await api.get("/batch/stock");
      setBatchStok(response.data.result || []);
      setBatchStokLoading(false);
    } catch (error) {
      console.error("Error fetching batch stock:", error);
      setBatchStokLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatchStok();
  }, [fetchBatchStok]);

  const handleCategoriesChange = (newCategories) => {
    setCategories(newCategories);
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmitProduct = async (productData) => {
    try {
      if (productData.type === "csv") {
        const formData = new FormData();
        formData.append("file", productData.file);

        await api.post("/products/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setSuccessModal({
          isOpen: true,
          message: "Products imported successfully",
        });
      } else {
        if (modalMode === "add") {
          await api.post("/products", productData);
          setSuccessModal({
            isOpen: true,
            message: "Product added successfully",
          });
        } else {
          await api.put(`/products/${productData.code_product}`, productData);
          setSuccessModal({
            isOpen: true,
            message: "Product updated successfully",
          });
        }
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Failed to save product",
      });
    }
  };

  const prepareEditData = useCallback(
    (product) => {
      return {
        ...product,
        code_product: product.code_product ?? "",
        barcode: product.barcode ?? "",
        name_product: product.name_product ?? "",
        code_categories: product.code_categories ?? "",
        category_name:
          categories.find((c) => c.code_categories === product.code_categories)
            ?.name_categories ?? "",
        sell_price: product.sell_price ?? 0,
        min_stock: product.min_stock ?? 0,
      };
    },
    [categories]
  );

  const handleDelete = async (code_product) => {
    try {
      await api.delete(`/products/${code_product}`);
      setSuccessModal({
        isOpen: true,
        message: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Failed to delete product",
      });
    }
    setDeleteConfirmModal({ isOpen: false, product: null });
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setAlertModal({ isOpen: true, message: "Please select a CSV file" });
      return;
    }

    // Check if file is CSV
    if (!csvFile.name.endsWith(".csv")) {
      setAlertModal({ isOpen: true, message: "Only CSV files are allowed" });
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await api.post("/products/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadLoading(false);
      setShowUploadModal(false);
      setCsvFile(null);
      setSuccessModal({
        isOpen: true,
        message: response.data.message || "Products imported successfully",
      });
      fetchProducts();
    } catch (error) {
      setUploadLoading(false);
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Failed to import products",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code_product: "",
      barcode: "",
      name_product: "",
      code_categories: "",
      sell_price: "",
      min_stock: "",
    });
    setFormErrors({});
  };

  const formatLargeNumber = (number) => {
    if (!number) return "";

    // Convert to string and remove any scientific notation
    const str = String(number);
    if (str.includes("E+")) {
      const [mantissa, exponent] = str.split("E+");
      const decimalPoints = mantissa.includes(".")
        ? mantissa.split(".")[1].length
        : 0;
      const num = parseFloat(mantissa);
      const exp = parseInt(exponent);

      // Convert to full number string
      let result = num.toString().replace(".", "");
      const zerosToAdd = exp - decimalPoints;
      result += "0".repeat(Math.max(0, zerosToAdd));

      return result;
    }

    return str;
  };

  const handleAddProduct = () => {
    // Reset form with proper default values
    setFormData({
      code_product: "",
      barcode: "",
      name_product: "",
      code_categories: "",
      category_name: "",
      sell_price: "",
      min_stock: "",
    });
    setModalMode("add");
    setShowModal(true);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const calculateTotalStock = useCallback(
    (productCode) => {
      const productBatches = batchStok.filter(
        (batch) => batch.code_product === productCode
      );
      return productBatches.reduce(
        (total, batch) =>
          total +
          (parseInt(batch.stock_quantity || 0) +
            parseInt(batch.initial_stock || 0)),
        0
      );
    },
    [batchStok]
  );

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      {/* Header and Search Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Product Management
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
            <div>
              <Categories onCategoriesChange={handleCategoriesChange} />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full md:w-60 relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option
                  key={category.code_categories}
                  value={category.code_categories}
                >
                  {category.name_categories}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-40">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(0);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Barcode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Categories
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Min Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  if (loading || batchStokLoading) {
                    return (
                      <tr>
                        <td colSpan="8" className="px-4 py-4 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <span>Loading...</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (products.length === 0) {
                    return (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          No products found
                        </td>
                      </tr>
                    );
                  }

                  return products.map((product, index) => (
                    <tr key={product.code_product} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1 + page * limit}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {formatLargeNumber(product.code_product)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {formatLargeNumber(product.barcode) || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-gray-900">
                        {product.name_product}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {categories.find(
                          (c) => c.code_categories === product.code_categories
                        )?.name_categories || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {Number(product.sell_price).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.min_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {!batchStokLoading ? `${calculateTotalStock(product.code_product)} pcs` : (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                            <span>Loading...</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setFormData(prepareEditData(product));
                              setModalMode("edit");
                              setShowModal(true);
                            }}
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.code_product)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Desktop Pagination */}
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
          {loading || batchStokLoading ? (
            <div className="bg-white p-6 rounded-lg shadow flex justify-center items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
              <span>Loading...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              No products found
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.code_product}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div
                  className="flex justify-between items-center p-4 cursor-pointer"
                  onClick={() => toggleRow(product.code_product)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {product.name_product}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500 font-mono">
                        {formatLargeNumber(product.code_product)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        Rp {Number(product.sell_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {expandedRow === product.code_product ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedRow === product.code_product && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Barcode</p>
                        <p className="text-sm font-mono">
                          {formatLargeNumber(product.barcode) || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm">
                          {categories.find(
                            (c) => c.code_categories === product.code_categories
                          )?.name_categories || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Min Stock</p>
                        <p className="text-sm">{product.min_stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className="text-sm">
                          {!batchStokLoading ? `${calculateTotalStock(product.code_product)} pcs` : (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                              <span>Loading...</span>
                            </div>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prepareEditData(product));
                          setModalMode("edit");
                          setShowModal(true);
                        }}
                        className="px-3 py-1.5 text-xs border border-blue-600 text-blue-600 rounded-lg flex items-center"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.code_product);
                        }}
                        className="px-3 py-1.5 text-xs border border-red-600 text-red-600 rounded-lg flex items-center"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Mobile Pagination */}
          {!loading && products.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                itemsPerPage={limit}
                totalItems={totalItems}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <ProductModal
        key={`${modalMode}-${formData.code_product || "new"}`}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        onSubmit={handleSubmitProduct}
        modalMode={modalMode}
        initialData={modalMode === "add" ? {} : prepareEditData(formData)}
        categories={categories}
      />

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                Import Products from CSV
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setCsvFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label
                  htmlFor="selectCsvFile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border rounded"
                />
                <p className="mt-2 text-sm text-gray-500">
                  File should be in CSV format with headers: code_product,
                  barcode, name_product, code_categories, sell_price, min_stock
                </p>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setCsvFile(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvUpload}
                  disabled={uploadLoading || !csvFile}
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 ${
                    uploadLoading || !csvFile
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-700"
                  }`}
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        message={successModal.message}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        onClose={() => setAlertModal({ isOpen: false, message: "" })}
      />
    </div>
  );
};

export default Product;
