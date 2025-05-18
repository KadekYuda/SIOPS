import React, { useState, useEffect, useCallback, useRef } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Package,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import ProductModal from "../../modal/ProductModal";
import SuccessModal from "../../modal/SuccessModal";
import AlertModal from "../../modal/AlertModal";
import Categories from "./Categories";
import CrudButton from "../../Button/CrudButton";
import Pagination from "./Pagination";
import api from "../../../service/api";
import LoadingComponent from "../../LoadingComponent";

const Product = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isStockHovered, setIsStockHovered] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);

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

  const getStockColor = (totalStock, minStock) => {
    if (totalStock <= minStock) return "bg-red-100 text-red-800";
    const difference = totalStock - minStock;
    if (difference <= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStockMessage = (totalStock, minStock) => {
    if (totalStock <= minStock) {
      return {
        icon: <AlertTriangle size={16} className="inline mr-1 text-red-600" />,
        message: "Stock is below minimum",
      };
    }

    const difference = totalStock - minStock;
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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: search,
        page: page.toString(),
        limit: limit.toString(),
      });

      // Tambahkan parameter category jika bukan "all"
      if (categoryFilter && categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }

      const response = await api.get(`/products?${params}`);

      const productsWithStock = response.data.result || [];
      setProducts(productsWithStock);
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
        const options = [
          { value: "all", label: "All Categories" },
          ...response.data.result.map((cat) => ({
            value: cat.code_categories,
            label: cat.name_categories,
          })),
        ];
        setCategories(response.data.result);
        setCategoryOptions(options);
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
      setCategoryOptions([{ value: "all", label: "All Categories" }]);
    }
  }, []);

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

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

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

  return (
    <div className="container mx-auto px-4 pt-20">
      {/* Mobile View */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-4 rounded-xl mb-4">
          <div className="flex flex-col gap-4">
            {/* Title & Batch Stock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="text-white mr-2" size={20} />
                <h1 className="text-sm font-bold text-white">
                  Product Management
                </h1>
              </div>
              <button
                onClick={() => navigate("/batchstock")}
                className="flex items-center bg-white/20 text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Batch stock
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4 ">
              <CrudButton
                icon={Plus}
                label="Create Product"
                onClick={handleAddProduct}
                buttonStyle="secondary"
                className="w-full text-xs md:text-xl"
              />
              <Categories onCategoriesChange={handleCategoriesChange} />
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border text-gray-700 border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(0);
                }}
                className="bg-white border border-white/20 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Category Filter */}
            <Select
              value={categoryOptions.find(
                (option) => option.value === categoryFilter
              )}
              onChange={(selectedOption) => {
                setCategoryFilter(selectedOption.value);
                setPage(0);
              }}
              options={categoryOptions}
              placeholder="All Categories"
              isClearable={false}
              className="text-sm"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-3">
          {loading ? (
            <LoadingComponent />
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.code_product}
                className="bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <button
                  className="w-full text-left"
                  onClick={() => toggleRow(product.code_product)}
                >
                  <div className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {product.name_product}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {formatLargeNumber(product.code_product)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {categories.find(
                              (c) =>
                                c.code_categories === product.code_categories
                            )?.name_categories || "Uncategorized"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <p className="text-sm font-medium text-emerald-600">
                          Rp {Number(product.sell_price).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
                              product.totalStock <= product.min_stock
                                ? "bg-red-100 text-red-700"
                                : product.totalStock - product.min_stock <= 5
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {product.totalStock} pcs
                          </span>
                          {expandedRow === product.code_product ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {expandedRow === product.code_product && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 pt-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Barcode
                        </p>
                        <p className="text-sm font-mono text-gray-700">
                          {product.barcode || "-"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Min Stock
                        </p>
                        <p className="text-sm text-gray-700">
                          {product.min_stock}
                        </p>
                      </div>

                      <div className="col-span-2 space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Stock Status
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getStockColor(
                              product.totalStock,
                              product.min_stock
                            )}`}
                          >
                            {product.totalStock} pcs
                          </span>
                          <span
                            className={`text-sm ${
                              product.totalStock <= product.min_stock
                                ? "text-red-600"
                                : product.totalStock - product.min_stock <= 5
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {
                              getStockMessage(
                                product.totalStock,
                                product.min_stock
                              ).icon
                            }
                            {
                              getStockMessage(
                                product.totalStock,
                                product.min_stock
                              ).message
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-row justify-end gap-2 mt-3">
                        <CrudButton
                          icon={Edit2}
                          onClick={() => {
                            setFormData(prepareEditData(product));
                            setModalMode("edit");
                            setShowModal(true);
                          }}
                          buttonStyle="primary"
                          buttonType="product"
                          actionType="edit"
                        />
                        <CrudButton
                          icon={Trash2}
                          onConfirm={() => handleDelete(product.code_product)}
                          buttonStyle="danger"
                          buttonType="product"
                          actionType="delete"
                          confirmMessage="Are you sure you want to delete this product?"
                          dataMessage="This action will permanently delete this product and cannot be undone."
                          title="Delete Product"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

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

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <Package className="text-white mr-3" size={24} />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Product Management
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/batchstock")}
                className="flex items-center bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                <ArrowRight className="h-4 w-4 mr-1.5" />
                Batch Stock
              </button>
              <CrudButton
                icon={Plus}
                label="Create Product"
                onClick={handleAddProduct}
                buttonStyle="secondary"
              />
              <Categories />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="w-full md:w-60">
                <Select
                  value={categoryOptions.find(
                    (option) => option.value === categoryFilter
                  )}
                  onChange={(selectedOption) => {
                    setCategoryFilter(selectedOption.value);
                    setPage(0);
                  }}
                  options={categoryOptions}
                  className="text-sm"
                  placeholder="Select Category"
                  isClearable={false}
                />
              </div>

              <div className="w-full md:w-40">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(0);
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-md border border-gray-200 border-t-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-12">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-32">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-32">
                    Barcode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-32">
                    Categories
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-32">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-32">
                    Min Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-32 ">
                    Stock
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider w-1">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  if (loading) {
                    return (
                      <tr>
                        <td colSpan="9" className="p-4">
                        <div className="flex justify-center items-center py-8">
                          <div className="flex items-center space-x-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="text-gray-500 text-sm">
                              Loading product data...
                            </p>
                          </div>
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm  text-gray-800">
                        {index + 1 + page * limit}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm  text-gray-800">
                        {formatLargeNumber(product.code_product)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm  text-gray-800">
                        {formatLargeNumber(product.barcode) || "-"}
                      </td>
                      <td className="px-4 py-4 text-base text-black">
                        {product.name_product}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm  text-gray-800">
                        {categories.find(
                          (c) => c.code_categories === product.code_categories
                        )?.name_categories || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm  text-gray-800">
                        Rp {Number(product.sell_price).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm  text-gray-800 flex justify-center">
                        {product.min_stock}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        <div
                          className="relative group"
                          onMouseEnter={() =>
                            setIsStockHovered(product.code_product)
                          }
                          onMouseLeave={() => setIsStockHovered(null)}
                        >
                          <span
                            className={`px-2 py-1 rounded-full ${getStockColor(
                              product.totalStock,
                              product.min_stock
                            )}`}
                          >
                            {product.totalStock} pcs
                          </span>
                          {isStockHovered === product.code_product && (
                            <div className="absolute z-10 transform -translate-y-full -translate-x-1/4 top-0 left-0 px-3 py-2 bg-white text-sm rounded-lg shadow-lg whitespace-nowrap">
                              <span
                                className={`text-sm ${
                                  product.totalStock <= product.min_stock
                                    ? "text-red-600"
                                    : product.totalStock - product.min_stock <=
                                      5
                                    ? "text-yellow-600"
                                    : "text-green-600"
                                }`}
                              >
                                {
                                  getStockMessage(
                                    product.totalStock,
                                    product.min_stock
                                  ).icon
                                }
                                {
                                  getStockMessage(
                                    product.totalStock,
                                    product.min_stock
                                  ).message
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4 text-sm ">
                          <div className="flex justify-end gap-3">
                            <CrudButton
                              icon={Edit2}
                              onClick={() => {
                                setFormData(prepareEditData(product));
                                setModalMode("edit");
                                setShowModal(true);
                              }}
                              buttonStyle="primary"
                              buttonType="product"
                              actionType="edit"
                            />
                            <CrudButton
                              icon={Trash2}
                              onConfirm={() =>
                                handleDelete(product.code_product)
                              }
                              buttonStyle="danger"
                              buttonType="product"
                              actionType="delete"
                              confirmMessage="Are you sure you want to delete this product?"
                              dataMessage="This action will permanently delete this product and cannot be undone."
                              title="Delete Product"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          <div className="hidden md:block ">
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

      {/* Modals */}
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
                    <LoadingComponent />
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

      <SuccessModal
        isOpen={successModal.isOpen}
        message={successModal.message}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        onClose={() => setAlertModal({ isOpen: false, message: "" })}
      />
    </div>
  );
};

export default Product;
